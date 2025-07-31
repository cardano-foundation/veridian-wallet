import { CreationStatus } from "../../core/agent/agent.types";
import { RootState } from "../../store";
import { Profile, ProfileCache } from "../../store/reducers/profileCache";
import { InitializationPhase } from "../../store/reducers/stateCache/stateCache.types";
import { OperationType } from "../globals/types";
import { CredentialsFilters } from "../pages/Credentials/Credentials.types";
import { filteredCredsFix } from "./filteredCredsFix";
import { filteredIdentifierFix } from "./filteredIdentifierFix";
import { notificationsFix } from "./notificationsFix";

export const profileInitFixData: ProfileCache = {
  profiles: {},
  recentProfiles: [],
};

export const defaultProfileIdentifierFix = filteredIdentifierFix[0];

export const profilesCachesFix = filteredIdentifierFix.reduce(
  (result, identifier) => {
    result[identifier.id] = {
      identity: identifier,
      connections: [],
      multisigConnections: [],
      peerConnections: [],
      credentials: filteredCredsFix.filter(
        (item) => item.identifierId === identifier.id
      ),
      archivedCredentials: [],
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
    currentProfile: {
      identity: {
        id: "",
        displayName: "",
        createdAtUTC: "",
        theme: 0,
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
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  identifiersCache: {
    identifiers: {},
    multiSigGroup: {
      groupId: "",
      connections: [],
    },
  },
  credsArchivedCache: { creds: [] },
  connectionsCache: {
    connections: {},
    multisigConnections: {},
  },
  walletConnectionsCache: {
    walletConnections: [],
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
