import { Agent } from "../../agent/agent";
import {
  PeerConnectSigningEvent,
  PeerConnectionEventTypes,
  TxSignError,
} from "./peerConnection.types";
import { CoreEventEmitter } from "../../agent/event";
require("fake-indexeddb/auto");
import { IdentityWalletConnect } from "./identityWalletConnect"; // Adjust the path accordingly

jest.mock("../../agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getConnectionShortDetailById: jest.fn(),
        getMultisigLinkedContacts: jest.fn(),
        getOobi: jest.fn(),
      },
      identifiers: {
        updateIdentifier: jest.fn(),
        getIdentifier: jest.fn(),
        getSigner: jest.fn(),
      },
      getKeriaOnlineStatus: jest.fn(),
      isSeedPhraseVerified: jest.fn().mockResolvedValue(true),
      isVerificationMandatory: jest.fn().mockResolvedValue(false),
      recordCriticalAction: jest.fn(),
    },
  },
}));

const walletInfo = {
  name: "Test Wallet",
  version: "1.0.0",
  icon: "",
  requestAutoconnect: false,
};
const selectedAid = "ELToRvQwhQ299vCk9GFMhggSdLHAAarm6LG8tyemik9G";
const seed = "test-seed";
const announce = ["announce-1", "announce-2"];
const eventServiceMock = new CoreEventEmitter();
const identityWalletConnect = new IdentityWalletConnect(
  walletInfo,
  seed,
  announce,
  selectedAid,
  eventServiceMock
);
describe("IdentityWalletConnect", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test("should return OOBI if identifier is located", async () => {
    const mockIdentifier = { id: "id" };
    Agent.agent.identifiers.getIdentifier = jest
      .fn()
      .mockResolvedValue(mockIdentifier);
    Agent.agent.connections.getOobi = jest.fn().mockResolvedValue("test-oobi");

    const result = await identityWalletConnect.getKeriIdentifier();
    expect(result.oobi).toBe("test-oobi");
    expect(result.id).toBe(selectedAid);
  });

  test("should sign payload if approved", async () => {
    const identifier = "test-identifier";
    const payload = "test-payload";
    const mockSigner = {
      sign: jest.fn().mockReturnValue({ qb64: "signed-payload" }),
    };

    Agent.agent.identifiers.getSigner = jest.fn().mockResolvedValue(mockSigner);
    eventServiceMock.emit = jest
      .fn()
      .mockImplementation((event: PeerConnectSigningEvent) => {
        event.payload.approvalCallback(true);
      });

    const result = await identityWalletConnect.signKeri(identifier, payload);
    expect(result).toBe("signed-payload");
  });

  test("should return timeout error if signing takes too long", async () => {
    const identifier = "test-identifier";
    const payload = "test-payload";

    const mockApprovalCallback = jest.fn();

    eventServiceMock.emit = jest.fn();
    jest.spyOn(global.Date, "now").mockImplementationOnce(() => 1);
    const result = await identityWalletConnect.signKeri(identifier, payload);
    expect(result).toEqual({ error: TxSignError.TimeOut });
    expect(eventServiceMock.emit).toHaveBeenCalledWith({
      type: PeerConnectionEventTypes.PeerConnectSign,
      payload: {
        identifier,
        payload,
        approvalCallback: expect.any(Function),
      },
    });
    expect(mockApprovalCallback).not.toHaveBeenCalled();
  });

  test("should return user declined error if approval is false", async () => {
    const identifier = "test-identifier";
    const payload = "test-payload";

    eventServiceMock.emit = jest
      .fn()
      .mockImplementation((event: PeerConnectSigningEvent) => {
        event.payload.approvalCallback(false);
      });

    const result = await identityWalletConnect.signKeri(identifier, payload);
    expect(result).toEqual({ error: TxSignError.UserDeclined });
  });
});
