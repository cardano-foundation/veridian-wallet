import { PayloadAction } from "@reduxjs/toolkit";
import { CreationStatus } from "../../../core/agent/agent.types";
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
} from "./stateCache";
import {
  IncomingRequestProps,
  IncomingRequestType,
  PeerConnectSigningEventRequest,
} from "./stateCache.types";

const signingRequest: PeerConnectSigningEventRequest = {
  type: IncomingRequestType.PEER_CONNECT_SIGN,
  signTransaction: {
    type: PeerConnectionEventTypes.PeerConnectSign,
    payload: {
      identifier: "a",
      payload: "tosign",
      approvalCallback: () => undefined,
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
});
