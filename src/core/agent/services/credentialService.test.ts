import { Ilks } from "signify-ts";
import { CredentialService } from "./credentialService";
import { CredentialMetadataRecordProps } from "../records/credentialMetadataRecord.types";
import { CredentialMetadataRecord } from "../records/credentialMetadataRecord";
import { CoreEventEmitter } from "../event";
import { Agent } from "../agent";
import { CredentialStatus } from "./credentialService.types";
import { IdentifierType } from "./identifier.types";
import {
  gHab,
  memberIdentifierRecord,
} from "../../__fixtures__/agent/multiSigFixtures";
import { EventTypes } from "../event.types";
import { hab } from "../../__fixtures__/agent/keriaNotificationFixtures";
import { ExchangeRoute } from "./keriaNotificationService.types";

const identifiersListMock = jest.fn();
const identifiersGetMock = jest.fn();
const identifiersCreateMock = jest.fn();
const identifiersMemberMock = jest.fn();
const identifiersInteractMock = jest.fn();
const identifiersRotateMock = jest.fn();

const oobiResolveMock = jest.fn();
const groupGetRequestMock = jest.fn();
const queryKeyStateMock = jest.fn();
let credentialListMock = jest.fn();
let getCredentialMock = jest.fn();
const revokeCredentialMock = jest.fn();
let deleteCredentialMock = jest.fn();
const credentialStateMock = jest.fn();

const saveOperationPendingMock = jest.fn();
const findOperationMock = jest.fn();

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
    get: getCredentialMock,
    list: credentialListMock,
    revoke: revokeCredentialMock,
    delete: deleteCredentialMock,
    state: credentialStateMock,
  }),
  exchanges: () => ({
    get: jest.fn(),
    send: jest.fn(),
  }),
  agent: {
    pre: "pre",
  },
  keyStates: () => ({
    query: queryKeyStateMock,
    get: jest.fn(),
  }),
  groups: () => ({ getRequest: groupGetRequestMock }),
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  getUserFacingIdentifierRecords: jest.fn(),
  getAllIdentifiers: jest.fn(),
  updateIdentifierMetadata: jest.fn(),
  createIdentifierMetadataRecord: jest.fn(),
});

const credentialStorage = jest.mocked({
  getAllCredentialMetadata: jest.fn(),
  deleteCredentialMetadata: jest.fn(),
  getCredentialMetadata: jest.fn(),
  getCredentialMetadataByConnectionId: jest.fn(),
  saveCredentialMetadataRecord: jest.fn(),
  updateCredentialMetadata: jest.fn(),
  getCredentialsPendingDeletion: jest.fn(),
});

const eventEmitter = new CoreEventEmitter();
const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter,
};

const notificationStorage = jest.mocked({
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findExpectedById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const operationPendingStorage = jest.mocked({
  save: saveOperationPendingMock,
  findById: findOperationMock,
});

const connectionService = jest.mocked({
  resolveOobi: jest.fn(),
  getConnectionById: jest.fn().mockResolvedValue({
    serviceEndpoints: [
      "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
    ],
    notes: [],
    historyItems: [],
  }),
  shareIdentifier: jest.fn(),
});

const credentialService = new CredentialService(
  agentServicesProps,
  credentialStorage as any,
  notificationStorage as any,
  identifierStorage as any,
  operationPendingStorage as any,
  connectionService as any,
);

const now = new Date();
const nowISO = now.toISOString();

const id1 = "id1";
const id2 = "id2";
const credentialMetadataProps: CredentialMetadataRecordProps = {
  id: id1,
  createdAt: now,
  issuanceDate: nowISO,
  credentialType: "credType",
  status: CredentialStatus.CONFIRMED,
  connectionId: "EEnw0sGaicPN-9gHgU62JIZOYo7cMzXjd-fpwJ1EgdK6",
  schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  identifierId: memberIdentifierRecord.id,
  identifierType: IdentifierType.Individual,
};

const credentialMetadataRecordA = new CredentialMetadataRecord(
  credentialMetadataProps
);
const credentialMetadataRecordB = new CredentialMetadataRecord({
  ...credentialMetadataProps,
  id: id2,
});

const archivedMetadataRecord = new CredentialMetadataRecord({
  ...credentialMetadataProps,
  isArchived: true,
});

// Callbacks need to be tested at an integration/e2e test level
describe("Credential service of agent", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  test("can get all credentials", async () => {
    credentialStorage.getAllCredentialMetadata = jest
      .fn()
      .mockResolvedValue([
        credentialMetadataRecordA,
        credentialMetadataRecordB,
      ]);

    expect(await credentialService.getCredentials()).toStrictEqual([
      {
        id: id1,
        credentialType: credentialMetadataRecordA.credentialType,
        issuanceDate: nowISO,
        status: CredentialStatus.CONFIRMED,
        schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        identifierId: memberIdentifierRecord.id,
        identifierType: IdentifierType.Individual,
        connectionId: "EEnw0sGaicPN-9gHgU62JIZOYo7cMzXjd-fpwJ1EgdK6",
      },
      {
        id: id2,
        credentialType: credentialMetadataRecordB.credentialType,
        issuanceDate: nowISO,
        status: CredentialStatus.CONFIRMED,
        schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        identifierId: memberIdentifierRecord.id,
        identifierType: IdentifierType.Individual,
        connectionId: "EEnw0sGaicPN-9gHgU62JIZOYo7cMzXjd-fpwJ1EgdK6",
      },
    ]);
  });

  test("can get all credentials if there are none", async () => {
    credentialStorage.getAllCredentialMetadata = jest
      .fn()
      .mockResolvedValue([]);

    expect(await credentialService.getCredentials()).toStrictEqual([]);
  });

  test("can archive any credential (re-archiving does nothing)", async () => {
    const credId = "credId1";
    await credentialService.archiveCredential(credId);
    expect(credentialStorage.updateCredentialMetadata).toBeCalledWith(credId, {
      isArchived: true,
    });
  });

  test("can restore an archived credential", async () => {
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(archivedMetadataRecord);
    const credId = "credId1";
    await credentialService.restoreCredential(credId);
    expect(credentialStorage.getCredentialMetadata).toBeCalledWith(credId);
    expect(credentialStorage.updateCredentialMetadata).toBeCalledWith(credId, {
      isArchived: false,
    });
  });

  test("cannot restore a non-archived credential", async () => {
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(credentialMetadataRecordA);
    const credId = "credId1";
    await expect(
      credentialService.restoreCredential(credId)
    ).rejects.toThrowError(CredentialService.CREDENTIAL_NOT_ARCHIVED);
    expect(credentialStorage.getCredentialMetadata).toBeCalledWith(credId);
    expect(credentialStorage.updateCredentialMetadata).not.toBeCalled();
  });

  test("cannot restore a credential without a metadata record", async () => {
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValue(null);
    const credId = "credId1";
    await expect(
      credentialService.restoreCredential(credId)
    ).rejects.toThrowError(
      CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG
    );
    expect(credentialStorage.getCredentialMetadata).toBeCalledWith(credId);
    expect(credentialStorage.updateCredentialMetadata).not.toBeCalled();
  });

  test("create metadata record successfully", async () => {
    await credentialService.createMetadata(credentialMetadataProps);
    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalled();
  });

  test("get acdc credential details successfully record by id", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(credentialMetadataRecordA);

    const acdc = {
      sad: {
        a: { LEI: "5493001KJTIIGC8Y1R17" },
        d: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
        i: "EIpeOFh268oRJTM4vNNoQvMWw-NBUPDv1NqYbx6Lc1Mk",
        ri: "EOIj7V-rqu_Q9aGSmPfviBceEtRk1UZBN5H2P_L-Hhx5",
        s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        v: "ACDC10JSON000197_",
      },
      schema: {
        title: "Qualified vLEI Issuer Credential",
        description: "vLEI Issuer Description",
        version: "1.0.0",
        credentialType: "QualifiedvLEIIssuervLEICredential",
      },
      status: {
        s: "0",
        dt: nowISO,
      },
    };
    getCredentialMock = jest.fn().mockResolvedValue(acdc);

    await expect(
      credentialService.getCredentialDetailsById(credentialMetadataRecordA.id)
    ).resolves.toStrictEqual({
      connectionId: "EEnw0sGaicPN-9gHgU62JIZOYo7cMzXjd-fpwJ1EgdK6",
      id: credentialMetadataRecordA.id,
      status: CredentialStatus.CONFIRMED,
      i: acdc.sad.i,
      a: acdc.sad.a,
      s: {
        title: acdc.schema.title,
        description: acdc.schema.description,
        version: acdc.schema.version,
      },
      lastStatus: {
        s: acdc.status.s,
        dt: nowISO,
      },
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierId: memberIdentifierRecord.id,
      identifierType: IdentifierType.Individual,
    });
  });

  test("can get credential short details by ID", async () => {
    const id = "testid";
    const credentialType = "TYPE-001";
    credentialStorage.getCredentialMetadata = jest.fn().mockReturnValue({
      id,
      status: CredentialStatus.CONFIRMED,
      credentialType,
      issuanceDate: nowISO,
      pendingDeletion: false,
      connectionId: undefined,
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierType: IdentifierType.Individual,
      identifierId: memberIdentifierRecord.id,
    });
    expect(
      await credentialService.getCredentialShortDetailsById(id)
    ).toStrictEqual({
      id,
      status: CredentialStatus.CONFIRMED,
      credentialType,
      issuanceDate: nowISO,
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierId: memberIdentifierRecord.id,
      identifierType: IdentifierType.Individual,
      connectionId: undefined,
    });
  });

  test("cannot get credential short details by ID if the credential does not exist", async () => {
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValue(null);
    await expect(
      credentialService.getCredentialShortDetailsById("randomid")
    ).rejects.toThrowError(
      CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG
    );
  });

  test("Should throw an error when KERIA is offline ", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(false);
    await expect(
      credentialService.getCredentialDetailsById("not-found-id")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
  });

  test("Can sync ACDCs from KERIA to local", async () => {
    credentialListMock
      .mockReturnValueOnce([
        {
          sad: {
            v: "ACDC10JSON000197_",
            d: "EIuZp_JvO5pbNmS8jyG96t3d4XENaFSJpLtbLySxvz-X",
            i: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
            ri: "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCrh",
            s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
            a: {
              d: "EDqWl2zEU2LtoVmP1s2jpWx9oFs3bs0zHxH6kdnIgx3-",
              i: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
              dt: "2023-11-29T02:13:34.858000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
            },
          },
          schema: {
            $id: "id-1",
            title: "title1",
          },
        },
        {
          sad: {
            v: "ACDC10JSON000197_",
            d: "EL24R3ECGtv_UzQmYUcu9AeP1ks2JPzTxgPcQPkadEPY",
            i: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
            ri: "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCrh",
            s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
            a: {
              d: "EC67QqakhZ1bZgKci_HsGMIKQybEdc9mJqykBecOG4rJ",
              i: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD",
              dt: "2023-11-29T02:12:35.716000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
            },
          },
          schema: {
            $id: "id-2",
            title: "title2",
          },
        },
        {
          sad: {
            v: "ACDC10JSON000197_",
            d: "EL24R3ECGtv_UzQmYUcu9AeP1ks2JPzTxgPcQPkadETT",
            i: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpTTT",
            ri: "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCrh",
            s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
            a: {
              d: "EC67QqakhZ1bZgKci_HsGMIKQybEdc9mJqykBecOG4rJ",
              i: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD",
              dt: "2023-11-29T02:12:35.716000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
            },
          },
          schema: {
            $id: "id-2",
            title: "title2",
          },
        },
      ])
      .mockResolvedValue([]);
    credentialStateMock
      .mockResolvedValueOnce({ et: Ilks.iss })
      .mockResolvedValueOnce({ et: Ilks.rev });
    credentialStorage.getAllCredentialMetadata = jest
      .fn()
      .mockReturnValue([
        { id: "EL24R3ECGtv_UzQmYUcu9AeP1ks2JPzTxgPcQPkadETT" },
      ]);
    identifiersGetMock.mockResolvedValueOnce(hab).mockResolvedValueOnce(gHab);
    eventEmitter.emit = jest.fn();

    await credentialService.syncKeriaCredentials();

    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledTimes(2);
    expect(credentialStorage.saveCredentialMetadataRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "EIuZp_JvO5pbNmS8jyG96t3d4XENaFSJpLtbLySxvz-X",
        isArchived: false,
        issuanceDate: "2023-11-29T02:13:34.858Z",
        credentialType: "title1",
        status: CredentialStatus.CONFIRMED,
        connectionId: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
        schema: "id-1",
        identifierId: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        identifierType: IdentifierType.Individual,
        createdAt: new Date("2023-11-29T02:13:34.858Z"),
      })
    );
    expect(credentialStorage.saveCredentialMetadataRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "EL24R3ECGtv_UzQmYUcu9AeP1ks2JPzTxgPcQPkadEPY",
        isArchived: false,
        issuanceDate: "2023-11-29T02:12:35.716Z",
        credentialType: "title2",
        status: CredentialStatus.REVOKED,
        connectionId: "ECTcHGs3EhJEdVTW10vm5pkiDlOXlR8bPBj9-8LSpZ3W",
        schema: "id-2",
        identifierId: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD",
        identifierType: IdentifierType.Group,
        createdAt: new Date("2023-11-29T02:12:35.716Z"),
      })
    );
    expect(credentialStateMock).toBeCalledWith(
      "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCrh",
      "EIuZp_JvO5pbNmS8jyG96t3d4XENaFSJpLtbLySxvz-X"
    );
    expect(credentialStateMock).toBeCalledWith(
      "EA67QQC6C6OG4Pok44UHKegNS0YoQm3yxeZwJEbbdCrh",
      "EL24R3ECGtv_UzQmYUcu9AeP1ks2JPzTxgPcQPkadEPY"
    );
  });

  test("Must throw 'Credential with given SAID not found on KERIA' when there's no KERI credential", async () => {
    const id = "not-found-id";
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(credentialMetadataRecordA);
    credentialListMock = jest.fn().mockResolvedValue([]);
    const error404 = new Error("Not Found - 404");
    getCredentialMock.mockRejectedValueOnce(error404);

    await expect(
      credentialService.getCredentialDetailsById(id)
    ).rejects.toThrowError(CredentialService.CREDENTIAL_NOT_FOUND);
  });

  test("Should throw error if other error occurs with get credential in cloud", async () => {
    const id = "not-found-id";
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(credentialMetadataRecordA);
    credentialListMock = jest.fn().mockResolvedValue([]);
    const errorMessage = new Error("Error - 500");
    getCredentialMock.mockRejectedValueOnce(errorMessage);

    await expect(
      credentialService.getCredentialDetailsById(id)
    ).rejects.toThrow(errorMessage);
  });

  test("Can delete stale local credential", async () => {
    const credentialId = "credential-id";
    await credentialService.deleteStaleLocalCredential(credentialId);
    expect(credentialStorage.deleteCredentialMetadata).toBeCalledWith(
      credentialId
    );
  });

  test("cannot mark credential as confirmed if metadata is missing", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      id: "id",
    });
    credentialListMock.mockResolvedValue([
      {
        sad: {
          d: "id",
        },
      },
    ]);
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValue(null);
    await expect(
      credentialService.markAcdc(id, CredentialStatus.CONFIRMED)
    ).rejects.toThrowError(
      CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG
    );
    expect(credentialStorage.updateCredentialMetadata).not.toBeCalled();
  });

  test("Can mark credential as confirmed", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      id: "id",
    });
    credentialListMock.mockResolvedValue([
      {
        sad: {
          d: "id",
        },
      },
    ]);
    const pendingCredentialMock = {
      id: "id",
      createdAt: new Date(),
      issuanceDate: "",
      credentialType: "",
      status: CredentialStatus.PENDING,
      connectionId: "connection-id",
    };
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(pendingCredentialMock);
    await credentialService.markAcdc(id, CredentialStatus.CONFIRMED);
    expect(credentialStorage.updateCredentialMetadata).toBeCalledWith(
      pendingCredentialMock.id,
      {
        ...pendingCredentialMock,
        status: CredentialStatus.CONFIRMED,
      }
    );
  });

  test("Can mark credential as revoked", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      id: "id",
    });
    credentialListMock.mockResolvedValue([
      {
        sad: {
          d: "id",
        },
      },
    ]);
    const pendingCredentialMock = {
      id: "id",
      createdAt: new Date(),
      issuanceDate: "",
      credentialType: "",
      status: CredentialStatus.PENDING,
      connectionId: "connection-id",
    };
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(pendingCredentialMock);
    await credentialService.markAcdc(id, CredentialStatus.REVOKED);
    expect(credentialStorage.updateCredentialMetadata).toBeCalledWith(
      pendingCredentialMock.id,
      {
        ...pendingCredentialMock,
        status: CredentialStatus.REVOKED,
      }
    );
  });

  test("Should mark credential is pending when start delete credential", async () => {
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValueOnce({
      id: "EAgLOT26GVWE4o56NYRbydwwC_oV46HLiTmhiH4SwDI9",
      isArchived: true,
    });
    eventEmitter.emit = jest.fn();

    await credentialService.markCredentialPendingDeletion(
      "EAgLOT26GVWE4o56NYRbydwwC_oV46HLiTmhiH4SwDI9"
    );

    expect(credentialStorage.updateCredentialMetadata).toBeCalledWith(
      "EAgLOT26GVWE4o56NYRbydwwC_oV46HLiTmhiH4SwDI9",
      { pendingDeletion: true }
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.CredentialRemovedEvent,
      payload: {
        credentialId: "EAgLOT26GVWE4o56NYRbydwwC_oV46HLiTmhiH4SwDI9",
      },
    });
  });

  test("cannot mark a non-archived credential as pending deletion", async () => {
    credentialStorage.getCredentialMetadata = jest
      .fn()
      .mockResolvedValue(credentialMetadataRecordA);
    const credId = "credId1";

    await expect(
      credentialService.markCredentialPendingDeletion(credId)
    ).rejects.toThrowError(CredentialService.CREDENTIAL_NOT_ARCHIVED);

    expect(credentialStorage.getCredentialMetadata).toBeCalledWith(credId);
    expect(credentialStorage.deleteCredentialMetadata).not.toBeCalled();
  });

  test("should delele the credential and delete credential", async () => {
    const mockMetadata = {
      identifierId: "test-identifier-id",
      pendingDeletion: true,
      id: "test-credential-id",
    };
    credentialService.deleteStaleLocalCredential = jest.fn();
    deleteCredentialMock.mockResolvedValueOnce(null);

    await credentialService.deleteCredential("test-credential-id");

    expect(deleteCredentialMock).toHaveBeenCalledWith(mockMetadata.id);
    expect(credentialStorage.deleteCredentialMetadata).toHaveBeenCalledWith(
      "test-credential-id"
    );
  });

  test("should delete local credential if delete from signify throws a 404 error", async () => {
    const mockMetadata = {
      identifierId: "test-identifier-id",
      pendingDeletion: true,
      id: "test-credential-id",
    };
    deleteCredentialMock.mockRejectedValueOnce(
      new Error("Request failed - 404 Not Found")
    );
    credentialService.deleteStaleLocalCredential = jest.fn();

    await credentialService.deleteCredential("test-credential-id");

    expect(deleteCredentialMock).toHaveBeenCalledWith(mockMetadata.id);
    expect(credentialStorage.deleteCredentialMetadata).toHaveBeenCalledWith(
      "test-credential-id"
    );
  });

  test("should throw an error if delete from signify throws a non-404 error", async () => {
    const mockMetadata = {
      identifierId: "test-identifier-id",
      pendingDeletion: true,
      id: "test-credential-id",
    };
    deleteCredentialMock.mockRejectedValueOnce(
      new Error("Request failed - 500 Internal Server Error")
    );

    await expect(
      credentialService.deleteCredential("test-credential-id")
    ).rejects.toThrow("Request failed - 500 Internal Server Error");

    expect(deleteCredentialMock).toHaveBeenCalledWith(mockMetadata.id);
    expect(credentialStorage.deleteCredentialMetadata).not.toHaveBeenCalled();
  });

  test("Should retrieve pending deletions and delete each by ID", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    credentialStorage.deleteCredentialMetadata = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    deleteCredentialMock = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    credentialService.deleteCredential = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    credentialStorage.getCredentialsPendingDeletion.mockResolvedValueOnce([
      { id: "id1" },
      { id: "id2" },
    ]);

    await credentialService.removeCredentialsPendingDeletion();

    expect(credentialService.deleteCredential).toHaveBeenNthCalledWith(
      1,
      "id1"
    );
    expect(credentialService.deleteCredential).toHaveBeenNthCalledWith(
      2,
      "id2"
    );
  });

  test("should delete all credentials for a given identifier", async () => {
    const identifierId = "test-identifier-id";
    const credentials = [
      { id: "cred-1", identifierId: identifierId },
      { id: "cred-2", identifierId: "another-identifier-id" },
      { id: "cred-3", identifierId: identifierId },
    ];
    credentialStorage.getAllCredentialMetadata.mockImplementation(
      (isGetArchive, identifierId) => {
        if (identifierId) {
          return Promise.resolve(
            credentials.filter((cred) => cred.identifierId === identifierId)
          );
        }
        return Promise.resolve(credentials);
      }
    );
    credentialService.deleteCredential = jest.fn();

    await credentialService.deleteAllCredentialsForIdentifier(identifierId);

    expect(credentialStorage.getAllCredentialMetadata).toHaveBeenCalledWith(
      undefined,
      identifierId
    );
    expect(credentialService.deleteCredential).toHaveBeenCalledTimes(2);
    expect(credentialService.deleteCredential).toHaveBeenCalledWith("cred-1");
    expect(credentialService.deleteCredential).toHaveBeenCalledWith("cred-3");
    expect(credentialService.deleteCredential).not.toHaveBeenCalledWith(
      "cred-2"
    );
  });
  
  test("should share credentials and delete notification", async () => {
    const mockRequestSaid = "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p";
    const mockNotificationId = "notification-id-for-share";
    const mockExchangeGetResponse = {
      exn: {
        i: "some-issuer-id",
        rp: "some-recipient-id",
        a: {
          s: ["some-schema-said"],
        },
        d: "some-digest",
      },
    };
    const mockCredentialListResponse = [
      { sad: { d: "cred-1" } },
      { sad: { d: "cred-2" } },
    ];
    const mockHab = {
      name: "test",
    };
    const mockCreateExchangeMessageResponse = ["exn", "sigs", "atc"];
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    notificationStorage.findExpectedById.mockResolvedValue({
      id: mockNotificationId,
      route: "/exn/coordination/credentials/info/req",
    });
    const exchangesGetMock = jest
      .fn()
      .mockResolvedValue(mockExchangeGetResponse);
    const createExchangeMessageMock = jest
      .fn()
      .mockResolvedValue(mockCreateExchangeMessageResponse);
    const sendFromEventsMock = jest.fn().mockResolvedValue({});
    signifyClient.exchanges = jest.fn().mockReturnValue({
      get: exchangesGetMock,
      createExchangeMessage: createExchangeMessageMock,
      sendFromEvents: sendFromEventsMock,
    });
    credentialListMock.mockResolvedValue(mockCredentialListResponse);
    identifiersGetMock.mockResolvedValue(mockHab);
    notificationStorage.deleteById = jest.fn();
    const markMock = jest.fn().mockResolvedValue({});
    signifyClient.notifications = jest.fn().mockReturnValue({
      list: jest.fn(),
      mark: markMock,
    });

    await credentialService.shareCredentials(
      mockNotificationId,
      mockRequestSaid
    );

    expect(notificationStorage.findExpectedById).toHaveBeenCalledWith(
      mockNotificationId
    );
    expect(exchangesGetMock).toHaveBeenCalledWith(mockRequestSaid);
    expect(credentialListMock).toHaveBeenCalledWith({
      filter: { "-s": "some-schema-said" },
    });
    expect(identifiersGetMock).toHaveBeenCalledWith(
      mockExchangeGetResponse.exn.rp
    );
          expect(createExchangeMessageMock).toHaveBeenCalledWith(
            mockHab,
            ExchangeRoute.CoordinationCredentialsInfoResp,
            { sads: JSON.stringify(mockCredentialListResponse) },      [],
      mockExchangeGetResponse.exn.i,
      undefined,
      mockRequestSaid
    );
    expect(sendFromEventsMock).toHaveBeenCalledWith(
      mockExchangeGetResponse.exn.rp,
      "credential_share",
      "exn",
      "sigs",
      "atc",
      [mockExchangeGetResponse.exn.i]
    );
    expect(notificationStorage.deleteById).toHaveBeenCalledWith(
      mockNotificationId
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: {
        id: mockNotificationId,
      },
    });
  });
});
