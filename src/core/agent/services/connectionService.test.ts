/**
 * @jest-environment node
 */
// @TODO - foconnor: Core tests should likely all be on node, so we can stop mocking Signify-TS/libsodium.

import { ready } from "signify-ts";
import { ConnectionStatus, CreationStatus, OobiType } from "../agent.types";
import { ConnectionService } from "./connectionService";
import { StorageMessage } from "../../storage/storage.types";
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
const errorUuid = "error-uuid";
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
      if (id === `${oobiPrefix}${errorUuid}`) {
        return {
          done: true,
          error: "OOBI resolution failed",
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
      if (name === `${oobiPrefix}${errorUuid}`) {
        return {
          done: true,
          error: "OOBI resolution failed",
          name,
          metadata: {
            oobi: `${oobiPrefix}${errorUuid}`,
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

const connectionPairStorage = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findExpectedById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const contactStorage = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  deleteByIdIfExists: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
  findExpectedById: jest.fn(),
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
  getAllIdentifiers: jest.fn(),
});

const basicStorage = jest.mocked({
  findExpectedById: jest.fn(),
});

const connectionService = new ConnectionService(
  agentServicesProps,
  credentialStorage as any,
  operationPendingStorage as any,
  identifierStorage as any,
  basicStorage as any,
  connectionPairStorage as any,
  contactStorage as any
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
        contactId: "id",
        label: alias,
        oobi: oobi,
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        ),
      },
    });
    expect(contactStorage.save).toBeCalledWith({
      id: "id",
      alias,
      oobi,
      groupId,
      createdAt: expect.any(Date),
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

    expect(contactStorage.save).toBeCalledWith({
      id: connectionId,
      alias,
      oobi,
      groupId,
      createdAt: expect.any(Date),
    });
  });

  test("Should throw an error if invalid OOBI URL format", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    let invalidUrls = [
      "https://localhost/oobi",
      "https://localhost/oobi/1234/agent/eid/extra",
      "https://localhost/.well-known/keri/oobi/",
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
      "https://localhost/oobi/1234/another/eid",
    ];

    for (const url of invalidUrls) {
      await expect(
        connectionService.resolveOobi(url, true)
      ).rejects.toThrowError(new Error(ConnectionService.OOBI_INVALID));
    }
  });

  test("Should create connection and resolveOOBI with valid URL format", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    let validUrls = [
      "https://localhost/oobi/1234/agent?name=alias",
      "https://localhost/oobi/1234/agent/5678?name=alias",
      "https://localhost/oobi/1234/controller?name=alias",
      "https://localhost/oobi/1234/mailbox/5678?name=alias",
      "https://localhost/oobi/1234/witness?name=alias",
      "https://localhost/oobi/1234/witness/5678?name=alias",
      "https://localhost/.well-known/keri/oobi/1234?name=alias",
      "https://localhost/oobi/1234?name=alias",
    ];

    global.fetch = jest.fn().mockResolvedValue({
      headers: {
        get: jest.fn().mockReturnValue("application/json+cesr"),
      },
    });

    for (const url of validUrls) {
      await connectionService.connectByOobiUrl(url, "shared-identifier");
      expect(contactStorage.save).toBeCalledWith(
        expect.objectContaining({
          alias: "alias",
          id: "1234",
          oobi: url,
        })
      );
      expect(connectionPairStorage.save).toBeCalledWith(
        expect.objectContaining({
          contactId: "1234",
          creationStatus: CreationStatus.PENDING,
          pendingDeletion: false,
        })
      );
    }

    const invalidDoobi = "https://localhost/oobi/1234?name=alias";
    global.fetch = jest.fn().mockResolvedValue({
      headers: {
        get: jest.fn().mockReturnValue("text/html"),
      },
    });

    await expect(
      connectionService.connectByOobiUrl(invalidDoobi, "shared-identifier")
    ).rejects.toThrowError(
      new Error(ConnectionService.INVALID_DOOBI_CONNECTION_CONTENT_TYPE)
    );

    validUrls = [
      "https://localhost/oobi/1234/agent?name=alias",
      "https://localhost/oobi/1234/witness?name=alias",
      "https://localhost/oobi/1234/controller?name=alias",
      "https://localhost/oobi/1234/mailbox/5678?name=alias",
      "https://localhost/.well-known/keri/oobi/1234?name=alias",
      "https://localhost/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao?name=alias",
    ];

    signifyClient.operations().get = jest
      .fn()
      .mockResolvedValue({ done: true });
    for (const url of validUrls) {
      const op = await connectionService.resolveOobi(url, true);
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

  test("Should throw error when creating normal connection without shared identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const normalConnectionUrl = "https://localhost/oobi/1234/agent?name=alias";

    await expect(
      connectionService.connectByOobiUrl(normalConnectionUrl)
    ).rejects.toThrowError(
      new Error(ConnectionService.NORMAL_CONNECTIONS_REQUIRE_SHARED_IDENTIFIER)
    );
  });

  test("Can mark an identifier to share when creating a connection", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const url = "https://localhost/oobi/1234/agent?name=alias";
    identifierStorage.getIdentifierMetadata.mockResolvedValue({
      displayName: "TestUser",
    });

    await connectionService.connectByOobiUrl(url, individualRecord.id);

    expect(contactStorage.save).toBeCalledWith(
      expect.objectContaining({
        alias: "alias",
        id: "1234",
        oobi: url,
      })
    );
    expect(connectionPairStorage.save).toBeCalledWith(
      expect.objectContaining({
        contactId: "1234",
        identifier: individualRecord.id,
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false,
      })
    );
  });

  test("can get all connections and multi-sig related ones are filtered", async () => {
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: contacts[0].id,
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: "test-identifier-1",
      },
      {
        contactId: contacts[0].id,
        createdAt: now,
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false,
        identifier: "test-identifier-2",
      },
    ]);

    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "keri",
      oobi: "oobi",
    });

    expect(await connectionService.getConnections()).toEqual([
      {
        id: contacts[0].id,
        label: "keri",
        oobi: "oobi",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
        contactId: contacts[0].id,
        identifier: "test-identifier-1",
      },
      {
        id: contacts[0].id,
        label: "keri",
        oobi: "oobi",
        status: ConnectionStatus.PENDING,
        createdAtUTC: expect.any(String),
        contactId: contacts[0].id,
        identifier: "test-identifier-2",
      },
    ]);
    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      pendingDeletion: false,
    });
  });

  test("can get connections filtered by identifier", async () => {
    const targetIdentifier = "specific-identifier";
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: contacts[0].id,
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: targetIdentifier,
      },
    ]);

    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "filtered-contact",
      oobi: "oobi-filtered",
    });

    const result = await connectionService.getConnections(targetIdentifier);

    expect(result).toEqual([
      {
        id: contacts[0].id,
        label: "filtered-contact",
        oobi: "oobi-filtered",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
        contactId: contacts[0].id,
        identifier: targetIdentifier,
      },
    ]);
    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      pendingDeletion: false,
      identifier: targetIdentifier,
    });
  });

  test("efficiently handles multiple connection pairs with same contact (contact record map)", async () => {
    const sharedContactId = "shared-contact-id";
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: sharedContactId,
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: "identifier-1",
      },
      {
        contactId: sharedContactId,
        createdAt: now,
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false,
        identifier: "identifier-2",
      },
      {
        contactId: sharedContactId,
        createdAt: now,
        creationStatus: CreationStatus.FAILED,
        pendingDeletion: false,
        identifier: "identifier-3",
      },
    ]);

    const sharedContact = {
      id: sharedContactId,
      alias: "shared-contact",
      oobi: "shared-oobi",
    };
    contactStorage.findExpectedById = jest
      .fn()
      .mockResolvedValue(sharedContact);

    const result = await connectionService.getConnections();

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      {
        id: sharedContactId,
        label: "shared-contact",
        oobi: "shared-oobi",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
        contactId: sharedContactId,
        identifier: "identifier-1",
      },
      {
        id: sharedContactId,
        label: "shared-contact",
        oobi: "shared-oobi",
        status: ConnectionStatus.PENDING,
        createdAtUTC: expect.any(String),
        contactId: sharedContactId,
        identifier: "identifier-2",
      },
      {
        id: sharedContactId,
        label: "shared-contact",
        oobi: "shared-oobi",
        status: ConnectionStatus.FAILED,
        createdAtUTC: expect.any(String),
        contactId: sharedContactId,
        identifier: "identifier-3",
      },
    ]);
    // Contact should only be fetched once due to contact record map
    expect(contactStorage.findExpectedById).toHaveBeenCalledTimes(1);
    expect(contactStorage.findExpectedById).toHaveBeenCalledWith(
      sharedContactId
    );
  });

  test("handles connections with multisig groupId", async () => {
    const groupId = "multisig-group-123";
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: "multisig-contact-id",
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: "multisig-identifier",
      },
    ]);

    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: "multisig-contact-id",
      alias: "multisig-contact",
      oobi: "multisig-oobi",
      groupId: groupId,
    });

    const result = await connectionService.getConnections();

    expect(result).toEqual([
      {
        id: "multisig-contact-id",
        label: "multisig-contact",
        oobi: "multisig-oobi",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
        contactId: "multisig-contact-id",
        groupId: groupId,
      },
    ]);
  });

  test("returns empty array when no connection pairs found", async () => {
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([]);

    const result = await connectionService.getConnections();

    expect(result).toEqual([]);
    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      pendingDeletion: false,
    });
    expect(contactStorage.findExpectedById).not.toHaveBeenCalled();
  });

  test("filters out pending deletion connections", async () => {
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: contacts[0].id,
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: "active-identifier",
      },
    ]);

    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "active-contact",
      oobi: "active-oobi",
    });

    await connectionService.getConnections();

    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      pendingDeletion: false,
    });
  });

  test("handles mixed connection statuses correctly", async () => {
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        contactId: "contact-1",
        createdAt: now,
        creationStatus: CreationStatus.COMPLETE,
        pendingDeletion: false,
        identifier: "complete-identifier",
      },
      {
        contactId: "contact-2",
        createdAt: now,
        creationStatus: CreationStatus.PENDING,
        pendingDeletion: false,
        identifier: "pending-identifier",
      },
      {
        contactId: "contact-3",
        createdAt: now,
        creationStatus: CreationStatus.FAILED,
        pendingDeletion: false,
        identifier: "failed-identifier",
      },
    ]);

    contactStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce({
        id: "contact-1",
        alias: "complete-contact",
        oobi: "complete-oobi",
      })
      .mockResolvedValueOnce({
        id: "contact-2",
        alias: "pending-contact",
        oobi: "pending-oobi",
      })
      .mockResolvedValueOnce({
        id: "contact-3",
        alias: "failed-contact",
        oobi: "failed-oobi",
      });

    const result = await connectionService.getConnections();

    expect(result).toEqual([
      {
        id: "contact-1",
        label: "complete-contact",
        oobi: "complete-oobi",
        status: ConnectionStatus.CONFIRMED,
        createdAtUTC: expect.any(String),
        contactId: "contact-1",
        identifier: "complete-identifier",
      },
      {
        id: "contact-2",
        label: "pending-contact",
        oobi: "pending-oobi",
        status: ConnectionStatus.PENDING,
        createdAtUTC: expect.any(String),
        contactId: "contact-2",
        identifier: "pending-identifier",
      },
      {
        id: "contact-3",
        label: "failed-contact",
        oobi: "failed-oobi",
        status: ConnectionStatus.FAILED,
        createdAtUTC: expect.any(String),
        contactId: "contact-3",
        identifier: "failed-identifier",
      },
    ]);
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
    contactStorage.findAllByQuery = jest.fn().mockResolvedValue([metadata]);
    expect(await connectionService.getMultisigConnections()).toEqual([
      {
        id: metadata.id,
        label: metadata.alias,
        createdAtUTC: metadata.createdAt.toISOString(),
        status: ConnectionStatus.CONFIRMED,
        oobi: metadata.oobi,
        groupId: metadata.groupId,
        contactId: metadata.id,
      },
    ]);
    expect(contactStorage.findAllByQuery).toHaveBeenCalledWith({
      $not: {
        groupId: undefined,
      },
    });
  });

  test("can save connection note with generic records", async () => {
    const connectionId = "connectionId";
    const identifier = "test-identifier";
    const note = {
      title: "title",
      message: "message",
    };

    await connectionService.createConnectionNote(
      connectionId,
      note,
      identifier
    );

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
    const identifier = "test-identifier";
    await connectionService.deleteConnectionNoteById(
      connectionId,
      connectionNoteId,
      identifier
    );
    expect(updateContactMock).toBeCalledWith(connectionId, {
      [`${identifier}:${connectionNoteId}`]: null,
    });
  });

  test("can update connection note by id", async () => {
    const connectionToUpdate = {
      id: "note:id",
      title: "title",
      message: "message",
    };
    const connectionId = "connectionId";
    const identifier = "test-identifier";

    await connectionService.updateConnectionNoteById(
      connectionId,
      connectionToUpdate.id,
      connectionToUpdate,
      identifier
    );
    expect(updateContactMock).toBeCalledWith(connectionId, {
      [`${identifier}:note:id`]: JSON.stringify(connectionToUpdate),
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

    const oobi = await connectionService.getOobi(id, {
      alias: "alias with spaces",
    });

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
    const KeriOobi = await connectionService.getOobi(id, {
      alias: "alias",
      groupId: "123",
    });
    expect(KeriOobi).toEqual(`${oobiPrefix}${id}?name=alias&groupId=123`);
  });

  test("can get connection short details by id", async () => {
    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "keri",
      oobi: "test-oobi",
      groupId: "test-group",
      createdAt: now,
      creationStatus: CreationStatus.COMPLETE,
    });
    expect(
      await connectionService.getConnectionShortDetailById(contacts[0].id)
    ).toMatchObject({
      id: contacts[0].id,
      createdAtUTC: nowISO,
      label: "keri",
      status: ConnectionStatus.CONFIRMED,
      groupId: "test-group",
    });
    expect(contactStorage.findExpectedById).toBeCalledWith(contacts[0].id);
  });

  test("can get connection short details by id with identifier", async () => {
    const identifier = "test-identifier";
    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "keri",
      oobi: "test-oobi",
      // No groupId for regular connections
    });
    connectionPairStorage.findExpectedById = jest.fn().mockResolvedValue({
      contactId: contacts[0].id,
      identifier,
      createdAt: now,
      creationStatus: CreationStatus.COMPLETE,
      pendingDeletion: false,
    });

    expect(
      await connectionService.getConnectionShortDetailById(
        contacts[0].id,
        identifier
      )
    ).toMatchObject({
      id: contacts[0].id,
      createdAtUTC: nowISO,
      label: "keri",
      status: ConnectionStatus.CONFIRMED,
      identifier,
    });
    expect(contactStorage.findExpectedById).toBeCalledWith(contacts[0].id);
    expect(connectionPairStorage.findExpectedById).toBeCalledWith(
      `${identifier}:${contacts[0].id}`
    );
  });

  test("can get connection short details by id without identifier (multisig)", async () => {
    const groupId = "test-group";
    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "multisig-contact",
      oobi: "test-multisig-oobi",
      groupId,
      createdAt: now,
      creationStatus: CreationStatus.COMPLETE,
    });

    expect(
      await connectionService.getConnectionShortDetailById(contacts[0].id)
    ).toMatchObject({
      id: contacts[0].id,
      createdAtUTC: nowISO,
      label: "multisig-contact",
      status: ConnectionStatus.CONFIRMED,
      groupId,
    });
    expect(contactStorage.findExpectedById).toBeCalledWith(contacts[0].id);
  });

  test("cannot get connection short details if contact does not exist", async () => {
    contactStorage.findExpectedById = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG)
      );
    await expect(
      connectionService.getConnectionShortDetailById(contacts[0].id)
    ).rejects.toThrowError(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);
  });

  test("cannot get connection short details if connection pair does not exist", async () => {
    const identifier = "test-identifier";
    contactStorage.findExpectedById = jest.fn().mockResolvedValue({
      id: contacts[0].id,
      alias: "keri",
      oobi: "test-oobi",
    });
    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG)
      );

    await expect(
      connectionService.getConnectionShortDetailById(contacts[0].id, identifier)
    ).rejects.toThrowError(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);
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

  test("Should sync unsynced KERI contacts and their connection pairs", async () => {
    const DATE = new Date();
    const localIdentifier = {
      id: "EP48HXCPvtzGu0c90gG9fkOYiSoi6U5Am-XaqcoNHTBl",
    };
    const cloudContacts = [
      {
        id: "EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR",
        alias: "MyFirstContact",
        oobi: "http://oobi.com/1",
        groupCreationId: "group-id",
        createdAt: DATE.toISOString(),
        "EP48HXCPvtzGu0c90gG9fkOYiSoi6U5Am-XaqcoNHTBl:createdAt":
          DATE.toISOString(),
      },
      {
        id: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
        alias: "MySecondContact",
        oobi: "http://oobi.com/2",
        createdAt: DATE.toISOString(),
      },
    ];

    contactListMock.mockReturnValue(cloudContacts);
    contactStorage.findById = jest.fn().mockResolvedValue(null);
    connectionPairStorage.findById = jest.fn().mockResolvedValue(null);

    await connectionService.syncKeriaContacts();

    expect(contactStorage.save).toBeCalledTimes(2);
    expect(contactStorage.save).toHaveBeenCalledWith({
      id: "EBaDnyriYK_FAruigHO42avVN40fOlVSUxpxXJ1fNxFR",
      alias: "MyFirstContact",
      createdAt: DATE,
      oobi: "http://oobi.com/1",
      groupId: "group-id",
    });

    expect(connectionPairStorage.save).toBeCalledTimes(1);
    expect(connectionPairStorage.save).toHaveBeenCalledWith({
      id: `${localIdentifier.id}:${cloudContacts[0].id}`,
      contactId: cloudContacts[0].id,
      identifier: localIdentifier.id,
      creationStatus: CreationStatus.COMPLETE,
      pendingDeletion: false,
      createdAt: DATE,
    });
  });

  test("should restore connection pairs from a cloud contact in multiple profiles", async () => {
    const localIdentifier = { id: "Eabc123" };
    const anotherLocalIdentifier = { id: "Fdef456" };
    identifierStorage.getAllIdentifiers = jest
      .fn()
      .mockResolvedValue([localIdentifier, anotherLocalIdentifier]);

    const cloudContact = {
      id: "Dcontact1",
      alias: "Test Contact",
      oobi: "http://oobi.com/Dcontact1",
      createdAt: "2025-01-01T00:00:00.000Z",
      "Eabc123:createdAt": "2025-01-02T00:00:00.000Z",
      "Fdef456:createdAt": "2025-01-03T00:00:00.000Z", // This one should be ignored
    };
    contactListMock.mockReturnValue([cloudContact]);
    contactStorage.findById = jest.fn().mockResolvedValue(null);
    connectionPairStorage.findById = jest.fn().mockResolvedValue(null);

    await connectionService.syncKeriaContacts();

    expect(contactStorage.save).toHaveBeenCalledTimes(1);
    expect(contactStorage.save).toHaveBeenCalledWith({
      id: "Dcontact1",
      alias: "Test Contact",
      oobi: "http://oobi.com/Dcontact1",
      groupId: undefined,
      createdAt: expect.any(Date),
    });
    expect(connectionPairStorage.save).toHaveBeenCalledTimes(2);
    expect(connectionPairStorage.save).toHaveBeenCalledWith({
      id: "Eabc123:Dcontact1",
      contactId: "Dcontact1",
      identifier: "Eabc123",
      creationStatus: CreationStatus.COMPLETE,
      pendingDeletion: false,
      createdAt: expect.any(Date),
    });
    expect(connectionPairStorage.save).toHaveBeenCalledWith({
      id: "Fdef456:Dcontact1",
      contactId: "Dcontact1",
      identifier: "Fdef456",
      creationStatus: CreationStatus.COMPLETE,
      pendingDeletion: false,
      createdAt: expect.any(Date),
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
    contactStorage.findAllByQuery = jest.fn().mockResolvedValue([metadata]);
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
        contactId: metadata.id,
      },
    ]);
    expect(contactStorage.findAllByQuery).toHaveBeenCalledWith({
      groupId,
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

    const op = await connectionService.resolveOobi(url, true);
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

    const op = await connectionService.resolveOobi(url, true);

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
    const op = await connectionService.resolveOobi(url, true);
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
      version: "1.2.0.1",
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

  test("should throw if oobi resolves with operation.error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    jest.spyOn(Date.prototype, "getTime").mockReturnValueOnce(0);
    await expect(
      connectionService.resolveOobi(`${oobiPrefix}${errorUuid}`, true)
    ).rejects.toThrowError(
      `${ConnectionService.FAILED_TO_RESOLVE_OOBI} [url: ${oobiPrefix}${errorUuid}] - OOBI resolution failed`
    );
  });

  test("Should throw error when KERIA is offline", async () => {
    await expect(
      connectionService.getConnectionById("id")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      connectionService.deleteConnectionByIdAndIdentifier("id", "identifier")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      connectionService.resolveOobi("oobi-url", true)
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
      `${oobiPrefix}oobi/EEGLKCqm1pENLuh9BW9EsbBxGnP0Pk8NMJ7_48Y_C3-6/agent?name=t1`
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

  test("Can delete stale local connection with identifier", async () => {
    const connectionId = "connection-id";
    const identifier = "test-identifier";

    // Mock that remaining pairs exist, so contact should NOT be deleted
    connectionPairStorage.findAllByQuery.mockResolvedValue([
      { id: "other-pair", contactId: connectionId },
    ]);

    await connectionService.deleteStaleLocalConnectionById(
      connectionId,
      identifier
    );

    expect(connectionPairStorage.deleteById).toBeCalledWith(
      `${identifier}:${connectionId}`
    );
    expect(connectionPairStorage.findAllByQuery).toBeCalledWith({
      contactId: connectionId,
    });
    expect(contactStorage.deleteById).not.toBeCalled();
  });

  test("Can delete stale local connection and contact if last pair", async () => {
    const connectionId = "connection-id";
    const identifier = "test-identifier";

    // Mock no remaining pairs, so contact should be deleted
    connectionPairStorage.findAllByQuery.mockResolvedValue([]);

    await connectionService.deleteStaleLocalConnectionById(
      connectionId,
      identifier
    );

    expect(connectionPairStorage.deleteById).toBeCalledWith(
      `${identifier}:${connectionId}`
    );
    expect(connectionPairStorage.findAllByQuery).toBeCalledWith({
      contactId: connectionId,
    });
    expect(contactStorage.deleteById).toBeCalledWith(connectionId);
  });

  test("Can delete stale local connection but preserve contact if other pairs exist", async () => {
    const connectionId = "connection-id";
    const identifier = "test-identifier";

    // Mock remaining pairs exist, so contact should NOT be deleted
    connectionPairStorage.findAllByQuery.mockResolvedValue([
      { id: "other-pair", contactId: connectionId },
    ]);

    await connectionService.deleteStaleLocalConnectionById(
      connectionId,
      identifier
    );

    expect(connectionPairStorage.deleteById).toBeCalledWith(
      `${identifier}:${connectionId}`
    );
    expect(connectionPairStorage.findAllByQuery).toBeCalledWith({
      contactId: connectionId,
    });
    expect(contactStorage.deleteById).not.toBeCalled();
  });

  test("connection exists in the database but not on Signify", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    contactGetMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );
    await expect(connectionService.getConnectionById("id")).rejects.toThrow(
      `${Agent.MISSING_DATA_ON_KERIA}: id`
    );
  });

  test("Can get connection pending deletion keri", async () => {
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValueOnce([
      {
        contactId: contacts[0].id,
        identifier: "test-identifier",
        createdAt: now,
        pendingDeletion: true,
      },
    ]);
    const result = await connectionService.getConnectionsPendingDeletion();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      contactId: contacts[0].id,
      identifier: "test-identifier",
      pendingDeletion: true,
    });
    expect(connectionPairStorage.findAllByQuery).toBeCalledTimes(1);
  });

  test("Should mark connection is pending when start delete connection", async () => {
    const connectionPairProps = {
      id: `test-identifier:${contacts[0].id}`,
      contactId: contacts[0].id,
      identifier: "test-identifier",
      createdAt: now,
      pendingDeletion: false,
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPairProps);
    eventEmitter.emit = jest.fn();

    await connectionService.markConnectionPendingDelete(
      contacts[0].id,
      "test-identifier"
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.ConnectionRemoved,
      payload: {
        contactId: contacts[0].id,
        identifier: "test-identifier",
      },
    });
    expect(connectionPairStorage.update).toBeCalledWith({
      ...connectionPairProps,
      pendingDeletion: true,
    });
  });

  test("Should throw error when connection pair not found for marking pending delete", async () => {
    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG)
      );

    await expect(
      connectionService.markConnectionPendingDelete(
        contacts[0].id,
        "test-identifier"
      )
    ).rejects.toThrowError(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);

    expect(connectionPairStorage.findExpectedById).toBeCalledWith(
      "test-identifier:" + contacts[0].id
    );
  });

  test("Should throw error when connection pair does not exist", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG)
      );

    await expect(
      connectionService.deleteConnectionByIdAndIdentifier(
        "contact-id",
        "test-identifier"
      )
    ).rejects.toThrowError(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG);

    expect(connectionPairStorage.findExpectedById).toBeCalledWith(
      "test-identifier:contact-id"
    );
  });

  test("Should delete entire contact when deleting the last connection pair", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair]);
    deleteContactMock = jest.fn().mockResolvedValueOnce(undefined);

    await connectionService.deleteConnectionByIdAndIdentifier(
      "contact-id",
      "test-identifier"
    );

    expect(connectionPairStorage.findExpectedById).toBeCalledWith(
      "test-identifier:contact-id"
    );
    expect(connectionPairStorage.findAllByQuery).toBeCalledWith({
      contactId: "contact-id",
    });
    expect(deleteContactMock).toBeCalledWith("contact-id");
    expect(contactStorage.deleteByIdIfExists).toBeCalledWith("contact-id");
    expect(connectionPairStorage.deleteById).toBeCalledWith(connectionPair.id);
  });

  test("Should handle 404 error when deleting the last connection pair", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair]);
    deleteContactMock = jest
      .fn()
      .mockRejectedValue(new Error("request - 404 - SignifyClient message"));

    await connectionService.deleteConnectionByIdAndIdentifier(
      "contact-id",
      "test-identifier"
    );

    expect(deleteContactMock).toBeCalledWith("contact-id");
    expect(contactStorage.deleteByIdIfExists).toBeCalledWith("contact-id");
    expect(connectionPairStorage.deleteById).toBeCalledWith(connectionPair.id);
  });

  test("Should throw error when deleting last connection pair fails with non-404 error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair]);
    deleteContactMock = jest
      .fn()
      .mockRejectedValue(new Error("Some other error - 500"));

    await expect(
      connectionService.deleteConnectionByIdAndIdentifier(
        "contact-id",
        "test-identifier"
      )
    ).rejects.toThrow("Some other error - 500");

    expect(deleteContactMock).toBeCalledWith("contact-id");
    expect(contactStorage.deleteByIdIfExists).not.toBeCalled();
    expect(connectionPairStorage.deleteById).not.toBeCalled();
  });

  test("Should update contact and delete pair when there are multiple connection pairs", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };
    const otherConnectionPair = {
      id: "other-identifier:contact-id",
      contactId: "contact-id",
      identifier: "other-identifier",
    };

    const mockConnection = {
      id: "contact-id",
      alias: "test-contact",
      "test-identifier:note1": "some note",
      "test-identifier:createdAt": "2023-01-01",
      "other-identifier:note1": "other note",
      "other-identifier:createdAt": "2023-01-02",
      someOtherField: "value",
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair, otherConnectionPair]);
    contactGetMock = jest.fn().mockResolvedValueOnce(mockConnection);
    updateContactMock.mockResolvedValueOnce(undefined);

    await connectionService.deleteConnectionByIdAndIdentifier(
      "contact-id",
      "test-identifier"
    );

    expect(connectionPairStorage.findExpectedById).toBeCalledWith(
      "test-identifier:contact-id"
    );
    expect(connectionPairStorage.findAllByQuery).toBeCalledWith({
      contactId: "contact-id",
    });
    expect(contactGetMock).toBeCalledWith("contact-id");
    expect(updateContactMock).toBeCalledWith("contact-id", {
      "test-identifier:note1": null,
      "test-identifier:createdAt": null,
    });
    expect(connectionPairStorage.deleteById).toBeCalledWith(connectionPair.id);
    expect(deleteContactMock).not.toBeCalled();
    expect(contactStorage.deleteByIdIfExists).not.toBeCalled();
  });

  test("Should handle 404 error when getting contact for field removal and continue to delete the connection pair", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };
    const otherConnectionPair = {
      id: "other-identifier:contact-id",
      contactId: "contact-id",
      identifier: "other-identifier",
    };
    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair, otherConnectionPair]);
    contactGetMock = jest
      .fn()
      .mockRejectedValue(new Error("request - 404 - SignifyClient message"));

    await connectionService.deleteConnectionByIdAndIdentifier(
      "contact-id",
      "test-identifier"
    );

    expect(contactGetMock).toBeCalledWith("contact-id");
    expect(updateContactMock).not.toBeCalled();
    expect(deleteContactMock).not.toBeCalled();
    expect(contactStorage.deleteByIdIfExists).not.toBeCalled();
    expect(connectionPairStorage.deleteById).toBeCalledWith(connectionPair.id);
  });

  test("Should throw error when getting contact fails with non-404 error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: "test-identifier:contact-id",
      contactId: "contact-id",
      identifier: "test-identifier",
    };
    const otherConnectionPair = {
      id: "other-identifier:contact-id",
      contactId: "contact-id",
      identifier: "other-identifier",
    };

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair, otherConnectionPair]);
    contactGetMock = jest
      .fn()
      .mockRejectedValue(new Error("Some other error - 500"));

    await expect(
      connectionService.deleteConnectionByIdAndIdentifier(
        "contact-id",
        "test-identifier"
      )
    ).rejects.toThrow("Some other error - 500");

    expect(contactGetMock).toBeCalledWith("contact-id");
    expect(updateContactMock).not.toBeCalled();
    expect(connectionPairStorage.deleteById).not.toBeCalled();
  });

  test("Can delete connection by id if keria throws a 404 error when delete contact", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: `test-identifier:${contacts[0].id}`,
      contactId: contacts[0].id,
      identifier: "test-identifier",
    };
    deleteContactMock = jest
      .fn()
      .mockRejectedValue(new Error("request - 404 - SignifyClient message"));
    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair]);

    await connectionService.deleteConnectionByIdAndIdentifier(
      contacts[0].id,
      "test-identifier"
    );

    expect(contactStorage.deleteByIdIfExists).toBeCalledWith(contacts[0].id);
    expect(connectionPairStorage.deleteById).toBeCalledWith(connectionPair.id);
  });

  test("Throws error if keria throw error with a non-404 error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const connectionPair = {
      id: `test-identifier:${contacts[0].id}`,
      contactId: contacts[0].id,
      identifier: "test-identifier",
    };

    const error = new Error("Some other error - 500");
    deleteContactMock.mockRejectedValueOnce(error);

    connectionPairStorage.findExpectedById = jest
      .fn()
      .mockResolvedValueOnce(connectionPair);
    connectionPairStorage.findAllByQuery = jest
      .fn()
      .mockResolvedValueOnce([connectionPair]);

    await expect(
      connectionService.deleteConnectionByIdAndIdentifier(
        contacts[0].id,
        "test-identifier"
      )
    ).rejects.toThrow("Some other error - 500");

    expect(contactStorage.deleteByIdIfExists).not.toBeCalled();
    expect(connectionPairStorage.deleteById).not.toBeCalled();
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

    const sharedIdentifier = "test-shared-identifier";
    contactGetMock = jest.fn().mockReturnValue(
      Promise.resolve({
        alias: "alias",
        oobi: "oobi",
        id: "id",
        sharedIdentifier,
        [`${sharedIdentifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
          JSON.stringify(connectionNote),
        [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}id`]:
          JSON.stringify(mockHistoryIpexMessage),
        [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_REVOKE}id`]:
          JSON.stringify(mockHistoryRevokeMessage),
        [`${sharedIdentifier}:createdAt`]: nowISO,
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

    expect(
      await connectionService.getConnectionById("id", false, sharedIdentifier)
    ).toEqual({
      id: "id",
      contactId: "id",
      identifier: "test-shared-identifier",
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
    connectionPairStorage.findAllByQuery = jest.fn().mockResolvedValueOnce([
      {
        contactId: contacts[0].id,
        createdAt: now,
        creationStatus: CreationStatus.PENDING,
      },
    ]);

    contactStorage.findExpectedById = jest.fn().mockResolvedValueOnce({
      id: contacts[0].id,
      alias: "keri",
      oobi: "oobi",
      groupId: "group-id",
    });

    const result = await connectionService.getConnectionsPending();

    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      creationStatus: CreationStatus.PENDING,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: contacts[0].id,
        alias: "keri",
        oobi: "oobi",
        groupId: "group-id",
      }),
    ]);
  });

  test("Should retrieve pending deletions and delete each by ID", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    connectionService.deleteConnectionByIdAndIdentifier = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    connectionService.getConnectionsPendingDeletion = jest
      .fn()
      .mockResolvedValueOnce([
        { contactId: "id1", identifier: "identifier1" },
        { contactId: "id2", identifier: "identifier2" },
      ]);
    const result = await connectionService.removeConnectionsPendingDeletion();

    expect(
      connectionService.deleteConnectionByIdAndIdentifier
    ).toHaveBeenCalledWith("id1", "identifier1");
    expect(
      connectionService.deleteConnectionByIdAndIdentifier
    ).toHaveBeenCalledWith("id2", "identifier2");
    expect(result).toEqual([
      { contactId: "id1", identifier: "identifier1" },
      { contactId: "id2", identifier: "identifier2" },
    ]);
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

    expect(connectionService.resolveOobi).toBeCalledWith("oobi1", false);
    expect(connectionService.resolveOobi).toBeCalledWith("oobi2", false);
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

    const sharedIdentifier = "test-shared-identifier";
    contactGetMock.mockResolvedValue({
      alias: "alias",
      oobi: "http://test.oobi",
      id: "test-id",
      sharedIdentifier,
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
        JSON.stringify(connectionNote),
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}ipex1`]:
        JSON.stringify(mockHistoryItems[0]),
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}cred1`]:
        JSON.stringify(mockHistoryItems[1]),
      [`${sharedIdentifier}:createdAt`]: nowISO,
    });

    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi",
      getTag: jest.fn(),
    });

    const result = await connectionService.getConnectionById(
      "test-id",
      true,
      sharedIdentifier
    );

    expect(result).toEqual({
      id: "test-id",
      contactId: "test-id",
      identifier: "test-shared-identifier",
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

    const sharedIdentifier = "test-shared-identifier";
    contactGetMock.mockResolvedValue({
      alias: "alias",
      oobi: "http://test.oobi",
      id: "test-id",
      sharedIdentifier,
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}id`]:
        JSON.stringify(connectionNote),
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}ipex1`]:
        JSON.stringify(mockHistoryItems[0]),
      [`${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}cred1`]:
        JSON.stringify(mockHistoryItems[1]),
      [`${sharedIdentifier}:createdAt`]: nowISO,
    });

    connectionStorage.findById = jest.fn().mockResolvedValue({
      id: "test-id",
      createdAt: new Date(nowISO),
      alias: "alias",
      oobi: "http://test.oobi",
      getTag: jest.fn(),
    });

    const result = await connectionService.getConnectionById(
      "test-id",
      false,
      sharedIdentifier
    );

    expect(result).toEqual({
      id: "test-id",
      contactId: "test-id",
      identifier: "test-shared-identifier",
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
    contactStorage.findExpectedById.mockResolvedValue({
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
    expect(rpyIms.includes('"http://oobi.com/oobi/ourIdentifier?name=Alice"'));
  });

  test("Shared identifier OOBIs carry over the external ID hint", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    contactStorage.findExpectedById.mockResolvedValue({
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
        '"http://oobi.com/oobi/ourIdentifier?name=Alice&externalId=test123"'
      )
    );
  });

  test("should delete all connections for a given identifier", async () => {
    const identifierId = "test-identifier";
    const connectionPairs = [
      { contactId: "contact-1", identifier: identifierId },
      { contactId: "contact-2", identifier: identifierId },
    ];
    connectionPairStorage.findAllByQuery.mockResolvedValue(connectionPairs);
    connectionService.deleteConnectionByIdAndIdentifier = jest.fn();

    await connectionService.deleteAllConnectionsForIdentifier(identifierId);

    expect(connectionPairStorage.findAllByQuery).toHaveBeenCalledWith({
      identifier: identifierId,
    });
    expect(
      connectionService.deleteConnectionByIdAndIdentifier
    ).toHaveBeenCalledTimes(2);
    expect(
      connectionService.deleteConnectionByIdAndIdentifier
    ).toHaveBeenCalledWith("contact-1", identifierId);
    expect(
      connectionService.deleteConnectionByIdAndIdentifier
    ).toHaveBeenCalledWith("contact-2", identifierId);
  });

  test("should delete all connections for a given group", async () => {
    const groupId = "test-group";
    const groupContacts = [
      { id: "contact-1", groupId },
      { id: "contact-2", groupId },
    ];
    contactStorage.findAllByQuery.mockResolvedValue(groupContacts);
    connectionService.deleteMultisigConnectionById = jest.fn();

    await connectionService.deleteAllConnectionsForGroup(groupId);

    expect(contactStorage.findAllByQuery).toHaveBeenCalledWith({ groupId });
    expect(
      connectionService.deleteMultisigConnectionById
    ).toHaveBeenCalledTimes(2);
    expect(connectionService.deleteMultisigConnectionById).toHaveBeenCalledWith(
      "contact-1"
    );
    expect(connectionService.deleteMultisigConnectionById).toHaveBeenCalledWith(
      "contact-2"
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
