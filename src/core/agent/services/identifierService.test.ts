import { ready, Serder } from "signify-ts";
import { PeerConnection } from "../../cardano/walletConnect/peerConnection";
import { Agent } from "../agent";
import { ConnectionStatus, MiscRecordId, CreationStatus } from "../agent.types";
import { IdentifierMetadataRecord } from "../records/identifierMetadataRecord";
import { CoreEventEmitter } from "../event";
import { IdentifierService } from "./identifierService";
import { EventTypes } from "../event.types";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import * as utils from "./utils";
import { BasicRecord } from "../records";
import { StorageMessage } from "../../storage/storage.types";
import { findNotificationsResult } from "../../__fixtures__/agent/keriaNotificationFixtures";
import {
  hab,
  remoteSignRefExn,
  remoteSignReqExn,
} from "../../__fixtures__/agent/identifierFixtures";
import {
  ExchangeRoute,
  NotificationRoute,
} from "./keriaNotificationService.types";

const listIdentifiersMock = jest.fn();
const getIdentifierMembersMock = jest.fn();
const getIdentifierMock = jest.fn();
const updateIdentifierMock = jest.fn();
const createIdentifierMock = jest.fn();
const rotateIdentifierMock = jest.fn();
const saveOperationPendingMock = jest.fn();
const findOperationMock = jest.fn();
const markNotificationMock = jest.fn();
const exchangeGetMock = jest.fn();
const interactMock = jest.fn();
const sendFromEventsMock = jest.fn();
const createExchangeMessageMock = jest.fn();

const mockSigner = {
  _code: "A",
  _size: -1,
  _raw: {},
  _verfer: {},
};
const managerMock = {
  get: () => {
    return {
      signers: [mockSigner],
    };
  },
};
const operationGetMock = jest.fn().mockImplementation((id: string) => {
  return {
    done: true,
    response: {
      i: id,
    },
  };
});
const getAgentConfigMock = jest.fn();

const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    list: listIdentifiersMock,
    get: getIdentifierMock,
    create: createIdentifierMock,
    addEndRole: jest.fn().mockResolvedValue({ op: jest.fn() }),
    interact: interactMock,
    rotate: rotateIdentifierMock,
    members: getIdentifierMembersMock,
    update: updateIdentifierMock,
  }),
  operations: () => ({
    get: operationGetMock,
  }),
  notifications: () => ({
    mark: markNotificationMock,
  }),
  exchanges: () => ({
    get: exchangeGetMock,
    sendFromEvents: sendFromEventsMock,
    createExchangeMessage: createExchangeMessageMock,
  }),
  agent: {
    pre: "pre",
  },
  manager: undefined,
  config: () => ({
    get: getAgentConfigMock,
  }),
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  getUserFacingIdentifierRecords: jest.fn(),
  getIdentifierRecords: jest.fn(),
  getAllIdentifiers: jest.fn(),
  updateIdentifierMetadata: jest.fn(),
  createIdentifierMetadataRecord: jest.fn(),
  getIdentifierMetadataByGroupId: jest.fn(),
  deleteIdentifierMetadata: jest.fn(),
  getIdentifierPendingCreation: jest.fn(),
  getIdentifiersPendingDeletion: jest.fn(),
});

const operationPendingStorage = jest.mocked({
  save: saveOperationPendingMock,
  findById: findOperationMock,
});

const eventEmitter = new CoreEventEmitter();
const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter,
};

const connections = jest.mocked({
  getMultisigLinkedContacts: jest.fn(),
  deleteConnectionById: jest.fn(),
});

const basicStorage = jest.mocked({
  findById: jest.fn(),
  save: jest.fn(),
  createOrUpdateBasicRecord: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
});

const notificationStorage = jest.mocked({
  deleteById: jest.fn(),
  findAllByQuery: jest.fn(),
  findExpectedById: jest.fn(),
});

const identifierService = new IdentifierService(
  agentServicesProps,
  identifierStorage as any,
  operationPendingStorage as any,
  basicStorage as any,
  notificationStorage as any,
  connections as any
);

jest.mock("../../cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      getConnectedDAppAddress: jest.fn(),
      getConnectingAid: jest.fn(),
      disconnectDApp: jest.fn(),
    },
  },
}));

const now = new Date();
const nowISO = now.toISOString();

const groupMetadata = {
  groupId: "group-id",
  groupInitiator: true,
  groupCreated: false,
};

const keriMetadataRecordProps = {
  id: "aidHere",
  displayName: "Identifier 2",
  createdAt: now,
  theme: 0,
  creationStatus: CreationStatus.COMPLETE,
  groupMetadata,
  sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
};

const identifierMetadataRecord = new IdentifierMetadataRecord({
  ...keriMetadataRecordProps,
  theme: 0,
});

const keriMetadataRecord = new IdentifierMetadataRecord(
  keriMetadataRecordProps
);

const identifierStateKeria = {
  prefix: keriMetadataRecord.id,
  state: {
    s: "s",
    dt: "dt",
    kt: "kt",
    k: "k",
    nt: "nt",
    n: "n",
    bt: "bt",
    b: "b",
    di: "di",
  },
  salty: {
    sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
  },
  icp_dt: "2024-12-30T16:49:05.800487+00:00",
};

const groupIdentifierStateKeria = {
  ...identifierStateKeria,
  group: {},
  salty: undefined,
};

const identifierMembersState = {
  signing: [
    {
      aid: "EGn8b8d9nUbmw3csQ7DO4mkfCz9HusIKL98xe1BFYOKb",
      ends: {},
    },
    {
      aid: "EH51ZBTNCY7acERZQ9u2PHMdswKMfW6KRHgKrYr0UMFg",
      ends: {},
    },
  ],
  rotation: [
    {
      aid: "EGn8b8d9nUbmw3csQ7DO4mkfCz9HusIKL98xe1BFYOKb",
      ends: {},
    },
    {
      aid: "EH51ZBTNCY7acERZQ9u2PHMdswKMfW6KRHgKrYr0UMFg",
      ends: {},
    },
  ],
};

eventEmitter.emit = jest.fn();

const WITNESSES = [
  "http://witnesess:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller?role=witness",
  "http://witnesess:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/controller?role=witness",
  "http://witnesess:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/controller?role=witness",
  "http://witnesess:5645/oobi/BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorE/controller?role=witness",
  "http://witnesess:5646/oobi/BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHP/controller?role=witness",
  "http://witnesess:5647/oobi/BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsM/controller?role=witness",
  "http://witnesess:5648/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2HA/controller?role=witness",
  "http://witnesess:5649/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapA/controller?role=witness",
  "http://witnesess:5650/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfA/controller?role=witness",
  "http://witnesess:5651/oobi/BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorA/controller?role=witness",
  "http://witnesess:5652/oobi/BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHA/controller?role=witness",
  "http://witnesess:5653/oobi/BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsB/controller?role=witness",
  "http://witnesess:5654/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2HB/controller?role=witness",
  "http://witnesess:5655/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapB/controller?role=witness",
  "http://witnesess:5656/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfB/controller?role=witness",
  "http://witnesess:5657/oobi/BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorB/controller?role=witness",
  "http://witnesess:5658/oobi/BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHB/controller?role=witness",
  "http://witnesess:5659/oobi/BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsB/controller?role=witness",
];
const witnessEids = WITNESSES.map(
  (oobi: string) => oobi.split("/oobi/")[1].split("/")[0]
);

const witnessObjects = WITNESSES.map((oobi: string) => ({
  eid: oobi.split("/oobi/")[1].split("/")[0],
  oobi,
}));

describe("Single sig service of agent", () => {
  beforeAll(async () => {
    await ready();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    getAgentConfigMock.mockResolvedValue({
      iurls: WITNESSES.slice(0, 6),
    });
    markNotificationMock.mockResolvedValue(undefined);
  });

  test("can get all user facing identifiers", async () => {
    identifierStorage.getUserFacingIdentifierRecords = jest
      .fn()
      .mockResolvedValue([keriMetadataRecord]);
    expect(await identifierService.getIdentifiers()).toStrictEqual([
      {
        id: keriMetadataRecord.id,
        displayName: "Identifier 2",
        createdAtUTC: nowISO,
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata,
      },
    ]);
  });

  test("can get all identifier records, even non user facing", async () => {
    identifierStorage.getIdentifierRecords = jest.fn().mockResolvedValue([
      keriMetadataRecord,
      new IdentifierMetadataRecord({
        ...keriMetadataRecordProps,
        id: "EIZ-n_hHHY5ERGTzvpXYBkB6_yBAM4RXcjQG3-JykFvT",
        displayName: "group",
        groupMemberPre: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5InX",
        groupMetadata: undefined,
      }),
    ]);
    expect(await identifierService.getIdentifiers(false)).toStrictEqual([
      {
        id: keriMetadataRecord.id,
        displayName: "Identifier 2",
        createdAtUTC: nowISO,
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata,
      },
      {
        id: "EIZ-n_hHHY5ERGTzvpXYBkB6_yBAM4RXcjQG3-JykFvT",
        displayName: "group",
        createdAtUTC: nowISO,
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMemberPre: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5InX",
        groupMetadata: undefined,
      },
    ]);
  });

  test("can get all identifiers without error if there are none", async () => {
    identifierStorage.getUserFacingIdentifierRecords = jest
      .fn()
      .mockResolvedValue([]);
    expect(await identifierService.getIdentifiers()).toStrictEqual([]);
  });

  test("identifier exists in the database but not on Signify", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    getIdentifierMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );
    await expect(
      identifierService.getIdentifier(keriMetadataRecord.id)
    ).rejects.toMatchObject(
      new Error(`${Agent.MISSING_DATA_ON_KERIA}: ${keriMetadataRecord.id}`, {
        cause: "request - 404 - SignifyClient message",
      })
    );
    expect(identifierStorage.getIdentifierMetadata).toBeCalledWith(
      keriMetadataRecord.id
    );
  });

  test("cannot get identifier if it's still pending", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      ...keriMetadataRecord,
      creationStatus: CreationStatus.PENDING,
    });
    await expect(
      identifierService.getIdentifier(keriMetadataRecord.id)
    ).rejects.toThrow(new Error(IdentifierService.IDENTIFIER_NOT_COMPLETE));
  });

  test("cannot get identifier if it failed", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      ...keriMetadataRecord,
      creationStatus: CreationStatus.FAILED,
    });
    await expect(
      identifierService.getIdentifier(keriMetadataRecord.id)
    ).rejects.toThrow(new Error(IdentifierService.IDENTIFIER_NOT_COMPLETE));
  });

  test("can get an identifier in detailed view", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    getIdentifierMock.mockResolvedValue(identifierStateKeria);

    expect(
      await identifierService.getIdentifier(keriMetadataRecord.id)
    ).toStrictEqual({
      id: keriMetadataRecord.id,
      displayName: keriMetadataRecordProps.displayName,
      createdAtUTC: nowISO,
      theme: 0,
      groupMetadata: keriMetadataRecord.groupMetadata,
      groupMemberPre: keriMetadataRecord.groupMemberPre,
      ...identifierStateKeria.state,
      creationStatus: CreationStatus.COMPLETE,
      members: undefined,
    });
  });

  test("group identifier detailed view should contain the member identifiers", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    getIdentifierMock.mockResolvedValue(groupIdentifierStateKeria);
    getIdentifierMembersMock.mockResolvedValue(identifierMembersState);

    expect(
      await identifierService.getIdentifier(keriMetadataRecord.id)
    ).toStrictEqual({
      id: keriMetadataRecord.id,
      displayName: keriMetadataRecordProps.displayName,
      createdAtUTC: nowISO,
      theme: 0,
      groupMetadata: keriMetadataRecord.groupMetadata,
      groupMemberPre: keriMetadataRecord.groupMemberPre,
      ...identifierStateKeria.state,
      creationStatus: CreationStatus.COMPLETE,
      members: [
        identifierMembersState.signing[0].aid,
        identifierMembersState.signing[1].aid,
      ],
    });
  });

  test("cannot create an identifier if theme is not valid", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);

    await expect(
      identifierService.createIdentifier({
        displayName: "newDisplayName",
        theme: 44,
      })
    ).rejects.toThrowError(IdentifierService.INVALID_THEME);

    expect(createIdentifierMock).not.toBeCalled();
  });

  test("should throw an error if queued is not an array when creating identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const newTheme = 1;
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: "invalidFormat",
        },
      })
    );

    await expect(
      identifierService.createIdentifier({
        displayName: "displayName",
        theme: newTheme,
      })
    ).rejects.toThrowError(
      IdentifierService.INVALID_QUEUED_DISPLAY_NAMES_FORMAT
    );

    expect(basicStorage.findById).toHaveBeenCalledWith(
      MiscRecordId.IDENTIFIERS_PENDING_CREATION
    );
  });

  test("can create an identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest
      .fn()
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: [],
          },
        })
      )
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: ["0:displayName"],
          },
        })
      );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await identifierService.createIdentifier({
      displayName,
      theme: 0,
    });

    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: ["0:displayName"] },
      })
    );
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
        sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierAdded,
      payload: {
        identifier: {
          id: "id",
          displayName,
          createdAtUTC: "2024-12-30T16:49:05.800Z",
          creationStatus: CreationStatus.PENDING,
          theme: 0,
        },
      },
    });
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: [] },
      })
    );
  });

  test("can create local group member identifier (initiator)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest
      .fn()
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: [],
          },
        })
      )
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: [
              "0:1-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
            ],
          },
        })
      );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await identifierService.createIdentifier({
      displayName,
      theme: 0,
      groupMetadata: {
        groupCreated: false,
        groupInitiator: true,
        groupId: "DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd",
      },
    });

    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            "0:1-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
          ],
        },
      })
    );
    expect(createIdentifierMock).toBeCalledWith(
      "0:1-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
      {
        toad: 4,
        wits: witnessEids.slice(0, 6),
      }
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
        sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierAdded,
      payload: {
        identifier: {
          id: "id",
          displayName,
          createdAtUTC: "2024-12-30T16:49:05.800Z",
          creationStatus: CreationStatus.PENDING,
          theme: 0,
          groupMetadata: {
            groupCreated: false,
            groupInitiator: true,
            groupId: "DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd",
          },
        },
      },
    });
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: [] },
      })
    );
  });

  test("can create local group member identifier (non initiator)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest
      .fn()
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: [],
          },
        })
      )
      .mockResolvedValueOnce(
        new BasicRecord({
          id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
          content: {
            queued: [
              "0:0-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
            ],
          },
        })
      );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await identifierService.createIdentifier({
      displayName,
      theme: 0,
      groupMetadata: {
        groupCreated: false,
        groupInitiator: false,
        groupId: "DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd",
      },
    });

    expect(basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            "0:0-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
          ],
        },
      })
    );
    expect(createIdentifierMock).toBeCalledWith(
      "0:0-DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd:displayName",
      {
        toad: 4,
        wits: witnessEids.slice(0, 6),
      }
    );
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
        sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierAdded,
      payload: {
        identifier: {
          id: "id",
          displayName,
          createdAtUTC: "2024-12-30T16:49:05.800Z",
          creationStatus: CreationStatus.PENDING,
          theme: 0,
          groupMetadata: {
            groupCreated: false,
            groupInitiator: false,
            groupId: "DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxHd",
          },
        },
      },
    });
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: [] },
      })
    );
  });

  test("can retry creating an identifier (skip storing name)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest.fn().mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: ["0:X", "0:displayName", "1:Y", "2:Z"],
        },
      })
    );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await identifierService.createIdentifier(
      {
        displayName,
        theme: 0,
      },
      true
    );

    expect(basicStorage.createOrUpdateBasicRecord).not.toBeCalled();
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierAdded,
      payload: {
        identifier: {
          id: "id",
          displayName,
          createdAtUTC: "2024-12-30T16:49:05.800Z",
          creationStatus: CreationStatus.PENDING,
          theme: 0,
        },
      },
    });
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: ["0:X", "1:Y", "2:Z"] },
      })
    );
  });

  test("can continue to create identifier if already exists on the cloud", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockRejectedValue(
      new Error("request - 400 - already incepted")
    );
    basicStorage.findById = jest.fn().mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: ["0:displayName"],
        },
      })
    );
    listIdentifiersMock
      .mockResolvedValueOnce({
        aids: [{ prefix: "differentId", name: "0:a-different-name" }],
      })
      .mockResolvedValueOnce({
        aids: [{ prefix: "id", name: "0:displayName" }],
      });
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await identifierService.createIdentifier(
      {
        displayName,
        theme: 0,
      },
      true
    );

    expect(basicStorage.createOrUpdateBasicRecord).not.toBeCalled();
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
      })
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierAdded,
      payload: {
        identifier: {
          id: "id",
          displayName,
          createdAtUTC: "2024-12-30T16:49:05.800Z",
          creationStatus: CreationStatus.PENDING,
          theme: 0,
        },
      },
    });
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: [] },
      })
    );
  });

  test("should error if display name is conflicting but cannot find by name thereafter", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockRejectedValue(
      new Error("request - 400 - already incepted")
    );
    basicStorage.findById = jest.fn().mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: ["0:displayName"],
        },
      })
    );
    listIdentifiersMock
      .mockResolvedValueOnce({
        aids: [{ prefix: "different-id", name: "0:different-displayName" }],
      })
      .mockResolvedValueOnce({
        aids: [],
      });
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });

    await expect(
      identifierService.createIdentifier(
        {
          displayName,
          theme: 0,
        },
        true
      )
    ).rejects.toThrowError(
      IdentifierService.CANNOT_FIND_EXISTING_IDENTIFIER_BY_SEARCH
    );

    expect(basicStorage.createOrUpdateBasicRecord).not.toBeCalled();
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(basicStorage.update).not.toBeCalled();
  });

  test("should continue to track operations if metadata record already exists when creating identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest.fn().mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: ["0:X", "0:displayName", "1:Y", "2:Z"],
        },
      })
    );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "op123",
      recordType: OperationPendingRecordType.Witness,
    });
    identifierStorage.createIdentifierMetadataRecord = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
      );

    await identifierService.createIdentifier(
      {
        displayName,
        theme: 0,
      },
      true
    );

    expect(basicStorage.createOrUpdateBasicRecord).not.toBeCalled();
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
      })
    );
    expect(eventEmitter.emit).not.toBeCalled();
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: ["0:X", "1:Y", "2:Z"] },
      })
    );
  });

  test("should remove pending identifier name if all actions complete and duplicated", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const displayName = "displayName";
    eventEmitter.emit = jest.fn();
    createIdentifierMock.mockResolvedValue({
      serder: {
        ked: {
          i: "id",
        },
      },
      op: jest.fn().mockResolvedValue({
        name: "op123",
        done: false,
      }),
    });
    basicStorage.findById = jest.fn().mockResolvedValue(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: ["0:X", "0:displayName", "1:Y", "2:Z"],
        },
      })
    );
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    identifierStorage.createIdentifierMetadataRecord = jest
      .fn()
      .mockRejectedValue(
        new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
      );

    await identifierService.createIdentifier(
      {
        displayName,
        theme: 0,
      },
      true
    );

    expect(basicStorage.createOrUpdateBasicRecord).not.toBeCalled();
    expect(createIdentifierMock).toBeCalledWith("0:displayName", {
      toad: 4,
      wits: witnessEids.slice(0, 6),
    });
    expect(identifierStorage.createIdentifierMetadataRecord).toBeCalledWith(
      expect.objectContaining({
        displayName,
        id: "id",
        creationStatus: CreationStatus.PENDING,
        theme: 0,
      })
    );
    expect(eventEmitter.emit).not.toBeCalled();
    expect(basicStorage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: { queued: ["0:X", "1:Y", "2:Z"] },
      })
    );
  });

  test("cannot create identifier is agent config is missing", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getAgentConfigMock.mockResolvedValueOnce({});

    await expect(
      identifierService.createIdentifier({
        displayName: "newDisplayName",
        theme: 0,
      })
    ).rejects.toThrowError(IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION);

    expect(createIdentifierMock).not.toBeCalled();
  });

  test("cannot create identifier is there are no discoverable witnesses", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getAgentConfigMock.mockResolvedValueOnce({
      iurls: [
        "http://witnesess:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller",
      ],
    });

    await expect(
      identifierService.createIdentifier({
        displayName: "newDisplayName",
        theme: 0,
      })
    ).rejects.toThrowError(IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE);

    expect(createIdentifierMock).not.toBeCalled();
  });

  test("should delete all associated linked connections if the identifier is a group member identifier", async () => {
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      ...keriMetadataRecord,
      creationStatus: CreationStatus.PENDING,
    });
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([
      {
        id: "EHxEwa9UAcThqxuxbq56BYMq7YPWYxA63A1nau2AZ-1A",
        connectionDate: nowISO,
        label: "",
        logo: "logoUrl",
        status: ConnectionStatus.PENDING,
      },
    ]);
    PeerConnection.peerConnection.getConnectingIdentifier = jest
      .fn()
      .mockReturnValue({ id: identifierMetadataRecord.id, oobi: "oobi" });
    notificationStorage.findAllByQuery.mockResolvedValue(
      findNotificationsResult
    );

    await identifierService.deleteIdentifier(identifierMetadataRecord.id);

    expect(connections.deleteConnectionById).toBeCalledWith(
      "EHxEwa9UAcThqxuxbq56BYMq7YPWYxA63A1nau2AZ-1A"
    );
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[0].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[0].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[0].id },
    });
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[1].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[1].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[1].id },
    });
  });

  test("should delete the local member identifier for that multisig if deleting the multi-sig identifier", async () => {
    const localMember = {
      id: "aidLocalMember",
      displayName: "Identifier Local",
      createdAt: now,
      theme: 0,
      groupMetadata,
      creationStatus: CreationStatus.PENDING,
      groupMemberPre: "manageAid",
    };
    identifierStorage.getIdentifierMetadata
      .mockReturnValueOnce({
        ...keriMetadataRecord,
        creationStatus: CreationStatus.PENDING,
        groupMemberPre: "manageAid",
        groupMetadata: undefined,
      })
      .mockReturnValueOnce(localMember);
    connections.getMultisigLinkedContacts = jest.fn().mockResolvedValue([
      {
        id: "group-id",
        connectionDate: nowISO,
        label: "",
        logo: "logoUrl",
        status: ConnectionStatus.CONFIRMED,
      },
    ]);
    identifierStorage.updateIdentifierMetadata = jest.fn();
    PeerConnection.peerConnection.getConnectingIdentifier = jest
      .fn()
      .mockReturnValue({ id: identifierMetadataRecord.id, oobi: "oobi" });
    jest
      .spyOn(utils, "randomSalt")
      .mockReturnValueOnce("QOP7zdP-kJs8nlwVR290XfyAk")
      .mockReturnValueOnce("0ADQpus-mQmmO4mgWcT3ekDz");
    notificationStorage.findAllByQuery
      .mockResolvedValueOnce([findNotificationsResult[0]])
      .mockResolvedValueOnce([findNotificationsResult[1]]);

    await identifierService.deleteIdentifier(identifierMetadataRecord.id);

    expect(connections.deleteConnectionById).toBeCalledWith("group-id");
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      "manageAid",
      {
        isDeleted: true,
        pendingDeletion: false,
      }
    );
    expect(updateIdentifierMock).toBeCalledWith(localMember.id, {
      name: `XX-QOP7zdP-kJs8nlwVR290XfyAk:${localMember.groupMetadata.groupId}:${localMember.displayName}`,
    });
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      identifierMetadataRecord.id,
      { isDeleted: true, pendingDeletion: false }
    );
    expect(updateIdentifierMock).toBeCalledWith(identifierMetadataRecord.id, {
      name: `XX-0ADQpus-mQmmO4mgWcT3ekDz:${identifierMetadataRecord.displayName}`,
    });
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[0].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[0].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[0].id },
    });
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[1].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[1].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[1].id },
    });
    expect(updateIdentifierMock).toBeCalledTimes(2);
  });

  test("can update an identifier", async () => {
    const newDisplayName = "newDisplayName";
    const newTheme = 1;
    await identifierService.updateIdentifier(keriMetadataRecord.id, {
      displayName: newDisplayName,
      theme: newTheme,
    });
    expect(updateIdentifierMock).toBeCalledWith(keriMetadataRecord.id, {
      name: `${newTheme}:${newDisplayName}`,
    });
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      keriMetadataRecord.id,
      {
        displayName: newDisplayName,
        theme: newTheme,
      }
    );
  });

  test("can delete an identifier and disconnect DApp", async () => {
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      ...identifierMetadataRecord,
      groupMetadata: undefined,
    });
    identifierStorage.updateIdentifierMetadata = jest.fn();
    PeerConnection.peerConnection.getConnectedDAppAddress = jest
      .fn()
      .mockReturnValue("dApp-address");
    PeerConnection.peerConnection.getConnectingIdentifier = jest
      .fn()
      .mockReturnValue({ id: identifierMetadataRecord.id, oobi: "oobi" });
    jest.spyOn(utils, "randomSalt").mockReturnValue("0ADQpus-mQmmO4mgWcT3ekDz");
    notificationStorage.findAllByQuery.mockResolvedValue(
      findNotificationsResult
    );

    await identifierService.deleteIdentifier(identifierMetadataRecord.id);

    expect(identifierStorage.getIdentifierMetadata).toBeCalledWith(
      identifierMetadataRecord.id
    );
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      identifierMetadataRecord.id,
      { isDeleted: true, pendingDeletion: false }
    );
    expect(updateIdentifierMock).toBeCalledWith(identifierMetadataRecord.id, {
      name: `XX-0ADQpus-mQmmO4mgWcT3ekDz:${identifierMetadataRecord.displayName}`,
    });
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[0].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[0].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[0].id },
    });
    expect(markNotificationMock).toBeCalledWith(findNotificationsResult[1].id);
    expect(notificationStorage.deleteById).toBeCalledWith(
      findNotificationsResult[1].id
    );
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: findNotificationsResult[1].id },
    });
    expect(PeerConnection.peerConnection.disconnectDApp).toBeCalledWith(
      "dApp-address",
      true
    );
  });

  test("Should correctly sync identifiers, handling both group and non-group cases, initiator and not initiator", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    listIdentifiersMock
      .mockReturnValueOnce({
        aids: [
          {
            name: "0:1-group1:test1",
            prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
            sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
          },
          {
            name: "15:test1",
            prefix: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
            group: {
              mhab: {
                name: "0:1-group1:test1",
                prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
                sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
              },
            },
          },
          {
            name: "33:test2",
            prefix: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
            sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
          },
          {
            name: "0:0-group3:test3",
            prefix: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
            sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE3TT",
          },
          {
            name: "0:test3",
            prefix: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJljTz8",
            group: {
              mhab: {
                name: "0:0-group3:test3",
                prefix: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
                sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE3TT",
              },
            },
          },
        ],
      })
      .mockReturnValue({ aids: [] });
    identifierStorage.getAllIdentifiers = jest.fn().mockReturnValue([]);
    identifierStorage.createIdentifierMetadataRecord = jest.fn();
    identifierStorage.updateIdentifierMetadata = jest.fn();
    jest
      .spyOn(signifyClient.operations(), "get")
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "witness.ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "group.EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJljTz8",
      });
    getIdentifierMock
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE3TT",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      });

    await identifierService.syncKeriaIdentifiers();

    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      displayName: "test1",
      theme: 0,
      groupMetadata: {
        groupId: "group1",
        groupCreated: false,
        groupInitiator: true,
      },
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      isDeleted: false,
    });
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      displayName: "test2",
      theme: 33,
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
      isDeleted: false,
    });
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
      displayName: "test3",
      theme: 0,
      groupMetadata: {
        groupId: "group3",
        groupCreated: false,
        groupInitiator: false,
      },
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE3TT",
      isDeleted: false,
    });
    expect(identifierStorage.updateIdentifierMetadata).toHaveBeenCalledWith(
      "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      {
        groupMetadata: {
          groupId: "group1",
          groupCreated: true,
          groupInitiator: true,
        },
      }
    );
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      displayName: "test1",
      theme: 15,
      groupMemberPre: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      isDeleted: false,
    });
    expect(identifierStorage.updateIdentifierMetadata).toHaveBeenCalledWith(
      "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
      {
        groupMetadata: {
          groupId: "group3",
          groupCreated: true,
          groupInitiator: false,
        },
      }
    );
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJljTz8",
      displayName: "test3",
      theme: 0,
      groupMemberPre: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiGaVB",
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      isDeleted: false,
    });
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Deleted identifiers are re-synced as soft deleted", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    listIdentifiersMock
      .mockReturnValueOnce({
        aids: [
          {
            name: "XX:1-group1:test1",
            prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
            sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
          },
          {
            name: "XX:test1",
            prefix: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
            group: {
              mhab: {
                name: "XX:1-group1:test1",
                prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
                sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
              },
            },
          },
          {
            name: "XX:test2",
            prefix: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
            sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
          },
        ],
      })
      .mockReturnValue({ aids: [] });
    identifierStorage.getAllIdentifiers = jest.fn().mockReturnValue([]);
    identifierStorage.createIdentifierMetadataRecord = jest.fn();
    identifierStorage.updateIdentifierMetadata = jest.fn();
    jest
      .spyOn(signifyClient.operations(), "get")
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      })
      .mockResolvedValueOnce({
        done: true,
        name: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      });
    getIdentifierMock
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      });

    await identifierService.syncKeriaIdentifiers();

    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      displayName: "test1",
      theme: 0,
      groupMetadata: {
        groupId: "group1",
        groupCreated: false,
        groupInitiator: true,
      },
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      isDeleted: true,
    });
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      displayName: "test2",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
      isDeleted: true,
    });
    expect(identifierStorage.updateIdentifierMetadata).toHaveBeenCalledWith(
      "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      {
        groupMetadata: {
          groupId: "group1",
          groupCreated: true,
          groupInitiator: true,
        },
      }
    );
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      displayName: "test1",
      theme: 0,
      groupMemberPre: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      creationStatus: CreationStatus.COMPLETE,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      isDeleted: true,
    });
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Should add operation record for pending group and non-group identifiers", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    listIdentifiersMock
      .mockReturnValueOnce({
        aids: [
          {
            name: "0:1-group1:test1",
            prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
            sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
          },
          {
            name: "15:test1",
            prefix: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
            group: {
              mhab: {
                name: "0:1-group1:test1",
                prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
                sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
              },
            },
          },
          {
            name: "33:test2",
            prefix: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
            sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
          },
        ],
      })
      .mockReturnValue({ aids: [] });
    identifierStorage.getAllIdentifiers = jest.fn().mockReturnValue([]);
    identifierStorage.createIdentifierMetadataRecord = jest.fn();
    identifierStorage.updateIdentifierMetadata = jest.fn();
    jest
      .spyOn(signifyClient.operations(), "get")
      .mockResolvedValueOnce({
        done: false,
        name: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      })
      .mockResolvedValueOnce({
        done: false,
        name: "witness.EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      })
      .mockResolvedValueOnce({
        done: false,
        name: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      });
    getIdentifierMock
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      });
    saveOperationPendingMock
      .mockResolvedValueOnce({
        id: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
        recordType: OperationPendingRecordType.Witness,
      })
      .mockResolvedValueOnce({
        id: "witness.EL-EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
        recordType: OperationPendingRecordType.Witness,
      })
      .mockResolvedValueOnce({
        id: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
        recordType: OperationPendingRecordType.Group,
      });

    await identifierService.syncKeriaIdentifiers();

    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      displayName: "test1",
      theme: 0,
      groupMetadata: {
        groupId: "group1",
        groupCreated: false,
        groupInitiator: true,
      },
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      isDeleted: false,
    });
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      displayName: "test2",
      theme: 33,
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
      isDeleted: false,
    });
    expect(identifierStorage.updateIdentifierMetadata).toHaveBeenCalledWith(
      "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      {
        groupMetadata: {
          groupId: "group1",
          groupCreated: true,
          groupInitiator: true,
        },
      }
    );
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      displayName: "test1",
      theme: 15,
      groupMemberPre: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      creationStatus: CreationStatus.PENDING,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      isDeleted: false,
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      recordType: OperationPendingRecordType.Witness,
      id: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      recordType: OperationPendingRecordType.Witness,
      id: "witness.EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      recordType: OperationPendingRecordType.Group,
      id: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
    });
  });

  test("Should add operation record for failed group and non-group identifiers", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    listIdentifiersMock
      .mockReturnValueOnce({
        aids: [
          {
            name: "0:1-group1:test1",
            prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
            sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
          },
          {
            name: "15:test1",
            prefix: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
            group: {
              mhab: {
                name: "0:1-group1:test1",
                prefix: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
                sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
              },
            },
          },
          {
            name: "33:test2",
            prefix: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
            sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
          },
        ],
      })
      .mockReturnValue({ aids: [] });
    identifierStorage.getAllIdentifiers = jest.fn().mockReturnValue([]);
    identifierStorage.createIdentifierMetadataRecord = jest.fn();
    identifierStorage.updateIdentifierMetadata = jest.fn();
    jest
      .spyOn(signifyClient.operations(), "get")
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
        error: { code: 400 },
      })
      .mockResolvedValueOnce({
        done: true,
        name: "witness.EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
        error: { code: 400 },
      })
      .mockResolvedValueOnce({
        done: true,
        name: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
        error: { code: 400 },
      });
    getIdentifierMock
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        salty: {
          sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
        },
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      })
      .mockResolvedValueOnce({
        icp_dt: "2024-12-10T07:28:18.217384+00:00",
      });
    saveOperationPendingMock
      .mockResolvedValueOnce({
        id: "witness.EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
        recordType: OperationPendingRecordType.Witness,
      })
      .mockResolvedValueOnce({
        id: "witness.EL-EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
        recordType: OperationPendingRecordType.Witness,
      })
      .mockResolvedValueOnce({
        id: "group.EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
        recordType: OperationPendingRecordType.Group,
      });

    await identifierService.syncKeriaIdentifiers();

    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      displayName: "test1",
      theme: 0,
      groupMetadata: {
        groupId: "group1",
        groupCreated: false,
        groupInitiator: true,
      },
      creationStatus: CreationStatus.FAILED,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHFlFbNZ29MWHve6gyXfaJr4q2xgCmNEadpkh7IPuP1weDcOEb-bv3CmOoXK3xIik85tc9AYlNxFn_sTMpcvlbog8k4T5rE35i",
      isDeleted: false,
    });
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EJ9oenRW3_SNc0JkETnOegspNGaDCypBfTU1kJiL2AMs",
      displayName: "test2",
      theme: 33,
      creationStatus: CreationStatus.FAILED,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      sxlt: "1AAHOxnWacQOKjjcVD3Fl1PNyd9MDOkWAjpIfStG297qrCx9E2W5D8St0SdJ1E8N8yeaN0Gy4kLhH6PVHQwlupAGNRKvodlX-UKo",
      isDeleted: false,
    });
    expect(identifierStorage.updateIdentifierMetadata).toHaveBeenCalledWith(
      "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      {
        groupMetadata: {
          groupId: "group1",
          groupCreated: true,
          groupInitiator: true,
        },
      }
    );
    expect(
      identifierStorage.createIdentifierMetadataRecord
    ).toHaveBeenCalledWith({
      id: "EPMFON5GHY3o4mLr7XsHvXBCED4gkr1ILUX9NSRkOPM",
      displayName: "test1",
      theme: 15,
      groupMemberPre: "EL-EboMhx-DaBLiAS_Vm3qtJOubb2rkcS3zLU_r7UXtl",
      creationStatus: CreationStatus.FAILED,
      createdAt: new Date("2024-12-10T07:28:18.217384+00:00"),
      isDeleted: false,
    });
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("should call signify.rotateIdentifier with correct params", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const identifierId = "identifierId";
    rotateIdentifierMock.mockResolvedValue({
      op: jest.fn().mockResolvedValue({
        done: true,
      }),
    });

    await identifierService.rotateIdentifier(identifierId);

    expect(rotateIdentifierMock).toHaveBeenCalledWith(identifierId);
  });

  test("Should throw error if we failed to obtain key manager when call getSigner", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    getIdentifierMock.mockResolvedValue(identifierStateKeria);

    await expect(
      identifierService.getSigner(keriMetadataRecord.id)
    ).rejects.toThrowError(IdentifierService.FAILED_TO_OBTAIN_KEY_MANAGER);
  });

  test("Can get signer", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    getIdentifierMock.mockResolvedValue(identifierStateKeria);
    signifyClient.manager = managerMock as any;
    expect(
      await identifierService.getSigner(keriMetadataRecord.id)
    ).toStrictEqual(mockSigner);
  });

  test("getIdentifier should throw an error when KERIA is offline", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(false);
    await expect(identifierService.getIdentifier("id")).rejects.toThrowError(
      Agent.KERIA_CONNECTION_BROKEN
    );
    await expect(identifierService.getSigner("id")).rejects.toThrowError(
      Agent.KERIA_CONNECTION_BROKEN
    );
    await expect(
      identifierService.createIdentifier({
        displayName: "name",
        theme: 0,
      })
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(identifierService.rotateIdentifier("id")).rejects.toThrowError(
      Agent.KERIA_CONNECTION_BROKEN
    );
  });

  test("Can delete stale local identifier", async () => {
    const identifierId = "identifier-id";
    PeerConnection.peerConnection.getConnectedDAppAddress = jest
      .fn()
      .mockReturnValueOnce("")
      .mockReturnValueOnce("dapp-address");
    PeerConnection.peerConnection.getConnectingIdentifier = jest
      .fn()
      .mockResolvedValue({
        id: identifierId,
      });

    await identifierService.deleteStaleLocalIdentifier(identifierId);
    expect(identifierStorage.deleteIdentifierMetadata).toBeCalledWith(
      identifierId
    );

    await identifierService.deleteStaleLocalIdentifier(identifierId);
    expect(PeerConnection.peerConnection.disconnectDApp).toBeCalledTimes(1);
    expect(identifierStorage.deleteIdentifierMetadata).toBeCalledWith(
      identifierId
    );
  });

  test("Should mark identifier as pending when starting to delete identifier", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(keriMetadataRecord);
    eventEmitter.emit = jest.fn();

    await identifierService.markIdentifierPendingDelete(keriMetadataRecord.id);

    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.IdentifierRemoved,
      payload: {
        id: keriMetadataRecord.id,
      },
    });
    expect(identifierStorage.updateIdentifierMetadata).toBeCalledWith(
      keriMetadataRecord.id,
      {
        pendingDeletion: true,
      }
    );
  });

  test("Should not try to mark an identifier as pending delete if it does not exist", async () => {
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(undefined);

    await expect(
      identifierService.markIdentifierPendingDelete(keriMetadataRecord.id)
    ).rejects.toThrow(new Error("Identifier metadata record does not exist"));
    expect(identifierStorage.updateIdentifierMetadata).not.toBeCalled();
  });

  test("Should retrieve identifiers pending deletion and delete each by ID", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    identifierService.deleteIdentifier = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    identifierStorage.getIdentifiersPendingDeletion.mockResolvedValueOnce([
      { id: "id1" },
      { id: "id2" },
    ]);
    await identifierService.removeIdentifiersPendingDeletion();

    expect(identifierService.deleteIdentifier).toHaveBeenCalledWith("id1");
    expect(identifierService.deleteIdentifier).toHaveBeenCalledWith("id2");
  });

  test("should processs any identifiers pending creation", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: [
            "0:newDisplayName",
            "0:1-ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inx:memberOne",
            "0:0-ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5InT:memberTwo",
          ],
        },
      })
    );
    identifierService.createIdentifier = jest.fn();

    await identifierService.processIdentifiersPendingCreation();

    expect(identifierService.createIdentifier).toHaveBeenCalledWith(
      {
        theme: 0,
        displayName: "newDisplayName",
      },
      true
    );
    expect(identifierService.createIdentifier).toHaveBeenCalledWith(
      {
        theme: 0,
        displayName: "memberOne",
        groupMetadata: {
          groupCreated: false,
          groupId: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inx",
          groupInitiator: true,
        },
      },
      true
    );
    expect(identifierService.createIdentifier).toHaveBeenCalledWith(
      {
        theme: 0,
        displayName: "memberTwo",
        groupMetadata: {
          groupCreated: false,
          groupId: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5InT",
          groupInitiator: false,
        },
      },
      true
    );
  });

  test("should throw error if queued identifiers has invalid format", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    basicStorage.findById.mockResolvedValueOnce(
      new BasicRecord({
        id: MiscRecordId.IDENTIFIERS_PENDING_CREATION,
        content: {
          queued: "0:invalidFormat",
        },
      })
    );

    await expect(
      identifierService.processIdentifiersPendingCreation()
    ).rejects.toThrowError(
      IdentifierService.INVALID_QUEUED_DISPLAY_NAMES_FORMAT
    );
  });

  test("should gracefully exit if no pending identifiers", async () => {
    basicStorage.findById.mockResolvedValueOnce(null);
    await identifierService.processIdentifiersPendingCreation();

    expect(basicStorage.findById).toHaveBeenCalledWith(
      MiscRecordId.IDENTIFIERS_PENDING_CREATION
    );
    expect(identifierService.createIdentifier).not.toHaveBeenCalled();
  });

  test("cannot get available witnesses list if the config is misconfigured", async () => {
    getAgentConfigMock.mockResolvedValueOnce({});

    await expect(
      identifierService.getAvailableWitnesses()
    ).rejects.toThrowError(IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION);
    expect(getAgentConfigMock).toBeCalled();
  });

  test("can get available witnesses list", async () => {
    getAgentConfigMock.mockResolvedValueOnce({
      iurls: [
        "http://witnesess:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/controller",
        ...WITNESSES.slice(0, 6),
      ],
    });

    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 4,
      witnesses: witnessObjects.slice(0, 6),
    });

    expect(getAgentConfigMock).toBeCalled();
  });

  test("available witness list must be at least 6", async () => {
    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 5),
    });

    await expect(
      identifierService.getAvailableWitnesses()
    ).rejects.toThrowError(IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE);
    expect(getAgentConfigMock).toBeCalled();
  });

  test("duplicate witnesses are ignored", async () => {
    getAgentConfigMock.mockResolvedValueOnce({
      iurls: [...WITNESSES.slice(0, 6), ...WITNESSES.slice(0, 6)],
    });

    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 4,
      witnesses: witnessObjects.slice(0, 6),
    });

    expect(getAgentConfigMock).toBeCalled();
  });

  test("different witness list sizes", async () => {
    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 7),
    });

    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 5,
      witnesses: witnessObjects.slice(0, 7),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 8),
    });

    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 5,
      witnesses: witnessObjects.slice(0, 7),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 9),
    });
    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 6,
      witnesses: witnessObjects.slice(0, 9),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 10),
    });
    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 7,
      witnesses: witnessObjects.slice(0, 10),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 11),
    });
    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 7,
      witnesses: witnessObjects.slice(0, 10),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES.slice(0, 12),
    });
    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 8,
      witnesses: witnessObjects.slice(0, 12),
    });

    getAgentConfigMock.mockResolvedValueOnce({
      iurls: WITNESSES,
    });
    expect(await identifierService.getAvailableWitnesses()).toStrictEqual({
      toad: 8,
      witnesses: witnessObjects.slice(0, 12),
    });
  });
});

describe("Remote signing", () => {
  beforeAll(() => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
  });

  test("Can retrieve remote sign request details", async () => {
    exchangeGetMock.mockResolvedValue(
      JSON.parse(JSON.stringify(remoteSignReqExn))
    ); // Deep clone so delete doesn't impact other tests
    expect(
      await identifierService.getRemoteSignRequestDetails("req-said")
    ).toEqual({
      identifier: "EBsX58cp09dyBfsS6xQ8O-p67HYQR4zYQLPfT9ht8swD",
      payload: {
        t: 2,
      },
    });
  });

  test("Can anchor a SealDigest for remote signing and respond", async () => {
    exchangeGetMock.mockResolvedValue(remoteSignReqExn);
    interactMock.mockResolvedValue({
      serder: {
        ked: {
          s: "1",
        },
      },
    });
    getIdentifierMock.mockResolvedValue(hab);
    createExchangeMessageMock.mockResolvedValue([
      new Serder(remoteSignRefExn.exn),
      [
        "AADYM8tdhMLLMPfbOgMIFWh0egygPgRxITKZ7ntqpOXD2G1wBA2C13mPvJo6ECiQbYlGoXOR1Fu-oAcF1UD0qaYF",
      ],
      "",
    ]);
    notificationStorage.findExpectedById.mockResolvedValue({
      id: "note-id",
      route: NotificationRoute.RemoteSignReq,
    });

    await identifierService.remoteSign("note-id", "req-said");

    expect(interactMock).toBeCalledWith(remoteSignReqExn.exn.rp, {
      d: "EIAARCAUQMQrjqMTp6D0Pk3UuOUrrIS8uKC1bvJRpWyJ",
    });
    expect(createExchangeMessageMock).toBeCalledWith(
      hab,
      ExchangeRoute.RemoteSignRef,
      { sn: "1" },
      [],
      remoteSignReqExn.exn.i,
      undefined,
      "req-said"
    );
    expect(sendFromEventsMock).toBeCalledWith(
      remoteSignReqExn.exn.rp,
      "remotesign",
      new Serder(remoteSignRefExn.exn),
      [
        "AADYM8tdhMLLMPfbOgMIFWh0egygPgRxITKZ7ntqpOXD2G1wBA2C13mPvJo6ECiQbYlGoXOR1Fu-oAcF1UD0qaYF",
      ],
      "",
      [remoteSignReqExn.exn.i]
    );
    expect(markNotificationMock).toBeCalledWith("note-id");
    expect(notificationStorage.deleteById).toBeCalledWith("note-id");
    expect(eventEmitter.emit).toBeCalledWith({
      type: EventTypes.NotificationRemoved,
      payload: { id: "note-id" },
    });
  });
});
