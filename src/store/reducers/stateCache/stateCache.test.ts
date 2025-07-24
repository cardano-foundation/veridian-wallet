import { PayloadAction } from "@reduxjs/toolkit";
import { PeerConnectionEventTypes } from "../../../core/cardano/walletConnect/peerConnection.types";
import { RoutePath } from "../../../routes";
import { OperationType } from "../../../ui/globals/types";
import { RootState } from "../../index";
import {
  AuthenticationCacheProps,
  CurrentRouteCacheProps,
  dequeueIncomingRequest,
  enqueueIncomingRequest,
  getAuthentication,
  getCurrentOperation,
  getCurrentRoute,
  getStateCache,
  initialState,
  login,
  logout,
  setAuthentication,
  setCurrentOperation,
  setCurrentRoute,
  setIsOnline,
  setPauseQueueIncomingRequest,
  setQueueIncomingRequest,
  showGenericError,
  StateCacheProps,
  stateCacheSlice,
  updateCurrentProfile,
} from "./stateCache";
import {
  IncomingRequestProps,
  IncomingRequestType,
  PeerConnectSigningEventRequest,
} from "./stateCache.types";
import {
  ConnectionStatus,
  CreationStatus,
} from "../../../core/agent/agent.types";
import { CredentialStatus } from "../../../core/agent/services/credentialService.types";
import { IdentifierType } from "../../../core/agent/services/identifier.types";
import { IdentifiersFilters } from "../../../ui/pages/Identifiers/Identifiers.types";
import { CredentialsFilters } from "../../../ui/pages/Credentials/Credentials.types";
import { CardListViewType } from "../../../ui/components/SwitchCardView/SwitchCardView.types";

// Mock the selectors
jest.mock("../identifiersCache", () => ({
  getIdentifiersCache: jest.fn(),
}));
jest.mock("../credsCache", () => ({
  getCredsCache: jest.fn(),
}));
jest.mock("../credsArchivedCache", () => ({
  getCredsArchivedCache: jest.fn(),
}));
jest.mock("../walletConnectionsCache", () => ({
  getWalletConnectionsCache: jest.fn(),
}));
jest.mock("../connectionsCache", () => ({
  getConnectionsCache: jest.fn(),
  getMultisigConnectionsCache: jest.fn(),
}));

// Import the mocked selectors
import { getIdentifiersCache } from "../identifiersCache";
import { getCredsCache } from "../credsCache";
import { getCredsArchivedCache } from "../credsArchivedCache";
import { getWalletConnectionsCache } from "../walletConnectionsCache";
import {
  getConnectionsCache,
  getMultisigConnectionsCache,
} from "../connectionsCache";

// Mock the setCurrentProfile action to spy on its calls
const mockSetCurrentProfile = jest.spyOn(
  stateCacheSlice.actions,
  "setCurrentProfile"
);

const signingRequest: PeerConnectSigningEventRequest = {
  type: IncomingRequestType.PEER_CONNECT_SIGN,
  signTransaction: {
    type: PeerConnectionEventTypes.PeerConnectSign,
    payload: {
      identifier: "a",
      payload: "tosign",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      approvalCallback: () => {},
    },
  },
  peerConnection: { meerkatId: "connection" },
};

const signingRequestB = { ...signingRequest };
signingRequestB.signTransaction.payload.identifier = "b";

const signingRequestC = { ...signingRequest };
signingRequestB.signTransaction.payload.identifier = "c";

describe("State Cache", () => {
  test("should return the initial state on first run", () => {
    expect(stateCacheSlice.reducer(undefined, {} as PayloadAction)).toEqual(
      initialState
    );
  });

  test("should set showGenericError", () => {
    const action = showGenericError(true);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.showGenericError).toEqual(true);
  });

  test("should set the current route cache", () => {
    const currentRoute: CurrentRouteCacheProps = {
      path: RoutePath.ONBOARDING,
      payload: {},
    };
    const action = setCurrentRoute(currentRoute);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.routes[0]).toEqual(currentRoute);
    expect(nextState).not.toBe(initialState);

    const rootState = { stateCache: nextState } as RootState;
    expect(getCurrentRoute(rootState)).toEqual(nextState.routes[0]);
    expect(getStateCache(rootState)).toEqual(nextState);
  });

  test("should set online status", () => {
    const action = setIsOnline(false);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.isOnline).toEqual(false);
  });

  test("should set the authentication cache", () => {
    const authentication: AuthenticationCacheProps = {
      loggedIn: false,
      userName: "",
      time: 0,
      passcodeIsSet: false,
      seedPhraseIsSet: false,
      passwordIsSet: false,
      passwordIsSkipped: false,
      ssiAgentIsSet: false,
      ssiAgentUrl: "",
      recoveryWalletProgress: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
      firstAppLaunch: false,
      defaultProfile: "",
    };
    const action = setAuthentication(authentication);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.authentication).toEqual(authentication);
    expect(nextState).not.toBe(initialState);

    const rootState = { stateCache: nextState } as RootState;
    expect(getAuthentication(rootState)).toEqual(nextState.authentication);
    expect(getStateCache(rootState)).toEqual(nextState);
  });

  test("should logout", () => {
    const action = logout();
    const nextState = stateCacheSlice.reducer(initialState, action);
    expect(nextState.authentication.loggedIn).toEqual(false);
    expect(nextState).not.toBe(initialState);
  });

  test("should login", () => {
    const action = login();
    const nextState = stateCacheSlice.reducer(initialState, action);
    expect(nextState.authentication.loggedIn).toEqual(true);
    expect(nextState).not.toBe(initialState);
  });

  test("should set the currentOperation cache", () => {
    const op = OperationType.SCAN_CONNECTION;
    const action = setCurrentOperation(op);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.currentOperation).toEqual(op);
    expect(nextState).not.toBe(initialState);

    const rootState = { stateCache: nextState } as RootState;
    expect(getCurrentOperation(rootState)).toEqual(nextState.currentOperation);
    expect(getStateCache(rootState)).toEqual(nextState);
  });

  test("should queue incoming request", () => {
    const action = setQueueIncomingRequest(signingRequest);
    const nextState = stateCacheSlice.reducer(initialState, action);
    expect(nextState.queueIncomingRequest.queues[0]).toEqual(signingRequest);
  });

  test("can batch incoming requests", () => {
    const initialStateMock: StateCacheProps = JSON.parse(
      JSON.stringify(initialState)
    );
    initialStateMock.queueIncomingRequest.queues = [signingRequest];
    const batchIncomingRequestProps: IncomingRequestProps[] = [
      signingRequestB,
      signingRequestC,
    ];
    const action = enqueueIncomingRequest(batchIncomingRequestProps);
    const nextState = stateCacheSlice.reducer(initialStateMock, action);
    expect(nextState.queueIncomingRequest.queues).toEqual([
      ...initialStateMock.queueIncomingRequest.queues,
      ...batchIncomingRequestProps,
    ]);
  });

  test("can dequeue incoming request", () => {
    const initialStateMock: StateCacheProps = JSON.parse(
      JSON.stringify(initialState)
    );
    initialStateMock.queueIncomingRequest.queues = [
      signingRequest,
      signingRequestB,
    ];
    const action = dequeueIncomingRequest();
    const nextState = stateCacheSlice.reducer(initialStateMock, action);
    expect(nextState.queueIncomingRequest.queues.length).toEqual(1);
    expect(nextState.queueIncomingRequest.isProcessing).toEqual(true);
  });

  test("can pause incoming request queue", () => {
    const action = setPauseQueueIncomingRequest(true);
    const nextState = stateCacheSlice.reducer(initialState, action);
    expect(nextState.queueIncomingRequest.isPaused).toEqual(true);
  });

  test("isProcessing should be false when isPause equal true", () => {
    const action1 = setPauseQueueIncomingRequest(true);
    const nextState1 = stateCacheSlice.reducer(initialState, action1);
    const action2 = setQueueIncomingRequest(signingRequest);
    const nextState2 = stateCacheSlice.reducer(nextState1, action2);
    expect(nextState2.queueIncomingRequest.isProcessing).toEqual(false);
    expect(nextState2.queueIncomingRequest.queues[0]).toEqual(signingRequest);
  });

  test("isProcessing should be true after dequeueCredentialRequest and queue still has elements", () => {
    const initialStateMock: StateCacheProps = JSON.parse(
      JSON.stringify(initialState)
    );
    initialStateMock.queueIncomingRequest.queues = [
      signingRequest,
      signingRequestB,
    ];
    const action = dequeueIncomingRequest();
    const nextState = stateCacheSlice.reducer(initialStateMock, action);
    expect(nextState.queueIncomingRequest.queues.length).toEqual(1);
    expect(nextState.queueIncomingRequest.isProcessing).toEqual(true);
  });

  test("should set defaultProfile in authentication cache", () => {
    const authentication: AuthenticationCacheProps = {
      loggedIn: true,
      userName: "testuser",
      time: Date.now(),
      passcodeIsSet: true,
      seedPhraseIsSet: true,
      passwordIsSet: true,
      passwordIsSkipped: false,
      ssiAgentIsSet: true,
      ssiAgentUrl: "",
      recoveryWalletProgress: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
      firstAppLaunch: false,
      defaultProfile: "profile-123",
    };
    const action = setAuthentication(authentication);
    const nextState = stateCacheSlice.reducer(initialState, action);

    expect(nextState.authentication.defaultProfile).toEqual("profile-123");
    expect(nextState.authentication).toEqual(authentication);

    const rootState = { stateCache: nextState } as RootState;
    expect(getAuthentication(rootState).defaultProfile).toEqual("profile-123");
    expect(getStateCache(rootState)).toEqual(nextState);
  });

  describe("setCurrentProfile", () => {
    test("should set the currentProfile with the provided payload", () => {
      const newProfilePayload = {
        identity: {
          id: "new-profile-id",
          displayName: "New Profile",
          createdAtUTC: "2024-01-01T00:00:00Z",
          theme: 2,
          creationStatus: CreationStatus.COMPLETE,
        },
        connections: [],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
      };
      const action =
        stateCacheSlice.actions.setCurrentProfile(newProfilePayload);
      const nextState = stateCacheSlice.reducer(initialState, action);

      expect(nextState.currentProfile).toEqual(newProfilePayload);
      expect(nextState).not.toBe(initialState);
    });
  });

  describe("updateCurrentProfile thunk", () => {
    const mockIdentifier = {
      id: "profile-id-1",
      displayName: "Test Profile",
      createdAtUTC: "2023-01-01T00:00:00Z",
      theme: 1,
      creationStatus: CreationStatus.COMPLETE,
    };

    const mockCredential = {
      id: "cred-id-1",
      issuanceDate: "2023-01-01T00:00:00Z",
      credentialType: "TestCredential",
      status: CredentialStatus.CONFIRMED,
      connectionId: "conn-id-1",
      schema: "test-schema",
      identifierId: "profile-id-1",
      identifierType: IdentifierType.Individual,
    };

    const mockArchivedCredential = {
      id: "archived-cred-id-1",
      issuanceDate: "2023-01-01T00:00:00Z",
      credentialType: "ArchivedCredential",
      status: CredentialStatus.REVOKED,
      connectionId: "conn-id-2",
      schema: "archived-test-schema",
      identifierId: "profile-id-1",
      identifierType: IdentifierType.Individual,
    };

    const mockPeerConnection = {
      meerkatId: "peer-conn-id-1",
      name: "Peer 1",
      url: "http://peer1.com",
      selectedAid: "profile-id-1",
    };

    const mockConnection = {
      id: "conn-id-1",
      label: "Connection 1",
      createdAtUTC: "2023-01-01T00:00:00Z",
      status: ConnectionStatus.CONFIRMED,
    };

    const mockMultisigConnection = {
      id: "multisig-conn-id-1",
      label: "Multisig Connection 1",
      createdAtUTC: "2023-01-01T00:00:00Z",
      status: ConnectionStatus.CONFIRMED,
      groupId: "group-id-1",
    };

    beforeEach(() => {
      // Reset mocks before each test
      (getIdentifiersCache as jest.Mock).mockClear();
      (getCredsCache as jest.Mock).mockClear();
      (getCredsArchivedCache as jest.Mock).mockClear();
      (getWalletConnectionsCache as jest.Mock).mockClear();
      (getConnectionsCache as jest.Mock).mockClear();
      (getMultisigConnectionsCache as jest.Mock).mockClear();
      mockSetCurrentProfile.mockClear();
    });

    test("should update currentProfile with data from other slices", async () => {
      const profileId = "profile-id-1";

      // Mock the return values of the selectors
      (getIdentifiersCache as jest.Mock).mockReturnValue({
        [profileId]: mockIdentifier,
      });
      (getCredsCache as jest.Mock).mockReturnValue([mockCredential]);
      (getCredsArchivedCache as jest.Mock).mockReturnValue([
        mockArchivedCredential,
      ]);
      (getWalletConnectionsCache as jest.Mock).mockReturnValue([
        mockPeerConnection,
      ]);
      (getConnectionsCache as jest.Mock).mockReturnValue({
        [mockConnection.id]: mockConnection,
      });
      (getMultisigConnectionsCache as jest.Mock).mockReturnValue({
        [mockMultisigConnection.id]: mockMultisigConnection,
      });

      // Create a mock store with a dispatch and getState function
      const mockStore = {
        dispatch: jest.fn(),
        getState: jest.fn(() => ({
          stateCache: initialState,
          seedPhraseCache: { seedPhrase: "", bran: "" },
          identifiersCache: {
            identifiers: { [profileId]: mockIdentifier },
            favourites: [],
            filters: IdentifiersFilters.All,
            multiSigGroup: undefined,
            openMultiSigId: undefined,
            scanGroupId: undefined,
            individualFirstFirstCreate: undefined,
          },
          credsCache: {
            creds: [mockCredential],
            favourites: [],
            filters: CredentialsFilters.All,
          },
          credsArchivedCache: { creds: [mockArchivedCredential] },
          connectionsCache: {
            connections: { [mockConnection.id]: mockConnection },
            multisigConnections: {
              [mockMultisigConnection.id]: mockMultisigConnection,
            },
          },
          walletConnectionsCache: {
            walletConnections: [mockPeerConnection],
            connectedWallet: null,
            pendingConnection: null,
            isConnecting: false,
            showConnectWallet: false,
          },
          viewTypeCache: {
            identifier: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
            credential: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
          },
          biometricsCache: { enableBiometrics: false, enabled: false },
          ssiAgentCache: { connectUrl: undefined, bootUrl: undefined },
          notificationsCache: { notifications: [] },
        })),
      };

      // Call the thunk
      await updateCurrentProfile(profileId)(
        mockStore.dispatch,
        mockStore.getState,
        undefined
      );

      // Assert that setCurrentProfile was dispatched with the correct payload
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        stateCacheSlice.actions.setCurrentProfile({
          identity: {
            id: mockIdentifier.id,
            displayName: mockIdentifier.displayName,
            createdAtUTC: mockIdentifier.createdAtUTC,
            theme: mockIdentifier.theme,
            creationStatus: mockIdentifier.creationStatus,
          },
          connections: [mockConnection],
          multisigConnections: [mockMultisigConnection],
          peerConnections: [mockPeerConnection],
          credentials: [mockCredential],
          archivedCredentials: [mockArchivedCredential],
        })
      );
    });

    test("should not update currentProfile if identifier is not found", async () => {
      const profileId = "non-existent-profile";

      (getIdentifiersCache as jest.Mock).mockReturnValue({}); // No identifiers

      const mockStore = {
        dispatch: jest.fn(),
        getState: jest.fn(() => ({
          stateCache: initialState,
          seedPhraseCache: { seedPhrase: "", bran: "" },
          identifiersCache: {
            identifiers: {},
            favourites: [],
            filters: IdentifiersFilters.All,
            multiSigGroup: undefined,
            openMultiSigId: undefined,
            scanGroupId: undefined,
            individualFirstCreate: undefined,
          },
          credsCache: {
            creds: [],
            favourites: [],
            filters: CredentialsFilters.All,
          },
          credsArchivedCache: { creds: [] },
          walletConnectionsCache: {
            walletConnections: [],
            connectedWallet: null,
            pendingConnection: null,
            isConnecting: false,
            showConnectWallet: false,
          },
          connectionsCache: { connections: {}, multisigConnections: {} },
          viewTypeCache: {
            identifier: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
            credential: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
          },
          biometricsCache: { enableBiometrics: false, enabled: false },
          ssiAgentCache: { connectUrl: undefined, bootUrl: undefined },
          notificationsCache: { notifications: [] },
        })),
      };

      await expect(
        updateCurrentProfile(profileId)(
          mockStore.dispatch,
          mockStore.getState,
          undefined
        )
      ).rejects.toThrow(`Profile with id ${profileId} not found.`);

      expect(mockStore.dispatch).not.toHaveBeenCalledWith(
        stateCacheSlice.actions.setCurrentProfile(expect.any(Object))
      );
    });

    test("should filter credentials and connections based on profileId", async () => {
      const profileId = "profile-id-1";
      const otherProfileId = "profile-id-2";

      const mockIdentifier2 = { ...mockIdentifier, id: otherProfileId };
      const mockCredential2 = {
        ...mockCredential,
        identifierId: otherProfileId,
        id: "cred-id-2",
      };
      const mockArchivedCredential2 = {
        ...mockArchivedCredential,
        identifierId: otherProfileId,
        id: "archived-cred-id-2",
      };
      const mockPeerConnection2 = {
        ...mockPeerConnection,
        selectedAid: otherProfileId,
        meerkatId: "peer-conn-id-2",
      };

      (getIdentifiersCache as jest.Mock).mockReturnValue({
        [profileId]: mockIdentifier,
        [otherProfileId]: mockIdentifier2,
      });
      (getCredsCache as jest.Mock).mockReturnValue([
        mockCredential,
        mockCredential2,
      ]);
      (getCredsArchivedCache as jest.Mock).mockReturnValue([
        mockArchivedCredential,
        mockArchivedCredential2,
      ]);
      (getWalletConnectionsCache as jest.Mock).mockReturnValue([
        mockPeerConnection,
        mockPeerConnection2,
      ]);
      (getConnectionsCache as jest.Mock).mockReturnValue({
        [mockConnection.id]: mockConnection,
      });
      (getMultisigConnectionsCache as jest.Mock).mockReturnValue({
        [mockMultisigConnection.id]: mockMultisigConnection,
      });

      const mockStore = {
        dispatch: jest.fn(),
        getState: jest.fn(() => ({
          stateCache: initialState,
          seedPhraseCache: { seedPhrase: "", bran: "" },
          identifiersCache: {
            identifiers: {
              [profileId]: mockIdentifier,
              [otherProfileId]: mockIdentifier2,
            },
            favourites: [],
            filters: IdentifiersFilters.All,
            multiSigGroup: undefined,
            openMultiSigId: undefined,
            scanGroupId: undefined,
            individualFirstCreate: undefined,
          },
          credsCache: {
            creds: [mockCredential, mockCredential2],
            favourites: [],
            filters: CredentialsFilters.All,
          },
          credsArchivedCache: {
            creds: [mockArchivedCredential, mockArchivedCredential2],
          },
          walletConnectionsCache: {
            walletConnections: [mockPeerConnection, mockPeerConnection2],
            connectedWallet: null,
            pendingConnection: null,
            isConnecting: false,
            showConnectWallet: false,
          },
          connectionsCache: {
            connections: { [mockConnection.id]: mockConnection },
            multisigConnections: {
              [mockMultisigConnection.id]: mockMultisigConnection,
            },
          },
          viewTypeCache: {
            identifier: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
            credential: { viewType: CardListViewType.Stack, favouriteIndex: 0 },
          },
          biometricsCache: { enableBiometrics: false, enabled: false },
          ssiAgentCache: { connectUrl: undefined, bootUrl: undefined },
          notificationsCache: { notifications: [] },
        })),
      };

      await updateCurrentProfile(profileId)(
        mockStore.dispatch,
        mockStore.getState,
        undefined
      );

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        stateCacheSlice.actions.setCurrentProfile({
          identity: {
            id: mockIdentifier.id,
            displayName: mockIdentifier.displayName,
            createdAtUTC: mockIdentifier.createdAtUTC,
            theme: mockIdentifier.theme,
            creationStatus: mockIdentifier.creationStatus,
          },
          connections: [mockConnection],
          multisigConnections: [mockMultisigConnection],
          peerConnections: [mockPeerConnection],
          credentials: [mockCredential],
          archivedCredentials: [mockArchivedCredential],
        })
      );
    });
  });
});
