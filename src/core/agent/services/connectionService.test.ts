/**
 * @jest-environment node
 */
// @TODO - foconnor: Core tests should likely all be on node, so we can stop mocking Signify-TS/libsodium.

import { ready } from "signify-ts";
import { ConnectionStatus, CreationStatus, OobiType } from "../agent.types";
import { ConnectionService } from "./connectionService";
import { CoreEventEmitter } from "../event";
import { ConfigurationService } from "../../configuration";
import { Agent } from "../agent";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { EventTypes } from "../event.types";
import {
  ConnectionHistoryItem,
  ConnectionHistoryType,
  KeriaContactKeyPrefix,
} from "./connectionService.types";
import { memberMetadataRecord } from "../../__fixtures__/agent/multiSigFixtures";
import { individualRecord } from "../../__fixtures__/agent/identifierFixtures";
import {
  humanReadableExn,
  humanReadableLinkedExn,
} from "../../__fixtures__/agent/keriaNotificationFixtures";

const contactListMock = jest.fn();
let deleteContactMock = jest.fn();
const updateContactMock = jest.fn();
const getOobiMock = jest.fn();
const getIdentifier = jest.fn();
const saveOperationPendingMock = jest.fn();
let contactGetMock = jest.fn();
const submitRpyMock = jest.fn();
const getExchangeMock = jest.fn();

const failUuid = "fail-uuid";
const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    get: getIdentifier,
  }),
  operations: () => ({
    get: jest.fn().mockImplementation((id: string) => {
      if (id === `${oobiPrefix}${failUuid}`) {
        return {
          done: false,
          name: id,
        };
      }
      return {
        done: true,
        response: {
          i: id,
        },
        name: id,
      };
    }),
  }),
  oobis: () => ({
    get: getOobiMock,
    resolve: jest.fn().mockImplementation((name: string) => {
      if (name === `${oobiPrefix}${failUuid}`) {
        return {
          done: false,
          name,
          metadata: {
            oobi: `${oobiPrefix}${failUuid}`,
          },
        };
      }
      return {
        done: true,
        response: {
          i: "id",
          dt: now,
        },
        metadata: {
          oobi: `${oobiPrefix}${failUuid}`,
        },
        name,
      };
    }),
  }),
  contacts: () => ({
    list: contactListMock,
    get: contactGetMock,
    delete: deleteContactMock,
    update: updateContactMock,
  }),
  exchanges: () => ({
    get: getExchangeMock,
  }),
  agent: {
    pre: "pre",
  },
  replies: () => ({
    submitRpy: submitRpyMock,
  }),
});

const eventEmitter = new CoreEventEmitter();

const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter,
};

const connectionStorage = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const operationPendingStorage = jest.mocked({
  save: saveOperationPendingMock,
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const credentialStorage = jest.mocked({
  getAllCredentialMetadata: jest.fn(),
  deleteCredentialMetadata: jest.fn(),
  getCredentialMetadata: jest.fn(),
  saveCredentialMetadataRecord: jest.fn(),
  updateCredentialMetadata: jest.fn(),
  getCredentialMetadatasById: jest.fn(),
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  getIdentifierMetadataByGroupId: jest.fn(),
});

const basicStorage = jest.mocked({
  findExpectedById: jest.fn(),
});

const connectionService = new ConnectionService(
  agentServicesProps,
  connectionStorage as any,
  credentialStorage as any,
  operationPendingStorage as any,
  identifierStorage as any,
  basicStorage as any
);

const now = new Date();
const nowISO = now.toISOString();
const contacts = [
  {
    alias: "keri",
    challenges: [],
    id: "EKwzermyJ6VhunFWpo7fscyCILxFG7zZIM9JwSSABbZ5",
    oobi: "http://oobi",
    wellKnowns: [],
  },
];

const oobiPrefix = "http://oobi.com/oobi/";

describe("Connection service of agent", () => {
  beforeAll(async () => {
    await ready();
    await new ConfigurationService().start();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("Should return group initiator type to trigger UI to create a new identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const groupId = "123";
    const connectionId = "id";
    const alias = "alias";
    const oobi = `http://localhost/oobi/${connectionId}/agent/agentId?groupId=${groupId}&name=${alias}`;

    const result = await connectionService.connectByOobiUrl(oobi);

    expect(result).toStrictEqual({
      type: OobiType.MULTI_SIG_INITIATOR,
      groupId,
      connection: {
        groupId,
        id: "id",
        label: alias,
        oobi: oobi,
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        ),
      },
    });
    expect(connectionStorage.save).toBeCalledWith({
      alias,
      oobi,
      id: "id",
      createdAt: new Date(now),
      creationStatus: CreationStatus.COMPLETE,
      groupId,
    });
  });

  test("Can create linked group connections for existing pending groups", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const groupId = "123";
    const connectionId = "connectionId";
    const alias = "alias";
    const oobi = `http://localhost/oobi/${connectionId}/agent/agentId?groupId=${groupId}&name=${alias}`;
    identifierStorage.getIdentifierMetadataByGroupId.mockResolvedValue(
      memberMetadataRecord
    );

    await connectionService.connectByOobiUrl(oobi);

    expect(connectionStorage.save).toBeCalledWith({
      id: connectionId,
      alias,
      createdAt: now,
      creationStatus: CreationStatus.COMPLETE,
      groupId,
      oobi,
    });
  });

  test("Should throw an error if invalid OOBI URL format", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    let invalidUrls = [
      "https://localhost/oobi",
      "https://localhost/oobi/1234",
      "https://localhost/oobi/1234/agent/eid/extra",
      "https://localhost/.well-known/keri/oobi/",
      "https://localhost/oobi/1234/witness/eid",
      "https://localhost",
    ];

    for (const url of invalidUrls) {
      await expect(
        connectionService.connectByOobiUrl(url)
      ).rejects.toThrowError(new Error(ConnectionService.OOBI_INVALID));
    }

    invalidUrls = [
      "https://localhost/oobi",
      "https://localhost",
      "https://localhost/oobi/1234/agent/eid/extra",
    ];

    for (const url of invalidUrls) {
      await expect(connectionService.resolveOobi(url)).rejects.toThrowError(
        new Error(ConnectionService.OOBI_INVALID)
      );
    }
  });

  test("Should create connection and resolveOOBI with valid URL format", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    let validUrls = [
      "https://localhost/oobi/1234/agent?name=alias",
      "https://localhost/oobi/1234/agent/5678?name=alias",
      "https://localhost/.well-known/keri/oobi/1234?name=alias",
    ];

    for (const url of validUrls) {
      await connectionService.connectByOobiUrl(url);
      expect(connectionStorage.save).toBeCalledWith(
        expect.objectContaining({
          alias: "alias",
          creationStatus: CreationStatus.PENDING,
          groupId: undefined,
          id: "1234",
          oobi: url,
        })
      );
    }

    validUrls = [
      "https://localhost/oobi/1234/agent?name=alias",
      "https://localhost/oobi/1234/witness?name=alias",
      "https://localhost/.well-known/keri/oobi/1234?name=alias",
      "https://localhost/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao?name=alias",
    ];

    signifyClient.operations().get = jest
      .fn()
      .mockResolvedValue({ done: true });
    for (const url of validUrls) {
      const op = await connectionService.resolveOobi(url);
      expect(op).toEqual({
        op: {
          response: { i: "id", dt: now },
          name: url.split("?")[0],
          metadata: {
            oobi: `${oobiPrefix}${failUuid}`,
          },
          done: true,
        },
        alias: "alias",
      });
    }
  });

  test("Can mark an identifier to share when creating a connection", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const url = "https://localhost/oobi/1234/agent?name=alias";
    identifierStorage.getIdentifierMetadata.mockResolvedValue({
      displayName: "TestUser",
    });

    await connectionService.connectByOobiUrl(url, individualRecord.id);

    expect(connectionStorage.save).toBeCalledWith(
      expect.objectContaining({
        alias: "alias",
        creationStatus: CreationStatus.PENDING,
        groupId: undefined,
        id: "1234",
        oobi: url,
        sharedIdentifier: individualRecord.id,
      })
    );
  });

  test("can get all connections and multi-sig related ones are filtered", async () => {
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        getTag: jest.fn(),
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
      },
      {
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        getTag: jest.fn(),
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false,
      },
    ]);

    expect(await connectionService.getConnections()).toEqual([
      {
        id: contacts[0].id,
        label: "keri",
        oobi: "oobi",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
      },
      {
        id: contacts[0].id,
        label: "keri",
        oobi: "oobi",
        status: ConnectionStatus.PENDING,
        createdAtUTC: expect.any(String),
      },
    ]);
    expect(connectionStorage.findAllByQuery).toHaveBeenCalledWith({
      groupId: undefined,
      pendingDeletion: false,
    });
  });

  test("can get all multisig connections", async () => {
    const groupId = "group-id";
    const metadata = {
      id: "id",
      alias: "alias",
      oobi: `localhost/oobi=2442?groupId=${groupId}`,
      groupId,
      createdAt: new Date(),
      getTag: jest.fn().mockReturnValue(groupId),
      pendingDeletion: false,
      creationStatus: CreationStatus.COMPLETE,
    };
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValue([metadata]);
    expect(await connectionService.getMultisigConnections()).toEqual([
      {
        id: metadata.id,
        label: metadata.alias,
        createdAtUTC: metadata.createdAt.toISOString(),
        status: ConnectionStatus.CONFIRMED,
        oobi: metadata.oobi,
        groupId: metadata.groupId,
      },
    ]);
    expect(connectionStorage.findAllByQuery).toHaveBeenCalledWith({
      $not: {
        groupId: undefined,
      },
      pendingDeletion: false,
    });
  });

  test("can save connection note with generic records", async () => {
    const connectionId = "connectionId";
    const note = {
      title: "title",
      message: "message",
    };

    await connectionService.createConnectionNote(connectionId, note);

    const parsedNote = JSON.parse(
      Object.values(updateContactMock.mock.calls[0][1])[0] as string
    );

    expect(parsedNote).toEqual(
      expect.objectContaining({
        title: note.title,
        message: note.message,
        id: expect.stringMatching(/^note:[A-Za-z0-9_-]{24}$/),
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        ),
      })
    );
  });

  test("can delete connection note with id", async () => {
    const connectionNoteId = "connectionNoteId";
    const connectionId = "connectionId";
    await connectionService.deleteConnectionNoteById(
      connectionId,
      connectionNoteId
    );
    expect(updateContactMock).toBeCalledWith(connectionId, {
      [connectionNoteId]: null,
    });
  });

  test("can update connection note by id", async () => {
    const connectionToUpdate = {
      id: "note:id",
      title: "title",
      message: "message",
    };
    const connectionId = "connectionId";

    await connectionService.updateConnectionNoteById(
      connectionId,
      connectionToUpdate.id,
      connectionToUpdate
    );
    expect(updateContactMock).toBeCalledWith(connectionId, {
      "note:id": JSON.stringify(connectionToUpdate),
    });
  });

  test("can get an OOBI with an alias (URL encoded)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getOobiMock.mockImplementation((name: string) => {
      return {
        oobis: [`${oobiPrefix}${name}`],
        done: true,
      };
    });
    signifyClient.oobis().get = jest.fn().mockImplementation((name: string) => {
      return `${oobiPrefix}${name}`;
    });
    const id = "keriuuid";

    const oobi = await connectionService.getOobi(id, "alias with spaces");

    expect(oobi).toEqual(`${oobiPrefix}${id}?name=alias+with+spaces`);
  });

  test("can get KERI OOBI with alias and groupId", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getOobiMock.mockImplementation((name: string) => {
      return {
        oobis: [`${oobiPrefix}${name}`],
        done: true,
      };
    });
    const id = "id";
    const KeriOobi = await connectionService.getOobi(id, "alias", "123");
    expect(KeriOobi).toEqual(`${oobiPrefix}${id}?name=alias&groupId=123`);
  });

  test("can get connection short details by id", async () => {
    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      createdAt: now,
      alias: "keri",
      getTag: jest.fn(),
      creationStatus: CreationStatus.COMPLETE,
    });
    expect(
      await connectionService.getConnectionShortDetailById(contacts[0].id)
    ).toMatchObject({
      id: contacts[0].id,
      createdAtUTC: nowISO,
      label: "keri",
      status: ConnectionStatus.CONFIRMED,
    });
    expect(connectionStorage.findById).toBeCalledWith(contacts[0].id);
  });

  test("can get failed connection short details by id", async () => {
    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      createdAt: now,
      alias: "keri",
      getTag: jest.fn(),
      creationStatus: CreationStatus.FAILED,
    });
    expect(
      await connectionService.getConnectionShortDetailById(contacts[0].id)
    ).toMatchObject({
      id: contacts[0].id,
      createdAtUTC: nowISO,
      label: "keri",
      status: ConnectionStatus.FAILED,
    });
    expect(connectionStorage.findById).toBeCalledWith(contacts[0].id);
  });

  test("cannot get connection short details if it does not exist", async () => {
    connectionStorage.findById = jest.fn().mockResolvedValue(null);
    await expect(
      connectionService.getConnectionShortDetailById(contacts[0].id)
    ).rejects.toThrowError(
      ConnectionService.CONNECTION_METADATA_RECORD_NOT_FOUND
    );
  });

  test("can get KERI OOBI", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getOobiMock.mockImplementation((name: string) => {
      return {
        oobis: [`${oobiPrefix}${name}`],
        done: true,
      };
    });
    const id = "id";
    const KeriOobi = await connectionService.getOobi(id);
    expect(KeriOobi).toEqual(oobiPrefix + id);
  });

  test("Should call createIdentifierMetadataRecord when there are un-synced KERI contacts", async () => {
    const DATE = new Date();
    contactListMock.mockReturnValue([
      {
        id: "EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR",
        alias: "MyFirstContact",
        oobi: "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902/oobi/EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR/agent/EP48HXCPvtzGu0c90gG9fkOYiSoi6U5Am-XaqcoNHTBl",
        groupCreationId: "group-id",
        createdAt: DATE.toISOString(),
        challenges: [],
        wellKnowns: [],
        sharedIdentifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9",
      },
      {
        id: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
        alias: "MySecondContact",
        oobi: "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902/oobi/ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W/agent/EJMV0RgikXM7jyvXB9oOyKSZzo_AsYrEgP15Ly0dwzEL",
        createdAt: DATE.toISOString(),
        challenges: [],
        wellKnowns: [],
      },
      {
        id: "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCXX",
        alias: "ExistingContact",
        oobi: "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902/oobi/EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCXX/agent/EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_zH",
        createdAt: DATE.toISOString(),
        challenges: [],
        wellKnowns: [],
      },
    ]);

    eventEmitter.emit = jest.fn();
    connectionStorage.getAll = jest
      .fn()
      .mockReturnValue([
        { id: "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCXX" },
      ]);

    await connectionService.syncKeriaContacts();

    expect(connectionStorage.save).toBeCalledTimes(2);
    expect(connectionStorage.save).toBeCalledWith({
      id: "EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR",
      alias: "MyFirstContact",
      createdAt: DATE,
      oobi: "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902/oobi/EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR/agent/EP48HXCPvtzGu0c90gG9fkOYiSoi6U5Am-XaqcoNHTBl",
      groupId: "group-id",
      sharedIdentifier: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_p9",
      creationStatus: CreationStatus.COMPLETE,
    });
    expect(connectionStorage.save).toBeCalledWith({
      id: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
      alias: "MySecondContact",
      createdAt: DATE,
      oobi: "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3902/oobi/ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W/agent/EJMV0RgikXM7jyvXB9oOyKSZzo_AsYrEgP15Ly0dwzEL",
      sharedIdentifier: "",
      creationStatus: CreationStatus.COMPLETE,
    });
  });

  test("Can get multisig linked contacts", async () => {
    const groupId = "123";
    const metadata = {
      id: "id",
      alias: "alias",
      oobi: `localhost/oobi=2442?groupId=${groupId}`,
      groupId,
      createdAt: new Date(),
      getTag: jest.fn().mockReturnValue(groupId),
      pendingDeletion: false,
      creationStatus: CreationStatus.COMPLETE,
    };
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValue([metadata]);
    expect(
      await connectionService.getMultisigLinkedContacts(groupId)
    ).toStrictEqual([
      {
        id: metadata.id,
        label: metadata.alias,
        createdAtUTC: metadata.createdAt.toISOString(),
        status: ConnectionStatus.CONFIRMED,
        oobi: metadata.oobi,
        groupId: metadata.groupId,
      },
    ]);
    expect(connectionStorage.findAllByQuery).toHaveBeenCalledWith({
      groupId,
      pendingDeletion: false,
    });
  });

  test("can resolve oobi without name parameter", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const url = `${oobiPrefix}keriuuid`;

    /* eslint-disable @typescript-eslint/no-var-requires */
    jest
      .spyOn(require("./utils"), "randomSalt")
      .mockReturnValue("0ADQpus-mQmmO4mgWcT3ekDz");
    /* eslint-enable @typescript-eslint/no-var-requires */

    const op = await connectionService.resolveOobi(url);
    expect(op).toEqual({
      op: {
        response: { i: "id", dt: now },
        name: url,
        done: true,
        metadata: {
          oobi: `${oobiPrefix}${failUuid}`,
        },
      },
      alias: "0ADQpus-mQmmO4mgWcT3ekDz",
    });
  });

  test("should preserve createdAt attribute when re-resolving OOBI", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const url = `${oobiPrefix}keriuuid?name=keri`;

    contactGetMock.mockResolvedValueOnce({
      alias: "keri",
      oobi: url,
      id: "id",
      createdAt: now,
    });

    const op = await connectionService.resolveOobi(url);

    expect(updateContactMock).not.toBeCalled();
    expect(op).toEqual({
      op: {
        response: { i: "id", dt: now },
        name: url.split("?")[0],
        done: true,
        metadata: {
          oobi: `${oobiPrefix}${failUuid}`,
        },
      },
      alias: "keri",
    });
  });

  test("can resolve oobi with a name parameter (URL decoded)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const url = `${oobiPrefix}keriuuid?name=alias%20with%20spaces`;
    signifyClient.operations().get = jest
      .fn()
      .mockResolvedValue({ done: true });
    const op = await connectionService.resolveOobi(url);
    expect(op).toEqual({
      op: {
        response: { i: "id", dt: now },
        name: url.split("?")[0],
        metadata: {
          oobi: `${oobiPrefix}${failUuid}`,
        },
        done: true,
      },
      alias: "alias with spaces",
    });
  });

  test("should update KERIA contact directly if waiting for completion", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    jest.spyOn(Date.prototype, "getTime").mockReturnValueOnce(0);
    contactGetMock.mockRejectedValueOnce(
      new Error("Not Found - 404 - not found")
    );

    await connectionService.resolveOobi(
      `${oobiPrefix}test?name=alias&groupId=1234`,
      true
    );

    expect(updateContactMock).toBeCalledWith("id", {
      alias: "alias",
      createdAt: expect.any(Date),
      groupCreationId: "1234",
      oobi: `${oobiPrefix}test?name=alias&groupId=1234`,
    });
  });

  test("should throw if oobi is not resolving and we explicitly wait for completion", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    jest.spyOn(Date.prototype, "getTime").mockReturnValueOnce(0);
    await expect(
      connectionService.resolveOobi(`${oobiPrefix}${failUuid}`, true)
    ).rejects.toThrowError(ConnectionService.FAILED_TO_RESOLVE_OOBI);
  });

  test("Should throw error when KERIA is offline", async () => {
    await expect(
      connectionService.getConnectionById("id")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      connectionService.deleteConnectionById("id")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      connectionService.resolveOobi("oobi-url")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(connectionService.getOobi("id")).rejects.toThrowError(
      Agent.KERIA_CONNECTION_BROKEN
    );
  });

  test("can get all connections that have multi-sig related", async () => {
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        groupId: "group-id",
        getTag: jest.fn().mockReturnValue("group-id"),
      },
    ]);
  });

  test("Should throw error if the oobi is empty", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getOobiMock.mockResolvedValue({
      oobis: [],
      done: true,
    });
    const id = "id";
    await expect(connectionService.getOobi(id)).rejects.toThrow(
      new Error(ConnectionService.CANNOT_GET_OOBI)
    );
  });

  test("Can get multi-sig oobi", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getOobiMock.mockResolvedValue({
      oobis: [
        `${oobiPrefix}oobi/EEGLKCqm1pENLuh9BW9EsbBxGnP0Pk8NMJ7_48Y_C3-6/agent/EJaQVSDkDEbPVxSe55vd9v5__Hb9inN8CwSbeB5qU5L_?name=t1`,
      ],
      done: true,
    });
    getIdentifier.mockResolvedValue({
      prefix: "EEGLKCqm1pENLuh9BW9EsbBxGnP0Pk8NMJ7_48Y_C3",
      states: {},
      group: {},
    });
    const id = "id";
    const KeriOobi = await connectionService.getOobi(id);
    expect(KeriOobi).toEqual(
      `${oobiPrefix}oobi/EEGLKCqm1pENLuh9BW9EsbBxGnP0Pk8NMJ7_48Y_C3-6?name=t1`
    );
  });

  test("should emit an event to add pending operation if the oobi resolving is not completing", async () => {
    getOobiMock.mockResolvedValue({
      oobis: [],
      done: false,
    });
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);

    saveOperationPendingMock.mockResolvedValueOnce({
      id: `${oobiPrefix}${failUuid}`,
      recordType: OperationPendingRecordType.Oobi,
    });

    jest.spyOn(Date.prototype, "getTime").mockReturnValueOnce(0);
    eventEmitter.emit = jest.fn();
    await connectionService.resolveOobi(`${oobiPrefix}${failUuid}`, false);
  });

  test("Can delete stale local connection", async () => {
    const connectionId = "connection-id";
    await connectionService.deleteStaleLocalConnectionById(connectionId);
    expect(connectionStorage.deleteById).toBeCalledWith(connectionId);
  });

  test("connection exists in the database but not on Signify", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    contactGetMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );
    await expect(
      connectionService.getConnectionById("id")
    ).rejects.toMatchObject(
      new Error(`${Agent.MISSING_DATA_ON_KERIA}: id`, {
        cause: "request - 404 - SignifyClient message",
      })
    );
  });

  test("Can get connection pending deletion keri", async () => {
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValueOnce([
      {
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        groupId: "group-id",
        getTag: jest.fn().mockReturnValue("group-id"),
        pendingDeletion: true,
      },
    ]);
    expect(
      await connectionService.getConnectionsPendingDeletion()
    ).toMatchObject([contacts[0].id]);
    expect(connectionStorage.findAllByQuery).toBeCalledTimes(1);
  });

  test("Should mark connection is pending when start delete connection", async () => {
    const connectionProps = {
      id: contacts[0].id,
      createdAt: now,
      alias: "keri",
      getTag: jest.fn(),
    };

    connectionStorage.findById = jest
      .fn()
      .mockResolvedValueOnce(connectionProps);
    eventEmitter.emit = jest.fn();

    await connectionService.markConnectionPendingDelete(contacts[0].id);

    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.ConnectionRemoved,
      payload: {
        connectionId: contacts[0].id,
      },
    });
    expect(connectionStorage.update).toBeCalledWith(connectionProps);
  });

  test("Should return when result find connection by id is empty", async () => {
    connectionStorage.findById = jest.fn().mockResolvedValueOnce(undefined);

    await connectionService.markConnectionPendingDelete(contacts[0].id);

    expect(connectionStorage.update).not.toBeCalled();
  });

  test("Can delete connection by id if keria throw error 404 when delete contact", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    deleteContactMock = jest
      .fn()
      .mockRejectedValue(new Error("request - 404 - SignifyClient message"));

    await connectionService.deleteConnectionById(contacts[0].id);
    expect(connectionStorage.deleteById).toBeCalledWith(contacts[0].id);
  });

  test("Throws error if keria throw error with a non-404 error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);

    const error = new Error("Some other error - 500");
    deleteContactMock.mockRejectedValueOnce(error);

    await expect(
      connectionService.deleteConnectionById(contacts[0].id)
    ).rejects.toThrow("Some other error - 500");
  });
  test("can get connection by id", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionNote = {
      id: "note:id",
      title: "title",
      message: "message",
    };
    const mockHistoryIpexMessage = {
      id: "id",
      credentialType: "lei",
      historyType: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
      type: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
      dt: new Date().toISOString(),
      connectionId: "connectionId",
    };
    const mockHistoryRevokeMessage = {
      id: "id",
      credentialType: "lei",
      historyType: ConnectionHistoryType.CREDENTIAL_REVOKED,
      type: ConnectionHistoryType.CREDENTIAL_REVOKED,
      dt: new Date().toISOString(),
      connectionId: "connectionId",
    };

    contactGetMock = jest.fn().mockReturnValue(
      Promise.resolve({
        alias: "alias",
        oobi: "oobi",
        id: "id",
        [`${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
          JSON.stringify(connectionNote),
        [`${KeriaContactKeyPrefix.HISTORY_IPEX}id`]: JSON.stringify(
          mockHistoryIpexMessage
        ),
        [`${KeriaContactKeyPrefix.HISTORY_REVOKE}id`]: JSON.stringify(
          mockHistoryRevokeMessage
        ),
        createdAt: nowISO,
      })
    );

    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      createdAtUTC: now,
      alias: "keri",
      oobi: "oobi",
      groupId: "group-id",
      getTag: jest.fn().mockReturnValue("group-id"),
    });

    expect(await connectionService.getConnectionById("id")).toEqual({
      id: "id",
      label: "alias",
      serviceEndpoints: ["oobi"],
      status: ConnectionStatus.CONFIRMED,
      createdAtUTC: nowISO,
      notes: [connectionNote],
      historyItems: [mockHistoryIpexMessage, mockHistoryRevokeMessage].map(
        (item) => ({
          id: item.id,
          type: item.historyType,
          timestamp: item.dt,
          credentialType: item.credentialType,
        })
      ),
    });
  });

  test("Can get pending connection", async () => {
    connectionStorage.findAllByQuery = jest.fn().mockResolvedValueOnce([
      {
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        groupId: "group-id",
        getTag: jest.fn().mockReturnValue("group-id"),
        creationStatus: CreationStatus.PENDING,
      },
    ]);

    const result = await connectionService.getConnectionsPending();

    expect(connectionStorage.findAllByQuery).toHaveBeenCalledWith({
      creationStatus: CreationStatus.PENDING,
      groupId: undefined,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: contacts[0].id,
        createdAt: now,
        alias: "keri",
        oobi: "oobi",
        groupId: "group-id",
        creationStatus: CreationStatus.PENDING,
      }),
    ]);
  });

  test("Should retrieve pending deletions and delete each by ID", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    connectionService.deleteConnectionById = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    connectionService.getConnectionsPendingDeletion = jest
      .fn()
      .mockResolvedValueOnce(["id1", "id2"]);
    const result = await connectionService.removeConnectionsPendingDeletion();

    expect(connectionService.deleteConnectionById).toHaveBeenCalledWith("id1");
    expect(connectionService.deleteConnectionById).toHaveBeenCalledWith("id2");
    expect(result).toEqual(["id1", "id2"]);
  });

  test("Should retrieve pending connections and resolve each OOBI", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const resolveOobiResultMock = {
      response: { i: "url", dt: now },
      name: "url",
      alias: "0ADQpus-mQmmO4mgWcT3ekDz",
      done: true,
      metadata: {
        oobi: `${oobiPrefix}${failUuid}`,
      },
    };

    connectionService.getConnectionsPending = jest
      .fn()
      .mockResolvedValue([{ oobi: "oobi1" }, { oobi: "oobi2" }]);

    connectionService.resolveOobi = jest
      .fn()
      .mockResolvedValue(resolveOobiResultMock)
      .mockResolvedValue(resolveOobiResultMock);

    await connectionService.resolvePendingConnections();

    expect(connectionService.resolveOobi).toBeCalledWith("oobi1");
    expect(connectionService.resolveOobi).toBeCalledWith("oobi2");
  });

  test("should return full history when full=true including IPEX_AGREE_COMPLETE", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionNote = {
      id: "note:id",
      title: "title",
      message: "message",
    };

    const mockHistoryItems = [
      {
        id: "ipex1",
        credentialType: "lei",
        historyType: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
        type: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
        dt: "2025-02-25T10:00:00.000Z",
        connectionId: "connectionId",
      },
      {
        id: "cred1",
        credentialType: "lei",
        historyType: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
        type: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
        dt: "2025-02-25T09:00:00.000Z",
        connectionId: "connectionId",
      },
    ];

    contactGetMock.mockResolvedValue({
      alias: "alias",
      oobi: "http://test.oobi",
      id: "test-id",
      [`${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
        JSON.stringify(connectionNote),
      [`${KeriaContactKeyPrefix.HISTORY_IPEX}ipex1`]: JSON.stringify(
        mockHistoryItems[0]
      ),
      [`${KeriaContactKeyPrefix.HISTORY_IPEX}cred1`]: JSON.stringify(
        mockHistoryItems[1]
      ),
      createdAt: nowISO,
    });

    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi",
      getTag: jest.fn(),
    });

    const result = await connectionService.getConnectionById("test-id", true);

    expect(result).toEqual({
      id: "test-id",
      label: "alias",
      serviceEndpoints: ["http://test.oobi"],
      status: ConnectionStatus.CONFIRMED,
      createdAtUTC: nowISO,
      notes: [connectionNote],
      historyItems: [
        {
          id: "ipex1",
          type: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
          timestamp: "2025-02-25T10:00:00.000Z",
          credentialType: "lei",
        },
        {
          id: "cred1",
          type: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
          timestamp: "2025-02-25T09:00:00.000Z",
          credentialType: "lei",
        },
      ],
    });
    expect(result.historyItems).toHaveLength(2);
    expect(
      result.historyItems.some(
        (item) => item.type === ConnectionHistoryType.IPEX_AGREE_COMPLETE
      )
    ).toBe(true);
  });

  test("should filter out IPEX_AGREE_COMPLETE when full=false", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionNote = {
      id: "note:id",
      title: "title",
      message: "message",
    };

    const mockHistoryItems: ConnectionHistoryItem[] = [
      {
        id: "ipex1",
        credentialType: "lei",
        historyType: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
        dt: "2025-02-25T10:00:00.000Z",
        connectionId: "connectionId",
      },
      {
        id: "cred1",
        credentialType: "lei",
        historyType: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
        dt: "2025-02-25T09:00:00.000Z",
        connectionId: "connectionId",
      },
    ];

    contactGetMock.mockResolvedValue({
      alias: "alias",
      oobi: "http://test.oobi",
      id: "test-id",
      [`${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
        JSON.stringify(connectionNote),
      [`${KeriaContactKeyPrefix.HISTORY_IPEX}ipex1`]: JSON.stringify(
        mockHistoryItems[0]
      ),
      [`${KeriaContactKeyPrefix.HISTORY_IPEX}cred1`]: JSON.stringify(
        mockHistoryItems[1]
      ),
      createdAt: nowISO,
    });

    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi",
      getTag: jest.fn(),
    });

    const result = await connectionService.getConnectionById("test-id", false);

    expect(result).toEqual({
      id: "test-id",
      label: "alias",
      serviceEndpoints: ["http://test.oobi"],
      status: ConnectionStatus.CONFIRMED,
      createdAtUTC: nowISO,
      notes: [connectionNote],
      historyItems: [
        {
          id: "cred1",
          type: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
          timestamp: "2025-02-25T09:00:00.000Z",
          credentialType: "lei",
        },
      ],
    });
    expect(result.historyItems).toHaveLength(1);
    expect(
      result.historyItems.some(
        (item) => item.type === ConnectionHistoryType.IPEX_AGREE_COMPLETE
      )
    ).toBe(false);
  });

  test("Can share an identifier with a connection", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    connectionStorage.findById.mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi",
    });
    identifierStorage.getIdentifierMetadata.mockResolvedValue({
      displayName: "Alice",
    });
    identifierStorage.getIdentifierMetadata.mockResolvedValue(individualRecord);
    getOobiMock.mockImplementation((name: string) => {
      return {
        oobis: [`${oobiPrefix}${name}`],
        done: true,
      };
    });
    signifyClient.oobis().get = jest.fn().mockImplementation((name: string) => {
      return `${oobiPrefix}${name}`;
    });

    await connectionService.shareIdentifier("connectionId", "ourIdentifier");

    expect(submitRpyMock.mock.calls[0][0]).toBe("connectionId");
    const rpyIms: string = submitRpyMock.mock.calls[0][1];
    expect(rpyIms.includes("/introduce"));
    expect(rpyIms.includes("\"http://oobi.com/oobi/ourIdentifier?name=Alice\""));
  });

  test("Shared identifier OOBIs carry over the external ID hint", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    connectionStorage.findById.mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi?name=Bob&externalId=test123&randomQueryParam=random",
    });
    identifierStorage.getIdentifierMetadata.mockResolvedValue({
      displayName: "Alice",
    });
    identifierStorage.getIdentifierMetadata.mockResolvedValue(individualRecord);
    getOobiMock.mockImplementation((name: string) => {
      return {
        oobis: [`${oobiPrefix}${name}`],
        done: true,
      };
    });
    signifyClient.oobis().get = jest.fn().mockImplementation((name: string) => {
      return `${oobiPrefix}${name}`;
    });

    await connectionService.shareIdentifier("connectionId", "ourIdentifier");

    expect(submitRpyMock.mock.calls[0][0]).toBe("connectionId");
    const rpyIms: string = submitRpyMock.mock.calls[0][1];
    expect(rpyIms.includes("/introduce"));
    expect(
      rpyIms.includes(
        "\"http://oobi.com/oobi/ourIdentifier?name=Alice&externalId=test123\""
      )
    );
  });

  test("Can get details of a human readable message", async () => {
    getExchangeMock.mockResolvedValue(humanReadableExn);
    expect(
      await connectionService.getHumanReadableMessage("message-said")
    ).toEqual({
      t: "Certificate created",
      st: "Everything is now fully signed",
      c: ["First paragraph", "Second paragraph"],
      l: undefined,
    });
  });

  test("Can get details of a human readable message with a link", async () => {
    getExchangeMock.mockResolvedValue(humanReadableLinkedExn);
    expect(
      await connectionService.getHumanReadableMessage("message-said")
    ).toEqual({
      t: "Certificate created",
      st: "Everything is now fully signed",
      c: ["First paragraph", "Second paragraph"],
      l: {
        t: "View certificate",
        a: "http://test.com",
      },
    });
  });
});
