import { HabState, Operation, Signer } from "signify-ts";
import {
  CreateIdentifierResult,
  IdentifierDetails,
  IdentifierShortDetails,
  RemoteSignRequest,
} from "./identifier.types";
import {
  CreationStatus,
  AgentServicesProps,
  MiscRecordId,
} from "../agent.types";
import {
  ExchangeRoute,
  NotificationRoute,
} from "./keriaNotificationService.types";
import {
  IdentifierMetadataRecord,
  IdentifierMetadataRecordProps,
} from "../records/identifierMetadataRecord";
import { AgentService } from "./agentService";
import { OnlineOnly, randomSalt, deleteNotificationRecordById } from "./utils";
import {
  BasicRecord,
  BasicStorage,
  IdentifierStorage,
  NotificationStorage,
} from "../records";
import { OperationPendingStorage } from "../records/operationPendingStorage";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { Agent } from "../agent";
import { PeerConnection } from "../../cardano/walletConnect/peerConnection";
import { ConnectionService } from "./connectionService";
import {
  EventTypes,
  IdentifierAddedEvent,
  IdentifierRemovedEvent,
  NotificationRemovedEvent,
} from "../event.types";
import { StorageMessage } from "../../storage/storage.types";
import { OobiQueryParams } from "./connectionService.types";
import type { KeriaNotification } from "./keriaNotificationService.types";

const UI_THEMES = [
  0, 1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 40, 41, 42, 43,
];

class IdentifierService extends AgentService {
  static readonly IDENTIFIER_METADATA_RECORD_MISSING =
    "Identifier metadata record does not exist";
  static readonly INVALID_THEME = "Identifier theme was not valid";
  static readonly EXN_MESSAGE_NOT_FOUND =
    "There's no exchange message for the given SAID";
  static readonly FAILED_TO_OBTAIN_KEY_MANAGER =
    "Failed to obtain key manager for given AID";
  static readonly IDENTIFIER_NOT_COMPLETE =
    "Cannot fetch identifier details as the identifier is still pending or failed to complete";
  static readonly INSUFFICIENT_WITNESSES_AVAILABLE =
    "An insufficient number of discoverable witnesses are available on connected KERIA instance";
  static readonly MISCONFIGURED_AGENT_CONFIGURATION =
    "Misconfigured KERIA agent for this wallet type";
  static readonly INVALID_QUEUED_DISPLAY_NAMES_FORMAT =
    "Queued display names has invalid format";
  static readonly CANNOT_FIND_EXISTING_IDENTIFIER_BY_SEARCH =
    "Identifier name taken on KERIA, but cannot be found when iterating over identifier list";
  static readonly DELETED_IDENTIFIER_THEME = "XX";

  protected readonly identifierStorage: IdentifierStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly basicStorage: BasicStorage;
  protected readonly notificationStorage: NotificationStorage;
  protected readonly connections: ConnectionService;

  constructor(
    agentServiceProps: AgentServicesProps,
    identifierStorage: IdentifierStorage,
    operationPendingStorage: OperationPendingStorage,
    basicStorage: BasicStorage,
    notificationStorage: NotificationStorage,
    connections: ConnectionService
  ) {
    super(agentServiceProps);
    this.identifierStorage = identifierStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.basicStorage = basicStorage;
    this.notificationStorage = notificationStorage;
    this.connections = connections;
  }

  onIdentifierRemoved() {
    this.props.eventEmitter.on(
      EventTypes.IdentifierRemoved,
      (data: IdentifierRemovedEvent) => {
        this.deleteIdentifier(data.payload.id);
      }
    );
  }

  onIdentifierAdded(callback: (event: IdentifierAddedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.IdentifierAdded, callback);
  }

  async getIdentifiers(userFacing = true): Promise<IdentifierShortDetails[]> {
    const identifiers: IdentifierShortDetails[] = [];
    const records: IdentifierMetadataRecord[] = userFacing
      ? await this.identifierStorage.getUserFacingIdentifierRecords()
      : await this.identifierStorage.getIdentifierRecords();

    for (let i = 0; i < records.length; i++) {
      const metadata = records[i];
      const identifier: IdentifierShortDetails = {
        displayName: metadata.displayName,
        id: metadata.id,
        createdAtUTC: metadata.createdAt.toISOString(),
        theme: metadata.theme,
        creationStatus: metadata.creationStatus ?? false,
        groupMetadata: metadata.groupMetadata,
      };
      if (metadata.groupMemberPre) {
        identifier.groupMemberPre = metadata.groupMemberPre;
      }
      identifiers.push(identifier);
    }
    return identifiers;
  }

  @OnlineOnly
  async getIdentifier(identifier: string): Promise<IdentifierDetails> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    if (
      metadata.creationStatus === CreationStatus.PENDING ||
      metadata.creationStatus === CreationStatus.FAILED
    ) {
      throw new Error(IdentifierService.IDENTIFIER_NOT_COMPLETE);
    }

    const hab = await this.props.signifyClient
      .identifiers()
      .get(identifier)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: ${metadata.id}`, {
            cause: error,
          });
        } else {
          throw error;
        }
      });

    let members;
    if (hab.group) {
      members = (
        await this.props.signifyClient.identifiers().members(identifier)
      ).signing.map((member: any) => member.aid);
    }

    return {
      id: hab.prefix,
      displayName: metadata.displayName,
      createdAtUTC: metadata.createdAt.toISOString(),
      theme: metadata.theme,
      groupMemberPre: metadata.groupMemberPre,
      creationStatus: metadata.creationStatus,
      groupMetadata: metadata.groupMetadata,
      s: hab.state.s,
      dt: hab.state.dt,
      kt: hab.state.kt,
      k: hab.state.k,
      nt: hab.state.nt,
      n: hab.state.n,
      bt: hab.state.bt,
      b: hab.state.b,
      di: hab.state.di,
      members,
    };
  }

  async processIdentifiersPendingCreation(): Promise<void> {
    const pendingIdentifiersRecord = await this.basicStorage.findById(
      MiscRecordId.IDENTIFIERS_PENDING_CREATION
    );

    if (!pendingIdentifiersRecord) return;

    if (!Array.isArray(pendingIdentifiersRecord.content.queued)) {
      throw new Error(IdentifierService.INVALID_QUEUED_DISPLAY_NAMES_FORMAT);
    }

    for (const queued of pendingIdentifiersRecord.content.queued) {
      let metadata: Omit<IdentifierMetadataRecordProps, "id" | "createdAt">;
      const splitName = queued.split(":");
      const theme = Number(splitName[0]);
      const groupMatch = splitName[1].match(/^(\d)-(.+)-(.+)$/);
      if (groupMatch) {
        metadata = {
          theme,
          displayName: splitName[2],
          groupMetadata: {
            groupId: splitName[1].substring(2),
            groupInitiator: splitName[1][0] === "1",
            groupCreated: false,
          },
        };
      } else {
        metadata = {
          theme,
          displayName: splitName[1],
        };
      }

      await this.createIdentifier(metadata, true);
    }
  }

  @OnlineOnly
  async createIdentifier(
    metadata: Omit<IdentifierMetadataRecordProps, "id" | "createdAt">,
    backgroundTask = false
  ): Promise<CreateIdentifierResult> {
    const { toad, witnesses } = await this.getAvailableWitnesses();

    if (!UI_THEMES.includes(metadata.theme)) {
      throw new Error(IdentifierService.INVALID_THEME);
    }

    // For simplicity, it's up to the UI to provide a unique name
    let name = `${metadata.theme}:${metadata.displayName}`;
    if (metadata.groupMetadata) {
      const initiatorFlag = metadata.groupMetadata.groupInitiator ? "1" : "0";
      name = `${metadata.theme}:${initiatorFlag}-${metadata.groupMetadata.groupId}:${metadata.displayName}`;
    }

    // For distributed reliability, store name so we can re-try on start-up
    // Hence much of this function will ignore duplicate errors
    if (!backgroundTask) {
      let processingNames = [];
      const pendingIdentifiersRecord = await this.basicStorage.findById(
        MiscRecordId.IDENTIFIERS_PENDING_CREATION
      );
      if (pendingIdentifiersRecord) {
        const { queued } = pendingIdentifiersRecord.content;
        if (!Array.isArray(queued)) {
          throw new Error(
            IdentifierService.INVALID_QUEUED_DISPLAY_NAMES_FORMAT
          );
        }
        processingNames = queued;
      }
      processingNames.push(name);

      await this.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: { queued: processingNames },
        })
      );
    }

    let identifier;
    try {
      const result = await this.props.signifyClient.identifiers().create(name, {
        toad,
        wits: witnesses.map((w) => w.eid),
      });
      await result.op();
      identifier = result.serder.ked.i;
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      const [, status, reason] = error.message.split(" - ");
      if (!(/400/gi.test(status) && /already incepted/gi.test(reason))) {
        throw error;
      }

      // @TODO - foconnor: Should have a way in KERIA to search by name
      //  Encoding the name in the URL is problematic, and will be changed to identifier only.
      //  But here we don't know what the identifier is, so we have to manually search.
      const details = await this.searchByName(name);
      if (!details) {
        throw new Error(
          IdentifierService.CANNOT_FIND_EXISTING_IDENTIFIER_BY_SEARCH
        );
      }
      identifier = details.prefix;
    }

    const identifierDetail = (await this.props.signifyClient
      .identifiers()
      .get(identifier)) as HabState;

    const addRoleOperation = await this.props.signifyClient
      .identifiers()
      .addEndRole(identifier, "agent", this.props.signifyClient.agent!.pre);
    await addRoleOperation.op();

    const creationStatus = CreationStatus.PENDING;
    try {
      await this.identifierStorage.createIdentifierMetadataRecord({
        id: identifier,
        ...metadata,
        creationStatus,
        createdAt: new Date(identifierDetail.icp_dt),
        sxlt: identifierDetail.salty?.sxlt,
      });

      this.props.eventEmitter.emit<IdentifierAddedEvent>({
        type: EventTypes.IdentifierAdded,
        payload: {
          identifier: {
            id: identifier,
            ...metadata,
            creationStatus,
            createdAtUTC: new Date(identifierDetail.icp_dt).toISOString(),
          },
        },
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

    await this.operationPendingStorage.save({
      id: `witness.${identifier}`,
      recordType: OperationPendingRecordType.Witness,
    });

    // Finally, remove from the re-try record
    const pendingIdentifiersRecord = await this.basicStorage.findById(
      MiscRecordId.IDENTIFIERS_PENDING_CREATION
    );

    if (pendingIdentifiersRecord) {
      const { queued } = pendingIdentifiersRecord.content;
      if (!Array.isArray(queued)) {
        throw new Error(IdentifierService.INVALID_QUEUED_DISPLAY_NAMES_FORMAT);
      }

      const index = queued.indexOf(name);
      if (index !== -1) {
        queued.splice(index, 1);
      }
      await this.basicStorage.update(pendingIdentifiersRecord);
    }
    return { identifier, createdAt: identifierDetail.icp_dt };
  }

  async deleteIdentifier(identifier: string): Promise<void> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    if (metadata.groupMetadata) {
      await this.deleteGroupLinkedConnections(metadata.groupMetadata.groupId);
    }

    if (metadata.groupMemberPre) {
      const localMember = await this.identifierStorage.getIdentifierMetadata(
        metadata.groupMemberPre
      );

      await this.identifierStorage.updateIdentifierMetadata(
        metadata.groupMemberPre,
        {
          isDeleted: true,
          pendingDeletion: false,
        }
      );
      await this.props.signifyClient.identifiers().update(localMember.id, {
        name: `${IdentifierService.DELETED_IDENTIFIER_THEME}-${randomSalt()}:${
          localMember.groupMetadata?.groupId
        }:${localMember.displayName}`,
      });

      await this.deleteGroupLinkedConnections(
        localMember.groupMetadata!.groupId
      );

      for (const notification of await this.notificationStorage.findAllByQuery({
        receivingPre: metadata.groupMemberPre,
      })) {
        await deleteNotificationRecordById(
          this.props.signifyClient,
          this.notificationStorage,
          notification.id,
          notification.a.r as NotificationRoute
        );

        this.props.eventEmitter.emit<NotificationRemovedEvent>({
          type: EventTypes.NotificationRemoved,
          payload: {
            id: notification.id,
          },
        });
      }
    }

    await this.props.signifyClient.identifiers().update(identifier, {
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}-${randomSalt()}:${
        metadata.displayName
      }`,
    });

    for (const notification of await this.notificationStorage.findAllByQuery({
      receivingPre: identifier,
    })) {
      await deleteNotificationRecordById(
        this.props.signifyClient,
        this.notificationStorage,
        notification.id,
        notification.a.r as NotificationRoute
      );

      this.props.eventEmitter.emit<NotificationRemovedEvent>({
        type: EventTypes.NotificationRemoved,
        payload: {
          id: notification.id,
        },
      });
    }

    const connectedDApp =
      PeerConnection.peerConnection.getConnectedDAppAddress();
    if (
      connectedDApp !== "" &&
      metadata.id ===
        (await PeerConnection.peerConnection.getConnectingIdentifier()).id
    ) {
      PeerConnection.peerConnection.disconnectDApp(connectedDApp, true);
    }

    await this.identifierStorage.updateIdentifierMetadata(identifier, {
      isDeleted: true,
      pendingDeletion: false,
    });
  }

  async removeIdentifiersPendingDeletion(): Promise<void> {
    const pendingIdentifierDeletions =
      await this.identifierStorage.getIdentifiersPendingDeletion();

    for (const identifier of pendingIdentifierDeletions) {
      await this.deleteIdentifier(identifier.id);
    }
  }

  async markIdentifierPendingDelete(id: string): Promise<void> {
    const identifierProps = await this.identifierStorage.getIdentifierMetadata(
      id
    );
    if (!identifierProps) {
      throw new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING);
    }

    identifierProps.pendingDeletion = true;
    await this.identifierStorage.updateIdentifierMetadata(id, {
      pendingDeletion: true,
    });

    this.props.eventEmitter.emit<IdentifierRemovedEvent>({
      type: EventTypes.IdentifierRemoved,
      payload: {
        id,
      },
    });
  }

  private async deleteGroupLinkedConnections(groupId: string): Promise<void> {
    const connections = await this.connections.getMultisigLinkedContacts(
      groupId
    );
    for (const connection of connections) {
      await this.connections.deleteConnectionById(connection.id);
    }
  }

  async deleteStaleLocalIdentifier(identifier: string): Promise<void> {
    const connectedDApp =
      PeerConnection.peerConnection.getConnectedDAppAddress();
    if (
      connectedDApp !== "" &&
      identifier ===
        (await PeerConnection.peerConnection.getConnectingIdentifier()).id
    ) {
      PeerConnection.peerConnection.disconnectDApp(connectedDApp, true);
    }
    await this.identifierStorage.deleteIdentifierMetadata(identifier);
  }

  async updateIdentifier(
    identifier: string,
    data: Pick<
      IdentifierMetadataRecordProps,
      "theme" | "displayName" | "groupMetadata"
    >
  ): Promise<void> {
    await this.props.signifyClient.identifiers().update(identifier, {
      name: `${data.theme}:${data.displayName}`,
    });
    return this.identifierStorage.updateIdentifierMetadata(identifier, {
      theme: data.theme,
      displayName: data.displayName,
    });
  }

  @OnlineOnly
  async getSigner(identifier: string): Promise<Signer> {
    const hab = await this.props.signifyClient.identifiers().get(identifier);

    const manager = this.props.signifyClient.manager;
    if (manager) {
      return manager.get(hab).signers[0];
    } else {
      throw new Error(IdentifierService.FAILED_TO_OBTAIN_KEY_MANAGER);
    }
  }

  async syncKeriaIdentifiers(): Promise<void> {
    const cloudIdentifiers: any[] = [];
    let returned = -1;
    let iteration = 0;

    while (returned !== 0) {
      const result = await this.props.signifyClient
        .identifiers()
        .list(iteration * (24 + 1), 24 + iteration * (24 + 1));
      cloudIdentifiers.push(...result.aids);

      returned = result.aids.length;
      iteration += 1;
    }

    const localIdentifiers = await this.identifierStorage.getAllIdentifiers();

    const unSyncedDataWithGroup = [];
    const unSyncedDataWithoutGroup = [];
    for (const identifier of cloudIdentifiers) {
      if (localIdentifiers.find((item) => item.id === identifier.prefix)) {
        continue;
      }

      if (identifier.group === undefined) {
        unSyncedDataWithoutGroup.push(identifier);
      } else {
        unSyncedDataWithGroup.push(identifier);
      }
    }

    for (const identifier of unSyncedDataWithoutGroup) {
      const op: Operation = await this.props.signifyClient
        .operations()
        .get(`witness.${identifier.prefix}`);

      const creationStatus = op.done
        ? op.error
          ? CreationStatus.FAILED
          : CreationStatus.COMPLETE
        : CreationStatus.PENDING;
      if (creationStatus === CreationStatus.PENDING) {
        await this.operationPendingStorage.save({
          id: op.name,
          recordType: OperationPendingRecordType.Witness,
        });
      }

      const nameParts = identifier.name.split(":");
      const theme =
        nameParts[0] === IdentifierService.DELETED_IDENTIFIER_THEME
          ? 0
          : parseInt(nameParts[0], 10);

      const localGroupMember = nameParts.length === 3;
      const identifierDetail = (await this.props.signifyClient
        .identifiers()
        .get(identifier.prefix)) as HabState;

      if (localGroupMember) {
        const groupIdParts = nameParts[1].split("-");
        const groupInitiator = groupIdParts[0] === "1";

        await this.identifierStorage.createIdentifierMetadataRecord({
          id: identifier.prefix,
          displayName: nameParts[2],
          theme,
          groupMetadata: {
            groupId: groupIdParts[1],
            groupCreated: false,
            groupInitiator,
          },
          creationStatus,
          createdAt: new Date(identifierDetail.icp_dt),
          sxlt: identifierDetail.salty?.sxlt,
          isDeleted: identifier.name.startsWith(
            IdentifierService.DELETED_IDENTIFIER_THEME
          ),
        });
        continue;
      }

      await this.identifierStorage.createIdentifierMetadataRecord({
        id: identifier.prefix,
        displayName: nameParts[1],
        theme,
        creationStatus,
        createdAt: new Date(identifierDetail.icp_dt),
        sxlt: identifierDetail.salty?.sxlt,
        isDeleted: identifier.name.startsWith(
          IdentifierService.DELETED_IDENTIFIER_THEME
        ),
      });
    }

    for (const identifier of unSyncedDataWithGroup) {
      const identifierDetail = (await this.props.signifyClient
        .identifiers()
        .get(identifier.prefix)) as HabState;

      const nameParts = identifier.name.split(":");
      const theme =
        nameParts[0] === IdentifierService.DELETED_IDENTIFIER_THEME
          ? 0
          : parseInt(nameParts[0], 10);

      const groupMemberPre = identifier.group.mhab.prefix;
      const groupIdParts = identifier.group.mhab.name.split(":")[1].split("-");
      const groupInitiator = groupIdParts[0] === "1";

      const op = await this.props.signifyClient
        .operations()
        .get(`group.${identifier.prefix}`);

      const creationStatus = op.done
        ? op.error
          ? CreationStatus.FAILED
          : CreationStatus.COMPLETE
        : CreationStatus.PENDING;
      if (creationStatus === CreationStatus.PENDING) {
        await this.operationPendingStorage.save({
          id: op.name,
          recordType: OperationPendingRecordType.Group,
        });
      }

      // Mark as created
      await this.identifierStorage.updateIdentifierMetadata(groupMemberPre, {
        groupMetadata: {
          groupId: groupIdParts[1],
          groupCreated: true,
          groupInitiator,
        },
      });

      await this.identifierStorage.createIdentifierMetadataRecord({
        id: identifier.prefix,
        displayName: nameParts[1],
        theme,
        groupMemberPre,
        creationStatus,
        createdAt: new Date(identifierDetail.icp_dt),
        isDeleted: identifier.name.startsWith(
          IdentifierService.DELETED_IDENTIFIER_THEME
        ),
      });
    }
  }

  @OnlineOnly
  async rotateIdentifier(identifier: string): Promise<void> {
    const rotateResult = await this.props.signifyClient
      .identifiers()
      .rotate(identifier);
    await rotateResult.op();
  }

  @OnlineOnly
  async getRemoteSignRequestDetails(
    requestSaid: string
  ): Promise<RemoteSignRequest> {
    const exchange = (
      await this.props.signifyClient.exchanges().get(requestSaid)
    ).exn;
    const payload = exchange.a;
    delete payload.d;

    return {
      identifier: exchange.rp,
      payload,
    };
  }

  @OnlineOnly
  async remoteSign(notificationId: string, requestSaid: string): Promise<void> {
    const noteRecord = await this.notificationStorage.findExpectedById(
      notificationId
    );
    const exchange = await this.props.signifyClient
      .exchanges()
      .get(requestSaid);

    const identifier = exchange.exn.rp;
    const seal = { d: exchange.exn.a.d }; // KeriaNotificationService verifies d is correct for a block

    // @TODO - foconnor: We should track the operation and submit the exn after completion
    const ixnResult = await this.props.signifyClient
      .identifiers()
      .interact(identifier, seal);

    const hab = await this.props.signifyClient.identifiers().get(identifier);
    const [exn, sigs, atc] = await this.props.signifyClient
      .exchanges()
      .createExchangeMessage(
        hab,
        ExchangeRoute.RemoteSignRef,
        { sn: ixnResult.serder.ked.s },
        [],
        exchange.exn.i,
        undefined,
        requestSaid
      );
    await this.props.signifyClient
      .exchanges()
      .sendFromEvents(identifier, "remotesign", exn, sigs, atc, [
        exchange.exn.i,
      ]);

    await deleteNotificationRecordById(
      this.props.signifyClient,
      this.notificationStorage,
      notificationId,
      noteRecord.route
    );
    this.props.eventEmitter.emit<NotificationRemovedEvent>({
      type: EventTypes.NotificationRemoved,
      payload: {
        id: notificationId,
      },
    });
  }

  async getAvailableWitnesses(): Promise<{
    toad: number;
    witnesses: Array<{ eid: string; oobi: string }>;
  }> {
    const config = await this.props.signifyClient.config().get();
    if (!config.iurls) {
      throw new Error(IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION);
    }

    const witnesses: Array<[string, { eid: string; oobi: string }]> = [];
    for (const oobi of config.iurls) {
      const role = new URL(oobi).searchParams.get(OobiQueryParams.ROLE);
      if (role === "witness") {
        const eid = oobi.split("/oobi/")[1].split("/")[0];
        witnesses.push([eid, { eid, oobi }]);
      }
    }

    const witnessMap = new Map();
    for (const [key, value] of witnesses) {
      if (!witnessMap.has(key)) {
        witnessMap.set(key, value);
      }
    }
    const uniqueWitnesses = [...witnessMap.values()];

    if (uniqueWitnesses.length >= 12)
      return { toad: 8, witnesses: uniqueWitnesses.slice(0, 12) };
    if (uniqueWitnesses.length >= 10)
      return { toad: 7, witnesses: uniqueWitnesses.slice(0, 10) };
    if (uniqueWitnesses.length >= 9)
      return { toad: 6, witnesses: uniqueWitnesses.slice(0, 9) };
    if (uniqueWitnesses.length >= 7)
      return { toad: 5, witnesses: uniqueWitnesses.slice(0, 7) };
    if (uniqueWitnesses.length >= 6)
      return { toad: 4, witnesses: uniqueWitnesses.slice(0, 6) };

    throw new Error(IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE);
  }

  private async searchByName(name: string): Promise<HabState | undefined> {
    let returned = -1;
    let iteration = 0;

    while (returned !== 0) {
      const result = await this.props.signifyClient
        .identifiers()
        .list(iteration * (24 + 1), 24 + iteration * (24 + 1));
      for (const identifier of result.aids) {
        if (identifier.name === name) return identifier;
      }

      returned = result.aids.length;
      iteration += 1;
    }
  }
}

export { IdentifierService };
