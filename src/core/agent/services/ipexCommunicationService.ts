import {
  b,
  d,
  Ilks,
  messagize,
  Operation,
  Saider,
  Serder,
  Siger,
} from "signify-ts";
import { ExnMessage, type AgentServicesProps } from "../agent.types";
import { type KeriaNotification } from "./keriaNotificationService.types";
import { ExchangeRoute } from "./keriaNotificationService.types";
import {
  CredentialStorage,
  IdentifierStorage,
  NotificationStorage,
  OperationPendingStorage,
  IdentifierMetadataRecord,
  NotificationRecord,
  CredentialMetadataRecord,
} from "../records";
import { CredentialMetadataRecordProps } from "../records/credentialMetadataRecord.types";
import { AgentService } from "./agentService";
import { getCredentialShortDetails, OnlineOnly } from "./utils";
import { CredentialStatus, ACDCDetails } from "./credentialService.types";
import {
  CredentialsMatchingApply,
  LinkedGroupInfo,
  SubmitIPEXResult,
} from "./ipexCommunicationService.types";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { MultiSigService } from "./multiSigService";
import { GrantToJoinMultisigExnPayload, MultiSigRoute } from "./multiSig.types";
import { AcdcStateChangedEvent, EventTypes } from "../event.types";
import { ConnectionService } from "./connectionService";
import { IdentifierType } from "./identifier.types";
import {
  ConnectionHistoryItem,
  ConnectionHistoryType,
  KeriaContactKeyPrefix,
} from "./connectionService.types";
import { Agent } from "../agent";
import { StorageMessage } from "../../storage/storage.types";

class IpexCommunicationService extends AgentService {
  static readonly ISSUEE_NOT_FOUND_LOCALLY =
    "Cannot accept incoming ACDC, issuee AID not found in local wallet DB";
  static readonly NOTIFICATION_NOT_FOUND = "Notification record not found";
  static readonly CREDENTIAL_NOT_FOUND_WITH_SCHEMA =
    "Credential not found with this schema";
  static readonly CREDENTIAL_NOT_FOUND = "Credential not found to present";
  static readonly SCHEMA_NOT_FOUND = "Schema not found";
  static readonly IPEX_ALREADY_REPLIED =
    "IPEX message has already been responded to or proposed to group";
  static readonly NO_CURRENT_IPEX_MSG_TO_JOIN =
    "Cannot join IPEX message as there is no current exn to join from the group leader";
  static readonly INVALID_HISTORY_TYPE = "Invalid history type";

  static readonly SCHEMA_SAID_ROME_DEMO =
    "EMkpplwGGw3fwdktSibRph9NSy_o2MvKDKO8ZoONqTOt";

  protected readonly identifierStorage: IdentifierStorage;
  protected readonly credentialStorage: CredentialStorage;
  protected readonly notificationStorage: NotificationStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly multisigService: MultiSigService;
  protected readonly connections: ConnectionService;

  constructor(
    agentServiceProps: AgentServicesProps,
    identifierStorage: IdentifierStorage,
    credentialStorage: CredentialStorage,
    notificationStorage: NotificationStorage,
    operationPendingStorage: OperationPendingStorage,
    multisigService: MultiSigService,
    connections: ConnectionService
  ) {
    super(agentServiceProps);
    this.identifierStorage = identifierStorage;
    this.credentialStorage = credentialStorage;
    this.notificationStorage = notificationStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.multisigService = multisigService;
    this.connections = connections;
  }

  @OnlineOnly
  async admitAcdcFromGrant(notificationId: string): Promise<void> {
    const grantNoteRecord = await this.notificationStorage.findById(
      notificationId
    );
    if (!grantNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${notificationId}`
      );
    }

    // For groups only
    if (grantNoteRecord.linkedRequest.accepted) {
      throw new Error(
        `${IpexCommunicationService.IPEX_ALREADY_REPLIED} ${notificationId}`
      );
    }

    const grantExn = await this.props.signifyClient
      .exchanges()
      .get(grantNoteRecord.a.d as string);

    const holder = await this.identifierStorage.getIdentifierMetadata(
      grantExn.exn.rp
    );
    if (!holder) {
      throw new Error(IpexCommunicationService.ISSUEE_NOT_FOUND_LOCALLY);
    }

    const schemaSaid = grantExn.exn.e.acdc.s;
    const issuerOobi = (
      await this.connections.getConnectionById(grantExn.exn.i)
    ).serviceEndpoints[0];
    await this.connections.resolveOobi(
      await this.getSchemaUrl(issuerOobi, grantExn.exn.i, schemaSaid),
      true
    );

    const allSchemaSaids = Object.keys(grantExn.exn.e.acdc?.e || {})
      .map(
        // Chained schemas, will be resolved in admit/multisigAdmit
        (key) => grantExn.exn.e.acdc.e?.[key]?.s
      )
      .filter((schema) => !!schema);
    allSchemaSaids.push(schemaSaid);

    const schema = await this.props.signifyClient.schemas().get(schemaSaid);
    try {
      const credential = await this.saveAcdcMetadataRecord(
        holder,
        grantExn.exn.e.acdc.d,
        grantExn.exn.e.acdc.a.dt,
        schema.title,
        grantExn.exn.i,
        schemaSaid
      );

      this.props.eventEmitter.emit<AcdcStateChangedEvent>({
        type: EventTypes.AcdcStateChanged,
        payload: {
          credential: getCredentialShortDetails(credential),
          status: CredentialStatus.PENDING,
        },
      });
    } catch (error) {
      // Ignore this as we might have failed before we deleted the notification and need to retry in the UI
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

    let op: Operation;
    if (holder.groupMemberPre) {
      const { op: opMultisigAdmit, exnSaid } = await this.submitMultisigAdmit(
        holder.id,
        grantExn,
        allSchemaSaids
      );

      op = opMultisigAdmit;
      grantNoteRecord.linkedRequest = {
        ...grantNoteRecord.linkedRequest,
        accepted: true,
        current: exnSaid,
      };
    } else {
      const { op: opAdmit, exnSaid } = await this.admitIpex(
        grantNoteRecord.a.d as string,
        holder.id,
        grantExn.exn.i,
        issuerOobi,
        allSchemaSaids
      );

      op = opAdmit;
      grantNoteRecord.linkedRequest = {
        ...grantNoteRecord.linkedRequest,
        accepted: true,
        current: exnSaid,
      };
      grantNoteRecord.hidden = true;
    }

    await this.operationPendingStorage.save({
      id: op.name,
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    await this.notificationStorage.update(grantNoteRecord);
  }

  @OnlineOnly
  async offerAcdcFromApply(notificationId: string, acdc: any): Promise<void> {
    const applyNoteRecord = await this.notificationStorage.findById(
      notificationId
    );
    if (!applyNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${notificationId}`
      );
    }

    // For groups only
    if (applyNoteRecord.linkedRequest.accepted) {
      throw new Error(
        `${IpexCommunicationService.IPEX_ALREADY_REPLIED} ${notificationId}`
      );
    }

    const msgSaid = applyNoteRecord.a.d as string;
    const applyExn = await this.props.signifyClient.exchanges().get(msgSaid);

    const discloser = await this.identifierStorage.getIdentifierMetadata(
      applyExn.exn.rp
    );

    let op: Operation;
    if (discloser.groupMemberPre) {
      const { op: opMultisigOffer, exnSaid } = await this.submitMultisigOffer(
        discloser.id,
        msgSaid,
        acdc,
        applyExn.exn.i
      );

      op = opMultisigOffer;
      applyNoteRecord.linkedRequest = {
        ...applyNoteRecord.linkedRequest,
        accepted: true,
        current: exnSaid,
      };
    } else {
      const [offer, sigs, end] = await this.props.signifyClient.ipex().offer({
        senderName: discloser.id,
        recipient: applyExn.exn.i,
        acdc: new Serder(acdc),
        applySaid: applyExn.exn.d,
      });
      op = await this.props.signifyClient
        .ipex()
        .submitOffer(discloser.id, offer, sigs, end, [applyExn.exn.i]);

      applyNoteRecord.linkedRequest = {
        ...applyNoteRecord.linkedRequest,
        accepted: true,
        current: offer.ked.d,
      };
      applyNoteRecord.hidden = true;
    }

    await this.operationPendingStorage.save({
      id: op.name,
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });

    await this.notificationStorage.update(applyNoteRecord);
  }

  @OnlineOnly
  async grantAcdcFromAgree(notificationId: string): Promise<void> {
    const agreeNoteRecord = await this.notificationStorage.findById(
      notificationId
    );
    if (!agreeNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${notificationId}`
      );
    }

    // For groups only
    if (agreeNoteRecord.linkedRequest.accepted) {
      throw new Error(
        `${IpexCommunicationService.IPEX_ALREADY_REPLIED} ${notificationId}`
      );
    }

    const msgSaid = agreeNoteRecord.a.d as string;
    const agreeExn = await this.props.signifyClient.exchanges().get(msgSaid);
    const offerExn = await this.props.signifyClient
      .exchanges()
      .get(agreeExn.exn.p);
    const acdcSaid = offerExn.exn.e.acdc.d;

    const pickedCred = await this.props.signifyClient
      .credentials()
      .get(acdcSaid)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          return undefined;
        } else {
          throw error;
        }
      });

    if (!pickedCred) {
      throw new Error(IpexCommunicationService.CREDENTIAL_NOT_FOUND);
    }

    const discloser = await this.identifierStorage.getIdentifierMetadata(
      agreeExn.exn.rp
    );

    let op: Operation;
    if (discloser.groupMemberPre) {
      const { op: opMultisigGrant, exnSaid } = await this.submitMultisigGrant(
        discloser.id,
        agreeExn.exn.i,
        agreeExn.exn.d,
        pickedCred
      );
      op = opMultisigGrant;

      agreeNoteRecord.linkedRequest = {
        ...agreeNoteRecord.linkedRequest,
        accepted: true,
        current: exnSaid,
      };
    } else {
      const [grant, sigs, end] = await this.props.signifyClient.ipex().grant({
        senderName: discloser.id,
        recipient: agreeExn.exn.i,
        acdc: new Serder(pickedCred.sad),
        anc: new Serder(pickedCred.anc),
        iss: new Serder(pickedCred.iss),
        acdcAttachment: pickedCred.atc,
        ancAttachment: pickedCred.ancatc,
        issAttachment: pickedCred.issAtc,
        agreeSaid: agreeExn.exn.d,
      });
      op = await this.props.signifyClient
        .ipex()
        .submitGrant(discloser.id, grant, sigs, end, [agreeExn.exn.i]);

      agreeNoteRecord.linkedRequest = {
        ...agreeNoteRecord.linkedRequest,
        accepted: true,
        current: grant.ked.d,
      };
      agreeNoteRecord.hidden = true;
    }

    await this.operationPendingStorage.save({
      id: op.name,
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });

    await this.createLinkedIpexMessageRecord(
      agreeExn,
      ConnectionHistoryType.IPEX_AGREE_COMPLETE
    );

    await this.notificationStorage.update(agreeNoteRecord);
  }

  @OnlineOnly
  async getIpexApplyDetails(
    notification: KeriaNotification
  ): Promise<CredentialsMatchingApply> {
    const exchange = await this.props.signifyClient
      .exchanges()
      .get(notification.a.d as string);

    const schemaSaid = exchange.exn.a.s;
    const schema = await this.props.signifyClient
      .schemas()
      .get(schemaSaid)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(IpexCommunicationService.SCHEMA_NOT_FOUND);
        } else {
          throw error;
        }
      });

    const attributes = exchange.exn.a.a;
    const filter = {
      "-s": { $eq: schemaSaid },
      "-a-i": exchange.exn.rp,
      ...(Object.keys(attributes).length > 0
        ? {
          ...Object.fromEntries(
            Object.entries(attributes).map(([key, value]) => [
              "-a-" + key,
              value,
            ])
          ),
        }
        : {}),
    };

    const filtered = await this.props.signifyClient.credentials().list({
      filter,
    });
    const localFiltered =
      await this.credentialStorage.getCredentialMetadatasById(
        filtered.map((cred: any) => cred.sad.d),
        {
          $and: [{ pendingDeletion: false }, { isArchived: false }],
        }
      );

    return {
      schema: {
        name: schema.title,
        description: schema.description,
      },
      credentials: localFiltered.map((cr) => {
        const credKeri = filtered.find((cred: any) => cred.sad.d === cr.id);
        return {
          connectionId: cr.connectionId,
          acdc: credKeri.sad,
        };
      }),
      attributes: attributes,
      identifier: exchange.exn.rp,
    };
  }

  private async saveAcdcMetadataRecord(
    holder: IdentifierMetadataRecord,
    credentialId: string,
    dateTime: string,
    schemaTitle: string,
    connectionId: string,
    schema: string
  ): Promise<CredentialMetadataRecord> {
    const credentialDetails: CredentialMetadataRecordProps = {
      id: credentialId,
      isArchived: false,
      credentialType: schemaTitle,
      issuanceDate: new Date(dateTime).toISOString(),
      status: CredentialStatus.PENDING,
      connectionId,
      schema,
      identifierId: holder.id,
      identifierType: holder.groupMemberPre
        ? IdentifierType.Group
        : IdentifierType.Individual,
      createdAt: new Date(dateTime),
    };
    return await this.credentialStorage.saveCredentialMetadataRecord(
      credentialDetails
    );
  }

  private async admitIpex(
    notificationD: string,
    holderAid: string,
    issuerAid: string,
    issuerOobi: string,
    schemaSaids: string[]
  ): Promise<SubmitIPEXResult> {
    for (const schemaSaid of schemaSaids) {
      await this.connections.resolveOobi(
        await this.getSchemaUrl(issuerOobi, issuerAid, schemaSaid),
        true
      );
    }

    const dt = new Date().toISOString().replace("Z", "000+00:00");
    const [admit, sigs, aend] = await this.props.signifyClient.ipex().admit({
      senderName: holderAid,
      message: "",
      grantSaid: notificationD,
      recipient: issuerAid,
      datetime: dt,
    });

    const op = await this.props.signifyClient
      .ipex()
      .submitAdmit(holderAid, admit, sigs, aend, [issuerAid]);
    return { op, exnSaid: admit.ked.d };
  }

  async createLinkedIpexMessageRecord(
    message: ExnMessage,
    historyType: ConnectionHistoryType
  ): Promise<void> {
    const connectionId =
      historyType === ConnectionHistoryType.CREDENTIAL_PRESENTED
        ? message.exn.rp
        : message.exn.i;

    const connection = await this.connections
      .getConnectionById(connectionId)
      .catch((error) => {
        if (
          error instanceof Error &&
          error.message.startsWith(Agent.MISSING_DATA_ON_KERIA)
        ) {
          return undefined;
        }
        throw error;
      });

    // Handles case where we receive IPEX messages from unknown or previously deleted connections
    if (!connection) {
      return;
    }

    let schemaSaid;
    if (message.exn.r === ExchangeRoute.IpexGrant) {
      schemaSaid = message.exn.e.acdc.s;
    } else if (message.exn.r === ExchangeRoute.IpexApply) {
      schemaSaid = message.exn.a.s;
    } else if (
      message.exn.r === ExchangeRoute.IpexAgree ||
      message.exn.r === ExchangeRoute.IpexAdmit
    ) {
      const previousExchange = await this.props.signifyClient
        .exchanges()
        .get(message.exn.p);
      schemaSaid = previousExchange.exn.e.acdc.s;
    }

    await this.connections.resolveOobi(
      await this.getSchemaUrl(
        connection.serviceEndpoints[0],
        connectionId,
        schemaSaid
      ),
      true
    );
    const schema = await this.props.signifyClient.schemas().get(schemaSaid);

    let prefix;
    let key;
    switch (historyType) {
      case ConnectionHistoryType.CREDENTIAL_REVOKED:
        prefix = KeriaContactKeyPrefix.HISTORY_REVOKE;
        key = message.exn.e.acdc.d;
        break;
      case ConnectionHistoryType.CREDENTIAL_ISSUANCE:
      case ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT:
      case ConnectionHistoryType.CREDENTIAL_PRESENTED:
      case ConnectionHistoryType.IPEX_AGREE_COMPLETE:
        prefix = KeriaContactKeyPrefix.HISTORY_IPEX;
        key = message.exn.d;
        break;
      default:
        throw new Error(IpexCommunicationService.INVALID_HISTORY_TYPE);
    }
    const historyItem: ConnectionHistoryItem = {
      id: message.exn.d,
      dt: message.exn.dt,
      credentialType: schema.title,
      connectionId,
      historyType,
    };

    await this.props.signifyClient.contacts().update(connectionId, {
      [`${prefix}${key}`]: JSON.stringify(historyItem),
    });
  }

  @OnlineOnly
  async joinMultisigAdmit(grantNotificationId: string): Promise<void> {
    const grantNoteRecord = await this.notificationStorage.findById(
      grantNotificationId
    );
    if (!grantNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${grantNotificationId}`
      );
    }

    if (grantNoteRecord.linkedRequest.accepted) {
      throw new Error(IpexCommunicationService.IPEX_ALREADY_REPLIED);
    }

    const multiSigExnSaid = grantNoteRecord.linkedRequest.current;
    if (!multiSigExnSaid) {
      throw new Error(IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN);
    }

    const exn = await this.props.signifyClient.exchanges().get(multiSigExnSaid);
    const admitExn = exn.exn.e.exn;
    const grantExn = await this.props.signifyClient.exchanges().get(admitExn.p);

    const holder = await this.identifierStorage.getIdentifierMetadata(
      admitExn.i
    );

    if (!holder) {
      throw new Error(IpexCommunicationService.ISSUEE_NOT_FOUND_LOCALLY);
    }

    const credentialId = grantExn.exn.e.acdc.d;
    const connectionId = grantExn.exn.i;

    const schemaSaid = grantExn.exn.e.acdc.s;
    const allSchemaSaids = Object.keys(grantExn.exn.e.acdc?.e || {})
      .map((key) => grantExn.exn.e.acdc.e?.[key]?.s)
      .filter((schema) => !!schema);
    allSchemaSaids.push(schemaSaid);

    const { op } = await this.submitMultisigAdmit(
      holder.id,
      grantExn,
      allSchemaSaids,
      admitExn
    );

    const schema = await this.props.signifyClient.schemas().get(schemaSaid);
    try {
      const credential = await this.saveAcdcMetadataRecord(
        holder,
        credentialId,
        grantExn.exn.e.acdc.a.dt,
        schema.title,
        connectionId,
        schemaSaid
      );

      this.props.eventEmitter.emit<AcdcStateChangedEvent>({
        type: EventTypes.AcdcStateChanged,
        payload: {
          credential: getCredentialShortDetails(credential),
          status: CredentialStatus.PENDING,
        },
      });
    } catch (error) {
      // Ignore this as we might have failed before we deleted the notification and need to retry in the UI
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
      id: op.name,
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });

    grantNoteRecord.linkedRequest = {
      ...grantNoteRecord.linkedRequest,
      accepted: true,
    };
    await this.notificationStorage.update(grantNoteRecord);
  }

  async joinMultisigOffer(applyNotificationId: string): Promise<void> {
    const applyNoteRecord = await this.notificationStorage.findById(
      applyNotificationId
    );
    if (!applyNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${applyNotificationId}`
      );
    }

    if (applyNoteRecord.linkedRequest.accepted) {
      throw new Error(IpexCommunicationService.IPEX_ALREADY_REPLIED);
    }

    const multiSigExnSaid = applyNoteRecord.linkedRequest.current;
    if (!multiSigExnSaid) {
      throw new Error(IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN);
    }

    const exn = await this.props.signifyClient.exchanges().get(multiSigExnSaid);
    const offerExn = exn.exn.e.exn;

    const { op } = await this.submitMultisigOffer(
      offerExn.i,
      offerExn.p,
      offerExn.e.acdc,
      offerExn.rp,
      offerExn
    );

    await this.operationPendingStorage.save({
      id: op.name,
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });

    applyNoteRecord.linkedRequest = {
      ...applyNoteRecord.linkedRequest,
      accepted: true,
    };
    await this.notificationStorage.update(applyNoteRecord);
  }

  async joinMultisigGrant(
    multiSigExn: ExnMessage,
    agreeNoteRecord: NotificationRecord
  ): Promise<void> {
    if (!agreeNoteRecord.linkedRequest.current) {
      throw new Error(IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN);
    }

    const grantExn = multiSigExn.exn.e.exn;
    const { op } = await this.submitMultisigGrant(
      multiSigExn.exn.e.exn.i,
      grantExn.e.acdc.i,
      grantExn.p,
      grantExn.e.acdc,
      {
        grantExn,
        atc: multiSigExn.pathed.exn!,
      }
    );

    await this.operationPendingStorage.save({
      id: op.name,
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });

    agreeNoteRecord.linkedRequest = {
      ...agreeNoteRecord.linkedRequest,
      accepted: true,
    };
    await this.notificationStorage.update(agreeNoteRecord);
  }

  private async submitMultisigOffer(
    multisigId: string,
    notificationSaid: string,
    acdcDetail: any,
    discloseePrefix: string,
    offerExnToJoin?: any
  ): Promise<SubmitIPEXResult> {
    let exn: Serder;
    let sigsMes: string[];
    let mend: string;

    const { ourIdentifier, multisigMembers } =
      await this.multisigService.getMultisigParticipants(multisigId);

    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    const mHab = await this.props.signifyClient
      .identifiers()
      .get(ourIdentifier.id);

    const recp = multisigMembers
      .filter((signing: any) => signing.aid !== ourIdentifier.id)
      .map((member: any) => member.aid);

    const [, acdc] = Saider.saidify(acdcDetail);

    if (offerExnToJoin) {
      const [, ked] = Saider.saidify(offerExnToJoin);
      const offer = new Serder(ked);
      const keeper = this.props.signifyClient.manager!.get(gHab);
      const sigs = await keeper.sign(b(new Serder(offerExnToJoin).raw));

      const mstateNew = gHab["state"];
      const seal = [
        "SealEvent",
        {
          i: gHab["prefix"],
          s: mstateNew["ee"]["s"],
          d: mstateNew["ee"]["d"],
        },
      ];
      const signer = sigs.map((sig: string) => new Siger({ qb64: sig }));
      const ims = d(messagize(offer, signer, seal));
      const atc = ims.substring(offer.size);

      const gembeds = {
        exn: [offer, atc],
      };

      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    } else {
      const time = new Date().toISOString().replace("Z", "000+00:00");
      const applySaid = notificationSaid;

      const [offer, offerSigs, offerEnd] = await this.props.signifyClient
        .ipex()
        .offer({
          senderName: multisigId,
          recipient: discloseePrefix,
          message: "",
          acdc: new Serder(acdc),
          datetime: time,
          applySaid,
        });

      const mstate = gHab["state"];
      const seal = [
        "SealEvent",
        { i: gHab["prefix"], s: mstate["ee"]["s"], d: mstate["ee"]["d"] },
      ];
      const sigers = offerSigs.map((sig: string) => new Siger({ qb64: sig }));
      const ims = d(messagize(offer, sigers, seal));
      let atc = ims.substring(offer.size);
      atc += offerEnd;

      const gembeds = {
        exn: [offer, atc],
      };

      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    }

    const op = await this.props.signifyClient
      .ipex()
      .submitOffer(multisigId, exn, sigsMes, mend, recp);

    return { op, exnSaid: exn.ked.d };
  }

  private async submitMultisigGrant(
    multisigId: string,
    discloseePrefix: string,
    agreeSaid: string,
    acdcDetail: any,
    grantToJoin?: GrantToJoinMultisigExnPayload
  ): Promise<SubmitIPEXResult> {
    let exn: Serder;
    let sigsMes: string[];
    let mend: string;

    const { ourIdentifier, multisigMembers } =
      await this.multisigService.getMultisigParticipants(multisigId);
    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    const mHab = await this.props.signifyClient
      .identifiers()
      .get(ourIdentifier.id);

    const recp = multisigMembers
      .filter((signing: any) => signing.aid !== ourIdentifier.id)
      .map((member: any) => member.aid);

    if (grantToJoin) {
      const { grantExn, atc } = grantToJoin;
      const [, ked] = Saider.saidify(grantExn);
      const grant = new Serder(ked);
      const keeper = this.props.signifyClient.manager!.get(gHab);
      const sigs = await keeper.sign(b(new Serder(grantExn).raw));
      const mstateNew = gHab["state"];
      const seal = [
        "SealEvent",
        {
          i: gHab["prefix"],
          s: mstateNew["ee"]["s"],
          d: mstateNew["ee"]["d"],
        },
      ];

      const sigers = sigs.map((sig: string) => new Siger({ qb64: sig }));
      const ims = d(messagize(grant, sigers, seal));
      let newAtc = ims.substring(grant.size);

      const previousEnd = atc ? atc.slice(newAtc.length) : "";
      newAtc += previousEnd;

      const gembeds = {
        exn: [grant, newAtc],
      };

      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    } else {
      const time = new Date().toISOString().replace("Z", "000+00:00");
      const [grant, sigs, end] = await this.props.signifyClient.ipex().grant({
        senderName: multisigId,
        recipient: discloseePrefix,
        message: "",
        acdc: new Serder(acdcDetail.sad),
        iss: new Serder(acdcDetail.iss),
        anc: new Serder(acdcDetail.anc),
        acdcAttachment: acdcDetail?.atc,
        ancAttachment: acdcDetail?.ancatc,
        issAttachment: acdcDetail?.issAtc,
        datetime: time,
        agreeSaid,
      });

      const mstate = gHab["state"];
      const seal = [
        "SealEvent",
        { i: gHab["prefix"], s: mstate["ee"]["s"], d: mstate["ee"]["d"] },
      ];
      const sigers = sigs.map((sig: string) => new Siger({ qb64: sig }));
      const ims = d(messagize(grant, sigers, seal));
      let atc = ims.substring(grant.size);
      atc += end;
      const gembeds = {
        exn: [grant, atc],
      };

      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    }

    const op = await this.props.signifyClient
      .ipex()
      .submitGrant(multisigId, exn, sigsMes, mend, recp);

    return { op, exnSaid: exn.ked.d };
  }

  async getAcdcFromIpexGrant(
    said: string
  ): Promise<Omit<ACDCDetails, "identifierType">> {
    const exchange = await this.props.signifyClient.exchanges().get(said);
    const credentialState = await this.props.signifyClient
      .credentials()
      .state(exchange.exn.e.acdc.ri, exchange.exn.e.acdc.d);

    const schemaSaid = exchange.exn.e.acdc.s;
    const schema = await this.props.signifyClient
      .schemas()
      .get(schemaSaid)
      .catch(async (error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          const issuerOobi = (
            await this.connections.getConnectionById(exchange.exn.i)
          ).serviceEndpoints[0];
          await this.connections.resolveOobi(
            await this.getSchemaUrl(issuerOobi, exchange.exn.i, schemaSaid),
            true
          );
          return await this.props.signifyClient.schemas().get(schemaSaid);
        } else {
          throw error;
        }
      });

    return {
      id: exchange.exn.e.acdc.d,
      schema: exchange.exn.e.acdc.s,
      i: exchange.exn.e.acdc.i,
      a: exchange.exn.e.acdc.a,
      s: {
        title: schema.title,
        description: schema.description,
        version: schema.version,
      },
      lastStatus: {
        s: credentialState.et === Ilks.iss ? "0" : "1",
        dt: new Date(credentialState.dt).toISOString(),
      },
      status: CredentialStatus.PENDING,
      identifierId: exchange.exn.rp,
      connectionId: exchange.exn.i,
    };
  }

  private async submitMultisigAdmit(
    multisigId: string,
    grantExn: ExnMessage,
    schemaSaids: string[],
    admitExnToJoin?: any
  ): Promise<SubmitIPEXResult> {
    let exn: Serder;
    let sigsMes: string[];
    let mend: string;

    const issuerOobi = (
      await this.connections.getConnectionById(grantExn.exn.i)
    ).serviceEndpoints[0];
    await Promise.all(
      schemaSaids.map(
        async (schemaSaid) =>
          await this.connections.resolveOobi(
            await this.getSchemaUrl(issuerOobi, grantExn.exn.i, schemaSaid),
            true
          )
      )
    );

    const { ourIdentifier, multisigMembers } =
      await this.multisigService.getMultisigParticipants(multisigId);
    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    const mHab = await this.props.signifyClient
      .identifiers()
      .get(ourIdentifier.id);

    const recp: string[] = multisigMembers
      .filter((signing: any) => signing.aid !== ourIdentifier.id)
      .map((member: any) => member.aid);

    if (admitExnToJoin) {
      const [, ked] = Saider.saidify(admitExnToJoin);
      const admit = new Serder(ked);
      const keeper = this.props.signifyClient.manager!.get(gHab);
      const sigs = await keeper.sign(b(new Serder(admitExnToJoin).raw));

      const mstateNew = gHab["state"];
      const seal = [
        "SealEvent",
        {
          i: gHab["prefix"],
          s: mstateNew["ee"]["s"],
          d: mstateNew["ee"]["d"],
        },
      ];

      const sigers = sigs.map((sig: any) => new Siger({ qb64: sig }));
      const ims = d(messagize(admit, sigers, seal));
      const atc = ims.substring(admit.size);
      const gembeds = {
        exn: [admit, atc],
      };
      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    } else {
      const time = new Date().toISOString().replace("Z", "000+00:00");
      const [admit, sigs, end] = await this.props.signifyClient.ipex().admit({
        senderName: multisigId,
        message: "",
        grantSaid: grantExn.exn.d,
        datetime: time,
        recipient: grantExn.exn.i,
      });

      const mstate = gHab["state"];
      const seal = [
        "SealEvent",
        { i: gHab["prefix"], s: mstate["ee"]["s"], d: mstate["ee"]["d"] },
      ];

      const sigers = sigs.map((sig: string) => new Siger({ qb64: sig }));
      const ims = d(messagize(admit, sigers, seal));
      let atc = ims.substring(admit.size);
      atc += end;
      const gembeds = {
        exn: [admit, atc],
      };

      [exn, sigsMes, mend] = await this.props.signifyClient
        .exchanges()
        .createExchangeMessage(
          mHab,
          MultiSigRoute.EXN,
          { gid: gHab["prefix"] },
          gembeds,
          recp[0]
        );
    }

    const op = await this.props.signifyClient
      .ipex()
      .submitAdmit(multisigId, exn, sigsMes, mend, recp);

    return { op, exnSaid: exn.ked.d };
  }

  async getLinkedGroupFromIpexGrant(id: string): Promise<LinkedGroupInfo> {
    const grantNoteRecord = await this.notificationStorage.findById(id);
    if (!grantNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
      );
    }

    const grantExn = await this.props.signifyClient
      .exchanges()
      .get(grantNoteRecord.a.d as string);

    const recipientPrefix = grantExn.exn.rp;
    const multisigAidDetails = await this.props.signifyClient
      .identifiers()
      .get(recipientPrefix);
    const members = await this.props.signifyClient
      .identifiers()
      .members(recipientPrefix);
    const memberAids = members.signing.map((member: any) => member.aid);

    const othersJoined: string[] = [];
    if (grantNoteRecord.linkedRequest.current) {
      for (const signal of await this.props.signifyClient
        .groups()
        .getRequest(grantNoteRecord.linkedRequest.current)) {
        othersJoined.push(signal.exn.i);
      }
    }

    return {
      threshold: multisigAidDetails.state.kt,
      members: memberAids,
      othersJoined: othersJoined,
      linkedRequest: grantNoteRecord.linkedRequest,
    };
  }

  async getLinkedGroupFromIpexApply(id: string): Promise<LinkedGroupInfo> {
    const applyNoteRecord = await this.notificationStorage.findById(id);
    if (!applyNoteRecord) {
      throw new Error(
        `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
      );
    }

    const applyExn = await this.props.signifyClient
      .exchanges()
      .get(applyNoteRecord.a.d as string);

    const recipientPrefix = applyExn.exn.rp;
    const multisigAidDetails = await this.props.signifyClient
      .identifiers()
      .get(recipientPrefix);
    const members = await this.props.signifyClient
      .identifiers()
      .members(recipientPrefix);
    const memberAids = members.signing.map((member: any) => member.aid);

    const othersJoined: string[] = [];
    if (applyNoteRecord.linkedRequest.current) {
      for (const signal of await this.props.signifyClient
        .groups()
        .getRequest(applyNoteRecord.linkedRequest.current)) {
        othersJoined.push(signal.exn.i);
      }
    }

    return {
      threshold: multisigAidDetails.state.kt,
      members: memberAids,
      othersJoined: othersJoined,
      linkedRequest: applyNoteRecord.linkedRequest,
    };
  }

  async getOfferedCredentialSaid(current: string): Promise<string> {
    const multiSigExn = await this.props.signifyClient.exchanges().get(current);
    const offerExn = multiSigExn.exn.e.exn;
    return offerExn.e.acdc.d;
  }

  private async getSchemaUrl(
    agentOobi: string,
    prefix: string,
    said: string
  ): Promise<string> {
    // Indexer role indicates issuer site hosting OOBIs for e.g. schemas.
    // This can be improved by resolving the indexer OOBI and using KERIA to retrieve the /loc/scheme URL.
    // For now this works, and doesn't impose security risks since schemas are secured by their SAID.
    const agentBase = agentOobi
      .split("/agent")[0]
      .split("/controller")[0]
      .replace("http://keria:3902", "http://127.0.0.1:3902");

    const indexerOobiResult = await (
      await fetch(`${agentBase}/indexer/${prefix}`)
    ).text();
    const schemaBase = indexerOobiResult.split("\"url\":\"")[1].split("\"")[0];

    return `${schemaBase}/oobi/${said}`;
  }
}

export { IpexCommunicationService };
