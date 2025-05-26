import { Ilks, Saider, State } from "signify-ts";
import { AgentService } from "./agentService";
import {
  AgentServicesProps,
  ConnectionStatus,
  MiscRecordId,
  CreationStatus,
} from "../agent.types";
import {
  KeriaNotificationMarker,
  KeriaNotification,
  ExchangeRoute,
  NotificationRoute,
  Notification,
} from "./keriaNotificationService.types";
import { CredentialStatus } from "./credentialService.types";
import {
  BasicRecord,
  BasicStorage,
  ConnectionStorage,
  CredentialStorage,
  IdentifierStorage,
  NotificationRecordStorageProps,
  NotificationStorage,
  OperationPendingStorage,
} from "../records";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { OperationPendingRecord } from "../records/operationPendingRecord";
import { MultiSigService } from "./multiSigService";
import { IpexCommunicationService } from "./ipexCommunicationService";
import {
  NotificationAddedEvent,
  EventTypes,
  OperationCompleteEvent,
  OperationAddedEvent,
  NotificationRemovedEvent,
  ConnectionStateChangedEvent,
  OperationFailedEvent,
} from "../event.types";
import {
  deleteNotificationRecordById,
  isNetworkError,
  randomSalt,
} from "./utils";
import { CredentialService } from "./credentialService";
import { ConnectionHistoryType, ExnMessage } from "./connectionService.types";
import { NotificationAttempts } from "../records/notificationRecord.types";
import { StorageMessage } from "../../storage/storage.types";
import { IdentifierService } from "./identifierService";
import { ConnectionService } from "./connectionService";

class KeriaNotificationService extends AgentService {
  static readonly NOTIFICATION_NOT_FOUND = "Notification record not found";
  static readonly OUT_OF_ORDER_NOTIFICATION =
    "Out of order notification received, unable to process right now";
  static readonly DUPLICATE_ISSUANCE =
    "Duplicate IPEX grant message for same credential, may be out-of-order TEL updates for revocation";
  static readonly SINGLETON_ROUTE_REQUIRED = "singleton";
  static readonly SINGLETON_PRE = "singleton_pre"; // Dummy prefix to re-use within singleton notifications where unused (better than setting to optional, as weakens rest of code)

  static readonly POLL_KERIA_INTERVAL = 2000;
  static readonly CHECK_READINESS_INTERNAL = 25;
  static readonly FAILED_NOTIFICATIONS_RETRY_INTERVAL = 1000; // @TODO - foconnor: Optimise with backoff.

  protected readonly notificationStorage!: NotificationStorage;
  protected readonly identifierStorage: IdentifierStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly connectionStorage: ConnectionStorage;
  protected readonly credentialStorage: CredentialStorage;
  protected readonly basicStorage: BasicStorage;
  protected readonly multiSigs: MultiSigService;
  protected readonly ipexCommunications: IpexCommunicationService;
  protected readonly credentialService: CredentialService;
  protected readonly connectionService: ConnectionService;
  protected readonly getKeriaOnlineStatus: () => boolean;
  protected readonly markAgentStatus: (online: boolean) => void;
  protected readonly connect: (retryInterval?: number) => Promise<void>;

  protected pendingOperations: OperationPendingRecord[] = [];
  private loggedIn = true;

  constructor(
    agentServiceProps: AgentServicesProps,
    notificationStorage: NotificationStorage,
    identifierStorage: IdentifierStorage,
    operationPendingStorage: OperationPendingStorage,
    connectionStorage: ConnectionStorage,
    credentialStorage: CredentialStorage,
    basicStorage: BasicStorage,
    multiSigs: MultiSigService,
    ipexCommunications: IpexCommunicationService,
    credentialService: CredentialService,
    connectionService: ConnectionService,
    getKeriaOnlineStatus: () => boolean,
    markAgentStatus: (online: boolean) => void,
    connect: (retryInterval?: number) => Promise<void>
  ) {
    super(agentServiceProps);
    this.notificationStorage = notificationStorage;
    this.identifierStorage = identifierStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.connectionStorage = connectionStorage;
    this.credentialStorage = credentialStorage;
    this.basicStorage = basicStorage;
    this.multiSigs = multiSigs;
    this.ipexCommunications = ipexCommunications;
    this.credentialService = credentialService;
    this.connectionService = connectionService;
    this.getKeriaOnlineStatus = getKeriaOnlineStatus;
    this.markAgentStatus = markAgentStatus;
    this.connect = connect;
    this.props.eventEmitter.on<OperationAddedEvent>(
      EventTypes.OperationAdded,
      (event) => {
        this.pendingOperations.push(event.payload.operation);
      }
    );
  }

  async pollNotifications(): Promise<void> {
    try {
      await this._pollNotifications();
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Error at pollNotifications", error);
      setTimeout(
        this.pollNotifications,
        KeriaNotificationService.POLL_KERIA_INTERVAL
      );
    }
  }

  private async _pollNotifications(): Promise<void> {
    let notificationQuery = {
      nextIndex: 0,
      lastNotificationId: "",
    };
    const notificationQueryRecord = await this.basicStorage.findById(
      MiscRecordId.KERIA_NOTIFICATION_MARKER
    );
    if (!notificationQueryRecord) {
      await this.basicStorage.save({
        id: MiscRecordId.KERIA_NOTIFICATION_MARKER,
        content: notificationQuery,
      });
    } else {
      notificationQuery =
        notificationQueryRecord.content as unknown as KeriaNotificationMarker;
    }

    let lastFailedNotificationsRetryTime = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!this.loggedIn || !this.getKeriaOnlineStatus()) {
        await new Promise((rs) =>
          setTimeout(rs, KeriaNotificationService.CHECK_READINESS_INTERNAL)
        );
        continue;
      }

      const startFetchingIndex =
        notificationQuery.nextIndex > 0 ? notificationQuery.nextIndex - 1 : 0;

      let notifications;
      try {
        notifications = await this.props.signifyClient
          .notifications()
          .list(startFetchingIndex, startFetchingIndex + 24);
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }

        if (this.getKeriaOnlineStatus() && isNetworkError(error)) {
          // Possible that bootAndConnect is called from @OnlineOnly in between loops,
          // so check if its gone down to avoid having 2 bootAndConnect loops
          this.markAgentStatus(false);
          // This will hang the loop until the connection is secured again
          await this.connect();
        } else {
          throw error;
        }
      }

      if (!notifications) {
        // KERIA went down while querying, now back online
        continue;
      }

      if (
        notificationQuery.nextIndex > 0 &&
        (notifications.notes.length == 0 ||
          notifications.notes[0].i !== notificationQuery.lastNotificationId)
      ) {
        // This is to verify no notifications were deleted for some reason (which affects the batch range)
        notificationQuery = {
          nextIndex: 0,
          lastNotificationId: "",
        };
        await this.basicStorage.createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.KERIA_NOTIFICATION_MARKER,
            content: notificationQuery,
          })
        );
        continue;
      }

      if (notificationQuery.nextIndex > 0) {
        // Since the first item is the (next index - 1), we can ignore it
        notifications.notes.shift();
      }

      for (const notif of notifications.notes) {
        try {
          await this.processNotification(notif);
        } catch (error) {
          /* eslint-disable no-console */
          console.error(`Error when processing notification ${notif.i}`, error);

          const failedNotifications = await this.basicStorage.findById(
            MiscRecordId.FAILED_NOTIFICATIONS
          );

          await this.basicStorage.createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.FAILED_NOTIFICATIONS,
              content: {
                ...(failedNotifications?.content || {}),
                [notif.i]: {
                  notification: notif,
                  attempts: 1,
                  lastAttempt: Date.now(),
                },
              },
            })
          );
        }

        const nextNotificationIndex = notificationQuery.nextIndex + 1;
        notificationQuery = {
          nextIndex: nextNotificationIndex,
          lastNotificationId: notif.i,
        };

        await this.basicStorage.createOrUpdateBasicRecord(
          new BasicRecord({
            id: MiscRecordId.KERIA_NOTIFICATION_MARKER,
            content: notificationQuery,
          })
        );
      }

      const now = Date.now();
      if (
        now - lastFailedNotificationsRetryTime >
        KeriaNotificationService.FAILED_NOTIFICATIONS_RETRY_INTERVAL
      ) {
        // Retry failed notifications every minute
        await this.retryFailedNotifications();
        lastFailedNotificationsRetryTime = now;
      }

      if (!notifications.notes.length) {
        await new Promise((rs) =>
          setTimeout(rs, KeriaNotificationService.POLL_KERIA_INTERVAL)
        );
      }
    }
  }

  startPolling() {
    this.loggedIn = true;
  }

  stopPolling() {
    this.loggedIn = false;
  }

  async deleteNotificationRecordById(
    id: string,
    route: NotificationRoute
  ): Promise<void> {
    return deleteNotificationRecordById(
      this.props.signifyClient,
      this.notificationStorage,
      id,
      route
    );
  }

  async processNotification(notif: Notification): Promise<void> {
    if (
      notif.r ||
      !Object.values(NotificationRoute).includes(notif.a.r as NotificationRoute)
    ) {
      return;
    }

    const exn = await this.props.signifyClient.exchanges().get(notif.a.d);
    const deletedCheckResult = await this.identifierDeleted(notif, exn);
    if ((await this.outboundExchange(exn)) || deletedCheckResult.deleted) {
      await this.markNotification(notif.i);
      return;
    }

    let shouldCreateRecord = true;
    if (notif.a.r === NotificationRoute.ExnIpexApply) {
      shouldCreateRecord = await this.processExnIpexApplyNotification(exn);
    } else if (notif.a.r === NotificationRoute.ExnIpexGrant) {
      shouldCreateRecord = await this.processExnIpexGrantNotification(
        notif,
        exn
      );
    } else if (notif.a.r === NotificationRoute.MultiSigRpy) {
      shouldCreateRecord = await this.processMultiSigRpyNotification(notif);
    } else if (notif.a.r === NotificationRoute.MultiSigIcp) {
      shouldCreateRecord = await this.processMultiSigIcpNotification(exn);
    } else if (notif.a.r === NotificationRoute.MultiSigExn) {
      shouldCreateRecord = await this.processMultiSigExnNotification(
        notif,
        exn
      );
    } else if (notif.a.r === NotificationRoute.HumanReadableMessage) {
      shouldCreateRecord = await this.processHumanReadableNotification(
        notif,
        exn
      );
    } else if (notif.a.r === NotificationRoute.RemoteSignReq) {
      shouldCreateRecord = await this.processRemoteSignReq(notif, exn);
    }

    if (!shouldCreateRecord) {
      return;
    }

    try {
      const note = await this.createNotificationRecord(
        notif,
        deletedCheckResult.receivingPre
      );
      if (notif.a.r !== NotificationRoute.ExnIpexAgree) {
        // Hidden from UI, so don't emit
        this.props.eventEmitter.emit<NotificationAddedEvent>({
          type: EventTypes.NotificationAdded,
          payload: {
            note,
          },
        });
      }
    } catch (error) {
      if (
        (error as Error).message !==
        `${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} ${notif.i}`
      ) {
        throw error;
      }
    }

    if (notif.a.r === NotificationRoute.ExnIpexAgree) {
      const identifier = await this.identifierStorage.getIdentifierMetadata(
        exn.exn.rp
      );
      if (identifier.groupMemberPre) {
        const smids = (
          await this.props.signifyClient.identifiers().members(exn.exn.rp)
        ).signing;
        if (smids[0].aid !== identifier.groupMemberPre) return;
      }
      await this.ipexCommunications.grantAcdcFromAgree(notif.i);
    }
  }

  async retryFailedNotifications(): Promise<void> {
    const failedNotificationsRecord = await this.basicStorage.findById(
      MiscRecordId.FAILED_NOTIFICATIONS
    );

    if (!failedNotificationsRecord || !failedNotificationsRecord.content) {
      return;
    }

    const failedNotifications = failedNotificationsRecord.content;

    for (const [notificationId, notificationData] of Object.entries(
      failedNotifications as Record<string, NotificationAttempts>
    )) {
      const { attempts, lastAttempt, notification } = notificationData;
      const now = Date.now();

      const backoffDelays = [
        1000, 2500, 5000, 10000, 30000, 60000, 300000, 900000,
      ];
      const delay =
        backoffDelays[Math.min(attempts - 1, backoffDelays.length - 1)];

      if (now - lastAttempt >= delay) {
        try {
          // Retry process the notification
          await this.processNotification(notification);

          delete failedNotifications[notificationId];
          await this.basicStorage.update(
            new BasicRecord({
              id: MiscRecordId.FAILED_NOTIFICATIONS,
              content: failedNotifications,
            })
          );
        } catch (error) {
          /* eslint-disable no-console */
          console.warn(
            `Error when retrying notification ${notification.i} [attempts: ${
              attempts + 1
            }]`,
            error
          );

          failedNotifications[notificationId] = {
            ...notificationData,
            attempts: attempts + 1,
            lastAttempt: now,
          };

          await this.basicStorage.createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.FAILED_NOTIFICATIONS,
              content: failedNotifications,
            })
          );
        }
      }
    }
  }

  private async outboundExchange(exchange: ExnMessage): Promise<boolean> {
    const ourIdentifier = await this.identifierStorage
      .getIdentifierMetadata(exchange.exn.i)
      .catch((error) => {
        if (
          (error as Error).message ===
          IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING
        ) {
          return undefined;
        } else {
          throw error;
        }
      });

    return ourIdentifier !== undefined;
  }

  private async identifierDeleted(
    notif: Notification,
    exn: ExnMessage
  ): Promise<{ deleted: true } | { deleted: false; receivingPre: string }> {
    // rp field not being properly utilised yet (open issue on Signify/KERIA), so will be potentially incorrect for groups > 2 members
    if (notif.a.r === NotificationRoute.MultiSigIcp) {
      for (const smid of exn.exn.a.smids) {
        try {
          const hab = await this.props.signifyClient.identifiers().get(smid);
          return hab.name.startsWith(IdentifierService.DELETED_IDENTIFIER_THEME)
            ? { deleted: true }
            : { deleted: false, receivingPre: smid };
        } catch (error) {
          if (
            !(
              error instanceof Error &&
              /404/gi.test(error.message.split(" - ")[1])
            )
          ) {
            throw error;
          }
        }
      }
    } else {
      const receivingPre = exn.exn.r.startsWith("/multisig")
        ? exn.exn.a.gid
        : exn.exn.rp;
      const hab = await this.props.signifyClient
        .identifiers()
        .get(receivingPre);
      return hab.name.startsWith(IdentifierService.DELETED_IDENTIFIER_THEME)
        ? { deleted: true }
        : { deleted: false, receivingPre };
    }

    return { deleted: true };
  }

  private async processExnIpexApplyNotification(
    exchange: ExnMessage
  ): Promise<true> {
    await this.ipexCommunications.createLinkedIpexMessageRecord(
      exchange,
      ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT
    );
    return true;
  }

  private async processExnIpexGrantNotification(
    notif: Notification,
    exchange: ExnMessage
  ): Promise<boolean> {
    // Only consider issuances for now
    const ourIdentifier = await this.identifierStorage
      .getIdentifierMetadata(exchange.exn.e.acdc.a.i)
      .catch((error) => {
        if (
          (error as Error).message ===
          IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING
        ) {
          return undefined;
        } else {
          throw error;
        }
      });
    if (!ourIdentifier) {
      return false;
    }

    const existingCredential =
      await this.credentialStorage.getCredentialMetadata(exchange.exn.e.acdc.d);
    const telStatus = (
      await this.props.signifyClient
        .credentials()
        .state(exchange.exn.e.acdc.ri, exchange.exn.e.acdc.d)
    ).et;

    const oldGrantNotifications = await this.notificationStorage.findAllByQuery(
      {
        credentialId: exchange.exn.e.acdc.d,
      }
    );

    // IPEX messages and TEL updates are not strictly ordered, so this will put to the failed notifications queue to re-process out of order
    if (
      telStatus === Ilks.iss &&
      (existingCredential || oldGrantNotifications.length > 0)
    ) {
      throw new Error(
        `${KeriaNotificationService.DUPLICATE_ISSUANCE}: [grant: ${exchange.exn.d}] [credential: ${exchange.exn.e.acdc.d}]`
      );
    }

    if (telStatus === Ilks.rev) {
      for (const notificationRecord of oldGrantNotifications) {
        await this.deleteNotificationRecordById(
          notificationRecord.id,
          notificationRecord.a.r as NotificationRoute
        );

        this.props.eventEmitter.emit<NotificationRemovedEvent>({
          type: EventTypes.NotificationRemoved,
          payload: {
            id: notificationRecord.id,
          },
        });
      }

      // In case credential gets revoked before
      if (
        existingCredential &&
        existingCredential.status === CredentialStatus.PENDING
      ) {
        throw new Error(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);
      }

      if (
        existingCredential &&
        existingCredential.status !== CredentialStatus.REVOKED
      ) {
        await this.credentialService.markAcdc(
          exchange.exn.e.acdc.d,
          CredentialStatus.REVOKED
        );

        await this.ipexCommunications.createLinkedIpexMessageRecord(
          exchange,
          ConnectionHistoryType.CREDENTIAL_REVOKED
        );

        const dt = new Date().toISOString().replace("Z", "000+00:00");
        const [admit, sigs, aend] = await this.props.signifyClient
          .ipex()
          .admit({
            senderName: ourIdentifier.id,
            message: "",
            grantSaid: notif.a.d,
            datetime: dt,
            recipient: exchange.exn.i,
          });
        await this.props.signifyClient
          .ipex()
          .submitAdmit(ourIdentifier.id, admit, sigs, aend, [exchange.exn.i]);

        const metadata: NotificationRecordStorageProps = {
          id: randomSalt(),
          createdAt: new Date(notif.dt),
          a: {
            r: NotificationRoute.LocalAcdcRevoked,
            credentialId: existingCredential.id,
            credentialTitle: existingCredential.credentialType,
          },
          connectionId: existingCredential.connectionId,
          receivingPre: exchange.exn.rp,
          read: false,
          route: NotificationRoute.LocalAcdcRevoked,
          credentialId: existingCredential.id,
        };

        try {
          const notificationRecord = await this.notificationStorage.save(
            metadata
          );

          this.props.eventEmitter.emit<NotificationAddedEvent>({
            type: EventTypes.NotificationAdded,
            payload: {
              note: {
                id: notificationRecord.id,
                createdAt: notificationRecord.createdAt.toISOString(),
                a: notificationRecord.a,
                read: false,
                connectionId: exchange.exn.i,
                groupReplied: false,
              },
            },
          });
        } catch (error) {
          if (
            !(error as Error).message.startsWith(
              StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG
            )
          ) {
            throw error;
          }
        }

        await this.markNotification(notif.i);
        return false;
      }
    }
    return true;
  }

  private async processMultiSigRpyNotification(
    notif: Notification
  ): Promise<false> {
    const groupRequests = await this.props.signifyClient
      .groups()
      .getRequest(notif.a.d)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          return [];
        } else {
          throw error;
        }
      });
    if (!groupRequests || !groupRequests.length) {
      await this.markNotification(notif.i);
      return false;
    }

    const multisigId = groupRequests[0].exn.a.gid;

    // If deleted, skip - XX indicates identifier was deleted
    // This is safer than checking for the local metadata record in case
    // We have incepted on the cloud but still haven't created the metadata record locally
    const gHab = await this.props.signifyClient.identifiers().get(multisigId);
    if (gHab.name.startsWith(IdentifierService.DELETED_IDENTIFIER_THEME)) {
      await this.markNotification(notif.i);
      return false;
    }

    const rpyRoute = groupRequests[0].exn.e.rpy.r;
    if (rpyRoute === "/end/role/add") {
      await this.multiSigs.joinAuthorization(groupRequests[0].exn);
      await this.markNotification(notif.i);
    }
    return false;
  }

  private async processMultiSigIcpNotification(
    exchange: ExnMessage
  ): Promise<boolean> {
    // Otherwise group initiator gets notification
    try {
      await this.props.signifyClient.identifiers().get(exchange.exn.e.icp.i);
    } catch (error) {
      if (
        error instanceof Error &&
        /404/gi.test(error.message.split(" - ")[1])
      ) {
        return true;
      } else {
        throw error;
      }
    }
    return false;
  }

  private async processMultiSigExnNotification(
    notif: Notification,
    exchange: ExnMessage
  ): Promise<false> {
    switch (exchange.exn.e?.exn?.r) {
      case ExchangeRoute.IpexAdmit: {
        const grantNotificationRecords =
          await this.notificationStorage.findAllByQuery({
            exnSaid: exchange.exn.e.exn.p,
          });

        // Either relates to an processed and deleted grant notification, or is out of order
        if (grantNotificationRecords.length === 0) {
          const grantExn = await this.props.signifyClient
            .exchanges()
            .get(exchange.exn.e.exn.p);
          const connectionInCloud =
            await this.connectionService.getConnectionById(
              grantExn.exn.i,
              true
            );
          const historyExists = connectionInCloud.historyItems.some(
            (item) => item.id === grantExn.exn.d
          );
          if (historyExists) {
            await this.markNotification(notif.i);
            return false;
          } else {
            throw new Error(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);
          }
        }

        // Refresh the date and read status for UI, and link
        const notificationRecord = grantNotificationRecords[0];
        notificationRecord.linkedRequest = {
          ...notificationRecord.linkedRequest,
          current: exchange.exn.d,
        };
        notificationRecord.createdAt = new Date(notif.dt);
        notificationRecord.read = false;

        await this.notificationStorage.update(notificationRecord);

        this.props.eventEmitter.emit<NotificationRemovedEvent>({
          type: EventTypes.NotificationRemoved,
          payload: {
            id: notificationRecord.id,
          },
        });
        this.props.eventEmitter.emit<NotificationAddedEvent>({
          type: EventTypes.NotificationAdded,
          payload: {
            note: {
              id: notificationRecord.id,
              createdAt: notificationRecord.createdAt.toISOString(),
              a: notificationRecord.a,
              connectionId: notificationRecord.connectionId,
              read: notificationRecord.read,
              groupReplied: true,
            },
          },
        });

        return false;
      }
      case ExchangeRoute.IpexOffer: {
        const applyExn = await this.props.signifyClient
          .exchanges()
          .get(exchange.exn.e.exn.p);

        const applyNotificationRecords =
          await this.notificationStorage.findAllByQuery({
            exnSaid: applyExn.exn.d,
          });

        // Either relates to an processed and deleted apply notification, or is out of order
        if (applyNotificationRecords.length === 0) {
          const connectionInCloud =
            await this.connectionService.getConnectionById(
              applyExn.exn.i,
              true
            );
          const historyExists = connectionInCloud.historyItems.some(
            (item) => item.id === applyExn.exn.d
          );
          if (historyExists) {
            await this.markNotification(notif.i);
            return false;
          } else {
            throw new Error(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);
          }
        }

        // Refresh the date and read status for UI, and link
        const notificationRecord = applyNotificationRecords[0];
        notificationRecord.linkedRequest = {
          ...notificationRecord.linkedRequest,
          current: exchange.exn.d,
        };
        notificationRecord.createdAt = new Date(notif.dt);
        notificationRecord.read = false;

        const { ourIdentifier, multisigMembers } =
          await this.multiSigs.getMultisigParticipants(exchange.exn.a.gid);

        notificationRecord.groupReplied = true;
        notificationRecord.groupInitiatorPre = multisigMembers[0].aid;
        notificationRecord.groupInitiator =
          ourIdentifier.groupMetadata?.groupInitiator;

        await this.notificationStorage.update(notificationRecord);

        this.props.eventEmitter.emit<NotificationRemovedEvent>({
          type: EventTypes.NotificationRemoved,
          payload: {
            id: notificationRecord.id,
          },
        });

        this.props.eventEmitter.emit<NotificationAddedEvent>({
          type: EventTypes.NotificationAdded,
          payload: {
            note: {
              id: notificationRecord.id,
              createdAt: notificationRecord.createdAt.toISOString(),
              a: notificationRecord.a,
              connectionId: notificationRecord.connectionId,
              read: notificationRecord.read,
              groupReplied: notificationRecord.groupReplied,
              groupInitiatorPre: notificationRecord.groupInitiatorPre,
              groupInitiator: notificationRecord.groupInitiator,
            },
          },
        });

        return false;
      }
      case ExchangeRoute.IpexGrant: {
        const agreeExn = await this.props.signifyClient
          .exchanges()
          .get(exchange.exn.e.exn.p);

        const agreeNotificationRecords =
          await this.notificationStorage.findAllByQuery({
            exnSaid: agreeExn.exn.d,
          });

        // Either relates to an processed and deleted agree notification, or is out of order
        if (agreeNotificationRecords.length === 0) {
          const connectionInCloud =
            await this.connectionService.getConnectionById(
              agreeExn.exn.i,
              true
            );
          const historyExists = connectionInCloud.historyItems.some(
            (item) => item.id === agreeExn.exn.d
          );
          if (historyExists) {
            await this.markNotification(notif.i);
            return false;
          } else {
            throw new Error(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);
          }
        }

        // @TODO - foconnor: Could be optimised to only update record once but deviates from the other IPEX messages - OK for now.
        const notificationRecord = agreeNotificationRecords[0];
        notificationRecord.linkedRequest = {
          ...notificationRecord.linkedRequest,
          current: exchange.exn.d,
        };

        await this.notificationStorage.update(notificationRecord);
        await this.ipexCommunications.joinMultisigGrant(
          exchange,
          notificationRecord
        );

        return false;
      }
      default:
        return false;
    }
  }

  private async processHumanReadableNotification(
    notif: Notification,
    exchange: ExnMessage
  ): Promise<boolean> {
    const payload = exchange.exn.a;

    const valid = [
      Object.hasOwn(payload, "m") && typeof payload.m === "string",
      Object.hasOwn(payload, "t") && typeof payload.t === "string",
      Object.hasOwn(payload, "st") && typeof payload.st === "string",
      Array.isArray(payload.c) &&
        payload.c.length > 0 &&
        payload.c.every((paragraph: unknown) => typeof paragraph === "string"),
    ].every(Boolean); // Ensure all true

    if (valid) {
      if (!payload.l) {
        return true;
      }

      if (typeof payload.l.t === "string" && typeof payload.l.a === "string") {
        return true;
      }
    }

    await this.markNotification(notif.i);
    return false;
  }

  private async processRemoteSignReq(
    notif: Notification,
    exchange: ExnMessage
  ): Promise<boolean> {
    const payload = exchange.exn.a;
    if (payload.d) {
      const [saider, _] = Saider.saidify(payload);
      if (payload.d === saider.qb64) {
        return true;
      }
    }

    await this.markNotification(notif.i);
    return false;
  }

  private async createNotificationRecord(
    notif: Notification,
    receivingPre: string
  ): Promise<KeriaNotification> {
    const exchange = await this.props.signifyClient.exchanges().get(notif.a.d);
    const metadata: NotificationRecordStorageProps = {
      id: notif.i,
      createdAt: new Date(notif.dt),
      a: notif.a,
      read: false,
      route: notif.a.r as NotificationRoute,
      connectionId: exchange.exn.i,
      receivingPre,
      credentialId: exchange.exn.e?.acdc?.d,
    };

    const result = await this.notificationStorage.save(metadata);
    return {
      id: result.id,
      createdAt: result.createdAt.toISOString(),
      a: result.a,
      connectionId: result.connectionId,
      read: result.read,
      groupReplied: result.linkedRequest.current !== undefined,
    };
  }

  async createSingletonNotification(
    route: NotificationRoute,
    a = {}
  ): Promise<KeriaNotification | undefined> {
    // These notifications are generally only created once, one per local notification route.
    if (!/^\/local\/singleton/.test(route)) {
      throw new Error(KeriaNotificationService.SINGLETON_ROUTE_REQUIRED);
    }

    // Only create once. If deleted by the user, it can be created again, but generally other logic prevents that.
    if (
      (
        await this.notificationStorage.findAllByQuery({
          route: NotificationRoute.LocalSingletonConnectInstructions,
        })
      ).length > 0
    ) {
      return;
    }

    const notification: NotificationRecordStorageProps = {
      id: randomSalt(),
      createdAt: new Date(),
      a: {
        ...a,
        r: route,
      },
      read: false,
      route,
      connectionId: KeriaNotificationService.SINGLETON_PRE,
      receivingPre: KeriaNotificationService.SINGLETON_PRE,
    };

    await this.notificationStorage.save(notification);
    return {
      id: notification.id,
      createdAt: notification.createdAt.toISOString(),
      a: notification.a,
      connectionId: notification.connectionId,
      read: notification.read,
      groupReplied: false,
    };
  }

  async readNotification(notificationId: string): Promise<void> {
    const notificationRecord = await this.notificationStorage.findById(
      notificationId
    );
    if (!notificationRecord) {
      throw new Error(KeriaNotificationService.NOTIFICATION_NOT_FOUND);
    }
    notificationRecord.read = true;
    await this.notificationStorage.update(notificationRecord);
  }

  async unreadNotification(notificationId: string): Promise<void> {
    const notificationRecord = await this.notificationStorage.findById(
      notificationId
    );
    if (!notificationRecord) {
      throw new Error(KeriaNotificationService.NOTIFICATION_NOT_FOUND);
    }
    notificationRecord.read = false;
    await this.notificationStorage.update(notificationRecord);
  }

  async getNotifications(): Promise<KeriaNotification[]> {
    const notifications = await this.notificationStorage.findAllByQuery({
      $not: {
        route: NotificationRoute.ExnIpexAgree,
      },
      hidden: false,
    });

    return notifications.map((notification) => {
      return {
        id: notification.id,
        createdAt: notification.createdAt.toISOString(),
        a: notification.a,
        connectionId: notification.connectionId,
        read: notification.read,
        groupReplied: notification.linkedRequest.current !== undefined,
        groupInitiator: notification.groupInitiator,
        groupInitiatorPre: notification.groupInitiatorPre,
      };
    });
  }

  private async markNotification(notiSaid: string): Promise<string> {
    return this.props.signifyClient.notifications().mark(notiSaid);
  }

  async pollLongOperations(): Promise<void> {
    try {
      await this._pollLongOperations();
    } catch (error) {
      console.error("Error at pollLongOperations", error);
      setTimeout(
        this.pollLongOperations,
        KeriaNotificationService.POLL_KERIA_INTERVAL
      );
    }
  }

  async _pollLongOperations(): Promise<void> {
    this.pendingOperations = await this.operationPendingStorage.getAll();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!this.loggedIn || !this.getKeriaOnlineStatus()) {
        await new Promise((rs) =>
          setTimeout(rs, KeriaNotificationService.CHECK_READINESS_INTERNAL)
        );
        continue;
      }

      for (const pendingOperation of this.pendingOperations) {
        try {
          await this.processOperation(pendingOperation);
        } catch (error) {
          console.error("Error when process a operation", error);
        }
      }

      await new Promise((rs) => {
        setTimeout(() => {
          rs(true);
        }, 250);
      });
    }
  }

  async processOperation(
    operationRecord: OperationPendingRecord
  ): Promise<void> {
    let operation;
    try {
      operation = await this.props.signifyClient
        .operations()
        .get(operationRecord.id);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      if (isNetworkError(error) && this.getKeriaOnlineStatus()) {
        this.markAgentStatus(false);
        // This will hang the loop until the connection is secured again
        await this.connect();
      } else {
        throw error;
      }
    }

    if (!operation) {
      return;
    }

    const recordId = operationRecord.id.replace(
      `${operationRecord.recordType}.`,
      ""
    );

    if (operation.done && operation.error) {
      switch (operationRecord.recordType) {
        case OperationPendingRecordType.Witness: {
          await this.identifierStorage.updateIdentifierMetadata(recordId, {
            creationStatus: CreationStatus.FAILED,
          });
          this.props.eventEmitter.emit<OperationFailedEvent>({
            type: EventTypes.OperationFailed,
            payload: {
              opType: operationRecord.recordType,
              oid: recordId,
            },
          });
          break;
        }
        case OperationPendingRecordType.Oobi: {
          const oobi = operation.metadata?.oobi?.split("/oobi/")[1];
          const connectionId = oobi.includes("/") ? oobi.split("/")[0] : oobi;
          const connectionRecord = await this.connectionStorage.findById(
            connectionId
          );

          if (connectionRecord && !connectionRecord.pendingDeletion) {
            connectionRecord.creationStatus = CreationStatus.FAILED;
            await this.connectionStorage.update(connectionRecord);
          }
          this.props.eventEmitter.emit<OperationFailedEvent>({
            type: EventTypes.OperationFailed,
            payload: {
              opType: operationRecord.recordType,
              oid: connectionId,
            },
          });
          break;
        }
        default: {
          break;
        }
      }

      await this.operationPendingStorage.deleteById(operationRecord.id);
      this.pendingOperations.splice(
        this.pendingOperations.indexOf(operationRecord),
        1
      );

      return;
    }

    if (operation.done) {
      switch (operationRecord.recordType) {
        case OperationPendingRecordType.Group: {
          await this.identifierStorage
            .updateIdentifierMetadata(recordId, {
              creationStatus: CreationStatus.COMPLETE,
            })
            .catch((error) => {
              // In case user deleted pending identifier
              if (
                !(
                  error instanceof Error &&
                  error.message.startsWith(
                    IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING
                  )
                )
              ) {
                throw error;
              }
            });
          await this.multiSigs.endRoleAuthorization(recordId);
          break;
        }
        case OperationPendingRecordType.Witness: {
          await this.identifierStorage
            .updateIdentifierMetadata(recordId, {
              creationStatus: CreationStatus.COMPLETE,
            })
            .catch((error) => {
              // In case user deleted pending identifier
              if (
                !(
                  error instanceof Error &&
                  error.message.startsWith(
                    IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING
                  )
                )
              ) {
                throw error;
              }
            });
          break;
        }
        case OperationPendingRecordType.Oobi: {
          const connectionRecord = await this.connectionStorage.findById(
            (operation.response as State).i
          );

          if (connectionRecord && !connectionRecord.pendingDeletion) {
            if (connectionRecord.sharedIdentifier) {
              await this.connectionService.shareIdentifier(
                connectionRecord.id,
                connectionRecord.sharedIdentifier
              );
            }

            connectionRecord.creationStatus = CreationStatus.COMPLETE;

            const keriaContact = await this.props.signifyClient
              .contacts()
              .get((operation.response as State).i)
              .catch(() => undefined);

            if (!keriaContact) {
              await this.props.signifyClient
                .contacts()
                .update((operation.response as State).i, {
                  alias: connectionRecord.alias,
                  createdAt: new Date((operation.response as State).dt),
                  oobi: connectionRecord.oobi,
                  sharedIdentifier: connectionRecord.sharedIdentifier ?? "",
                });
            }

            await this.connectionStorage.update(connectionRecord);

            this.props.eventEmitter.emit<ConnectionStateChangedEvent>({
              type: EventTypes.ConnectionStateChanged,
              payload: {
                connectionId: connectionRecord.id,
                status: ConnectionStatus.CONFIRMED,
              },
            });
          }
          break;
        }
        case OperationPendingRecordType.ExchangeReceiveCredential: {
          const admitExchange = await this.props.signifyClient
            .exchanges()
            .get(operation.metadata?.said);
          if (admitExchange.exn.r === ExchangeRoute.IpexAdmit) {
            const grantExchange = await this.props.signifyClient
              .exchanges()
              .get(admitExchange.exn.p);
            const credentialId = grantExchange.exn.e.acdc.d;

            const notifications = await this.notificationStorage.findAllByQuery(
              {
                exnSaid: grantExchange.exn.d,
              }
            );

            for (const notification of notifications) {
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

            await this.credentialService
              .markAcdc(credentialId, CredentialStatus.CONFIRMED)
              .catch((error) => {
                // In case user deleted pending credential in UI
                if (
                  !(
                    error instanceof Error &&
                    error.message.startsWith(
                      CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG
                    )
                  )
                ) {
                  throw error;
                }
              });

            await this.ipexCommunications.createLinkedIpexMessageRecord(
              grantExchange,
              ConnectionHistoryType.CREDENTIAL_ISSUANCE
            );
          }
          break;
        }
        case OperationPendingRecordType.ExchangeOfferCredential: {
          const offerExchange = await this.props.signifyClient
            .exchanges()
            .get(operation.metadata?.said);

          if (offerExchange.exn.r === ExchangeRoute.IpexOffer) {
            const applyExchange = await this.props.signifyClient
              .exchanges()
              .get(offerExchange.exn.p);

            const holder = await this.identifierStorage.getIdentifierMetadata(
              offerExchange.exn.i
            );
            const notifications = await this.notificationStorage.findAllByQuery(
              {
                exnSaid: applyExchange.exn.d,
              }
            );

            for (const notification of notifications) {
              if (!holder.groupMemberPre) {
                await deleteNotificationRecordById(
                  this.props.signifyClient,
                  this.notificationStorage,
                  notification.id,
                  notification.a.r as NotificationRoute
                );
                continue;
              }

              // "Refresh" the notification so user is aware offer is successfully sent
              notification.createdAt = new Date();
              notification.read = false;

              const { multisigMembers, ourIdentifier } =
                await this.multiSigs.getMultisigParticipants(
                  applyExchange.exn.rp
                );

              notification.groupReplied = true;
              notification.groupInitiatorPre = multisigMembers[0].aid;
              notification.groupInitiator =
                ourIdentifier.groupMetadata!.groupInitiator;

              await this.notificationStorage.update(notification);

              this.props.eventEmitter.emit<NotificationRemovedEvent>({
                type: EventTypes.NotificationRemoved,
                payload: {
                  id: notification.id,
                },
              });

              this.props.eventEmitter.emit<NotificationAddedEvent>({
                type: EventTypes.NotificationAdded,
                payload: {
                  note: {
                    id: notification.id,
                    createdAt: notification.createdAt.toISOString(),
                    a: notification.a,
                    connectionId: notification.connectionId,
                    read: notification.read,
                    groupReplied: notification.groupReplied,
                    groupInitiatorPre: notification.groupInitiatorPre,
                    groupInitiator: notification.groupInitiator,
                  },
                },
              });
            }
          }
          break;
        }
        case OperationPendingRecordType.ExchangePresentCredential: {
          const grantExchange = await this.props.signifyClient
            .exchanges()
            .get(operation.metadata?.said);
          if (grantExchange.exn.r === ExchangeRoute.IpexGrant) {
            const agreeExchange = await this.props.signifyClient
              .exchanges()
              .get(grantExchange.exn.p);

            const notifications = await this.notificationStorage.findAllByQuery(
              {
                exnSaid: agreeExchange.exn.d,
              }
            );
            for (const notification of notifications) {
              await deleteNotificationRecordById(
                this.props.signifyClient,
                this.notificationStorage,
                notification.id,
                notification.a.r as NotificationRoute
              );
            }

            await this.ipexCommunications.createLinkedIpexMessageRecord(
              grantExchange,
              ConnectionHistoryType.CREDENTIAL_PRESENTED
            );
          }
          break;
        }
        default: {
          break;
        }
      }

      this.props.eventEmitter.emit<OperationCompleteEvent>({
        type: EventTypes.OperationComplete,
        payload: {
          opType: operationRecord.recordType,
          oid: recordId,
        },
      });
      await this.operationPendingStorage.deleteById(operationRecord.id);
      this.pendingOperations.splice(
        this.pendingOperations.indexOf(operationRecord),
        1
      );
    }
  }

  onNewNotification(callback: (event: NotificationAddedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.NotificationAdded, callback);
  }

  onRemoveNotification(callback: (event: NotificationRemovedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.NotificationRemoved, callback);
  }

  onLongOperationSuccess(callback: (event: OperationCompleteEvent) => void) {
    this.props.eventEmitter.on(EventTypes.OperationComplete, callback);
  }

  onLongOperationFailure(callback: (event: OperationFailedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.OperationFailed, callback);
  }
}

export { KeriaNotificationService };
