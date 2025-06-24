import { Serder } from "signify-ts";
import { ConnectionStatus, MiscRecordId, CreationStatus } from "../agent.types";
import { Agent } from "../agent";
import { CoreEventEmitter } from "../event";
import { MultiSigService } from "./multiSigService";
import {
  BasicRecord,
  IdentifierMetadataRecord,
  IdentifierStorage,
} from "../records";
import { ConfigurationService } from "../../configuration";
import {
  getMultisigIdentifierResponse,
  getMemberIdentifierResponse,
  memberMetadataRecord,
  initiatorConnectionShortDetails,
  multisigMetadataRecord,
  resolvedOobiOpResponse,
  memberIdentifierRecord,
  getMultisigMembersResponse,
  getRequestMultisigIcp,
  memberMetadataRecordProps,
  inceptionDataFix,
  linkedContacts,
  queuedIdentifier,
  queuedJoin,
  getAvailableWitnesses,
} from "../../__fixtures__/agent/multiSigFixtures";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { EventTypes } from "../event.types";
import { MultiSigRoute } from "./multiSig.types";
import { StorageMessage } from "../../storage/storage.types";

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

const identifiersListMock = jest.fn();
const identifiersGetMock = jest.fn();
const identifiersCreateMock = jest.fn();
const identifiersMemberMock = jest.fn();
const identifiersInteractMock = jest.fn();
const identifiersRotateMock = jest.fn();
const identifierCreateIcpDataMock = jest.fn();
const identifierSubmitIcpDataMock = jest.fn();

const oobiResolveMock = jest.fn();
const groupGetRequestMock = jest.fn();
const queryKeyStateGetMock = jest.fn();
const addEndRoleMock = jest.fn();
const sendExchangesMock = jest.fn();
const getExchangesMock = jest.fn();
const markNotificationMock = jest.fn();
const createExchangeMessageMock = jest.fn();
const getMemberMock = jest.fn();
const submitRpyMock = jest.fn();

const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    list: identifiersListMock,
    get: identifiersGetMock,
    create: identifiersCreateMock,
    addEndRole: addEndRoleMock,
    interact: identifiersInteractMock,
    rotate: identifiersRotateMock,
    members: identifiersMemberMock,
    createInceptionData: identifierCreateIcpDataMock,
    submitInceptionData: identifierSubmitIcpDataMock,
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
    mark: markNotificationMock,
  }),
  credentials: () => ({
    list: jest.fn(),
  }),
  exchanges: () => ({
    get: getExchangesMock,
    send: sendExchangesMock,
    createExchangeMessage: createExchangeMessageMock,
  }),
  replies: () => ({
    submitRpy: submitRpyMock,
  }),
  agent: {
    pre: "pre",
  },
  keyStates: () => ({
    query: jest.fn(),
    get: queryKeyStateGetMock,
  }),
  groups: () => ({ getRequest: groupGetRequestMock }),
  manager: {
    get: getMemberMock,
  },
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  getUserFacingIdentifierRecords: jest.fn(),
  getAllIdentifiers: jest.fn(),
  updateIdentifierMetadata: jest.fn(),
  createIdentifierMetadataRecord: jest.fn(),
});

const operationPendingStorage = jest.mocked({
  save: jest.fn(),
});

const basicStorage = jest.mocked({
  findById: jest.fn(),
  save: jest.fn(),
  createOrUpdateBasicRecord: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
  findExpectedById: jest.fn(),
});

const eventEmitter = new CoreEventEmitter();
const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter,
};

const connections = jest.mocked({
  resolveOobi: jest.fn(),
  getConnectionShortDetailById: jest.fn(),
  getMultisigLinkedContacts: jest.fn(),
});

const identifiers = jest.mocked({
  getIdentifiers: jest.fn(),
  rotateIdentifier: jest.fn(),
  getAvailableWitnesses: jest.fn(),
});

const multiSigService = new MultiSigService(
  agentServicesProps,
  identifierStorage as any,
  operationPendingStorage as any,
  notificationStorage as any,
  basicStorage as any,
  connections as any,
  identifiers as any
);

const now = new Date();
const nowISO = now.toISOString();
const memberPrefix = "EJpKquuibYTqpwMDqEFAFs0gwq0PASAHZ_iDmSF3I2Vg";

beforeEach(async () => {
  jest.resetAllMocks();
  await new ConfigurationService().start();
});

describe("Oobi/endrole", () => {
  test("Can add end role authorization", async () => {
    identifiersMemberMock.mockResolvedValue(getMultisigMembersResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberIdentifierRecord);
    identifiersGetMock.mockResolvedValueOnce(getMultisigIdentifierResponse);
    addEndRoleMock.mockResolvedValue({
      op: jest.fn(),
      serder: { size: 1 },
      sigs: [],
    });
    await multiSigService.endRoleAuthorization("prefix");
    expect(sendExchangesMock).toBeCalledTimes(
      getMultisigMembersResponse["signing"].length
    );
  });

  test("Can join end role authorization", async () => {
    identifiersMemberMock.mockResolvedValue(getMultisigMembersResponse);
    const mockRequestExn = {
      a: {
        gid: "EFPEKHhywRg2Naa-Gx0jiAAXYnQ5y92vDniHAk8beEA_",
      },
      e: {
        rpy: {
          v: "KERI10JSON000111_",
          t: "rpy",
          d: "EE8Ze_pwiMHMMDz_giL0ezN7y_4PJSUPKTe3q2Km_WpY",
          dt: "2024-07-12T09:37:48.801000+00:00",
          r: "/end/role/add",
          a: {
            cid: "EFPEKHhywRg2Naa-Gx0jiAAXYnQ5y92vDniHAk8beEA_",
            role: "agent",
            eid: "EDr4kddR_keAzTUs_PNW-qSsUdLDrKD0YbZxiU-y4B3K",
          },
        },
        d: "EFme1_S0eHc-C6HpcaWpFZnKJGX4f91IBCDmiM6vBQOR",
      },
      rp: "EFPEKHhywRg2Naa-Gx0jiAAXYnQ5y92vDniHAk8beEA_",
    };
    groupGetRequestMock.mockResolvedValue([
      {
        exn: {
          ...mockRequestExn,
        },
      },
    ]);
    getExchangesMock.mockResolvedValue({
      exn: {
        a: {
          gid: "gid",
        },
      },
    });
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberIdentifierRecord);
    identifiersGetMock
      .mockResolvedValueOnce(getMultisigIdentifierResponse)
      .mockResolvedValueOnce(getMemberIdentifierResponse);
    addEndRoleMock.mockResolvedValue({
      op: jest.fn(),
      serder: { size: 1 },
      sigs: [],
    });

    await multiSigService.joinAuthorization(mockRequestExn);

    expect(sendExchangesMock).toBeCalledWith(
      memberIdentifierRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.RPY,
      { gid: getMultisigIdentifierResponse.prefix },
      {
        rpy: [
          { size: 1 },
          "FABELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY0AAAAAAAAAAAAAAAAAAAAAAAELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY-AAA",
        ],
      },
      [
        getMultisigMembersResponse.signing[0].aid,
        getMultisigMembersResponse.signing[1].aid,
      ]
    );
  });
});

describe("Usage of multi-sig", () => {
  test("Can get participants with a multi-sig identifier", async () => {
    identifiersMemberMock.mockResolvedValue(getMultisigMembersResponse);

    identifierStorage.getIdentifierMetadata
      .mockRejectedValueOnce(
        new Error(IdentifierStorage.IDENTIFIER_METADATA_RECORD_MISSING)
      )
      .mockResolvedValueOnce({
        ...memberMetadataRecordProps,
        groupMetadata: {
          ...memberMetadataRecordProps.groupMetadata,
          groupCreated: true,
        },
      });

    await multiSigService.getMultisigParticipants("id");

    expect(identifierStorage.getIdentifierMetadata).toBeCalledWith(
      getMultisigMembersResponse.signing[0].aid
    );
  });

  test("Can not get participants with a multi-sig identifier if not exist our identifier", async () => {
    identifiersMemberMock.mockResolvedValue(getMultisigMembersResponse);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);

    await expect(
      multiSigService.getMultisigParticipants("id")
    ).rejects.toThrowError(MultiSigService.MEMBER_AID_NOT_FOUND);
  });
});

const expectAllWitnessIntroductions = () => {
  expect(submitRpyMock).toHaveBeenCalledTimes(
    getAvailableWitnesses.witnesses.length
  );

  getAvailableWitnesses.witnesses.forEach((witness, index) => {
    expect(submitRpyMock).toHaveBeenNthCalledWith(
      index + 1,
      linkedContacts[0].id,
      expect.stringContaining(
        `"a":{"cid":"EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8","oobi":"${witness.oobi}"}`
      )
    );
    expect(submitRpyMock).toHaveBeenNthCalledWith(
      index + 1,
      linkedContacts[0].id,
      expect.stringContaining("\"t\":\"rpy\"")
    );
    expect(submitRpyMock).toHaveBeenNthCalledWith(
      index + 1,
      linkedContacts[0].id,
      expect.stringContaining("\"r\":\"/introduce\"")
    );
  });
};

describe("Creation of multi-sig", () => {
  beforeAll(() => {
    eventEmitter.emit = jest.fn();
  });

  test("Can create a multisig identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock.mockResolvedValue([
      resolvedOobiOpResponse.op.response,
    ]);
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [{ ...queuedIdentifier, name: "0:different identifier" }],
        },
      })
    );
    basicStorage.findExpectedById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            { ...queuedIdentifier, name: "0:different identifier" },
            queuedIdentifier,
          ],
        },
      })
    );
    identifierCreateIcpDataMock.mockResolvedValue(inceptionDataFix);

    identifiers.getAvailableWitnesses.mockResolvedValue(getAvailableWitnesses);

    getMemberMock.mockReturnValue({
      sign: jest
        .fn()
        .mockResolvedValue([
          "AACK3Pk2vKzotWjsUnbhKqs7P68NoeyIN5Ae7aGYl3ALCXDOk72Mby9kCu_vSpezqZzjWP9D2tQzwyvGCY26ovoE",
        ]),
    });

    await multiSigService.createGroup(
      memberPrefix,
      linkedContacts,
      linkedContacts.length + 1
    );

    expectAllWitnessIntroductions();
    expect(identifierCreateIcpDataMock).toBeCalledWith("0:Identifier 2", {
      algo: "group",
      mhab: getMemberIdentifierResponse,
      isith: 2,
      nsith: 2,
      toad: 3,
      wits: [],
      states: [
        getMemberIdentifierResponse.state,
        resolvedOobiOpResponse.op.response,
      ],
      rstates: [
        getMemberIdentifierResponse.state,
        resolvedOobiOpResponse.op.response,
      ],
    });
    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            { ...queuedIdentifier, name: "0:different identifier" },
            queuedIdentifier,
          ],
        },
      })
    );
    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
        rmids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: "Identifier 2",
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberPrefix,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: "Identifier 2",
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberPrefix,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [{ ...queuedIdentifier, name: "0:different identifier" }],
        },
      })
    );
  });

  test("Cannot create a group if the threshold is invalid", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    await expect(
      multiSigService.createGroup(memberPrefix, linkedContacts, 0)
    ).rejects.toThrowError(MultiSigService.INVALID_THRESHOLD);
    await expect(
      multiSigService.createGroup(
        memberPrefix,
        linkedContacts,
        linkedContacts.length + 2
      )
    ).rejects.toThrowError(MultiSigService.INVALID_THRESHOLD);
  });

  test("Cannot create a group with an invalid member identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue(
      new IdentifierMetadataRecord({
        ...memberMetadataRecordProps,
        groupMetadata: undefined,
      })
    );
    await expect(
      multiSigService.createGroup(memberPrefix, linkedContacts, 1)
    ).rejects.toThrowError(MultiSigService.MISSING_GROUP_METADATA);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue(
      new IdentifierMetadataRecord({
        ...memberMetadataRecordProps,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: false,
          groupCreated: false,
        },
      })
    );
    await expect(
      multiSigService.createGroup(memberPrefix, linkedContacts, 1)
    ).rejects.toThrowError(MultiSigService.ONLY_ALLOW_GROUP_INITIATOR);
  });

  test("Cannot create a group with contacts that are not linked to the group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);

    await expect(
      multiSigService.createGroup(
        memberPrefix,
        [
          {
            ...linkedContacts[0],
            groupId: "wrong-group-id",
          },
        ],
        2
      )
    ).rejects.toThrowError(MultiSigService.ONLY_ALLOW_LINKED_CONTACTS);
  });

  test("Can re-try creating a multisig identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock.mockResolvedValue([
      resolvedOobiOpResponse.op.response,
    ]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [queuedIdentifier],
        },
      })
    );

    identifiers.getAvailableWitnesses.mockResolvedValue(getAvailableWitnesses);

    getMemberMock.mockReturnValue({
      sign: jest
        .fn()
        .mockResolvedValue([
          "AACK3Pk2vKzotWjsUnbhKqs7P68NoeyIN5Ae7aGYl3ALCXDOk72Mby9kCu_vSpezqZzjWP9D2tQzwyvGCY26ovoE",
        ]),
    });

    await multiSigService.createGroup(
      memberPrefix,
      linkedContacts,
      linkedContacts.length + 1,
      true
    );

    expectAllWitnessIntroductions();
    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
        rmids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: "Identifier 2",
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberPrefix,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: "Identifier 2",
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberPrefix,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );
  });

  test("Can retry creating an identifier that was completely created but not removed from queue", async () => {
    // This test should be enough to capture all of the try catches
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock.mockResolvedValue([
      resolvedOobiOpResponse.op.response,
    ]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [queuedIdentifier],
        },
      })
    );

    // Idempotent
    identifierSubmitIcpDataMock.mockRejectedValueOnce(
      new Error("request - 400 - already incepted")
    );
    identifierStorage.createIdentifierMetadataRecord.mockRejectedValueOnce(
      new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
    );

    identifiers.getAvailableWitnesses.mockResolvedValue(getAvailableWitnesses);

    getMemberMock.mockReturnValue({
      sign: jest
        .fn()
        .mockResolvedValue([
          "AACK3Pk2vKzotWjsUnbhKqs7P68NoeyIN5Ae7aGYl3ALCXDOk72Mby9kCu_vSpezqZzjWP9D2tQzwyvGCY26ovoE",
        ]),
    });

    await multiSigService.createGroup(
      memberPrefix,
      linkedContacts,
      linkedContacts.length + 1,
      true
    );

    expectAllWitnessIntroductions();
    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
        rmids: [
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: "Identifier 2",
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberPrefix,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: "Identifier 2",
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberPrefix,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );
  });

  test("Cannot retry creating an identifier if its inception data is not stored", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(memberMetadataRecord);
    identifiersGetMock.mockResolvedValue(getMemberIdentifierResponse);
    queryKeyStateGetMock.mockResolvedValue([
      resolvedOobiOpResponse.op.response,
    ]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );

    await expect(
      multiSigService.createGroup(
        memberPrefix,
        linkedContacts,
        linkedContacts.length + 1,
        true
      )
    ).rejects.toThrowError(MultiSigService.QUEUED_GROUP_DATA_MISSING);

    expect(identifierSubmitIcpDataMock).not.toBeCalled();
    expect(identifierStorage.createIdentifierMetadataRecord).not.toBeCalled();
  });

  test("Can join a group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers.mockResolvedValue([memberMetadataRecord]);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock
      .mockResolvedValueOnce([resolvedOobiOpResponse.op.response])
      .mockResolvedValueOnce([getMemberIdentifierResponse.state]);
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [{ ...queuedJoin, name: "0:different identifier" }],
        },
      })
    );
    basicStorage.findExpectedById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            { ...queuedJoin, name: "0:different identifier" },
            queuedJoin,
          ],
        },
      })
    );
    identifierCreateIcpDataMock.mockResolvedValue(inceptionDataFix);
    markNotificationMock.mockResolvedValue({ status: "done" });
    notificationStorage.deleteById = jest.fn();

    identifiers.getAvailableWitnesses.mockResolvedValue(getAvailableWitnesses);

    getMemberMock.mockReturnValue({
      sign: jest
        .fn()
        .mockResolvedValue([
          "AACK3Pk2vKzotWjsUnbhKqs7P68NoeyIN5Ae7aGYl3ALCXDOk72Mby9kCu_vSpezqZzjWP9D2tQzwyvGCY26ovoE",
        ]),
    });

    await multiSigService.joinGroup("id", "d");

    expect(identifierCreateIcpDataMock).toBeCalledWith("0:Identifier 2", {
      algo: "group",
      mhab: getMemberIdentifierResponse,
      isith: 2,
      nsith: 2,
      toad: 4,
      wits: [
        "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
        "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
        "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
        "BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorE",
        "BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHP",
        "BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsM",
      ],
      states: [
        resolvedOobiOpResponse.op.response,
        getMemberIdentifierResponse.state,
      ],
      rstates: [
        resolvedOobiOpResponse.op.response,
        getMemberIdentifierResponse.state,
      ],
    });
    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
        rmids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: memberMetadataRecord.displayName,
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberMetadataRecord.id,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: memberMetadataRecord.displayName,
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberMetadataRecord.id,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(markNotificationMock).toBeCalledWith("id");
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [{ ...queuedJoin, name: "0:different identifier" }],
        },
      })
    );
  });

  test("Cannot join group by notification if exn message is missing", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );
    await expect(multiSigService.joinGroup("id", "d")).rejects.toThrowError(
      `${MultiSigService.EXN_MESSAGE_NOT_FOUND} d`
    );
  });

  test("Cannot join group if we do not control any member", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([multisigMetadataRecord]);
    await expect(multiSigService.joinGroup("id", "d")).rejects.toThrowError(
      MultiSigService.MEMBER_AID_NOT_FOUND
    );
  });

  test("Cannot join group if member identifier is malformed", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers = jest.fn().mockResolvedValue([
      new IdentifierMetadataRecord({
        ...memberMetadataRecordProps,
        groupMetadata: undefined,
      }),
    ]);
    await expect(multiSigService.joinGroup("id", "d")).rejects.toThrowError(
      MultiSigService.MISSING_GROUP_METADATA
    );
  });

  test("Can retry joining a group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers.mockResolvedValue([memberMetadataRecord]);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock
      .mockResolvedValueOnce([resolvedOobiOpResponse.op.response])
      .mockResolvedValueOnce([getMemberIdentifierResponse.state]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [queuedJoin],
        },
      })
    );
    identifierCreateIcpDataMock.mockResolvedValue(inceptionDataFix);
    markNotificationMock.mockResolvedValue({ status: "done" });
    notificationStorage.deleteById = jest.fn();

    await multiSigService.joinGroup("id", "d", true);

    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
        rmids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: memberMetadataRecord.displayName,
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberMetadataRecord.id,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: memberMetadataRecord.displayName,
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberMetadataRecord.id,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(markNotificationMock).toBeCalledWith("id");
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );
  });

  test("Can retry joining a group that was completely joined but not removed from queue", async () => {
    // This test should be enough to capture all of the try catches
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers.mockResolvedValue([memberMetadataRecord]);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock
      .mockResolvedValueOnce([resolvedOobiOpResponse.op.response])
      .mockResolvedValueOnce([getMemberIdentifierResponse.state]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [queuedJoin],
        },
      })
    );
    identifierCreateIcpDataMock.mockResolvedValue(inceptionDataFix);
    markNotificationMock.mockResolvedValue({ status: "done" });

    // Idempotent
    identifierSubmitIcpDataMock.mockRejectedValueOnce(
      new Error("request - 400 - already incepted")
    );
    identifierStorage.createIdentifierMetadataRecord.mockRejectedValueOnce(
      new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
    );
    markNotificationMock.mockRejectedValueOnce(
      new Error("request - 404 - SignifyClient message")
    );
    notificationStorage.deleteById.mockRejectedValueOnce(
      new Error(StorageMessage.RECORD_DOES_NOT_EXIST_ERROR_MSG)
    );

    await multiSigService.joinGroup("id", "d", true);

    expect(identifierSubmitIcpDataMock).toBeCalledWith(inceptionDataFix);
    expect(sendExchangesMock).toBeCalledWith(
      memberMetadataRecord.id,
      "multisig",
      getMemberIdentifierResponse,
      MultiSigRoute.ICP,
      {
        gid: inceptionDataFix.icp.i,
        smids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
        rmids: [
          "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
          "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        ],
      },
      {
        icp: [
          new Serder(inceptionDataFix.icp),
          "-AACAAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEECABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
        ],
      },
      ["EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7"]
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        id: inceptionDataFix.icp.i,
        displayName: memberMetadataRecord.displayName,
        theme: 0,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: memberMetadataRecord.id,
        createdAt: new Date(getMultisigIdentifierResponse.icp_dt),
      })
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      memberMetadataRecord.id,
      expect.objectContaining({
        groupMetadata: expect.objectContaining({
          groupCreated: true,
        }),
      })
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.GroupCreated,
      payload: {
        group: {
          id: inceptionDataFix.icp.i,
          displayName: memberMetadataRecord.displayName,
          creationStatus: CreationStatus.PENDING,
          createdAtUTC: "2024-08-10T07:23:54.839894+00:00",
          groupMemberPre: memberMetadataRecord.id,
          theme: 0,
        },
      },
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: `group.${inceptionDataFix.icp.i}`,
      recordType: OperationPendingRecordType.Group,
    });
    expect(markNotificationMock).toBeCalledWith("id");
    expect(notificationStorage.deleteById).toBeCalledWith("id");
    expect(basicStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );
  });

  test("Cannot retry creating an identifier if its inception data is not stored", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers.mockResolvedValue([memberMetadataRecord]);
    identifiersGetMock
      .mockResolvedValueOnce(getMemberIdentifierResponse)
      .mockResolvedValueOnce(getMultisigIdentifierResponse);
    queryKeyStateGetMock
      .mockResolvedValueOnce([resolvedOobiOpResponse.op.response])
      .mockResolvedValueOnce([getMemberIdentifierResponse.state]);
    basicStorage.findExpectedById.mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.MULTISIG_IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [],
        },
      })
    );

    await expect(
      multiSigService.joinGroup("id", "d", true)
    ).rejects.toThrowError(MultiSigService.QUEUED_GROUP_DATA_MISSING);

    expect(identifierSubmitIcpDataMock).not.toBeCalled();
    expect(identifierStorage.createIdentifierMetadataRecord).not.toBeCalled();
  });

  test("Can get multisig icp details of 2 person group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([memberMetadataRecord]);
    connections.getConnectionShortDetailById = jest
      .fn()
      .mockResolvedValue(initiatorConnectionShortDetails);
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([]);

    const result = await multiSigService.getMultisigIcpDetails(
      "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO"
    );

    expect(result.ourIdentifier.id).toBe(memberMetadataRecord.id);
    expect(result.sender.id).toBe(initiatorConnectionShortDetails.id);
    expect(result.otherConnections.length).toBe(0);
    expect(result.threshold).toBe(2);
  });

  test("Throw error if the group join request contains unknown identifiers", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([
      {
        ...getRequestMultisigIcp,
        exn: {
          ...getRequestMultisigIcp.exn,
          a: {
            ...getRequestMultisigIcp.exn.a,
            smids: [
              "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
              "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
              "EI8fS00-AxbbqXmwoivpw-0ui0qgZtGbh8Ue-ZVbxYST",
            ],
          },
          e: { icp: { kt: 3 } },
        },
      },
    ]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([memberMetadataRecord]);
    connections.getConnectionShortDetailById = jest
      .fn()
      .mockResolvedValue(initiatorConnectionShortDetails);
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([]);
    await expect(
      multiSigService.getMultisigIcpDetails(
        "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO"
      )
    ).rejects.toThrowError(MultiSigService.UNKNOWN_AIDS_IN_MULTISIG_ICP);
  });

  test("Should not error if we have extra linked contacts", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([memberMetadataRecord]);
    connections.getConnectionShortDetailById = jest
      .fn()
      .mockResolvedValue(initiatorConnectionShortDetails);
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([
      {
        id: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
        connectionDate: nowISO,
        label: "",
        logo: "logoUrl",
        status: ConnectionStatus.CONFIRMED,
      },
      {
        id: "EBHG7UW-48EAF4bMYbaCsPQfSuFk-INidVXLexDMk6TP",
        connectionDate: nowISO,
        label: "",
        logo: "logoUrl",
        status: ConnectionStatus.CONFIRMED,
      },
    ]);

    const result = await multiSigService.getMultisigIcpDetails(
      "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO"
    );

    expect(result.ourIdentifier.id).toBe(memberMetadataRecord.id);
    expect(result.sender.id).toBe(initiatorConnectionShortDetails.id);
    expect(result.otherConnections.length).toBe(0);
    expect(result.threshold).toBe(2);
  });

  test("Can get multisig icp details of 3 person group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([
      {
        ...getRequestMultisigIcp,
        exn: {
          ...getRequestMultisigIcp.exn,
          a: {
            ...getRequestMultisigIcp.exn.a,
            smids: [
              "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
              "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
              "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
            ],
          },
          e: { icp: { kt: 3 } },
        },
      },
    ]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([memberMetadataRecord]);
    connections.getConnectionShortDetailById = jest
      .fn()
      .mockResolvedValue(initiatorConnectionShortDetails);
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([
      {
        id: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
        connectionDate: nowISO,
        label: "",
        logo: "logoUrl",
        status: ConnectionStatus.CONFIRMED,
      },
    ]);

    const result = await multiSigService.getMultisigIcpDetails(
      "ED-gjeEni5eCdpFlBtG7s4wkv7LJ0TmWplCS4DNQwW2P"
    );

    expect(result.ourIdentifier.id).toBe(memberMetadataRecord.id);
    expect(result.sender.id).toBe(initiatorConnectionShortDetails.id);
    expect(result.otherConnections.length).toBe(1);
    expect(result.otherConnections[0].id).toBe(
      "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G"
    );
    expect(result.threshold).toBe(3);
  });

  test("Cannot get multisig icp details if the exn is missing", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockRejectedValue(
      new Error("request - 404 - not found")
    );
    await expect(
      multiSigService.getMultisigIcpDetails(
        "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO"
      )
    ).rejects.toThrowError(
      `${MultiSigService.EXN_MESSAGE_NOT_FOUND} ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO`
    );
  });

  test("Throw error if we do not control any member of the group", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([getRequestMultisigIcp]);
    identifiers.getIdentifiers = jest
      .fn()
      .mockResolvedValue([
        { ...memberMetadataRecord, groupMetadata: undefined },
      ]);
    jest
      .spyOn(Agent.agent.connections, "getConnectionShortDetailById")
      .mockResolvedValue(initiatorConnectionShortDetails);

    await expect(
      multiSigService.getMultisigIcpDetails(
        "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO"
      )
    ).rejects.toThrowError(MultiSigService.MEMBER_AID_NOT_FOUND);
  });

  test("Cannot get multi-sig details from a notification with no matching exn message", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    groupGetRequestMock.mockResolvedValue([]);

    await expect(
      multiSigService.getMultisigIcpDetails(
        "EHe8OnqWhR--r7zPJy97PS2B5rY7Zp4vnYQICs4gXodW"
      )
    ).rejects.toThrowError(
      `${MultiSigService.EXN_MESSAGE_NOT_FOUND} EHe8OnqWhR--r7zPJy97PS2B5rY7Zp4vnYQICs4gXodW`
    );
  });

  test("Should processs any groups pending creation", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [queuedIdentifier, queuedJoin],
        },
      })
    );
    multiSigService.createGroup = jest.fn();
    multiSigService.joinGroup = jest.fn();

    await multiSigService.processGroupsPendingCreation();

    expect(multiSigService.createGroup).toHaveBeenCalledWith(
      queuedIdentifier.data.group!.mhab.prefix,
      queuedIdentifier.groupConnections,
      2,
      true
    );
    expect(multiSigService.joinGroup).toBeCalledWith(
      queuedJoin.notificationId,
      queuedJoin.notificationSaid,
      true
    );
  });
});
