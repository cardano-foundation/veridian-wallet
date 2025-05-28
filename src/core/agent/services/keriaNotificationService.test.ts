import { ready } from "signify-ts";
import { Agent } from "../agent";
import { ConnectionStatus, MiscRecordId, CreationStatus } from "../agent.types";
import {
  ExchangeRoute,
  NotificationRoute,
} from "./keriaNotificationService.types";
import {
  BasicRecord,
  IdentifierStorage,
  NotificationStorage,
} from "../records";
import { OperationPendingRecord } from "../records/operationPendingRecord";
import { CredentialStatus } from "./credentialService.types";
import { CoreEventEmitter } from "../event";
import { KeriaNotificationService } from "./keriaNotificationService";
import { EventTypes } from "../event.types";
import { deleteNotificationRecordById } from "./utils";
import {
  credentialMetadataMock,
  getCredentialResponse,
  multisigExnGrant,
  multisigExnAdmitForIssuance,
  multisigExnOfferForPresenting,
  multisigExnApplyForPresenting,
  notificationMultisigRpyProp,
  notificationMultisigExnProp,
  notificationMultisigIcpProp,
  notificationIpexGrantProp,
  notificationIpexApplyProp,
  grantForIssuanceExnMessage,
  applyForPresentingExnMessage,
  agreeForPresentingExnMessage,
  credentialStateIssued,
  notificationIpexOfferProp,
  notificationIpexAgreeProp,
  groupIdentifierMetadataRecord,
  hab,
  humanReadableExn,
  humanReadableNotification,
  humanReadableLinkedExn,
  remoteSignReqNotification,
} from "../../__fixtures__/agent/keriaNotificationFixtures";
import { ConnectionHistoryType } from "./connectionService.types";
import { StorageMessage } from "../../storage/storage.types";
import {
  getMemberIdentifierResponse,
  getMultisigIdentifierResponse,
  getRequestMultisigIcp,
} from "../../__fixtures__/agent/multiSigFixtures";
import { IdentifierService } from "./identifierService";
import { CredentialService } from "./credentialService";
import { MultiSigRoute } from "./multiSig.types";
import { remoteSignReqExn } from "../../__fixtures__/agent/identifierFixtures";

const identifiersListMock = jest.fn();
const identifiersGetMock = jest.fn();
const identifiersCreateMock = jest.fn();
const identifiersMemberMock = jest.fn();
const identifiersInteractMock = jest.fn();
const identifiersRotateMock = jest.fn();

const groupGetRequestMock = jest.fn();

const oobiResolveMock = jest.fn();
const queryKeyStateMock = jest.fn();
const markNotificationMock = jest.fn();
const getCredentialMock = jest.fn();
const credentialStateMock = jest.fn();
const admitMock = jest.fn();
const submitAdmitMock = jest.fn();
const listNotificationsMock = jest.fn();
const operationsGetMock = jest.fn().mockImplementation((id: string) => {
  return {
    done: true,
    response: {
      i: id,
    },
  };
});

const contactsUpdateMock = jest.fn();
const contactGetMock = jest.fn();
const contactDeleteMock = jest.fn();
const exchangesGetMock = jest.fn();
const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    list: identifiersListMock,
    get: identifiersGetMock,
    create: identifiersCreateMock,
    addEndRole: jest.fn(),
    interact: identifiersInteractMock,
    rotate: identifiersRotateMock,
    members: identifiersMemberMock,
  }),
  operations: () => ({
    get: operationsGetMock,
  }),
  oobis: () => ({
    get: jest.fn(),
    resolve: oobiResolveMock,
  }),
  contacts: () => ({
    list: jest.fn(),
    get: contactGetMock,
    delete: contactDeleteMock,
    update: contactsUpdateMock,
  }),
  notifications: () => ({
    list: listNotificationsMock,
    mark: markNotificationMock,
  }),
  ipex: () => ({
    admit: admitMock,
    submitAdmit: submitAdmitMock,
  }),
  credentials: () => ({
    get: getCredentialMock,
    list: jest.fn(),
    state: credentialStateMock,
  }),
  exchanges: () => ({
    get: exchangesGetMock,
    send: jest.fn(),
  }),
  agent: {
    pre: "pre",
  },
  keyStates: () => ({
    query: queryKeyStateMock,
    get: jest.fn(),
  }),
  groups: () => ({
    getRequest: groupGetRequestMock,
  }),
  schemas: () => ({
    get: jest.fn().mockResolvedValue({
      title: "IIW 2024 Demo Day Attendee",
    }),
  }),
});

const eventEmitter = new CoreEventEmitter();

const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter: eventEmitter,
};

const identifierMetadataRecordProps = {
  id: "aidHere",
  displayName: "Identifier 2",
  createdAt: new Date(),
  theme: 0,
};

const notificationStorage = jest.mocked({
  open: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const connectionStorage = jest.mocked({
  open: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  updateIdentifierMetadata: jest.fn(),
});

const operationPendingGetAllMock = jest.fn();
const operationPendingStorage = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: operationPendingGetAllMock,
});

const credentialStorage = jest.mocked({
  getAllCredentialMetadata: jest.fn(),
  deleteCredentialMetadata: jest.fn(),
  getCredentialMetadata: jest.fn(),
  saveCredentialMetadataRecord: jest.fn(),
  updateCredentialMetadata: jest.fn(),
  getCredentialMetadatasById: jest.fn(),
});

const basicStorage = jest.mocked({
  findById: jest.fn(),
  save: jest.fn(),
  createOrUpdateBasicRecord: jest.fn(),
  update: jest.fn(),
});

const multiSigs = jest.mocked({
  joinAuthorization: jest.fn(),
  endRoleAuthorization: jest.fn(),
  getMultisigParticipants: jest.fn(),
});

const ipexCommunications = jest.mocked({
  createLinkedIpexMessageRecord: jest.fn(),
  grantAcdcFromAgree: jest.fn(),
  joinMultisigOffer: jest.fn(),
  joinMultisigGrant: jest.fn(),
});

const credentialService = jest.mocked({
  markAcdc: jest.fn(),
});

const connectionService = jest.mocked({
  resolveOobi: jest.fn(),
  getConnectionById: jest.fn().mockResolvedValue({
    serviceEndpoints: [
      "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
    ],
    historyItems: [],
  }),
  shareIdentifier: jest.fn(),
});
const keriaNotificationService = new KeriaNotificationService(
  agentServicesProps,
  notificationStorage as any,
  identifierStorage as any,
  operationPendingStorage as any,
  connectionStorage as any,
  credentialStorage as any,
  basicStorage as any,
  multiSigs as any,
  ipexCommunications as any,
  credentialService as any,
  connectionService as any,
  Agent.agent.getKeriaOnlineStatus,
  Agent.agent.markAgentStatus,
  Agent.agent.connect
);

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getKeriaOnlineStatus: jest.fn(),
      markAgentStatus: jest.fn(),
      connect: jest.fn(),
    },
  },
}));

eventEmitter.emit = jest.fn();
eventEmitter.on = jest.fn();

const DATETIME = new Date();

describe("Signify notification service of agent", () => {
  beforeAll(async () => {
    await ready();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    markNotificationMock.mockResolvedValue({ status: "done" });
    identifiersGetMock.mockResolvedValueOnce(hab);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Should emit new event for new notification", async () => {
    exchangesGetMock
      .mockResolvedValueOnce(getRequestMultisigIcp)
      .mockResolvedValueOnce(getRequestMultisigIcp)
      .mockResolvedValue(grantForIssuanceExnMessage);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce(credentialStateIssued);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    const notes = [
      notificationMultisigIcpProp,
      notificationIpexGrantProp,
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "unknown",
          d: "string",
          m: "",
        },
      },
    ];
    credentialStorage.getCredentialMetadata.mockResolvedValueOnce(null);
    identifierStorage.getIdentifierMetadata
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "0AC0W27tnnd2WyHWUh-368EI",
      createdAt: new Date("2024-09-20T02:51:24.930Z"),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EBcuMc13wJx0wbmxdWqqjoD5V_c532dg2sO-fvISrrMH",
        m: "",
      },
      connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
      read: false,
      linkedRequest: { accepted: false },
    });
    identifiersGetMock.mockReset();
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockRejectedValueOnce(new Error("Not Found - 404 - not found"))
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockRejectedValueOnce(new Error("Not Found - 404 - not found"));
    groupGetRequestMock.mockResolvedValue([{ exn: { a: { gid: "id" } } }]);

    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(eventEmitter.emit).toBeCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.NotificationAdded,
      payload: {
        note: {
          a: {
            d: "EBcuMc13wJx0wbmxdWqqjoD5V_c532dg2sO-fvISrrMH",
            m: "",
            r: NotificationRoute.ExnIpexGrant,
          },
          connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
          createdAt: "2024-09-20T02:51:24.930Z",
          id: "0AC0W27tnnd2WyHWUh-368EI",
          read: false,
          groupReplied: false,
        },
      },
    });
  });

  test("Should admit revocation if there is an existing credential", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "rev",
    });
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    const notes = [notificationIpexGrantProp];
    credentialStorage.getCredentialMetadata.mockResolvedValue(
      credentialMetadataMock
    );
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.save = jest
      .fn()
      .mockReturnValue({ id: "id", createdAt: new Date(), content: {} });
    groupGetRequestMock.mockResolvedValue([{ exn: { a: { gid: "id" } } }]);
    jest.useFakeTimers();
    admitMock.mockResolvedValue([{}, ["sigs"], "end"]);
    submitAdmitMock.mockResolvedValueOnce({
      name: "name",
      done: true,
    });

    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(admitMock).toBeCalledTimes(1);
    expect(submitAdmitMock).toBeCalledTimes(1);
    expect(markNotificationMock).toBeCalledTimes(1);
    expect(credentialService.markAcdc).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.d,
      CredentialStatus.REVOKED
    );
  });

  test("Can mark notification as read in DB", async () => {
    const notification = {
      id: "id",
      read: false,
    };

    notificationStorage.findById = jest.fn().mockResolvedValue(notification);
    await keriaNotificationService.readNotification(notification.id);
    expect(notificationStorage.update).toBeCalledWith({ id: "id", read: true });
  });

  test("Can mark notification as unread in DB", async () => {
    const notification = {
      id: "id",
      read: true,
    };

    notificationStorage.findById = jest.fn().mockResolvedValue(notification);
    await keriaNotificationService.unreadNotification(notification.id);
    expect(notificationStorage.update).toBeCalledWith({
      id: "id",
      read: false,
    });
  });

  test("Cannot mark a notification as read if it does not exist", async () => {
    notificationStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      keriaNotificationService.readNotification("not-exist-noti-id")
    ).rejects.toThrowError(KeriaNotificationService.NOTIFICATION_NOT_FOUND);
  });

  test("Can delete a notification", async () => {
    const id = "uuid";

    await keriaNotificationService.deleteNotificationRecordById(
      id,
      NotificationRoute.ExnIpexAgree
    );

    expect(notificationStorage.deleteById).toBeCalledWith(id);
    expect(markNotificationMock).toBeCalledWith(id);
  });

  test("Can delete a notification by ID (utils)", async () => {
    const id = "uuid";
    const notificationStorage = new NotificationStorage(
      agentServicesProps.signifyClient
    );

    notificationStorage.deleteById = jest.fn();
    await deleteNotificationRecordById(
      agentServicesProps.signifyClient,
      notificationStorage,
      id,
      NotificationRoute.ExnIpexGrant
    );
    expect(notificationStorage.deleteById).toBeCalledWith(id);
    expect(markNotificationMock).toBeCalledWith(id);
  });

  test("Should not mark local notification on KERIA when deleting", async () => {
    const id = "uuid";
    const notificationStorage = new NotificationStorage(
      agentServicesProps.signifyClient
    );
    notificationStorage.deleteById = jest.fn();
    await deleteNotificationRecordById(
      agentServicesProps.signifyClient,
      notificationStorage,
      id,
      NotificationRoute.LocalAcdcRevoked
    );
    expect(notificationStorage.deleteById).toBeCalledWith(id);
    expect(markNotificationMock).not.toBeCalled();
  });

  test("Should not create multisig icp notifications if the identifier already exists (group initiator)", async () => {
    exchangesGetMock.mockResolvedValue({
      exn: {
        r: NotificationRoute.MultiSigIcp,
        p: "p",
        a: { gid: "i", smids: ["a", "b"], rmids: ["a", "b"] },
        e: { icp: { i: "i" } },
      },
    });
    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    identifiersGetMock.mockResolvedValue(getMemberIdentifierResponse);

    await keriaNotificationService.processNotification(
      notificationMultisigIcpProp
    );

    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should create multisig icp notifications for new groups", async () => {
    exchangesGetMock.mockResolvedValue({
      exn: {
        r: NotificationRoute.MultiSigIcp,
        p: "p",
        a: { gid: "i", smids: ["a", "b"], rmids: ["a", "b"] },
        e: { icp: { i: "i" } },
      },
    });
    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    identifiersGetMock.mockReset();
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockRejectedValue(new Error("Not Found - 404 - not found"));
    notificationStorage.save.mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });

    await keriaNotificationService.processNotification(
      notificationMultisigIcpProp
    );

    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        a: {
          d: "string",
          m: "",
          r: MultiSigRoute.ICP,
        },
        route: MultiSigRoute.ICP,
        read: false,
      })
    );
  });

  test("Cannot mark a notification as unread if it does not exist", async () => {
    notificationStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      keriaNotificationService.unreadNotification("not-exist-noti-id")
    ).rejects.toThrowError(KeriaNotificationService.NOTIFICATION_NOT_FOUND);
  });

  test("Should join end role group authorisations automatically", async () => {
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: NotificationRoute.MultiSigRpy,
        p: "p",
        a: { i: "i", gid: "gid" },
        e: {
          rpy: {
            r: "/end/role/add",
          },
        },
      },
    });
    const multisigNotificationExn = {
      exn: {
        a: {
          gid: "uuid",
        },
        e: {
          rpy: {
            v: "KERI10JSON000111_",
            t: "rpy",
            d: "uuid",
            dt: "2024-07-12T09:37:48.801000+00:00",
            r: "/end/role/add",
            a: {
              cid: "uuid",
              role: "agent",
              eid: "new-uuid",
            },
          },
          d: "uuid",
        },
      },
    };
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(identifierMetadataRecordProps);
    groupGetRequestMock.mockResolvedValue([multisigNotificationExn]);
    identifiersGetMock.mockResolvedValueOnce(getMultisigIdentifierResponse);

    const notes = [notificationMultisigRpyProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(markNotificationMock).toBeCalledWith(notes[0].i);
    expect(multiSigs.joinAuthorization).toBeCalledTimes(1);
  });

  test("Can process incoming presentation requests and log in connection history", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await keriaNotificationService.processNotification(
      notificationIpexApplyProp
    );

    expect(
      ipexCommunications.createLinkedIpexMessageRecord
    ).toHaveBeenCalledWith(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT
    );
  });

  test("Should mark credential as revoked if TEL status is revoked and credential exists locally", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "rev",
    });
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date("2024-07-30T04:19:55.348000+00:00"),
      linkedRequest: { accepted: false },
      a: {
        r: NotificationRoute.LocalAcdcRevoked,
        credentialId: credentialMetadataMock.id,
        credentialTitle: credentialMetadataMock.credentialType,
      },
    });
    credentialStorage.getCredentialMetadata.mockResolvedValue(
      credentialMetadataMock
    );
    admitMock.mockResolvedValue([{}, ["sigs"], "end"]);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    submitAdmitMock.mockResolvedValueOnce({
      name: "name",
      done: true,
    });

    const notification = {
      type: "NotificationRecord",
      id: "id",
      createdAt: new Date(),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: false,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: new Date(),
    };
    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue([notification]);
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await keriaNotificationService.processNotification(
      notificationIpexGrantProp
    );

    expect(credentialService.markAcdc).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.d,
      CredentialStatus.REVOKED
    );
    expect(ipexCommunications.createLinkedIpexMessageRecord).toBeCalledWith(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_REVOKED
    );
    expect(markNotificationMock).toBeCalledTimes(2);
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.NotificationAdded,
      payload: {
        note: {
          id: "id",
          createdAt: "2024-07-30T04:19:55.348Z",
          a: {
            r: NotificationRoute.LocalAcdcRevoked,
            credentialId: credentialMetadataMock.id,
            credentialTitle: credentialMetadataMock.credentialType,
          },
          read: false,
          connectionId: grantForIssuanceExnMessage.exn.i,
          groupReplied: false,
        },
      },
    });
  });

  test("Should be able to mark a credential as revoked even if the revoked notification already exists (idempotent)", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "rev",
    });
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });
    credentialStorage.getCredentialMetadata.mockResolvedValue(
      credentialMetadataMock
    );
    admitMock.mockResolvedValue([{}, ["sigs"], "end"]);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    submitAdmitMock.mockResolvedValueOnce({
      name: "name",
      done: true,
    });
    notificationStorage.save.mockRejectedValueOnce(
      new Error(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG}`)
    );

    const notification = {
      type: "NotificationRecord",
      id: "id",
      createdAt: new Date(),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: false,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: new Date(),
    };
    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue([notification]);
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await keriaNotificationService.processNotification(
      notificationIpexGrantProp
    );

    expect(credentialService.markAcdc).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.d,
      CredentialStatus.REVOKED
    );
    expect(ipexCommunications.createLinkedIpexMessageRecord).toBeCalledWith(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_REVOKED
    );
    expect(markNotificationMock).toBeCalledTimes(2);
    expect(eventEmitter.emit).not.toBeCalledWith(
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
      })
    );
  });

  test("Should mark revocation grant as out of order for re-try if credential still pending", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "rev",
    });
    credentialStorage.getCredentialMetadata.mockResolvedValue({
      ...credentialMetadataMock,
      status: CredentialStatus.PENDING,
    });
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });

    const notification = {
      type: "NotificationRecord",
      id: "id",
      createdAt: new Date(),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: false,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: new Date(),
    };
    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue([notification]);

    await expect(
      keriaNotificationService.processNotification(notificationIpexGrantProp)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(credentialService.markAcdc).not.toBeCalled();
    expect(ipexCommunications.createLinkedIpexMessageRecord).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should delete old issuance notifications if the same credential gets revoked in a new notification", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "rev",
    });
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });
    credentialStorage.getCredentialMetadata.mockResolvedValue(undefined);
    const notification = {
      type: "NotificationRecord",
      id: "id",
      createdAt: new Date(),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: false,
      linkedGlinkedRequestroupRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: new Date(),
    };
    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue([notification]);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await keriaNotificationService.processNotification(
      notificationIpexGrantProp
    );

    expect(notificationStorage.deleteById).toBeCalledWith(notification.id);
    expect(credentialService.markAcdc).toBeCalledTimes(0);
    expect(markNotificationMock).toBeCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.NotificationRemoved,
      payload: {
        id: notification.id,
      },
    });
  });

  test("Should error if we receive a iss grant for an existing credential (set for re-processing in case of TEL update -> rev delays)", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "iss",
    });
    notificationStorage.save = jest
      .fn()
      .mockReturnValue({ id: "id", createdAt: new Date(), content: {} });
    credentialStorage.getCredentialMetadata.mockResolvedValue(
      credentialMetadataMock
    );
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await expect(
      keriaNotificationService.processNotification(notificationIpexGrantProp)
    ).rejects.toThrowError(KeriaNotificationService.DUPLICATE_ISSUANCE);

    expect(notificationStorage.deleteById).not.toBeCalled();
    expect(credentialService.markAcdc).not.toBeCalled();
    expect(markNotificationMock).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Should error if we receive a iss grant but have existing iss notification (set for re-processing in case of TEL update -> rev delays)", async () => {
    exchangesGetMock.mockResolvedValue(grantForIssuanceExnMessage);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce({
      ...credentialStateIssued,
      et: "iss",
    });
    notificationStorage.save = jest
      .fn()
      .mockReturnValue({ id: "id", createdAt: new Date(), content: {} });
    const notification = {
      type: "NotificationRecord",
      id: "id",
      createdAt: new Date(),
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: false,
      linkedGlinkedRequestroupRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: new Date(),
    };
    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue([notification]);
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await expect(
      keriaNotificationService.processNotification(notificationIpexGrantProp)
    ).rejects.toThrowError(KeriaNotificationService.DUPLICATE_ISSUANCE);

    expect(notificationStorage.deleteById).not.toBeCalled();
    expect(credentialService.markAcdc).not.toBeCalled();
    expect(markNotificationMock).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Should skip if notification route is /multisig/exn and `e.exn.r` is not ipex/admit, ipex/offer, ipex/grant", async () => {
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnApplyForPresenting)
      .mockResolvedValueOnce({ exn: { d: "d" } });
    identifierStorage.getIdentifierMetadata
      .mockRejectedValue(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should skip if notification if we send the exn", async () => {
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(identifierMetadataRecordProps);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnApplyForPresenting)
      .mockResolvedValueOnce({ exn: { d: "d" } });
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({});

    const notes = [notificationMultisigExnProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(markNotificationMock).toBeCalledTimes(1);
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Original grant is linked to received /multisig/exn admit message and refreshed, and no notification record is created", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(identifierMetadataRecordProps)
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );

    exchangesGetMock.mockResolvedValueOnce(multisigExnAdmitForIssuance);

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: DATETIME,
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: DATETIME,
      },
    ]);
    credentialStorage.getCredentialMetadata.mockResolvedValue(null);

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "id",
        read: false,
        route: NotificationRoute.ExnIpexGrant,
        linkedRequest: {
          accepted: false,
          current: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
        },
      })
    );
    expect(notificationStorage.update).not.toBeCalledWith(
      expect.objectContaining({
        createdAt: DATETIME,
      })
    );
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.NotificationRemoved,
      payload: {
        id: "id",
      },
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            id: "id",
          }),
        }),
      })
    );
    expect(eventEmitter.emit).not.toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            createdAt: DATETIME,
          }),
        }),
      })
    );
    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should mark MultiSigExn admit notification if no grant notification exists but history indicates credential received", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnAdmitForIssuance;
    const grantExn = grantForIssuanceExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(grantExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: grantExn.exn.i,
      historyItems: [
        { id: grantExn.exn.d, type: ConnectionHistoryType.CREDENTIAL_ISSUANCE },
      ],
      serviceEndpoints: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: exchange.exn.e.exn.p,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      grantExn.exn.i,
      true
    );
    expect(markNotificationMock).toHaveBeenCalledWith(notif.i);
    expect(notificationStorage.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  test("Should throw out-of-order error for MultiSigExn admit if no grant notification or relevant history exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnAdmitForIssuance;
    const grantExn = grantForIssuanceExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(grantExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: grantExn.exn.i,
      historyItems: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await expect(
      keriaNotificationService.processNotification(notif)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: exchange.exn.e.exn.p,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      grantExn.exn.i,
      true
    );
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.save).not.toHaveBeenCalled();
  });

  test("Should proceed with refresh logic for MultiSigExn admit if grant notification exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnAdmitForIssuance;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    const existingGrantNotification = {
      id: "existing-grant-id",
      a: { r: NotificationRoute.ExnIpexGrant },
      exnSaid: exchange.exn.e.exn.p,
      createdAt: new Date("2024-01-01"),
      read: true,
      linkedRequest: { accepted: false },
    };
    notificationStorage.findAllByQuery.mockResolvedValue([
      existingGrantNotification,
    ]);

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: exchange.exn.e.exn.p,
    });
    expect(connectionService.getConnectionById).not.toHaveBeenCalled();
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "existing-grant-id",
        linkedRequest: expect.objectContaining({
          current: exchange.exn.d,
        }),
        read: false,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: "existing-grant-id" },
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            id: "existing-grant-id",
            groupReplied: true,
          }),
        }),
      })
    );
  });

  test("Should mark MultiSigExn offer notification if no apply notification exists but history indicates request processed", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnOfferForPresenting;
    const applyExn = applyForPresentingExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(applyExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: applyExn.exn.i,
      historyItems: [
        {
          id: applyExn.exn.d,
          type: ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT,
        },
      ],
      serviceEndpoints: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: applyForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      applyExn.exn.i,
      true
    );
    expect(markNotificationMock).toHaveBeenCalledWith(notif.i);
    expect(notificationStorage.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  test("Should throw out-of-order error for MultiSigExn offer if no apply notification or relevant history exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnOfferForPresenting;
    const applyExn = applyForPresentingExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(applyExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: applyExn.exn.i,
      historyItems: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await expect(
      keriaNotificationService.processNotification(notif)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: applyForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      applyExn.exn.i,
      true
    );
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.save).not.toHaveBeenCalled();
  });

  test("Should proceed with refresh logic for MultiSigExn offer if apply notification exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnOfferForPresenting;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(applyForPresentingExnMessage);
    const existingApplyNotification = {
      id: "existing-apply-id",
      a: { r: NotificationRoute.ExnIpexApply },
      exnSaid: applyForPresentingExnMessage.exn.d,
      createdAt: new Date("2024-01-01"),
      read: true,
      linkedRequest: { accepted: false },
    };
    notificationStorage.findAllByQuery.mockResolvedValue([
      existingApplyNotification,
    ]);

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    multiSigs.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: { id: "our-id" },
      multisigMembers: [{ aid: "member-aid" }],
    });

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: applyForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).not.toHaveBeenCalled();
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "existing-apply-id",
        linkedRequest: expect.objectContaining({
          current: exchange.exn.d,
        }),
        read: false,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: "existing-apply-id" },
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            id: "existing-apply-id",
            groupReplied: true,
          }),
        }),
      })
    );
  });

  test("Should mark MultiSigExn grant notification if no agree notification exists but history indicates credential presented", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnGrant;
    const agreeExn = agreeForPresentingExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(agreeExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: exchange.exn.i,
      historyItems: [
        {
          id: agreeExn.exn.d,
          type: ConnectionHistoryType.CREDENTIAL_PRESENTED,
        },
      ],
      serviceEndpoints: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: agreeForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      agreeExn.exn.i,
      true
    );
    expect(markNotificationMock).toHaveBeenCalledWith(notif.i);
    expect(notificationStorage.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  test("Should throw out-of-order error for MultiSigExn grant if no agree notification or relevant history exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnGrant;
    const agreeExn = agreeForPresentingExnMessage;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(agreeExn);
    notificationStorage.findAllByQuery.mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValue({
      id: agreeExn.exn.i,
      historyItems: [],
    });

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await expect(
      keriaNotificationService.processNotification(notif)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: agreeForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).toHaveBeenCalledWith(
      agreeExn.exn.i,
      true
    );
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.save).not.toHaveBeenCalled();
  });

  test("Should proceed with join logic for MultiSigExn grant if agree notification exists", async () => {
    const notif = {
      ...notificationMultisigExnProp,
      a: {
        ...notificationMultisigExnProp.a,
        r: NotificationRoute.MultiSigExn,
        d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    const exchange = multisigExnGrant;

    exchangesGetMock.mockResolvedValueOnce(exchange);
    exchangesGetMock.mockResolvedValueOnce(agreeForPresentingExnMessage);
    const existingAgreeNotification = {
      id: "existing-agree-id",
      a: { r: NotificationRoute.ExnIpexAgree },
      exnSaid: agreeForPresentingExnMessage.exn.d,
      createdAt: new Date("2024-01-01"),
      read: true,
      linkedRequest: { accepted: false },
    };
    notificationStorage.findAllByQuery.mockResolvedValue([
      existingAgreeNotification,
    ]);

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processNotification(notif);

    expect(exchangesGetMock).toHaveBeenCalledWith(notif.a.d);
    expect(exchangesGetMock).toHaveBeenCalledWith(exchange.exn.e.exn.p);
    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      exnSaid: agreeForPresentingExnMessage.exn.d,
    });
    expect(connectionService.getConnectionById).not.toHaveBeenCalled();
    expect(markNotificationMock).not.toHaveBeenCalled();
    expect(notificationStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "existing-agree-id",
        linkedRequest: expect.objectContaining({
          current: exchange.exn.d,
        }),
      })
    );
    expect(ipexCommunications.joinMultisigGrant).toHaveBeenCalledWith(
      exchange,
      expect.objectContaining({ id: "existing-agree-id" })
    );
    expect(notificationStorage.save).not.toHaveBeenCalled();
  });

  test("Out of order /multisig/exn admit messages error out for re-processing (issuer grant not received yet)", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(identifierMetadataRecordProps);

    exchangesGetMock
      .mockResolvedValueOnce(multisigExnAdmitForIssuance)
      .mockResolvedValueOnce(grantForIssuanceExnMessage);

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    credentialStorage.getCredentialMetadata.mockResolvedValue(null);
    connectionService.getConnectionById.mockResolvedValueOnce({
      id: multisigExnAdmitForIssuance.exn.i,
      historyItems: [],
      serviceEndpoints: [
        "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
      ],
    });

    await expect(
      keriaNotificationService.processNotification(notificationMultisigExnProp)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(notificationStorage.update).not.toBeCalledWith();
    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should return all notifications", async () => {
    const mockNotifications = [
      {
        id: "0AC0W27tnnd2WyHWUh-368EI",
        createdAt: DATETIME,
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
        linkedRequest: { accepted: false },
        hidden: false,
      },
      {
        id: "0AC0W34tnnd2WyUCOy-790AY",
        createdAt: DATETIME,
        a: { r: NotificationRoute.ExnIpexOffer },
        read: false,
        connectionId: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiSaVB",
        linkedRequest: { accepted: false },
        hidden: false,
      },
    ];

    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue(mockNotifications);

    const result = await keriaNotificationService.getNotifications();

    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      $not: {
        route: NotificationRoute.ExnIpexAgree,
      },
      hidden: false,
    });
    expect(result).toEqual([
      {
        id: "0AC0W27tnnd2WyHWUh-368EI",
        createdAt: DATETIME.toISOString(),
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
        groupReplied: false,
      },
      {
        id: "0AC0W34tnnd2WyUCOy-790AY",
        createdAt: DATETIME.toISOString(),
        a: { r: NotificationRoute.ExnIpexOffer },
        read: false,
        connectionId: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiSaVB",
        groupReplied: false,
      },
    ]);
  });

  test("Notifications should indiciate if there in a current response or proposal", async () => {
    const mockNotifications = [
      {
        id: "0AC0W27tnnd2WyHWUh-368EI",
        createdAt: DATETIME,
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
        linkedRequest: { accepted: false },
      },
      {
        id: "0AC0W34tnnd2WyUCOy-790AY",
        createdAt: DATETIME,
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiSaVB",
        linkedRequest: { accepted: false, current: "current-admit-said" },
      },
    ];

    notificationStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValue(mockNotifications);

    const result = await keriaNotificationService.getNotifications();

    expect(notificationStorage.findAllByQuery).toHaveBeenCalledWith({
      $not: {
        route: NotificationRoute.ExnIpexAgree,
      },
      hidden: false,
    });
    expect(result).toEqual([
      {
        id: "0AC0W27tnnd2WyHWUh-368EI",
        createdAt: DATETIME.toISOString(),
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
        groupReplied: false,
      },
      {
        id: "0AC0W34tnnd2WyUCOy-790AY",
        createdAt: DATETIME.toISOString(),
        a: { r: NotificationRoute.ExnIpexGrant },
        read: false,
        connectionId: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiSaVB",
        groupReplied: true,
      },
    ]);
  });

  test("Should return an empty list notification if no notifications are found", async () => {
    notificationStorage.findAllByQuery.mockResolvedValue([]);
    const result = await keriaNotificationService.getNotifications();

    expect(result).toEqual([]);
  });

  test("Should return false if 404 error occurs with route multisig/rpy", async () => {
    groupGetRequestMock.mockRejectedValueOnce(
      new Error("SomeErrorMessage - 404")
    );
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: NotificationRoute.MultiSigRpy,
        p: "p",
        a: { i: "i" },
        e: {},
      },
    });
    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );
    await keriaNotificationService.processNotification(
      notificationMultisigRpyProp
    );
    expect(markNotificationMock).toHaveBeenCalledWith(
      notificationMultisigRpyProp.i
    );
  });

  test("Should throw error if other error occurs with route multisig/rpy", async () => {
    const errorMessage = "Error - 500";
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: NotificationRoute.MultiSigRpy,
        p: "p",
        a: { i: "i", gid: "gid" },
        e: {
          rpy: {
            r: "/end/role/add",
          },
        },
      },
    });
    identifierStorage.getIdentifierMetadata
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockRejectedValueOnce(new Error(errorMessage));
    groupGetRequestMock.mockRejectedValueOnce(new Error(errorMessage));
    await expect(
      keriaNotificationService.processNotification(notificationMultisigRpyProp)
    ).rejects.toThrow(errorMessage);
  });

  test("Should skip if missing identifier metadata with route multisig/rpy", async () => {
    groupGetRequestMock.mockResolvedValue([{ exn: { a: { gid: "id" } } }]);
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: NotificationRoute.MultiSigRpy,
        p: "p",
        a: { i: "i" },
        e: {},
      },
    });
    identifierStorage.getIdentifierMetadata
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    identifiersGetMock.mockResolvedValue({
      ...getMultisigIdentifierResponse,
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}:deleted`,
    });

    await keriaNotificationService.processNotification(
      notificationMultisigRpyProp
    );

    expect(markNotificationMock).toHaveBeenCalledWith(
      notificationMultisigRpyProp.i
    );
  });

  test("Should skip IPEX grants that are not issuances to a held identifier", async () => {
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: ExchangeRoute.IpexGrant,
        p: "p",
        a: { i: "i" },
        e: { acdc: { d: "d", a: { i: "i" } } },
      },
    });
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce(credentialStateIssued);
    credentialStorage.getCredentialMetadata.mockResolvedValueOnce(
      credentialMetadataMock
    );
    identifierStorage.getIdentifierMetadata
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    notificationStorage.findById = jest
      .fn()
      .mockResolvedValueOnce({ linkedRequest: { current: "current_id" } });

    await keriaNotificationService.processNotification(
      notificationIpexGrantProp
    );

    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should throw error if other error occurs with route ipex/grant", async () => {
    const errorMessage = "Error - 500";
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: ExchangeRoute.IpexAdmit,
        p: "p",
        a: { i: "i" },
        e: { acdc: { d: "d" } },
      },
    });
    getCredentialMock.mockResolvedValue(getCredentialResponse);
    credentialStateMock.mockResolvedValueOnce(credentialStateIssued);
    credentialStorage.getCredentialMetadata.mockResolvedValueOnce(
      credentialMetadataMock
    );
    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    await expect(
      keriaNotificationService.processNotification(notificationIpexGrantProp)
    ).rejects.toThrow(errorMessage);
  });

  test("Should throw error if other error occurs with admit multisig exn", async () => {
    const errorMessage = "Error - 500";
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnAdmitForIssuance)
      .mockResolvedValueOnce(grantForIssuanceExnMessage);

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date(),
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);

    identifierStorage.getIdentifierMetadata.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    await expect(
      keriaNotificationService.processNotification(notificationMultisigExnProp)
    ).rejects.toThrow(errorMessage);
  });

  test("Should skip if existing credential with admit multisig exn", async () => {
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnAdmitForIssuance)
      .mockResolvedValueOnce(grantForIssuanceExnMessage);

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date(),
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);

    identifierStorage.getIdentifierMetadata.mockResolvedValueOnce({
      id: "id",
    });

    getCredentialMock.mockResolvedValue(getCredentialResponse);

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    expect(markNotificationMock).toHaveBeenCalledWith(
      notificationIpexGrantProp.i
    );
  });

  test("Should mark and skip notification if it originated from an identifier we control", async () => {
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: ExchangeRoute.IpexOffer,
        p: "p",
        a: { i: "i" },
        e: { acdc: { d: "d" } },
      },
    });

    identifierStorage.getIdentifierMetadata.mockResolvedValueOnce({
      id: "id",
    });

    await keriaNotificationService.processNotification(
      notificationIpexOfferProp
    );
    expect(markNotificationMock).toHaveBeenCalledWith(
      notificationIpexOfferProp.i
    );
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should store /ipex/agree notifications but emit no event, and for individual identifiers auto-grant in response", async () => {
    exchangesGetMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });

    const notes = [notificationIpexAgreeProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(notificationStorage.save).toBeCalledWith({
      a: notificationIpexAgreeProp.a,
      read: false,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      credentialId: undefined,
      id: notificationIpexAgreeProp.i,
      receivingPre: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
      route: NotificationRoute.ExnIpexAgree,
      createdAt: new Date(notificationIpexAgreeProp.dt),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(ipexCommunications.grantAcdcFromAgree).toBeCalledWith("string");
  });

  test("Should auto-grant in response to agree even if the notification exists in the DB (allows retry on grant)", async () => {
    exchangesGetMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue({
        id: "id",
      });
    notificationStorage.save.mockRejectedValue(
      new Error(`${StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG} string`)
    );

    const notes = [notificationIpexAgreeProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(notificationStorage.save).toBeCalledWith({
      a: notificationIpexAgreeProp.a,
      read: false,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      credentialId: undefined,
      id: notificationIpexAgreeProp.i,
      receivingPre: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
      route: NotificationRoute.ExnIpexAgree,
      createdAt: new Date(notificationIpexAgreeProp.dt),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(ipexCommunications.grantAcdcFromAgree).toBeCalledWith("string");
  });

  test("Should ignore notifications for deleted individual identifiers", async () => {
    exchangesGetMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    identifiersGetMock.mockReset();
    identifiersGetMock.mockResolvedValue({
      ...hab,
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}:deletedIdentifier`,
    });

    await keriaNotificationService.processNotification(
      notificationIpexAgreeProp
    );

    expect(identifiersGetMock).toBeCalledWith(
      agreeForPresentingExnMessage.exn.rp
    );
    expect(markNotificationMock).toBeCalledWith(notificationIpexAgreeProp.i);
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should ignore notifications for deleted group identifiers", async () => {
    exchangesGetMock.mockResolvedValue(multisigExnAdmitForIssuance);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    identifiersGetMock.mockReset();
    identifiersGetMock.mockResolvedValue({
      ...hab,
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}:deletedIdentifier`,
    });

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    expect(identifiersGetMock).toBeCalledWith(
      multisigExnAdmitForIssuance.exn.a.gid
    );
    expect(markNotificationMock).toBeCalledWith(notificationMultisigExnProp.i);
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Should ignore multisig icp if local member deleted already", async () => {
    exchangesGetMock.mockResolvedValue(getRequestMultisigIcp);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    identifiersGetMock.mockReset();
    identifiersGetMock.mockResolvedValue({
      ...hab,
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}:deletedIdentifier`,
    });

    await keriaNotificationService.processNotification(
      notificationMultisigIcpProp
    );

    expect(identifiersGetMock).toBeCalledWith(
      getRequestMultisigIcp.exn.a.smids[0]
    );
    expect(markNotificationMock).toBeCalledWith(notificationMultisigIcpProp.i);
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Can create a singleton notification", async () => {
    notificationStorage.findAllByQuery.mockResolvedValue([]);
    await keriaNotificationService.createSingletonNotification(
      NotificationRoute.LocalSingletonConnectInstructions
    );
    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        route: NotificationRoute.LocalSingletonConnectInstructions,
        read: false,
        connectionId: KeriaNotificationService.SINGLETON_PRE,
        receivingPre: KeriaNotificationService.SINGLETON_PRE,
        a: { r: NotificationRoute.LocalSingletonConnectInstructions },
      })
    );
  });

  test("Can create a singleton notification with more attributes", async () => {
    notificationStorage.findAllByQuery.mockResolvedValue([]);
    await keriaNotificationService.createSingletonNotification(
      NotificationRoute.LocalSingletonConnectInstructions,
      { field: 1 }
    );
    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        route: NotificationRoute.LocalSingletonConnectInstructions,
        read: false,
        connectionId: KeriaNotificationService.SINGLETON_PRE,
        receivingPre: KeriaNotificationService.SINGLETON_PRE,
        a: { r: NotificationRoute.LocalSingletonConnectInstructions, field: 1 },
      })
    );
  });

  test("Singleton notifications must have a singleton route", async () => {
    expect(
      keriaNotificationService.createSingletonNotification(
        NotificationRoute.ExnIpexAgree
      )
    ).rejects.toThrowError(KeriaNotificationService.SINGLETON_ROUTE_REQUIRED);
    expect(
      keriaNotificationService.createSingletonNotification(
        NotificationRoute.LocalAcdcRevoked
      )
    ).rejects.toThrowError(KeriaNotificationService.SINGLETON_ROUTE_REQUIRED);
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Skip creation if singleton already exists", async () => {
    notificationStorage.findAllByQuery.mockResolvedValue([
      {
        id: "id",
        route: NotificationRoute.LocalSingletonConnectInstructions,
      },
    ]);
    await keriaNotificationService.createSingletonNotification(
      NotificationRoute.LocalSingletonConnectInstructions
    );
    expect(notificationStorage.save).not.toBeCalled();
  });
});

// @TODO - foconnor: Move remaining IPEX tests
describe("Group IPEX presentation", () => {
  beforeEach(() => {
    identifiersGetMock.mockResolvedValueOnce(hab);
  });

  test("Original apply is linked to received /multisig/exn offer message and refreshed, and no notification record is created", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnOfferForPresenting)
      .mockResolvedValueOnce(applyForPresentingExnMessage);

    multiSigs.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: {
        id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        displayName: "Identifier 2",
        createdAt: "2024-09-23T08:53:11.981Z",
        theme: 0,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      multisigMembers: [
        {
          aid: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          ends: [],
        },
        {
          aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
          ends: [],
        },
      ],
    });

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: DATETIME,
        a: {
          r: NotificationRoute.ExnIpexApply,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexApply,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: DATETIME,
      },
    ]);

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    expect(multiSigs.getMultisigParticipants).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR"
    );

    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "id",
        route: NotificationRoute.ExnIpexApply,
        linkedRequest: {
          accepted: false,
          current: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
        },
        read: false,
      })
    );
    expect(notificationStorage.update).not.toBeCalledWith(
      expect.objectContaining({
        createdAt: DATETIME,
      })
    );
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.NotificationRemoved,
      payload: {
        id: "id",
      },
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            id: "id",
            read: false,
          }),
        }),
      })
    );
    expect(eventEmitter.emit).not.toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            createdAt: DATETIME,
          }),
        }),
      })
    );
    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
  });

  test("Out of order IPEX /multisig/exn offer messages error for re-processing", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnOfferForPresenting)
      .mockResolvedValueOnce(applyForPresentingExnMessage);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValueOnce({
      id: multisigExnOfferForPresenting.exn.i,
      historyItems: [],
      serviceEndpoints: [
        "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
      ],
    });

    await expect(
      keriaNotificationService.processNotification(notificationMultisigExnProp)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(notificationStorage.update).not.toBeCalled();
  });

  test("Original agree is linked to /multisig/exn grant message and is auto-joined, and no notification record is created", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnGrant)
      .mockResolvedValueOnce(agreeForPresentingExnMessage);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-04-29T11:01:04.903Z"),
        a: {
          r: NotificationRoute.ExnIpexAgree,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexAgree,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date("2024-04-29T11:01:04.903Z"),
      },
    ]);

    await keriaNotificationService.processNotification(
      notificationMultisigExnProp
    );

    const updatedAgree = {
      id: "id",
      route: NotificationRoute.ExnIpexAgree,
      linkedRequest: {
        accepted: false,
        current: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
      },
    };
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining(updatedAgree)
    );
    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(ipexCommunications.joinMultisigGrant).toBeCalledWith(
      multisigExnGrant,
      expect.objectContaining(updatedAgree)
    );
  });

  test("Out of order IPEX /multisig/exn grant messages error for re-processing", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    exchangesGetMock
      .mockResolvedValueOnce(multisigExnGrant)
      .mockResolvedValueOnce(agreeForPresentingExnMessage);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);

    connectionService.getConnectionById.mockResolvedValueOnce({
      id: multisigExnGrant.exn.i,
      historyItems: [],
      serviceEndpoints: [
        "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
      ],
    });

    await expect(
      keriaNotificationService.processNotification(notificationMultisigExnProp)
    ).rejects.toThrowError(KeriaNotificationService.OUT_OF_ORDER_NOTIFICATION);

    expect(notificationStorage.update).not.toBeCalled();
  });

  test("Should store /ipex/agree notifications but emit no event, and for group initiators auto-grant in response", async () => {
    exchangesGetMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });
    identifiersMemberMock.mockResolvedValue({
      signing: [
        {
          aid: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
        },
        {
          aid: "memberB",
        },
        {
          aid: "memberC",
        },
      ],
    });

    const notes = [notificationIpexAgreeProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(notificationStorage.save).toBeCalledWith({
      a: notificationIpexAgreeProp.a,
      read: false,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      credentialId: undefined,
      id: notificationIpexAgreeProp.i,
      route: NotificationRoute.ExnIpexAgree,
      receivingPre: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
      createdAt: new Date(notificationIpexAgreeProp.dt),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(identifiersMemberMock).toBeCalledWith(
      "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli"
    );
    expect(ipexCommunications.grantAcdcFromAgree).toBeCalledWith("string");
  });

  test("Should store /ipex/agree notifications but emit no event, and do nothing else if not group initiator", async () => {
    exchangesGetMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValue(groupIdentifierMetadataRecord);
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: new Date(),
      linkedRequest: { accepted: false },
    });
    identifiersMemberMock.mockResolvedValue({
      signing: [
        {
          aid: "memberA",
        },
        {
          aid: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
        },
        {
          aid: "memberC",
        },
      ],
    });

    const notes = [notificationIpexAgreeProp];
    for (const notif of notes) {
      await keriaNotificationService.processNotification(notif);
    }

    expect(notificationStorage.save).toBeCalledWith({
      a: notificationIpexAgreeProp.a,
      read: false,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      credentialId: undefined,
      id: notificationIpexAgreeProp.i,
      route: NotificationRoute.ExnIpexAgree,
      receivingPre: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
      createdAt: new Date(notificationIpexAgreeProp.dt),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(identifiersMemberMock).toBeCalledWith(
      "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli"
    );
    expect(ipexCommunications.grantAcdcFromAgree).not.toBeCalled();
  });
});

describe("Human readable messages", () => {
  beforeEach(() => {
    identifiersGetMock.mockResolvedValueOnce(hab);
  });

  test("Can receive a human readable exn message", async () => {
    exchangesGetMock.mockResolvedValue(humanReadableExn);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    const date = new Date();
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: date,
      linkedRequest: { accepted: false },
      read: false,
      connectionId: humanReadableExn.exn.i,
      a: humanReadableNotification.a,
    });

    await keriaNotificationService.processNotification(
      humanReadableNotification
    );

    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        a: humanReadableNotification.a,
        connectionId: humanReadableExn.exn.i,
        read: false,
        receivingPre: humanReadableExn.exn.rp,
        route: NotificationRoute.HumanReadableMessage,
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationAdded,
      payload: {
        note: expect.objectContaining({
          id: "id",
          createdAt: date.toISOString(),
          a: humanReadableNotification.a,
          read: false,
        }),
      },
    });
    expect(markNotificationMock).not.toBeCalled();
  });

  test("Can receive a human readable exn message with a link", async () => {
    exchangesGetMock.mockResolvedValue(humanReadableLinkedExn);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    const date = new Date();
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: date,
      linkedRequest: { accepted: false },
      read: false,
      connectionId: humanReadableLinkedExn.exn.i,
      a: humanReadableNotification.a,
    });

    await keriaNotificationService.processNotification(
      humanReadableNotification
    );

    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        a: humanReadableNotification.a,
        connectionId: humanReadableLinkedExn.exn.i,
        read: false,
        receivingPre: humanReadableLinkedExn.exn.rp,
        route: NotificationRoute.HumanReadableMessage,
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationAdded,
      payload: {
        note: expect.objectContaining({
          id: "id",
          createdAt: date.toISOString(),
          a: humanReadableNotification.a,
          read: false,
        }),
      },
    });
    expect(markNotificationMock).not.toBeCalled();
  });

  test("Ignores malformed human readable messages", async () => {
    const variants = [
      {
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
      },
      {
        m: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        c: ["First paragraph", "Second paragraph"],
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: "Not an array",
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: [],
      },
    ];

    for (const variant of variants) {
      identifiersGetMock.mockResolvedValueOnce(hab);
      exchangesGetMock.mockResolvedValueOnce({
        exn: {
          ...humanReadableExn.exn,
          a: variant,
        },
        pathed: {},
      });
      identifierStorage.getIdentifierMetadata = jest
        .fn()
        .mockRejectedValueOnce(
          new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
        );

      await keriaNotificationService.processNotification(
        humanReadableNotification
      );

      expect(notificationStorage.save).not.toBeCalled();
      expect(eventEmitter.emit).not.toBeCalled();
      expect(markNotificationMock).toBeCalledWith(humanReadableNotification.i);
    }
  });

  test("Ignores malformed human readable messages where the link is malformed", async () => {
    const variants = [
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
        l: "View certificate",
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
        l: ["View certificate"],
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
        l: {},
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
        l: { t: "View certificate" },
      },
      {
        m: "Certificate created",
        t: "Certificate created",
        st: "Everything is now fully signed",
        c: ["First paragraph", "Second paragraph"],
        l: { a: "http://test.com" },
      },
    ];

    for (const variant of variants) {
      identifiersGetMock.mockResolvedValueOnce(hab);
      exchangesGetMock.mockResolvedValueOnce({
        exn: {
          ...humanReadableLinkedExn.exn,
          a: variant,
        },
        pathed: {},
      });
      identifierStorage.getIdentifierMetadata = jest
        .fn()
        .mockRejectedValueOnce(
          new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
        );

      await keriaNotificationService.processNotification(
        humanReadableNotification
      );

      expect(notificationStorage.save).not.toBeCalled();
      expect(eventEmitter.emit).not.toBeCalled();
      expect(markNotificationMock).toBeCalledWith(humanReadableNotification.i);
    }
  });
});

describe("Remote signing", () => {
  beforeEach(() => {
    identifiersGetMock.mockResolvedValueOnce(hab);
  });

  test("Can receive a remote signing request", async () => {
    exchangesGetMock.mockResolvedValue(remoteSignReqExn);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );
    const date = new Date();
    notificationStorage.save = jest.fn().mockReturnValue({
      id: "id",
      createdAt: date,
      linkedRequest: { accepted: false },
      read: false,
      connectionId: remoteSignReqExn.exn.i,
      a: remoteSignReqNotification.a,
    });

    await keriaNotificationService.processNotification(
      remoteSignReqNotification
    );

    expect(notificationStorage.save).toBeCalledWith(
      expect.objectContaining({
        a: remoteSignReqNotification.a,
        connectionId: remoteSignReqExn.exn.i,
        read: false,
        receivingPre: remoteSignReqExn.exn.rp,
        route: NotificationRoute.RemoteSignReq,
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationAdded,
      payload: {
        note: expect.objectContaining({
          id: "id",
          createdAt: date.toISOString(),
          a: remoteSignReqNotification.a,
          read: false,
        }),
      },
    });
    expect(markNotificationMock).not.toBeCalled();
  });

  test("Ignores un-saidified signing requests", async () => {
    exchangesGetMock.mockResolvedValue({
      exn: {
        ...remoteSignReqExn.exn,
        a: { t: 2 },
      },
      pathed: {},
    });
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );

    await keriaNotificationService.processNotification(
      remoteSignReqNotification
    );

    expect(notificationStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(markNotificationMock).toBeCalledWith(remoteSignReqNotification.i);
  });

  test("Ignores mis-saidified signing requests", async () => {
    exchangesGetMock.mockResolvedValue({
      exn: {
        ...remoteSignReqExn.exn,
        a: { t: 2, d: "BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7Pfsp" },
      },
      pathed: {},
    });
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      );

    await keriaNotificationService.processNotification(
      remoteSignReqNotification
    );

    expect(notificationStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(markNotificationMock).toBeCalledWith(remoteSignReqNotification.i);
  });
});

describe("Failed notifications", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    identifiersGetMock.mockResolvedValueOnce(hab);
  });

  test("Should create a new failed notification to basic record if processNotification throws any error", async () => {
    jest.useFakeTimers();
    jest
      .spyOn(keriaNotificationService as any, "getKeriaOnlineStatus")
      .mockReturnValue(true);
    jest.spyOn(console, "error").mockReturnValueOnce();
    basicStorage.findById = jest.fn().mockResolvedValueOnce({
      id: MiscRecordId.KERIA_NOTIFICATION_MARKER,
      content: {
        nextIndex: 0,
        lastNotificationId: "",
      },
    });
    let firstTry = true;
    const notifications = [
      {
        i: "string",
        dt: "string",
        r: true,
        a: {
          r: NotificationRoute.ExnIpexApply,
          d: "string",
          m: "",
        },
      },
      {
        i: "string",
        dt: "string",
        r: true,
        a: {
          r: NotificationRoute.MultiSigExn,
          d: "string",
          m: "",
        },
      },
    ];
    listNotificationsMock.mockImplementation(async () => {
      if (firstTry) {
        firstTry = false;
        return {
          start: 0,
          end: 2,
          total: 2,
          notes: notifications,
        };
      } else {
        throw new Error("Break the while loop");
      }
    });

    keriaNotificationService.processNotification = jest
      .fn()
      .mockRejectedValue("error");
    basicStorage.createOrUpdateBasicRecord.mockResolvedValueOnce({
      id: MiscRecordId.FAILED_NOTIFICATIONS,
      content: {
        [notifications[0].i]: {
          notification: notifications[0],
          attempts: 1,
          lastAttempt: Date.now(),
        },
      },
    });
    try {
      await keriaNotificationService.pollNotifications();
    } catch (error) {
      expect((error as Error).message).toBe("Break the while loop");
    }
    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledTimes(4);
  });

  test("Should retry failed notifications and remove successfully processed ones", async () => {
    jest.spyOn(keriaNotificationService, "processNotification");
    const notif1 = {
      i: "notif1",
      dt: "string",
      r: true,
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "string",
        m: "",
      },
    };
    const notif2 = {
      i: "notif2",
      dt: "string",
      r: true,
      a: {
        r: NotificationRoute.MultiSigExn,
        d: "string",
        m: "",
      },
    };
    const notif3 = {
      i: "notif3",
      dt: "string",
      r: true,
      a: {
        r: NotificationRoute.MultiSigExn,
        d: "string",
        m: "",
      },
    };
    const failedNotifications = {
      notif1: {
        notification: notif1,
        attempts: 1,
        lastAttempt: Date.now() - 6000,
      }, // Ready for retry
      notif2: {
        notification: notif2,
        attempts: 3,
        lastAttempt: Date.now() - 50000,
      }, // Ready for retry
      notif3: {
        notification: notif3,
        attempts: 5,
        lastAttempt: Date.now() - 1000,
      }, // Not ready yet
    };

    basicStorage.findById = jest.fn().mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.FAILED_NOTIFICATIONS,
        content: failedNotifications,
        createdAt: new Date(),
      })
    );

    await keriaNotificationService.retryFailedNotifications();
    const now = new Date();
    expect(keriaNotificationService.processNotification).toHaveBeenCalledTimes(
      2
    );
    expect(keriaNotificationService.processNotification).toHaveBeenCalledWith(
      notif1
    );
    expect(keriaNotificationService.processNotification).toHaveBeenCalledWith(
      notif2
    );

    expect(basicStorage.update).toHaveBeenCalledWith(
      new BasicRecord({
        id: MiscRecordId.FAILED_NOTIFICATIONS,
        content: {
          notif3: failedNotifications.notif3,
        },
        createdAt: now,
      })
    );
  });

  test("Should handle failure when retrying a failed notification", async () => {
    const notif1 = {
      i: "notif1",
      dt: "string",
      r: true,
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "string",
        m: "",
      },
    };

    const failedNotifications = {
      notif1: {
        notification: notif1,
        attempts: 1,
        lastAttempt: Date.now() - 6000,
      },
    };

    basicStorage.findById = jest.fn().mockResolvedValue({
      id: MiscRecordId.FAILED_NOTIFICATIONS,
      content: failedNotifications,
      createdAt: new Date(),
    });

    jest
      .spyOn(keriaNotificationService, "processNotification")
      .mockRejectedValue(new Error("Process notification failed"));

    await keriaNotificationService.retryFailedNotifications();
    expect(basicStorage.createOrUpdateBasicRecord).toHaveBeenCalledWith(
      new BasicRecord({
        id: MiscRecordId.FAILED_NOTIFICATIONS,
        content: {
          notif1: {
            ...failedNotifications.notif1,
            attempts: 2,
            lastAttempt: Date.now(),
          },
        },
      })
    );
  });

  test("Should retry failed notifications if more than 1 minute have passed", async () => {
    jest.useFakeTimers();
    jest.spyOn(keriaNotificationService, "retryFailedNotifications");
    jest
      .spyOn(keriaNotificationService as any, "getKeriaOnlineStatus")
      .mockReturnValue(true);
    let firstTry = true;
    const notifications = [
      {
        i: "string",
        dt: "string",
        r: true,
        a: {
          r: NotificationRoute.ExnIpexApply,
          d: "string",
          m: "",
        },
      },
      {
        i: "string",
        dt: "string",
        r: true,
        a: {
          r: NotificationRoute.MultiSigExn,
          d: "string",
          m: "",
        },
      },
    ];

    listNotificationsMock.mockImplementation(async () => {
      if (firstTry) {
        firstTry = false;
        return {
          start: 0,
          end: 2,
          total: 2,
          notes: notifications,
        };
      } else {
        throw new Error("Break the while loop");
      }
    });

    keriaNotificationService.processNotification = jest
      .fn()
      .mockRejectedValue("error");
    jest.advanceTimersByTime(60001);

    try {
      await keriaNotificationService.pollNotifications();
    } catch (error) {
      expect((error as Error).message).toBe("Break the while loop");
    }
    expect(
      keriaNotificationService.retryFailedNotifications
    ).toHaveBeenCalledTimes(1);
  });
});

describe("Long running operation tracker", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    markNotificationMock.mockResolvedValue({ status: "done" });
  });

  test("Should handle long operations with type group", async () => {
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "group",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata.mockResolvedValueOnce({
      id: "id",
    });
    identifierStorage.updateIdentifierMetadata.mockResolvedValueOnce(undefined);

    await keriaNotificationService.processOperation(operationRecord);

    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      { creationStatus: CreationStatus.COMPLETE }
    );
    expect(multiSigs.endRoleAuthorization).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Completed group operations for deleted groups does not cause an error", async () => {
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "group",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata.mockResolvedValueOnce({
      id: "id",
    });
    identifierStorage.updateIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processOperation(operationRecord);

    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      { creationStatus: CreationStatus.COMPLETE }
    );
    expect(multiSigs.endRoleAuthorization).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type witness", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "witness.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "witness",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.updateIdentifierMetadata.mockResolvedValueOnce(undefined);

    await keriaNotificationService.processOperation(operationRecord);

    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      {
        creationStatus: CreationStatus.COMPLETE,
      }
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "witness.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Completed group operations for deleted groups does not cause an error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "witness.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "witness",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.updateIdentifierMetadata.mockRejectedValueOnce(
      new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
    );

    await keriaNotificationService.processOperation(operationRecord);

    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      {
        creationStatus: CreationStatus.COMPLETE,
      }
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "witness.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type oobi", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
        oobi: "http://keria:3902/oobi/ELDjcyhsjppizfKQ_AvYeF4RuF1u0O6ya6OYUM6zLYH-/agent/EI4-oLA5XcrZepuB5mDrl3279EjbFtiDrz4im5Q4Ht0O?name=CF%20Credential%20Issuance",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    const connectionMock = {
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
      oobi: "http://oobi.com/",
    };
    connectionStorage.findById.mockResolvedValueOnce(connectionMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    contactGetMock.mockResolvedValueOnce(null);

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionService.shareIdentifier).not.toBeCalled();
    expect(connectionStorage.update).toBeCalledWith({
      id: connectionMock.id,
      creationStatus: CreationStatus.COMPLETE,
      createdAt: operationMock.response.dt,
      alias: connectionMock.alias,
      oobi: "http://oobi.com/",
    });
    expect(contactsUpdateMock).toBeCalledWith(connectionMock.id, {
      alias: "CF Credential Issuance",
      createdAt: operationMock.response.dt,
      oobi: "http://oobi.com/",
      sharedIdentifier: "",
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.ConnectionStateChanged,
      payload: {
        connectionId: "id",
        status: ConnectionStatus.CONFIRMED,
      },
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(2, {
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type oobi and share specified identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
        oobi: "http://keria:3902/oobi/ELDjcyhsjppizfKQ_AvYeF4RuF1u0O6ya6OYUM6zLYH-/agent/EI4-oLA5XcrZepuB5mDrl3279EjbFtiDrz4im5Q4Ht0O?name=CF%20Credential%20Issuance",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    const connectionMock = {
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
      oobi: "http://oobi.com/",
      sharedIdentifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9",
    };
    connectionStorage.findById.mockResolvedValueOnce(connectionMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    contactGetMock.mockResolvedValueOnce(null);

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionService.shareIdentifier).toBeCalledWith(
      connectionMock.id,
      "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9"
    );
    expect(connectionStorage.update).toBeCalledWith({
      id: connectionMock.id,
      creationStatus: CreationStatus.COMPLETE,
      createdAt: operationMock.response.dt,
      alias: connectionMock.alias,
      oobi: "http://oobi.com/",
      sharedIdentifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9",
    });
    expect(contactsUpdateMock).toBeCalledWith(connectionMock.id, {
      alias: "CF Credential Issuance",
      createdAt: operationMock.response.dt,
      oobi: "http://oobi.com/",
      sharedIdentifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9",
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.ConnectionStateChanged,
      payload: {
        connectionId: "id",
        status: ConnectionStatus.CONFIRMED,
      },
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(2, {
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should not update connection if it already exists", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
        oobi: "http://keria:3902/oobi/ELDjcyhsjppizfKQ_AvYeF4RuF1u0O6ya6OYUM6zLYH-/agent/EI4-oLA5XcrZepuB5mDrl3279EjbFtiDrz4im5Q4Ht0O?name=CF%20Credential%20Issuance",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    operationsGetMock.mockResolvedValue(operationMock);
    const connectionMock = {
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
    };
    connectionStorage.findById.mockResolvedValueOnce(connectionMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    contactGetMock.mockResolvedValueOnce({
      alias: "alias",
      oobi: "oobi",
      id: "id",
      createdAt: new Date(),
    });

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionStorage.update).toHaveBeenCalledWith(connectionMock);
    expect(contactsUpdateMock).toBeCalledTimes(0);
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should not update connection if it already exists", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
        oobi: "http://keria:3902/oobi/ELDjcyhsjppizfKQ_AvYeF4RuF1u0O6ya6OYUM6zLYH-/agent/EI4-oLA5XcrZepuB5mDrl3279EjbFtiDrz4im5Q4Ht0O?name=CF%20Credential%20Issuance",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    operationsGetMock.mockResolvedValue(operationMock);
    const connectionMock = {
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
    };
    connectionStorage.findById.mockResolvedValueOnce(connectionMock);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    contactGetMock.mockResolvedValueOnce({
      alias: "alias",
      oobi: "oobi",
      id: "id",
      createdAt: new Date(),
    });

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionStorage.update).toHaveBeenCalledWith(connectionMock);
    expect(contactsUpdateMock).toBeCalledTimes(0);
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationComplete,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "oobi.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type exchange.receivecredential and delete original notification", async () => {
    const credentialIdMock = "credentialId";
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexAdmit,
          p: "p",
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexGrant,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery.mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);
    credentialService.markAcdc.mockResolvedValue(undefined);

    await keriaNotificationService.processOperation(operationRecord);

    expect(credentialService.markAcdc).toBeCalledWith(
      credentialIdMock,
      CredentialStatus.CONFIRMED
    );
    expect(ipexCommunications.createLinkedIpexMessageRecord).toBeCalledWith(
      {
        exn: {
          r: ExchangeRoute.IpexGrant,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      },
      ConnectionHistoryType.CREDENTIAL_ISSUANCE
    );
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Can handle long operations with type exchange.receivecredential even if ACDC is deleted", async () => {
    const credentialIdMock = "credentialId";
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexAdmit,
          p: "p",
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexGrant,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery.mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);
    credentialService.markAcdc.mockRejectedValueOnce(
      new Error(CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG)
    );

    await keriaNotificationService.processOperation(operationRecord);

    expect(credentialService.markAcdc).toBeCalledWith(
      credentialIdMock,
      CredentialStatus.CONFIRMED
    );
    expect(ipexCommunications.createLinkedIpexMessageRecord).toBeCalledWith(
      {
        exn: {
          r: ExchangeRoute.IpexGrant,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      },
      ConnectionHistoryType.CREDENTIAL_ISSUANCE
    );
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type exchange.offercredential and delete original notification", async () => {
    const credentialIdMock = "credentialId";
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexOffer,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexApply,
          p: "p",
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.offercredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.offercredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery.mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        a: {
          r: NotificationRoute.ExnIpexApply,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexApply,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);

    await keriaNotificationService.processOperation(operationRecord);

    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.offercredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with type exchange.presentcredential and delete original notification", async () => {
    const credentialIdMock = "credentialId";
    const grantExchangeMock = {
      exn: {
        r: ExchangeRoute.IpexGrant,
        d: "d",
        e: {
          acdc: {
            d: credentialIdMock,
          },
        },
      },
    };
    const agreeExchange = {
      exn: {
        r: ExchangeRoute.IpexAgree,
        p: "p",
      },
    };
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce(grantExchangeMock)
      .mockResolvedValueOnce(agreeExchange);
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.presentcredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.presentcredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery.mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        a: {
          r: NotificationRoute.ExnIpexAgree,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexAgree,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);

    await keriaNotificationService.processOperation(operationRecord);

    expect(ipexCommunications.createLinkedIpexMessageRecord).toBeCalledWith(
      grantExchangeMock,
      ConnectionHistoryType.CREDENTIAL_PRESENTED
    );
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.presentcredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should handle long operations with default case", async () => {
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "id",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "unknown",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    };

    await keriaNotificationService.processOperation(
      operationRecord as OperationPendingRecord
    );

    expect(operationPendingStorage.deleteById).toHaveBeenCalledWith(
      operationRecord.id
    );
  });

  test("Should delete original grant notification when multi-sig admit operation completes", async () => {
    const credentialIdMock = "credentialId";
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexAdmit,
          p: "p",
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexGrant,
          d: "d",
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      groupMemberPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);
    credentialService.markAcdc.mockResolvedValue(undefined);

    await keriaNotificationService.processOperation(operationRecord);

    expect(credentialService.markAcdc).toBeCalledWith(
      credentialIdMock,
      CredentialStatus.CONFIRMED
    );
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.NotificationRemoved,
      payload: {
        id: "id",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should refresh original apply notification when multi-sig offer operation completes", async () => {
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexOffer,
          p: "p",
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexApply,
          d: "d",
          e: {
            acdc: {
              d: "credential-said",
            },
          },
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.offercredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.offercredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      groupMemberPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: DATETIME,
        a: {
          r: NotificationRoute.ExnIpexApply,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexApply,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
        groupReplied: true,
        groupInitiatorPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
        groupInitiator: true,
      },
    ]);

    multiSigs.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: {
        id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        displayName: "holder",
        createdAt: "2024-09-23T08:53:11.981Z",
        theme: 0,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      multisigMembers: [
        {
          aid: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
          ends: [],
        },
        {
          aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
          ends: [],
        },
      ],
    });

    await keriaNotificationService.processOperation(operationRecord);

    expect(notificationStorage.delete).not.toBeCalled();
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        read: false,
      })
    );
    expect(notificationStorage.update).not.toBeCalledWith(
      expect.objectContaining({
        createdAt: DATETIME,
      })
    );
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(1, {
      type: EventTypes.NotificationRemoved,
      payload: {
        id: "id",
      },
    });
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            id: "id",
          }),
        }),
      })
    );
    expect(eventEmitter.emit).not.toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: EventTypes.NotificationAdded,
        payload: expect.objectContaining({
          note: expect.objectContaining({
            createdAt: DATETIME,
          }),
        }),
      })
    );
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.offercredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should delete original agree notification when multi-sig grant operation completes", async () => {
    const credentialIdMock = "credentialId";
    signifyClient
      .exchanges()
      .get.mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexGrant,
          e: {
            acdc: {
              d: credentialIdMock,
            },
          },
          p: "p",
        },
      })
      .mockResolvedValueOnce({
        exn: {
          r: ExchangeRoute.IpexAgree,
          d: "d",
        },
      });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.presentcredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.presentcredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      type: "IdentifierMetadataRecord",
      id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      displayName: "holder",
      groupMemberPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: "id",
        createdAt: new Date(),
        a: {
          r: NotificationRoute.ExnIpexAgree,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexAgree,
        read: true,
        linkedRequest: { accepted: false },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: new Date(),
      },
    ]);

    await keriaNotificationService.processOperation(operationRecord);

    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(markNotificationMock).toBeCalledWith("id");
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.presentcredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("ExchangeReceiveCredential operations must have an exchange route of /ipex/admit", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const operationMock = {
      metadata: {
        said: "said",
      },
      done: true,
      response: {
        i: "id",
        dt: new Date(),
      },
    };
    operationsGetMock.mockResolvedValue(operationMock);
    const credentialIdMock = "credentialId";
    exchangesGetMock.mockResolvedValueOnce({
      exn: {
        r: ExchangeRoute.IpexGrant,
        e: {
          acdc: {
            d: credentialIdMock,
          },
        },
      },
    });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    await keriaNotificationService.processOperation(operationRecord);

    expect(operationsGetMock).toBeCalledTimes(1);
    expect(credentialService.markAcdc).toBeCalledTimes(0);
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
  });

  test("Should call setTimeout listening for pending operations if Keria is offline", async () => {
    // We mock the setTimeout here so we can exit the while(true) loop
    jest.spyOn(global, "setTimeout").mockImplementation(() => {
      throw new Error("Force Exit");
    });
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(false);
    operationPendingGetAllMock.mockResolvedValueOnce([
      {
        type: "OperationPendingRecord",
        id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
        createdAt: new Date("2024-08-01T10:36:17.814Z"),
        recordType: "exchange.receivecredential",
        updatedAt: new Date("2024-08-01T10:36:17.814Z"),
      },
    ]);

    try {
      await keriaNotificationService.pollLongOperations();
    } catch (error) {
      expect((error as Error).message).toBe("Force Exit");
    }

    expect(operationsGetMock).not.toBeCalled();
    expect(setTimeout).toHaveBeenCalledWith(
      keriaNotificationService.pollLongOperations,
      KeriaNotificationService.POLL_KERIA_INTERVAL
    );
  });

  test("Should update notification marker after the notification is processed", async () => {
    jest
      .spyOn(keriaNotificationService as any, "getKeriaOnlineStatus")
      .mockReturnValue(true);
    jest.spyOn(console, "error").mockReturnValueOnce();
    basicStorage.findById.mockResolvedValueOnce({
      id: MiscRecordId.KERIA_NOTIFICATION_MARKER,
      content: {
        nextIndex: 0,
        lastNotificationId: "",
      },
    });
    let firstTry = true;
    listNotificationsMock.mockImplementation(async () => {
      if (firstTry) {
        firstTry = false;
        return {
          start: 0,
          end: 2,
          total: 2,
          notes: [
            {
              i: "string",
              dt: "string",
              r: true,
              a: {
                r: NotificationRoute.ExnIpexApply,
                d: "string",
                m: "",
              },
            },
            {
              i: "string",
              dt: "string",
              r: true,
              a: {
                r: NotificationRoute.MultiSigExn,
                d: "string",
                m: "",
              },
            },
          ],
        };
      } else {
        throw new Error("Break the while loop");
      }
    });

    try {
      await keriaNotificationService.pollNotifications();
    } catch (error) {
      expect((error as Error).message).toBe("Break the while loop");
    }

    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledWith(
      keriaNotificationService.pollNotifications,
      KeriaNotificationService.POLL_KERIA_INTERVAL
    );
  });

  test("Should register callback for NotificationAdded event", () => {
    const callback = jest.fn();
    keriaNotificationService.onNewNotification(callback);

    expect(eventEmitter.on).toHaveBeenCalledWith(
      EventTypes.NotificationAdded,
      callback
    );
  });

  test("Should register callback for OperationComplete event", () => {
    const callback = jest.fn();
    keriaNotificationService.onLongOperationSuccess(callback);

    expect(eventEmitter.on).toHaveBeenCalledWith(
      EventTypes.OperationComplete,
      callback
    );
  });

  test("Should register callback for NotificationRemoved event", () => {
    const callback = jest.fn();
    keriaNotificationService.onRemoveNotification(callback);

    expect(eventEmitter.on).toHaveBeenCalledWith(
      EventTypes.NotificationRemoved,
      callback
    );
  });

  test('Should retry connection when "Failed to fetch" error occurs when process operation', async () => {
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    operationsGetMock.mockRejectedValueOnce(new Error("Failed to fetch"));
    jest
      .spyOn(keriaNotificationService as any, "getKeriaOnlineStatus")
      .mockReturnValue(true);

    await keriaNotificationService.processOperation(operationRecord);

    expect(Agent.agent.markAgentStatus).toHaveBeenCalledWith(false);
    expect(Agent.agent.connect).toHaveBeenCalled();
  });

  test("Should throw other errors when process operation", async () => {
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "exchange.receivecredential.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "exchange.receivecredential",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    const errorMessage = "Error - 500";
    operationsGetMock.mockRejectedValueOnce(new Error(errorMessage));
    jest
      .spyOn(keriaNotificationService as any, "getKeriaOnlineStatus")
      .mockReturnValue(true);

    await expect(
      keriaNotificationService.processOperation(operationRecord)
    ).rejects.toThrow(errorMessage);
  });
});

describe("Handling of failed long running operations", () => {
  test("Should handle failed witness operations and exit early", async () => {
    operationsGetMock.mockResolvedValue({
      done: true,
      error: { code: 400 },
    });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "witness",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    await keriaNotificationService.processOperation(operationRecord);

    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      {
        creationStatus: CreationStatus.FAILED,
      }
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationFailed,
      payload: {
        opType: operationRecord.recordType,
        oid: "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
    expect(identifierStorage.updateIdentifierMetadata).not.toBeCalledWith(
      "AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      {
        creationStatus: CreationStatus.COMPLETE,
      }
    );
    expect(eventEmitter.emit).not.toBeCalledWith(
      expect.objectContaining({
        type: EventTypes.OperationComplete,
      })
    );
  });

  test("Should handle failed longer oobi operations and exit early", async () => {
    operationsGetMock.mockResolvedValue({
      done: true,
      error: { code: 400 },
      metadata: {
        oobi: "http://keria.com/oobi/EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU/agent/EMXchkqpJKegnObFGUAt7Cqj9yggGNZIpc5PbS7Igwip?name=CF%20Credential%20Issuance",
      },
    });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "AOCUvGbpidkplC7gA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    connectionStorage.findById.mockResolvedValueOnce({
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
      oobi: "http://keria.com/oobi/EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU/agent/EMXchkqpJKegnObFGUAt7Cqj9yggGNZIpc5PbS7Igwip?name=CF%20Credential%20Issuance",
    });

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionStorage.findById).toBeCalledWith(
      "EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU"
    );
    expect(connectionStorage.update).toBeCalledWith(
      expect.objectContaining({
        creationStatus: CreationStatus.FAILED,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationFailed,
      payload: {
        opType: operationRecord.recordType,
        oid: "EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "AOCUvGbpidkplC7gA"
    );
    expect(connectionStorage.update).not.toBeCalledWith(
      expect.objectContaining({
        creationStatus: CreationStatus.COMPLETE,
      })
    );
    expect(eventEmitter.emit).not.toBeCalledWith(
      expect.objectContaining({
        type: EventTypes.OperationComplete,
      })
    );
  });

  test("Should handle failed short oobi operations and exit early", async () => {
    operationsGetMock.mockResolvedValue({
      done: true,
      error: { code: 400 },
      metadata: {
        oobi: "http://keria.com/oobi/EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU",
      },
    });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "AOCUvGbpidkplC7gA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "oobi",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;
    connectionStorage.findById.mockResolvedValueOnce({
      id: "id",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date(),
      alias: "CF Credential Issuance",
      oobi: "http://keria.com/oobi/EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU",
    });

    await keriaNotificationService.processOperation(operationRecord);

    expect(connectionStorage.findById).toBeCalledWith(
      "EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU"
    );
    expect(connectionStorage.update).toBeCalledWith(
      expect.objectContaining({
        creationStatus: CreationStatus.FAILED,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.OperationFailed,
      payload: {
        opType: operationRecord.recordType,
        oid: "EMoQKrOjmuOGgoqBuPB5goSZiEqjYNN5hb9sAt1HHVrU",
      },
    });
    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "AOCUvGbpidkplC7gA"
    );
    expect(connectionStorage.update).not.toBeCalledWith(
      expect.objectContaining({
        creationStatus: CreationStatus.COMPLETE,
      })
    );
    expect(eventEmitter.emit).not.toBeCalledWith(
      expect.objectContaining({
        type: EventTypes.OperationComplete,
      })
    );
  });

  test("Should handle all other failed operation types as a failure", async () => {
    operationsGetMock.mockResolvedValue({
      done: true,
      error: { code: 400 },
    });
    const operationRecord = {
      type: "OperationPendingRecord",
      id: "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA",
      createdAt: new Date("2024-08-01T10:36:17.814Z"),
      recordType: "group",
      updatedAt: new Date("2024-08-01T10:36:17.814Z"),
    } as OperationPendingRecord;

    await keriaNotificationService.processOperation(operationRecord);

    expect(operationPendingStorage.deleteById).toBeCalledWith(
      "group.AOCUvGbpidkplC7gAoJOxLgXX1P2j4xlWMbzk3gM8JzA"
    );
    expect(eventEmitter.emit).not.toBeCalledWith(
      expect.objectContaining({
        type: EventTypes.OperationComplete,
      })
    );
  });
});
