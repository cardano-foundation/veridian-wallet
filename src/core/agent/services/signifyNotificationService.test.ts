import { Agent } from "@aries-framework/core";
import { SignifyNotificationService } from "./signifyNotificationService";
import { SignifyApi } from "../modules/signify/signifyApi";

const agent = jest.mocked({
  modules: {
    generalStorage: {
      getAllAvailableIdentifierMetadata: jest.fn(),
      getAllArchivedIdentifierMetadata: jest.fn(),
      getIdentifierMetadata: jest.fn(),
      saveIdentifierMetadataRecord: jest.fn(),
      archiveIdentifierMetadata: jest.fn(),
      deleteIdentifierMetadata: jest.fn(),
      updateIdentifierMetadata: jest.fn(),
      getKeriIdentifiersMetadata: jest.fn(),
    },
  },
  dids: {
    getCreatedDids: jest.fn(),
    resolve: jest.fn(),
    create: jest.fn(),
  },
  genericRecords: {
    save: jest.fn(),
    findAllByQuery: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  },
});

const basicStorage = jest.mocked({
  open: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const signifyApi = jest.mocked({
  getIdentifierByName: jest.fn(),
  createIdentifier: jest.fn(),
  getAllIdentifiers: jest.fn(),
  markNotification: jest.fn(),
  getKeriExchange: jest.fn(),
});

const signifyNotificationService = new SignifyNotificationService(
  agent as any as Agent,
  basicStorage,
  signifyApi as any as SignifyApi
);

// @TODO - don't stop if merging to develop.
describe.skip("Signify notification service of agent", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("callback should be called when there are KERI notifications", async () => {
    const callback = jest.fn();
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
    basicStorage.save = jest
      .fn()
      .mockReturnValue({ id: "id", createdAt: new Date(), content: {} });
    jest.useFakeTimers();
    for (const notif of notes) {
      await signifyNotificationService.processNotification(notif, callback);
    }
    expect(basicStorage.save).toBeCalledTimes(2);
    expect(callback).toBeCalledTimes(2);
  });

  test("Should call update when dismiss a notification", async () => {
    const notification = {
      id: "id",
      _tags: {
        isDismissed: false,
      } as any,
      setTag: function (name: string, value: any) {
        this._tags[name] = value;
      },
    };
    basicStorage.findById = jest.fn().mockResolvedValue(notification);
    await signifyNotificationService.dismissNotification(notification.id);
    expect(basicStorage.update).toBeCalledTimes(1);
  });

  test("Should throw error when dismiss an invalid notification", async () => {
    basicStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      signifyNotificationService.dismissNotification("not-exist-noti-id")
    ).rejects.toThrowError(
      SignifyNotificationService.KERI_NOTIFICATION_NOT_FOUND
    );
  });
});
