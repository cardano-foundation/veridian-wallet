import { Agent } from "../agent";
import { EventService } from "./eventService";
import { SignifyNotificationService } from "./signifyNotificationService";

const identifiersListMock = jest.fn();
const identifiersGetMock = jest.fn();
const identifiersCreateMock = jest.fn();
const identifiersMemberMock = jest.fn();
const identifiersInteractMock = jest.fn();
const identifiersRotateMock = jest.fn();

const groupGetRequestMock = jest.fn();

const oobiResolveMock = jest.fn();
const queryKeyStateMock = jest.fn();

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
    get: jest.fn().mockImplementation((id: string) => {
      return {
        done: true,
        response: {
          i: id,
        },
      };
    }),
  }),
  oobis: () => ({
    get: jest.fn(),
    resolve: oobiResolveMock,
  }),
  contacts: () => ({
    list: jest.fn(),
    get: jest.fn().mockImplementation((id: string) => {
      return {
        alias: "e57ee6c2-2efb-4158-878e-ce36639c761f",
        oobi: "oobi",
        id,
      };
    }),
    delete: jest.fn(),
  }),
  notifications: () => ({
    list: jest.fn(),
    mark: jest.fn(),
  }),
  ipex: () => ({
    admit: jest.fn(),
    submitAdmit: jest.fn(),
  }),
  credentials: () => ({
    list: jest.fn(),
  }),
  exchanges: () => ({
    get: jest.fn().mockResolvedValue({ exn: { i: "connection-id" } }),
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
});

const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventService: new EventService(),
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

const identifierStorage = jest.mocked({});
const operationPendingStorage = jest.mocked({});

const signifyNotificationService = new SignifyNotificationService(
  agentServicesProps,
  notificationStorage as any,
  identifierStorage as any,
  operationPendingStorage as any,
  connectionStorage as any
);

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getKeriaOnlineStatus: jest.fn(),
      multiSigs: { hasMultisig: jest.fn() },
      ipexCommunications: {
        grantAcdcFromAgree: jest.fn(),
      },
    },
  },
}));

describe("Signify notification service of agent", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("callback should be called when there are KERI notifications", async () => {
    const callback = jest.fn();
    Agent.agent.multiSigs.hasMultisig = jest.fn().mockResolvedValue(false);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    const notes = [
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "/multisig/icp",
          d: "string",
          m: "",
        },
      },
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
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "/exn/ipex/grant",
          d: "string",
          m: "",
        },
      },
    ];
    notificationStorage.save = jest
      .fn()
      .mockReturnValue({ id: "id", createdAt: new Date(), content: {} });
    groupGetRequestMock.mockResolvedValue([{ exn: { a: { gid: "id" } } }]);
    jest.useFakeTimers();
    for (const notif of notes) {
      await signifyNotificationService.processNotification(notif, callback);
    }
    expect(notificationStorage.save).toBeCalledTimes(2);
    expect(callback).toBeCalledTimes(2);
  });

  test("Should call update when read a notification", async () => {
    const notification = {
      id: "id",
      read: false,
    };

    notificationStorage.findById = jest.fn().mockResolvedValue(notification);
    await signifyNotificationService.readNotification(notification.id);
    expect(notificationStorage.update).toBeCalledTimes(1);
  });

  test("Should throw error when read an invalid notification", async () => {
    notificationStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      signifyNotificationService.readNotification("not-exist-noti-id")
    ).rejects.toThrowError(SignifyNotificationService.NOTIFICATION_NOT_FOUND);
  });

  test("can delete keri notification by ID", async () => {
    const id = "uuid";
    await signifyNotificationService.deleteNotificationRecordById(id);
    expect(notificationStorage.deleteById).toBeCalled();
  });

  test("Should skip if there is no valid multi-sig notification", async () => {
    const callback = jest.fn();
    groupGetRequestMock.mockResolvedValue([]);
    const notes = [
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "/multisig/icp",
          d: "not-found-said",
          m: "",
        },
      },
    ];
    for (const notif of notes) {
      await signifyNotificationService.processNotification(notif, callback);
    }
    expect(callback).toBeCalledTimes(0);
  });

  test("Should skip if there is a existed multi-sig", async () => {
    const callback = jest.fn();
    Agent.agent.multiSigs.hasMultisig = jest.fn().mockResolvedValue(true);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    groupGetRequestMock.mockResolvedValue([{ exn: { a: { gid: "id" } } }]);
    const notes = [
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "/multisig/icp",
          d: "d",
          m: "",
        },
      },
    ];
    for (const notif of notes) {
      await signifyNotificationService.processNotification(notif, callback);
    }
    expect(callback).toBeCalledTimes(0);
  });

  test("Should skip if there is a missing gid multi-sig notification", async () => {
    const callback = jest.fn();
    Agent.agent.multiSigs.hasMultisig = jest.fn().mockResolvedValue(true);
    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([]);
    groupGetRequestMock.mockResolvedValue([{ exn: { a: {} } }]);
    const notes = [
      {
        i: "string",
        dt: "string",
        r: false,
        a: {
          r: "/multisig/icp",
          d: "no-gid-said",
          m: "",
        },
      },
    ];
    for (const notif of notes) {
      await signifyNotificationService.processNotification(notif, callback);
    }
    expect(callback).toBeCalledTimes(0);
  });

  test("Should call update when unread a notification", async () => {
    const notification = {
      id: "id",
      read: true,
    };

    notificationStorage.findById = jest.fn().mockResolvedValue(notification);
    await signifyNotificationService.unreadNotification(notification.id);
    expect(notificationStorage.update).toBeCalledTimes(1);
  });

  test("Should throw error when unread an invalid notification", async () => {
    notificationStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      signifyNotificationService.unreadNotification("not-exist-noti-id")
    ).rejects.toThrowError(SignifyNotificationService.NOTIFICATION_NOT_FOUND);
  });
});
