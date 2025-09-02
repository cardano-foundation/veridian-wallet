import { RootState } from "../../store";
import { Profile, ProfileCache } from "../../store/reducers/profileCache";
import { InitializationPhase } from "../../store/reducers/stateCache/stateCache.types";
import { OperationType } from "../globals/types";
import { CredentialsFilters } from "../pages/Credentials/Credentials.types";
import { filteredArchivedCredsFix, filteredCredsFix } from "./filteredCredsFix";
import { filteredIdentifierFix } from "./filteredIdentifierFix";
import { notificationsFix } from "./notificationsFix";
import { walletConnectionsFix } from "./walletConnectionsFix";

export const profileInitFixData: ProfileCache = {
  profiles: {},
  recentProfiles: [],
  multiSigGroup: undefined,
};

export const defaultProfileIdentifierFix = filteredIdentifierFix[0];

export const profilesCachesFix = filteredIdentifierFix.reduce(
  (result, identifier) => {
    result[identifier.id] = {
      identity: identifier,
      connections: [],
      multisigConnections: [],
      peerConnections: walletConnectionsFix.filter(
        (item) => item.selectedAid === identifier.id
      ),
      credentials: filteredCredsFix.filter(
        (item) => item.identifierId === identifier.id
      ),
      archivedCredentials: filteredArchivedCredsFix.filter(
        (item) => item.identifierId === identifier.id
      ),
      notifications: notificationsFix.filter(
        (item) => item.receivingPre === identifier.id
      ),
    };

    return result;
  },
  {} as Record<string, Profile>
);

export const recentProfilesDataFix = filteredIdentifierFix
  .map((identifier) => identifier.id)
  .filter((item) => item !== filteredIdentifierFix[0].id);

export const profileCacheFixData: ProfileCache = {
  profiles: {
    ...profilesCachesFix,
  },
  defaultProfile: filteredIdentifierFix[0].id,
  recentProfiles: [...recentProfilesDataFix],
  multiSigGroup: undefined,
};

export const defaultProfileDataFix =
  profilesCachesFix[filteredIdentifierFix[0].id];

export const storeStateFixData: RootState = {
  stateCache: {
    isOnline: true,
    initializationPhase: InitializationPhase.PHASE_TWO,
    recoveryCompleteNoInterruption: false,
    routes: [],
    authentication: {
      loggedIn: false,
      userName: "",
      time: 0,
      passcodeIsSet: false,
      seedPhraseIsSet: false,
      passwordIsSet: false,
      passwordIsSkipped: true,
      ssiAgentIsSet: false,
      ssiAgentUrl: "",
      recoveryWalletProgress: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
      firstAppLaunch: false,
    },
    currentOperation: OperationType.IDLE,
    queueIncomingRequest: {
      isProcessing: false,
      queues: [],
      isPaused: false,
    },
    toastMsgs: [],
    pendingJoinGroupMetadata: null,
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  connectionsCache: {
    connections: {},
    multisigConnections: {},
  },
  walletConnectionsCache: {
    connectedWallet: null,
    pendingConnection: null,
  },
  viewTypeCache: {
    credential: {
      viewType: null,
      favouriteIndex: 0,
      favourites: [],
      filters: CredentialsFilters.All,
    },
  },
  biometricsCache: {
    enabled: false,
  },
  ssiAgentCache: {
    bootUrl: "",
    connectUrl: "",
  },
  profilesCache: {
    ...profileCacheFixData,
  },
};
