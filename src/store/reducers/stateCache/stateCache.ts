import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import {
  AnyAction,
  createSlice,
  PayloadAction,
  ThunkAction,
} from "@reduxjs/toolkit";
import { Salter } from "signify-ts";
import { CreationStatus } from "../../../core/agent/agent.types";
import { LoginAttempts } from "../../../core/agent/services/auth.types";
import { OperationType, ToastMsgType } from "../../../ui/globals/types";
import { RootState } from "../../index";
import {
  getConnectionsCache,
  getMultisigConnectionsCache,
} from "../connectionsCache";
import { getCredsArchivedCache } from "../credsArchivedCache";
import { getCredsCache } from "../credsCache";
import { getIdentifiersCache } from "../identifiersCache";
import { getNotificationsCache } from "../notificationsCache";
import { getWalletConnectionsCache } from "../walletConnectionsCache";
import {
  AuthenticationCacheProps,
  CurrentRouteCacheProps,
  IncomingRequestProps,
  InitializationPhase,
  StateCacheProps,
} from "./stateCache.types";
import { filterProfileData } from "./utils";

const initialState: StateCacheProps = {
  initializationPhase: InitializationPhase.PHASE_ZERO,
  recoveryCompleteNoInterruption: false,
  isOnline: false,
  routes: [],
  currentProfile: {
    identity: {
      id: "",
      displayName: "",
      createdAtUTC: "",
      theme: 0,
      // TODO: default status ??
      creationStatus: CreationStatus.PENDING,
    },
    connections: [],
    multisigConnections: [],
    peerConnections: [],
    credentials: [],
    archivedCredentials: [],
    notifications: [],
  },
  profileHistories: [],
  authentication: {
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
    firstAppLaunch: true,
  },
  currentOperation: OperationType.IDLE,
  queueIncomingRequest: {
    isProcessing: false,
    queues: [],
    isPaused: false,
  },
  toastMsgs: [],
  forceInitApp: 0,
};

const stateCacheSlice = createSlice({
  name: "stateCache",
  initialState,
  reducers: {
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setInitializationPhase: (
      state,
      action: PayloadAction<InitializationPhase>
    ) => {
      state.initializationPhase = action.payload;
    },
    setRecoveryCompleteNoInterruption: (state) => {
      state.recoveryCompleteNoInterruption = true;
    },
    setCurrentRoute: (state, action: PayloadAction<CurrentRouteCacheProps>) => {
      const filteredRoutes = state.routes.filter(
        (route) => action.payload.path !== route.path
      );
      state.routes = [action.payload, ...filteredRoutes];
    },
    removeCurrentRoute: (state) => {
      state.routes = state.routes.slice(1);
    },
    removeRoute: (state, action: PayloadAction<string>) => {
      state.routes = state.routes.filter(
        (route) => route.path !== action.payload
      );
    },
    resetAllRoutes: (state) => {
      state.routes = [];
    },
    setLoginAttempt: (state, action: PayloadAction<LoginAttempts>) => {
      state.authentication.loginAttempt = { ...action.payload };
    },
    setFirstAppLaunchComplete: (state) => {
      state.authentication.firstAppLaunch = false;
    },
    login: (state) => {
      state.authentication = {
        ...state.authentication,
        loggedIn: true,
      };
    },
    logout: (state) => {
      state.authentication = {
        ...state.authentication,
        loggedIn: false,
      };
    },
    setAuthentication: (
      state,
      action: PayloadAction<AuthenticationCacheProps>
    ) => {
      state.authentication = action.payload;
    },
    setCurrentOperation: (state, action: PayloadAction<OperationType>) => {
      state.currentOperation = action.payload;
    },
    setToastMsg: (state, action: PayloadAction<ToastMsgType>) => {
      if (
        state.isSetupProfile &&
        action.payload === ToastMsgType.IDENTIFIER_UPDATED
      )
        return;

      state.toastMsgs = [
        {
          id: new Salter({}).qb64,
          message: action.payload,
        },
        ...(state.toastMsgs || []),
      ];
    },
    removeToastMessage: (state, action: PayloadAction<string>) => {
      state.toastMsgs = state.toastMsgs.filter(
        (item) => item.id !== action.payload
      );
    },
    setPauseQueueIncomingRequest: (state, action: PayloadAction<boolean>) => {
      state.queueIncomingRequest = {
        ...state.queueIncomingRequest,
        isPaused: action.payload,
        isProcessing: !action.payload,
      };
    },
    setQueueIncomingRequest: (
      state,
      action: PayloadAction<IncomingRequestProps>
    ) => {
      const isPaused = state.queueIncomingRequest.isPaused;
      if (!isPaused && !state.queueIncomingRequest.isProcessing) {
        state.queueIncomingRequest.isProcessing = true;
      }
      state.queueIncomingRequest.queues.push(action.payload);
    },
    dequeueIncomingRequest: (state) => {
      if (state.queueIncomingRequest.queues.length > 0) {
        state.queueIncomingRequest.queues.shift();
        const isPaused = state.queueIncomingRequest.isPaused;
        state.queueIncomingRequest.isProcessing = isPaused
          ? false
          : state.queueIncomingRequest.queues.length > 0;
      }
    },
    enqueueIncomingRequest: (
      state,
      action: PayloadAction<IncomingRequestProps[]>
    ) => {
      const isPaused = state.queueIncomingRequest.isPaused;
      if (
        isPaused &&
        !state.queueIncomingRequest.isProcessing &&
        action.payload.length > 0
      ) {
        state.queueIncomingRequest.isProcessing = true;
      }
      state.queueIncomingRequest.queues =
        state.queueIncomingRequest.queues.concat(action.payload);
    },
    setCameraDirection: (
      state,
      action: PayloadAction<LensFacing | undefined>
    ) => {
      state.cameraDirection = action.payload;
    },
    showGenericError: (state, action: PayloadAction<boolean | undefined>) => {
      state.showGenericError = action.payload;
    },
    showGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.showLoading = action.payload;
    },
    showNoWitnessAlert: (state, action: PayloadAction<boolean | undefined>) => {
      state.showNoWitnessAlert = action.payload;
    },
    clearStateCache: (state) => {
      return {
        ...initialState,
        forceInitApp: (state.forceInitApp || 0) + 1,
      };
    },
    setIsSetupProfile: (state, action: PayloadAction<boolean | undefined>) => {
      state.isSetupProfile = action.payload;
    },
    setCurrentProfile: (
      state,
      action: PayloadAction<StateCacheProps["currentProfile"]>
    ) => {
      state.currentProfile = action.payload;
    },
    setProfileHistories: (state, action: PayloadAction<string[]>) => {
      state.profileHistories = action.payload;
    },
  },
});

const {
  setInitializationPhase,
  setRecoveryCompleteNoInterruption,
  setCurrentRoute,
  removeCurrentRoute,
  removeRoute,
  resetAllRoutes,
  login,
  logout,
  setAuthentication,
  setCurrentOperation,
  setToastMsg,
  dequeueIncomingRequest,
  setQueueIncomingRequest,
  setPauseQueueIncomingRequest,
  enqueueIncomingRequest,
  setIsOnline,
  setLoginAttempt,
  setFirstAppLaunchComplete,
  setCameraDirection,
  showGenericError,
  removeToastMessage,
  showNoWitnessAlert,
  clearStateCache,
  showGlobalLoading,
  setIsSetupProfile,
  setCurrentProfile,
  setProfileHistories,
} = stateCacheSlice.actions;

const updateCurrentProfile =
  (profileId: string): ThunkAction<void, RootState, unknown, AnyAction> =>
    async (dispatch, getState) => {
      const state = getState();
      const identifiers = getIdentifiersCache(state);

      if (!identifiers || !identifiers[profileId]) {
        throw new Error(`Profile with id ${profileId} not found.`);
      }

      const profileData = identifiers[profileId];
      const allCreds = getCredsCache(state);
      const allArchivedCreds = getCredsArchivedCache(state);
      const allPeerConnections = getWalletConnectionsCache(state);
      const allConnections = getConnectionsCache(state);
      const allMultisigConnections = getMultisigConnectionsCache(state);
      const allNotifications = getNotificationsCache(state);

      const {
        profileIdentifier,
        profileCredentials,
        profileArchivedCredentials,
        profilePeerConnections,
        profileNotifications,
      } = filterProfileData(
        identifiers,
        allCreds,
        allArchivedCreds,
        allPeerConnections,
        allNotifications,
        profileId
      );

      const newProfile: StateCacheProps["currentProfile"] = {
        identity: {
          id: profileIdentifier.id,
          displayName: profileData.displayName,
          createdAtUTC: profileIdentifier.createdAtUTC,
          theme: profileIdentifier.theme,
          creationStatus: profileIdentifier.creationStatus,
        },
        // TODO: add filtering for connections once we have connections per account merged
        connections: Object.values(allConnections),
        multisigConnections: Object.values(allMultisigConnections),
        peerConnections: profilePeerConnections,
        credentials: profileCredentials,
        archivedCredentials: profileArchivedCredentials,
        notifications: profileNotifications,
      };
      dispatch(setCurrentProfile(newProfile));
    };

const getStateCache = (state: RootState) => state.stateCache;
const getInitializationPhase = (state: RootState) =>
  state.stateCache.initializationPhase;
const getRecoveryCompleteNoInterruption = (state: RootState) =>
  state.stateCache.recoveryCompleteNoInterruption;
const getRoutes = (state: RootState) => state.stateCache.routes;
const getCurrentRoute = (state: RootState) =>
  state.stateCache.routes.length ? state.stateCache.routes[0] : undefined;
const getAuthentication = (state: RootState) => state.stateCache.authentication;
const getCurrentOperation = (state: RootState) =>
  state.stateCache.currentOperation;
const getToastMsgs = (state: RootState) => state.stateCache.toastMsgs;
const getQueueIncomingRequest = (state: RootState) =>
  state.stateCache.queueIncomingRequest;
const getIsOnline = (state: RootState) => state.stateCache.isOnline;
const getLoginAttempt = (state: RootState) =>
  state.stateCache.authentication.loginAttempt;
const getFirstAppLaunch = (state: RootState) =>
  state.stateCache.authentication.firstAppLaunch;
const getCameraDirection = (state: RootState) =>
  state.stateCache.cameraDirection;
const getShowCommonError = (state: RootState) =>
  state.stateCache.showGenericError;
const getShowNoWitnessAlert = (state: RootState) =>
  state.stateCache.showNoWitnessAlert;
const getToastMgs = (state: RootState) => state.stateCache.toastMsgs;
const getForceInitApp = (state: RootState) => state.stateCache.forceInitApp;
const getGlobalLoading = (state: RootState) => state.stateCache.showLoading;
const getShowSetupProfilePage = (state: RootState) =>
  state.stateCache.isSetupProfile;
const getCurrentProfile = (state: RootState) => state.stateCache.currentProfile;
const getProfileHistories = (state: RootState) =>
  state.stateCache.profileHistories;

export type {
  AuthenticationCacheProps,
  CurrentRouteCacheProps,
  StateCacheProps
};

export {
  clearStateCache,
  dequeueIncomingRequest,
  enqueueIncomingRequest,
  getAuthentication,
  getCameraDirection,
  getCurrentOperation, getCurrentProfile, getCurrentRoute,
  getFirstAppLaunch,
  getForceInitApp,
  getGlobalLoading,
  getInitializationPhase,
  getIsOnline,
  getLoginAttempt,
  getProfileHistories,
  getQueueIncomingRequest,
  getRecoveryCompleteNoInterruption,
  getRoutes,
  getShowCommonError,
  getShowNoWitnessAlert,
  getShowSetupProfilePage,
  getStateCache,
  getToastMgs,
  getToastMsgs, initialState,
  login,
  logout,
  removeCurrentRoute,
  removeRoute,
  removeToastMessage,
  resetAllRoutes, setAuthentication,
  setCameraDirection,
  setCurrentOperation, setCurrentProfile, setCurrentRoute,
  setFirstAppLaunchComplete,
  setInitializationPhase,
  setIsOnline,
  setIsSetupProfile,
  setLoginAttempt,
  setPauseQueueIncomingRequest,
  setProfileHistories,
  setQueueIncomingRequest,
  setRecoveryCompleteNoInterruption,
  setToastMsg,
  showGenericError,
  showGlobalLoading,
  showNoWitnessAlert,
  stateCacheSlice,
  updateCurrentProfile
};

