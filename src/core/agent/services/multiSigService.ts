import {
  Algos,
  CreateIdentifierBody,
  d,
  HabState,
  messagize,
  Serder,
  Siger,
  State,
  b,
  Cigar,
  Signer,
  reply,
  Serials,
} from "signify-ts";
import {
  AgentServicesProps,
  MiscRecordId,
  CreationStatus,
} from "../agent.types";
import { NotificationRoute } from "./keriaNotificationService.types";
import type {
  ConnectionShortDetails,
  AuthorizationRequestExn,
} from "../agent.types";
import {
  BasicRecord,
  BasicStorage,
  IdentifierStorage,
  NotificationStorage,
  OperationPendingStorage,
} from "../records";
import { AgentService } from "./agentService";
import {
  GroupParticipants,
  MultiSigIcpRequestDetails,
  QueuedGroupCreation,
  QueuedGroupProps,
} from "./identifier.types";
import { MultiSigRoute, InceptMultiSigExnMessage } from "./multiSig.types";
import { deleteNotificationRecordById, OnlineOnly } from "./utils";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { EventTypes, GroupCreatedEvent } from "../event.types";
import { ConnectionService } from "./connectionService";
import { IdentifierService } from "./identifierService";
import { StorageMessage } from "../../storage/storage.types";
import { RpyRoute } from "./connectionService.types";
class MultiSigService extends AgentService {
  static readonly INVALID_THRESHOLD = "Invalid threshold";
  static readonly CANNOT_GET_KEYSTATE_OF_IDENTIFIER =
    "Unable to query key state of identifier";
  static readonly EXN_MESSAGE_NOT_FOUND =
    "There's no exchange message for the given SAID";
  static readonly MULTI_SIG_NOT_FOUND =
    "There's no multi sig identifier for the given SAID";
  static readonly AID_IS_NOT_MULTI_SIG =
    "This AID is not a multi sig identifier";
  static readonly UNKNOWN_AIDS_IN_MULTISIG_ICP =
    "Multi-sig join request contains unknown AIDs (not connected)";
  static readonly MISSING_GROUP_METADATA =
    "Metadata record for group is missing";
  static readonly ONLY_ALLOW_LINKED_CONTACTS =
    "Only allowed to create multi-sig using contacts with a matching groupId to our member identifier";
  static readonly ONLY_ALLOW_GROUP_INITIATOR =
    "Only the group initiator can create the multisig";
  static readonly GROUP_ALREADY_EXISTS = "Group already exists";
  static readonly MEMBER_AID_NOT_FOUND =
    "We do not control any member AID of the multi-sig";
  static readonly QUEUED_GROUP_DATA_MISSING =
    "Cannot retry creating group identifier if retry data is missing from the DB";

  protected readonly identifierStorage: IdentifierStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly notificationStorage: NotificationStorage;
  protected readonly basicStorage: BasicStorage;
  protected readonly connections: ConnectionService;
  protected readonly identifiers: IdentifierService;

  constructor(
    agentServiceProps: AgentServicesProps,
    identifierStorage: IdentifierStorage,
    operationPendingStorage: OperationPendingStorage,
    notificationStorage: NotificationStorage,
    basicStorage: BasicStorage,
    connections: ConnectionService,
    identifiers: IdentifierService
  ) {
    super(agentServiceProps);
    this.identifierStorage = identifierStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.notificationStorage = notificationStorage;
    this.basicStorage = basicStorage;
    this.connections = connections;
    this.identifiers = identifiers;
  }

  onGroupAdded(callback: (event: GroupCreatedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.GroupCreated, callback);
  }

  @OnlineOnly
  async createGroup(
    memberPrefix: string,
    groupConnections: ConnectionShortDetails[],
    threshold: number,
    backgroundTask = false
  ): Promise<void> {
    if (threshold < 1 || threshold > groupConnections.length + 1) {
      throw new Error(MultiSigService.INVALID_THRESHOLD);
    }

    const mHabRecord = await this.identifierStorage.getIdentifierMetadata(
      memberPrefix
    );
    if (!mHabRecord.groupMetadata) {
      throw new Error(MultiSigService.MISSING_GROUP_METADATA);
    }
    if (!mHabRecord.groupMetadata.groupInitiator) {
      throw new Error(MultiSigService.ONLY_ALLOW_GROUP_INITIATOR);
    }

    const notLinkedContacts = groupConnections.filter(
      (contact) => contact.groupId !== mHabRecord.groupMetadata?.groupId
    );
    if (notLinkedContacts.length) {
      throw new Error(MultiSigService.ONLY_ALLOW_LINKED_CONTACTS);
    }

    const mHab: HabState = await this.props.signifyClient
      .identifiers()
      .get(mHabRecord.id as string);
    const connectionStates = await Promise.all(
      groupConnections.map(
        async (connection) =>
          (
            await this.props.signifyClient.keyStates().get(connection.id)
          )[0]
      )
    );
    const states = [mHab["state"], ...connectionStates];
    const groupName = `${mHabRecord.theme}:${mHabRecord.displayName}`;

    const inceptionData = backgroundTask
      ? await this.getInceptionData(groupName)
      : await this.generateAndStoreInceptionData(
        mHab,
        states,
        groupName,
        threshold,
        {
          initiator: true,
          groupConnections,
          threshold,
        }
      );
    await this.inceptGroup(mHab, states, inceptionData);

    // Share witness OOBIs with other group members
    await this.shareWitnessOobis(mHab, groupConnections);

    const multisigId = inceptionData.icp.i;
    const creationStatus = CreationStatus.PENDING;

    const multisigDetail = (await this.props.signifyClient
      .identifiers()
      .get(multisigId as string)) as HabState;

    try {
      await this.identifierStorage.createIdentifierMetadataRecord({
        id: multisigId,
        displayName: mHabRecord.displayName,
        theme: mHabRecord.theme,
        creationStatus,
        groupMemberPre: memberPrefix,
        createdAt: new Date(multisigDetail.icp_dt),
      });
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.startsWith(
            StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG
          )
        )
      ) {
        throw error;
      }
    }

    mHabRecord.groupMetadata.groupCreated = true;
    await this.identifierStorage.updateIdentifierMetadata(
      mHabRecord.id,
      mHabRecord
    );
    this.props.eventEmitter.emit<GroupCreatedEvent>({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: multisigId,
          displayName: mHabRecord.displayName,
          theme: mHabRecord.theme,
          creationStatus,
          groupMemberPre: memberPrefix,
          createdAtUTC: multisigDetail.icp_dt,
        },
      },
    });

    await this.operationPendingStorage.save({
      id: `group.${multisigId}`,
      recordType: OperationPendingRecordType.Group,
    });

    // Finally, remove from the re-try record
    const pendingGroupsRecord = await this.basicStorage.findExpectedById(
      MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION
    );

    const queued = pendingGroupsRecord.content.queued as QueuedGroupCreation[];
    const index = queued.findIndex((group) => group.name === groupName);
    if (index !== -1) {
      queued.splice(index, 1);
    }
    await this.basicStorage.update(pendingGroupsRecord);
  }

  private async getInceptionData(
    groupName: string
  ): Promise<CreateIdentifierBody> {
    const pendingGroupsRecord = await this.basicStorage.findExpectedById(
      MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION
    );

    const queued = pendingGroupsRecord.content.queued as QueuedGroupCreation[];
    const group = queued.find((group) => group.name === groupName);
    if (!group) {
      throw new Error(MultiSigService.QUEUED_GROUP_DATA_MISSING);
    }

    return group.data;
  }

  private async generateAndStoreInceptionData(
    mHab: HabState,
    states: State[],
    groupName: string,
    threshold: number,
    queuedProps: QueuedGroupProps,
    toad?: string,
    wits?: string[]
  ): Promise<CreateIdentifierBody> {
    // For distributed reliability, store name and inception data so we can re-try on start-up
    // Hence we ignore duplicate errors
    let queued: QueuedGroupCreation[] = [];
    const pendingGroupsRecord = await this.basicStorage.findById(
      MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION
    );
    if (pendingGroupsRecord) {
      const currentQueue = pendingGroupsRecord.content
        .queued as QueuedGroupCreation[];
      queued = currentQueue;
    }

    const inceptionData = await this.props.signifyClient
      .identifiers()
      .createInceptionData(groupName, {
        algo: Algos.group,
        mhab: mHab,
        isith: threshold,
        nsith: threshold,
        toad: Number(toad ?? mHab.state.bt),
        wits: wits ?? mHab.state.b,
        states: states,
        rstates: states,
      });

    queued.push({ name: groupName, data: inceptionData, ...queuedProps });

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: { queued },
      })
    );

    return inceptionData;
  }

  private async inceptGroup(
    mHab: HabState,
    states: State[],
    inceptionData: CreateIdentifierBody
  ): Promise<void> {
    try {
      await this.props.signifyClient
        .identifiers()
        .submitInceptionData(inceptionData);
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      const [, status, reason] = error.message.split(" - ");
      if (!(/400/gi.test(status) && /already incepted/gi.test(reason))) {
        throw error;
      }
    }

    const serder = new Serder(inceptionData.icp);
    const sigers = inceptionData.sigs.map(
      (sig: string) => new Siger({ qb64: sig })
    );

    const ims = d(messagize(serder, sigers));
    const atc = ims.substring(serder.size);
    const embeds = {
      icp: [serder, atc],
    };

    const smids = states.map((state) => state["i"]);
    const recp = smids.filter((prefix) => prefix !== mHab.prefix);

    await this.props.signifyClient.exchanges().send(
      mHab.prefix,
      "multisig",
      mHab,
      MultiSigRoute.ICP,
      {
        gid: serder.pre,
        smids: smids,
        rmids: smids,
      },
      embeds,
      recp
    );
  }

  private async shareWitnessOobis(
    mHab: HabState,
    groupConnections: ConnectionShortDetails[]
  ): Promise<void> {
    const { witnesses } = await this.identifiers.getAvailableWitnesses();
    const keeper = this.props.signifyClient.manager!.get(mHab);

    for (const witness of witnesses) {
      const rpyData = {
        cid: mHab.prefix,
        oobi: witness.oobi,
      };

      const rpy = reply(
        RpyRoute.INTRODUCE,
        rpyData,
        undefined,
        undefined,
        Serials.JSON
      );

      const sigs = await keeper.sign(b(rpy.raw));
      const sigers = sigs.map((sig: string) => new Siger({ qb64: sig }));
      const seal = [
        "SealEvent",
        { i: mHab.prefix, s: mHab.state.ee.s, d: mHab.state.ee.d },
      ];
      const ims = d(messagize(rpy, sigers, seal));

      for (const connection of groupConnections) {
        await this.props.signifyClient.replies().submitRpy(connection.id, ims);
      }
    }
  }

  @OnlineOnly
  async getMultisigIcpDetails(
    notificationSaid: string
  ): Promise<MultiSigIcpRequestDetails> {
    const icpMsg: InceptMultiSigExnMessage[] = await this.props.signifyClient
      .groups()
      .getRequest(notificationSaid)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          return [];
        } else {
          throw error;
        }
      });

    if (!icpMsg.length) {
      throw new Error(
        `${MultiSigService.EXN_MESSAGE_NOT_FOUND} ${notificationSaid}`
      );
    }

    const senderPrefix = icpMsg[0].exn.i;
    // @TODO - foconnor: This cross service call should be handled better.
    const senderContact = await this.connections.getConnectionShortDetailById(
      icpMsg[0].exn.i
    );

    const smids = icpMsg[0].exn.a.smids;
    // @TODO - foconnor: These searches should be optimised, revisit.
    const ourIdentifiers = await this.identifiers.getIdentifiers();

    const ourIdentifier = ourIdentifiers.find((identifier) =>
      smids.includes(identifier.id)
    );
    if (!ourIdentifier || !ourIdentifier.groupMetadata?.groupId) {
      throw new Error(MultiSigService.MEMBER_AID_NOT_FOUND);
    }

    const linkedConnections = await this.connections.getMultisigLinkedContacts(
      ourIdentifier.groupMetadata.groupId
    );
    const otherConnections = [];
    for (const prefix of smids) {
      if (prefix === senderPrefix || prefix === ourIdentifier.id) continue;

      const linkedConnection = linkedConnections.find(
        (connection) => connection.id === prefix
      );
      if (!linkedConnection) {
        throw new Error(MultiSigService.UNKNOWN_AIDS_IN_MULTISIG_ICP);
      }

      otherConnections.push(linkedConnection);
    }

    return {
      ourIdentifier,
      sender: senderContact,
      otherConnections,
      threshold: parseInt(icpMsg[0].exn.e.icp.kt as string),
    };
  }

  @OnlineOnly
  async joinGroup(
    notificationId: string,
    notificationSaid: string,
    backgroundTask = false
  ): Promise<void> {
    const icpMsg: InceptMultiSigExnMessage[] = await this.props.signifyClient
      .groups()
      .getRequest(notificationSaid)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(
            `${MultiSigService.EXN_MESSAGE_NOT_FOUND} ${notificationSaid}`
          );
        } else {
          throw error;
        }
      });
    const exn = icpMsg[0].exn;

    const identifiers = await this.identifiers.getIdentifiers(false);
    const mHabRecord = identifiers.find((identifier) => {
      return exn.a.smids.find((member) => identifier.id === member);
    });

    if (!mHabRecord) {
      throw new Error(MultiSigService.MEMBER_AID_NOT_FOUND);
    }

    if (!mHabRecord.groupMetadata) {
      throw new Error(MultiSigService.MISSING_GROUP_METADATA);
    }

    const mHab = await this.props.signifyClient
      .identifiers()
      .get(mHabRecord.id);
    const groupName = `${mHabRecord.theme}:${mHabRecord.displayName}`;

    // @TODO - foconnor: We should error here if smids no longer matches once we have multi-sig rotation.
    const states = await Promise.all(
      exn.a.smids.map(
        async (memberId) =>
          (
            await this.props.signifyClient.keyStates().get(memberId)
          )[0]
      )
    );

    const inceptionData = backgroundTask
      ? await this.getInceptionData(groupName)
      : await this.generateAndStoreInceptionData(
        mHab,
        states,
        groupName,
        Number(exn.e.icp.kt),
        {
          initiator: false,
          notificationId,
          notificationSaid,
        },
        exn.e.icp.bt,
        exn.e.icp.b
      );
    await this.inceptGroup(mHab, states, inceptionData);

    const multisigId = inceptionData.icp.i;
    const creationStatus = CreationStatus.PENDING;
    const multisigDetail = (await this.props.signifyClient
      .identifiers()
      .get(multisigId)) as HabState;

    try {
      await this.identifierStorage.createIdentifierMetadataRecord({
        id: multisigId,
        displayName: mHabRecord.displayName,
        theme: mHabRecord.theme,
        creationStatus,
        groupMemberPre: mHabRecord.id,
        createdAt: new Date(multisigDetail.icp_dt),
      });
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.startsWith(
            StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG
          )
        )
      ) {
        throw error;
      }
    }

    mHabRecord.groupMetadata.groupCreated = true;
    await this.identifierStorage.updateIdentifierMetadata(
      mHabRecord.id,
      mHabRecord
    );
    this.props.eventEmitter.emit<GroupCreatedEvent>({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: multisigId,
          displayName: mHabRecord.displayName,
          theme: mHabRecord.theme,
          creationStatus,
          groupMemberPre: mHabRecord.id,
          createdAtUTC: multisigDetail.icp_dt,
        },
      },
    });

    await this.operationPendingStorage.save({
      id: `group.${multisigId}`,
      recordType: OperationPendingRecordType.Group,
    });

    try {
      await deleteNotificationRecordById(
        this.props.signifyClient,
        this.notificationStorage,
        notificationId,
        NotificationRoute.MultiSigIcp
      );
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.startsWith(
            StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG
          )
        )
      ) {
        throw error;
      }
    }

    // Finally, remove from the re-try record
    const pendingGroupsRecord = await this.basicStorage.findExpectedById(
      MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION
    );

    const queued = pendingGroupsRecord.content.queued as QueuedGroupCreation[];
    const index = queued.findIndex((group) => group.name === groupName);
    if (index !== -1) {
      queued.splice(index, 1);
    }
    await this.basicStorage.update(pendingGroupsRecord);
  }

  async getMultisigParticipants(
    multisigId: string
  ): Promise<GroupParticipants> {
    const members = await this.props.signifyClient
      .identifiers()
      .members(multisigId);
    const multisigMembers = members.signing;

    let ourIdentifier;
    for (const member of multisigMembers) {
      const identifier = await this.identifierStorage
        .getIdentifierMetadata(member.aid)
        .catch((error) => {
          if (
            error.message ===
            IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING
          ) {
            return undefined;
          } else {
            throw error;
          }
        });

      if (identifier && identifier.groupMetadata?.groupCreated) {
        ourIdentifier = identifier;
        break;
      }
    }

    if (!ourIdentifier) {
      throw new Error(MultiSigService.MEMBER_AID_NOT_FOUND);
    }

    return {
      ourIdentifier,
      multisigMembers,
    };
  }

  async endRoleAuthorization(multisigId: string): Promise<void> {
    const { ourIdentifier, multisigMembers } =
      await this.getMultisigParticipants(multisigId);

    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    const mHab = await this.props.signifyClient
      .identifiers()
      .get(ourIdentifier.id as string);

    const recp = multisigMembers
      .filter((signing: any) => signing.aid !== ourIdentifier.id)
      .map((member: any) => member.aid);

    for (const member of multisigMembers) {
      const eid = Object.keys(member.ends.agent)[0]; //agent of member
      const endRoleRes = await this.props.signifyClient
        .identifiers()
        .addEndRole(
          multisigId,
          "agent",
          eid,
          new Date().toISOString().replace("Z", "000+00:00")
        );
      await endRoleRes.op();

      const rpy = endRoleRes.serder;
      const mstate = gHab["state"];
      const seal = [
        "SealEvent",
        { i: gHab["prefix"], s: mstate["ee"]["s"], d: mstate["ee"]["d"] },
      ];
      const sigers = endRoleRes.sigs.map((sig) => new Siger({ qb64: sig }));
      const roleims = d(
        messagize(rpy, sigers, seal, undefined, undefined, false)
      );
      const atc = roleims.substring(rpy.size);
      const roleEmbeds = {
        rpy: [rpy, atc],
      };

      await this.props.signifyClient.exchanges().send(
        ourIdentifier.id,
        "multisig",
        mHab,
        MultiSigRoute.RPY,
        {
          gid: gHab.prefix,
        },
        roleEmbeds,
        recp
      );
    }
  }

  async joinAuthorization(requestExn: AuthorizationRequestExn): Promise<void> {
    const multisigId = requestExn.a.gid;
    const rpystamp = requestExn.e.rpy.dt;
    const rpyrole = requestExn.e.rpy.a.role;
    const rpyeid = requestExn.e.rpy.a.eid;

    const endRoleRes = await this.props.signifyClient
      .identifiers()
      .addEndRole(multisigId, rpyrole, rpyeid, rpystamp);
    await endRoleRes.op();
    const rpy = endRoleRes.serder;

    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    const mstate = gHab["state"];
    const seal = [
      "SealEvent",
      { i: gHab["prefix"], s: mstate["ee"]["s"], d: mstate["ee"]["d"] },
    ];
    const sigers = endRoleRes.sigs.map((sig) => new Siger({ qb64: sig }));
    const roleims = d(
      messagize(rpy, sigers, seal, undefined, undefined, false)
    );
    const atc = roleims.substring(rpy.size);
    const roleEmbeds = {
      rpy: [rpy, atc],
    };

    const { ourIdentifier, multisigMembers } =
      await this.getMultisigParticipants(multisigId);
    const recp = multisigMembers
      .filter((signing: any) => signing.aid !== ourIdentifier.id)
      .map((member: any) => member.aid);
    const mHab = await this.props.signifyClient
      .identifiers()
      .get(ourIdentifier.id as string);

    await this.props.signifyClient.exchanges().send(
      ourIdentifier.id,
      "multisig",
      mHab,
      MultiSigRoute.RPY,
      {
        gid: gHab.prefix,
      },
      roleEmbeds,
      recp
    );
  }

  async processGroupsPendingCreation(): Promise<void> {
    const pendingGroupsRecord = await this.basicStorage.findById(
      MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION
    );
    if (!pendingGroupsRecord) return;

    for (const queued of pendingGroupsRecord.content
      .queued as QueuedGroupCreation[]) {
      if (queued.initiator) {
        await this.createGroup(
          queued.data.group!.mhab.prefix,
          queued.groupConnections,
          queued.threshold,
          true
        );
      } else {
        await this.joinGroup(
          queued.notificationId,
          queued.notificationSaid,
          true
        );
      }
    }
  }
}

export { MultiSigService };
