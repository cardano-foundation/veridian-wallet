import { IdentityWalletConnect } from "./identityWalletConnect";
import { Agent } from "../../agent/agent";
import { PeerConnectionPairRecord } from "../../agent/records";
import { PeerConnection } from "./peerConnection";
import { KeyStoreKeys, SecureStorage } from "../../storage";
import ICON_BASE64 from "../../../assets/icon-only";
require("fake-indexeddb/auto");

jest.mock("../../agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getConnectionShortDetailById: jest.fn(),
        getMultisigLinkedContacts: jest.fn(),
        getOobi: jest.fn(),
      },
      identifiers: {
        getIdentifier: jest.fn(),
        updateIdentifier: jest.fn(),
      },
      getKeriaOnlineStatus: jest.fn(),
      isSeedPhraseVerified: jest.fn().mockResolvedValue(true),
      peerConnectionPair: {
        getPeerConnection: jest.fn(),
        createPeerConnectionPairRecord: jest.fn(),
      },
    },
  },
}));
const EXISTING_KEY = "keythatexists";
const EXISTING_VALUE = "valuethatexists";

jest.mock("../../storage", () => ({
  SecureStorage: {
    get: jest.fn((options: { key: string }) => {
      if (options.key === EXISTING_KEY) {
        return Promise.resolve({ value: EXISTING_VALUE });
      }
      return Promise.resolve({ value: null });
    }),
    set: jest.fn(),
    remove: jest.fn(),
  },
  KeyStoreKeys: {
    MEERKAT_SEED: "app-meerkat-seed",
  },
}));

describe("PeerConnection", () => {
  let peerConnection: PeerConnection;

  beforeEach(() => {
    peerConnection = PeerConnection.peerConnection;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create a new PeerConnection instance", () => {
    expect(peerConnection).toBeInstanceOf(PeerConnection);
  });

  test("should throw error if we call connect from a DApp when the peer connection hasn't started", async () => {
    const dAppIdentifier = "testDApp";
    await expect(
      peerConnection.connectWithDApp(dAppIdentifier)
    ).rejects.toThrow(PeerConnection.PEER_CONNECTION_START_PENDING);
  });

  test("should throw error if we call disconnect from a DApp when the peer connection hasn't started", () => {
    const dAppIdentifier = "testDApp";
    expect(() => peerConnection.disconnectDApp(dAppIdentifier)).toThrow(
      PeerConnection.PEER_CONNECTION_START_PENDING
    );
  });

  test("should start a connection", async () => {
    const selectedAid = "testAid";
    jest.spyOn(SecureStorage, "get").mockResolvedValue("seed");

    await peerConnection.start(selectedAid);

    expect(SecureStorage.get).toHaveBeenCalledWith(KeyStoreKeys.MEERKAT_SEED);
  });

  test("should connect with a DApp if there is not existing connection", async () => {
    const dAppIdentifier = "testDApp";
    const accountId = "testAid";
    const peerConnectionId = `${dAppIdentifier}:${accountId}`;
    Agent.agent.identifiers.getIdentifier = jest.fn().mockResolvedValue({
      id: accountId,
    });
    Agent.agent.connections.getOobi = jest.fn().mockResolvedValue("test-oobi");
    Agent.agent.peerConnectionPair.getPeerConnection = jest
      .fn()
      .mockResolvedValue(undefined);
    const connectSpy = jest
      .spyOn(IdentityWalletConnect.prototype, "connect")
      .mockReturnValue("seed");

    await peerConnection.start(accountId);
    await peerConnection.connectWithDApp(peerConnectionId);
    expect(
      Agent.agent.peerConnectionPair.getPeerConnection
    ).toHaveBeenCalledWith(peerConnectionId);
    expect(
      Agent.agent.peerConnectionPair.createPeerConnectionPairRecord
    ).toHaveBeenCalledWith({
      id: `${dAppIdentifier}:${accountId}`,
      selectedAid: accountId,
      iconB64: expect.any(String),
    });
    expect(connectSpy).toHaveBeenCalledWith(dAppIdentifier);
    expect(SecureStorage.set).toHaveBeenCalledWith(
      KeyStoreKeys.MEERKAT_SEED,
      "seed"
    );
  });

  test("should connect with a DApp if there is an existing connection", async () => {
    const dAppIdentifier = "testDApp";
    const accountId = "testAid";
    const peerConnectionId = `${dAppIdentifier}:${accountId}`;
    Agent.agent.peerConnectionPair.getPeerConnection = jest
      .fn()
      .mockResolvedValue({} as PeerConnectionPairRecord);
    const connectSpy = jest
      .spyOn(IdentityWalletConnect.prototype, "connect")
      .mockReturnValue("seed");

    await peerConnection.start(accountId);
    await peerConnection.connectWithDApp(peerConnectionId);
    expect(
      Agent.agent.peerConnectionPair.getPeerConnection
    ).toHaveBeenCalledWith(peerConnectionId);
    expect(
      Agent.agent.peerConnectionPair.createPeerConnectionPairRecord
    ).not.toBeCalled();
    expect(connectSpy).toHaveBeenCalledWith(dAppIdentifier);
    expect(SecureStorage.set).toHaveBeenCalledWith(
      KeyStoreKeys.MEERKAT_SEED,
      "seed"
    );
  });

  test("should throw an error if there is an error from getPeerConnectionMetadata", async () => {
    const dAppIdentifier = "testDApp";
    Agent.agent.peerConnectionPair.getPeerConnection = jest
      .fn()
      .mockRejectedValue(new Error("error"));
    const connectSpy = jest
      .spyOn(IdentityWalletConnect.prototype, "connect")
      .mockReturnValue("seed");

    await peerConnection.start("testAid");
    await expect(
      peerConnection.connectWithDApp(dAppIdentifier)
    ).rejects.toThrow(new Error("error"));
    expect(connectSpy).not.toHaveBeenCalledWith(dAppIdentifier);
    expect(SecureStorage.set).not.toHaveBeenCalledWith(
      KeyStoreKeys.MEERKAT_SEED,
      "seed"
    );
  });

  test("should disconnect from a DApp", () => {
    const dAppIdentifier = "testDApp";
    const disconnectSpy = jest
      .spyOn(IdentityWalletConnect.prototype, "disconnect")
      .mockReturnValue();

    peerConnection.start("testAid");
    peerConnection.disconnectDApp(dAppIdentifier);
    expect(disconnectSpy).toHaveBeenCalledWith(dAppIdentifier);
  });

  test("should return the connected DApp address", () => {
    peerConnection.start("testAid");
    expect(peerConnection.getConnectedDAppAddress()).toBe("");
  });

  test("should return the connecting Aid", async () => {
    peerConnection.start("testAid");
    expect((await peerConnection.getConnectingIdentifier()).id).toBe("testAid");
  });
});
