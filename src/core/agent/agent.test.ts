const stopPollingMock = jest.fn();
const getAllIdentifiersMock = jest.fn();
const getAllCredentialsMock = jest.fn();
const getAllConnectionsMock = jest.fn();
const getAllNotificationsMock = jest.fn();
const updateIdentifierMock = jest.fn();
const deleteCredentialMock = jest.fn().mockResolvedValue(undefined);
const deleteContactMock = jest.fn().mockResolvedValue(undefined);
const markNotificationMock = jest.fn().mockResolvedValue(undefined);
const wipeSessionMock = jest.fn();

import { SignifyClient, ready as signifyReady, Tier } from "signify-ts";
import { mnemonicToEntropy } from "bip39";
import { AgentUrls, MiscRecordId } from "./agent.types";
import { Agent } from "./agent";
import { KeyStoreKeys, SecureStorage } from "../storage";
import { CoreEventEmitter } from "./event";
import { EventTypes } from "./event.types";
import { PeerConnection } from "../cardano/walletConnect/peerConnection";
import { IdentifierService } from "./services";

jest.mock("signify-ts", () => ({
  SignifyClient: jest.fn(),
  ready: jest.fn(),
  Tier: { low: "low" },
  Salter: jest.fn().mockReturnValue({ qb64: "my-salt" }),
}));

jest.mock("../storage/ionicStorage/ionicSession", () => ({
  IonicSession: jest.fn(() => ({
    wipe: wipeSessionMock,
  })),
}));

jest.mock("../cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      getConnectedDAppAddress: jest.fn(),
      disconnectDApp: jest.fn(),
    },
  },
}));

const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    update: updateIdentifierMock,
  }),
});

const eventEmitter = new CoreEventEmitter();
eventEmitter.emit = jest.fn().mockImplementation(() => Promise.resolve());
jest.mock("bip39", () => ({
  mnemonicToEntropy: jest.fn(),
}));

const mockAgentServicesProps = {
  eventEmitter: eventEmitter,
};

const mockGetBranValue = "AEsI_2YqNsQlf8brzDJaP";
jest.spyOn(SecureStorage, "get").mockResolvedValue(mockGetBranValue);
jest.spyOn(SecureStorage, "wipe").mockResolvedValue();
const mockBasicStorageService = {
  save: jest.fn(),
  update: jest.fn(),
  createOrUpdateBasicRecord: jest.fn(),
};

const mockConnectionService = {
  removeConnectionsPendingDeletion: jest.fn(),
  resolvePendingConnections: jest.fn(),
  syncKeriaContacts: jest.fn(),
};
const mockIdentifierService = {
  processIdentifiersPendingCreation: jest.fn(),
  removeIdentifiersPendingDeletion: jest.fn(),
  syncKeriaIdentifiers: jest.fn(),
};
const mockCredentialService = {
  syncKeriaCredentials: jest.fn(),
  removeCredentialsPendingDeletion: jest.fn(),
};
const mockMultiSigService = {
  processGroupsPendingCreation: jest.fn(),
};
const mockKeriaNotificationService = {
  stopPolling: stopPollingMock,
};
const mockIdentifierStorage = {
  getAllIdentifiers: getAllIdentifiersMock,
};
const mockCredentialStorage = {
  getAllCredentialMetadata: getAllCredentialsMock,
};
const mockConnectionStorage = {
  getAll: getAllConnectionsMock,
};
const mockNotificationStorage = {
  getAll: getAllNotificationsMock,
};

const mockEntropy = "00000000000000000000000000000000";

describe("KERIA connectivity", () => {
  let agent: Agent;
  let mockAgentUrls: AgentUrls;
  let mockSignifyClient: any;

  beforeEach(() => {
    mockSignifyClient = {
      boot: jest.fn(),
      connect: jest.fn(),
    };
    (SignifyClient as jest.Mock).mockImplementation(() => mockSignifyClient);
    agent = Agent.agent;
    (agent as any).basicStorageService = mockBasicStorageService;
    (agent as any).agentServicesProps = mockAgentServicesProps;
    (agent as any).connectionService = mockConnectionService;
    (agent as any).identifierService = mockIdentifierService;
    (agent as any).credentialService = mockCredentialService;
    (agent as any).multiSigService = mockMultiSigService;

    mockAgentUrls = {
      url: "http://127.0.0.1:3901",
      bootUrl: "http://127.0.0.1:3903",
    };
    Agent.isOnline = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw an error if boot fails", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockRejectedValueOnce(new Error("Boot error"));

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_BOOT_FAILED
    );
    expect(mockSignifyClient.connect).not.toHaveBeenCalled();
  });

  test("should throw an connection error if boot fetch failing", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockRejectedValueOnce(new Error("Failed to fetch"));

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_BOOT_FAILED_BAD_NETWORK
    );
    expect(mockSignifyClient.connect).not.toHaveBeenCalled();
  });

  test("should throw an error if boot result is not ok and status is not 409", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_BOOT_FAILED
    );
    expect(mockSignifyClient.connect).not.toHaveBeenCalled();
  });

  test("should throw an connection error if connect fetch failing", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({ ok: true });
    mockSignifyClient.connect.mockRejectedValueOnce(
      new Error("Failed to fetch")
    );

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_CONNECT_FAILED_BAD_NETWORK
    );

    expect(mockSignifyClient.boot).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
  });

  test("should throw an not booted error if connect fails after booting", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({ ok: true });
    mockSignifyClient.connect.mockRejectedValueOnce(
      new Error("Error - 404: agent does not exist for controller")
    );

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_NOT_BOOTED
    );

    expect(mockSignifyClient.boot).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
  });

  test("should throw an error if connect fails after booting", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({ ok: true });
    mockSignifyClient.connect.mockRejectedValueOnce(new Error("Connect error"));

    await expect(agent.bootAndConnect(mockAgentUrls)).rejects.toThrowError(
      Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT
    );

    expect(mockSignifyClient.boot).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
  });

  test("should boot and connect successfully if agent offline", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({ ok: true });
    mockSignifyClient.connect.mockResolvedValueOnce(true);
    SecureStorage.get = jest.fn().mockResolvedValueOnce(mockGetBranValue);
    mockConnectionService.removeConnectionsPendingDeletion = jest
      .fn()
      .mockReturnValue(["id1", "id2"]);
    mockConnectionService.resolvePendingConnections = jest
      .fn()
      .mockReturnValue(undefined);
    mockIdentifierService.removeIdentifiersPendingDeletion = jest
      .fn()
      .mockReturnValue(undefined);
    mockIdentifierService.processIdentifiersPendingCreation = jest
      .fn()
      .mockReturnValue(undefined);
    mockCredentialService.removeCredentialsPendingDeletion = jest
      .fn()
      .mockReturnValue(undefined);

    await agent.bootAndConnect(mockAgentUrls);

    expect(signifyReady).toHaveBeenCalled();
    expect(SignifyClient).toHaveBeenCalledWith(
      mockAgentUrls.url,
      mockGetBranValue,
      Tier.low,
      mockAgentUrls.bootUrl
    );
    expect(SecureStorage.get).toBeCalledWith(KeyStoreKeys.SIGNIFY_BRAN);
    expect(mockSignifyClient.boot).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
    expect(mockBasicStorageService.save).toBeCalledTimes(2);
    expect(Agent.isOnline).toBe(true);
    expect(mockAgentServicesProps.eventEmitter.emit).toBeCalledWith({
      type: EventTypes.KeriaStatusChanged,
      payload: {
        isOnline: true,
      },
    });
  });

  test("should ignore 409 already booted and continue to connect", async () => {
    (signifyReady as jest.Mock).mockResolvedValueOnce(true);
    mockSignifyClient.boot.mockResolvedValueOnce({
      ok: false,
      status: 409,
    });
    mockSignifyClient.connect.mockResolvedValueOnce(true);
    SecureStorage.get = jest.fn().mockResolvedValueOnce(mockGetBranValue);
    await agent.bootAndConnect(mockAgentUrls);

    expect(signifyReady).toHaveBeenCalled();
    expect(SignifyClient).toHaveBeenCalledWith(
      mockAgentUrls.url,
      mockGetBranValue,
      Tier.low,
      mockAgentUrls.bootUrl
    );
    expect(SecureStorage.get).toBeCalledWith(KeyStoreKeys.SIGNIFY_BRAN);
    expect(mockSignifyClient.boot).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
    expect(mockBasicStorageService.save).toBeCalledTimes(2);
    expect(Agent.isOnline).toBe(true);
    expect(mockAgentServicesProps.eventEmitter.emit).toBeCalledWith({
      type: EventTypes.KeriaStatusChanged,
      payload: {
        isOnline: true,
      },
    });
  });

  test("should not boot and connect if already online", async () => {
    Agent.isOnline = true;

    await agent.bootAndConnect(mockAgentUrls);

    expect(signifyReady).not.toHaveBeenCalled();
    expect(mockSignifyClient.boot).not.toHaveBeenCalled();
    expect(mockSignifyClient.connect).not.toHaveBeenCalled();
  });
});

describe("Recovery of DB from cloud sync", () => {
  let agent: Agent;
  let mockSeedPhrase: string[];
  let mockConnectUrl: string;
  let mockSignifyClient: any;

  beforeEach(() => {
    mockSignifyClient = {
      boot: jest.fn(),
      connect: jest.fn(),
    };
    (SignifyClient as jest.Mock).mockImplementation(() => mockSignifyClient);
    agent = Agent.agent;
    (agent as any).basicStorageService = mockBasicStorageService;
    (agent as any).agentServicesProps = mockAgentServicesProps;
    (agent as any).connectionService = mockConnectionService;

    mockSeedPhrase = [
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "abandon",
      "about",
    ];
    mockConnectUrl = "http://127.0.0.1:3901";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should recover the agent and connect successfully", async () => {
    mockSignifyClient.connect.mockResolvedValueOnce(undefined);
    SecureStorage.set = jest.fn().mockResolvedValueOnce(undefined);
    const branBuffer = Buffer.from(mockEntropy, "hex").slice(
      0,
      -Agent.BUFFER_ALLOC_SIZE
    );
    const expectedBran = branBuffer.toString("utf-8");
    (mnemonicToEntropy as jest.Mock).mockReturnValueOnce(mockEntropy);
    mockConnectionService.removeConnectionsPendingDeletion = jest
      .fn()
      .mockReturnValue(["id1", "id2"]);
    mockIdentifierService.removeIdentifiersPendingDeletion = jest
      .fn()
      .mockReturnValue(undefined);
    mockIdentifierService.processIdentifiersPendingCreation = jest
      .fn()
      .mockReturnValue(undefined);

    await agent.recoverKeriaAgent(mockSeedPhrase, mockConnectUrl);

    expect(SignifyClient).toHaveBeenCalledWith(
      mockConnectUrl,
      expectedBran,
      Tier.low
    );
    expect(mockConnectionService.syncKeriaContacts).toHaveBeenCalled();
    expect(mockIdentifierService.syncKeriaIdentifiers).toHaveBeenCalled();
    expect(mockCredentialService.syncKeriaCredentials).toHaveBeenCalled();
    expect(mockSignifyClient.connect).toHaveBeenCalled();
    expect(
      mockBasicStorageService.createOrUpdateBasicRecord
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MiscRecordId.CLOUD_RECOVERY_STATUS,
        content: { syncing: false },
      })
    );
    expect(SecureStorage.set).toHaveBeenCalledWith(
      KeyStoreKeys.SIGNIFY_BRAN,
      expectedBran
    );
  });

  test("should throw an error for invalid mnemonic", async () => {
    (mnemonicToEntropy as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Invalid mnemonic");
    });

    await expect(
      agent.recoverKeriaAgent(mockSeedPhrase, mockConnectUrl)
    ).rejects.toThrowError(Agent.INVALID_MNEMONIC);

    expect(mockSignifyClient.connect).not.toHaveBeenCalled();
    expect(SecureStorage.set).not.toHaveBeenCalled();
  });

  test("should throw KERIA_NOT_BOOTED error if agent is not booted", async () => {
    (mnemonicToEntropy as jest.Mock).mockReturnValueOnce(mockEntropy);
    (mnemonicToEntropy as jest.Mock).mockReturnValueOnce(mockEntropy);
    mockSignifyClient.connect.mockRejectedValueOnce(
      new Error("Error - 404: agent does not exist for controller")
    );

    await expect(
      agent.recoverKeriaAgent(mockSeedPhrase, mockConnectUrl)
    ).rejects.toThrowError(Agent.KERIA_NOT_BOOTED);

    expect(SecureStorage.set).not.toHaveBeenCalled();
  });

  test("should throw KERIA_BOOT_FAILED_BAD_NETWORK error if connect fetch failing", async () => {
    (mnemonicToEntropy as jest.Mock).mockReturnValueOnce(mockEntropy);
    (mnemonicToEntropy as jest.Mock).mockReturnValueOnce(mockEntropy);
    mockSignifyClient.connect.mockRejectedValueOnce(
      new Error("Failed to fetch")
    );

    await expect(
      agent.recoverKeriaAgent(mockSeedPhrase, mockConnectUrl)
    ).rejects.toThrowError(Agent.KERIA_CONNECT_FAILED_BAD_NETWORK);

    expect(SecureStorage.set).not.toHaveBeenCalled();
  });
});

describe("Agent setup and wiping", () => {
  let agent: Agent;
  let mockAgentUrls: AgentUrls;
  let mockSignifyClient: any;

  beforeEach(() => {
    // @TODO - foconnor: This method of mocking needs to change.
    mockSignifyClient = {
      boot: jest.fn(),
      connect: jest.fn(),
      identifiers: jest.fn().mockReturnValue({
        update: updateIdentifierMock,
      }),
      credentials: jest.fn().mockReturnValue({
        delete: deleteCredentialMock,
      }),
      contacts: jest.fn().mockReturnValue({
        delete: deleteContactMock,
      }),
      notifications: jest.fn().mockReturnValue({
        mark: markNotificationMock,
      }),
    };
    agent = Agent.agent;
    (agent as any).agentServicesProps = {
      ...mockAgentServicesProps,
      signifyClient: mockSignifyClient,
    };
    (agent as any).keriaNotificationService = mockKeriaNotificationService;
    (agent as any).identifierStorage = mockIdentifierStorage;
    (agent as any).credentialStorage = mockCredentialStorage;
    (agent as any).connectionStorage = mockConnectionStorage;
    (agent as any).notificationStorage = mockNotificationStorage;

    mockAgentUrls = {
      url: "http://127.0.0.1:3901",
      bootUrl: "http://127.0.0.1:3903",
    };
    Agent.isOnline = true;
  });

  test("can delete the entire wallet", async () => {
    PeerConnection.peerConnection.getConnectedDAppAddress = jest
      .fn()
      .mockReturnValue("");
    getAllIdentifiersMock.mockResolvedValue([
      { id: "identifier", displayName: "my-identifier" },
    ]);
    getAllCredentialsMock.mockResolvedValue([{ id: "credential-id" }]);
    getAllConnectionsMock.mockResolvedValue([{ id: "connection-id" }]);
    getAllNotificationsMock.mockResolvedValue([{ id: "note-id" }]);

    await Agent.agent.deleteAccount();

    expect(PeerConnection.peerConnection.disconnectDApp).not.toBeCalled();
    expect(stopPollingMock).toBeCalled();
    expect(updateIdentifierMock).toBeCalledWith("identifier", {
      name: `${IdentifierService.DELETED_IDENTIFIER_THEME}-my-salt:my-identifier`,
    });
    expect(deleteCredentialMock).toBeCalledWith("credential-id");
    expect(deleteContactMock).toBeCalledWith("connection-id");
    expect(markNotificationMock).toBeCalledWith("note-id");
    expect(wipeSessionMock).toBeCalledWith("idw");
    expect(SecureStorage.wipe).toBeCalled();
  });

  test("will disconnect dapp when deleting entire wallet", async () => {
    PeerConnection.peerConnection.getConnectedDAppAddress = jest
      .fn()
      .mockReturnValue("meerkat-id");
    getAllIdentifiersMock.mockResolvedValue([]);
    getAllCredentialsMock.mockResolvedValue([]);
    getAllConnectionsMock.mockResolvedValue([]);
    getAllNotificationsMock.mockResolvedValue([]);

    await agent.deleteAccount();

    expect(PeerConnection.peerConnection.disconnectDApp).toBeCalledWith(
      "meerkat-id",
      true
    );
    expect(stopPollingMock).toBeCalled();
    expect(wipeSessionMock).toBeCalledWith("idw");
    expect(SecureStorage.wipe).toBeCalled();
  });
});
