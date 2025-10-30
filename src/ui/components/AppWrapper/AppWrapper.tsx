import { TapJacking } from "@capacitor-community/tap-jacking";
import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import { Device } from "@capacitor/device";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionStatus,
  MiscRecordId,
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import {
  AcdcStateChangedEvent,
  ConnectionStateChangedEvent,
} from "../../../core/agent/event.types";
import { BasicRecord } from "../../../core/agent/records";
import { IdentifierService } from "../../../core/agent/services";
import { CredentialStatus } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import {
  PeerConnectedEvent,
  PeerConnectionBrokenEvent,
  PeerConnectSigningEvent,
  PeerDisconnectedEvent,
} from "../../../core/cardano/walletConnect/peerConnection.types";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import {
  DAppConnection,
  getConnectedDApp,
  Profile,
  setConnectedDApp,
  setCurrentProfile,
  setIndividualFirstCreate,
  setIsConnectingToDApp,
  setPendingDAppConnection,
  setProfiles,
  updateOrAddConnectionCache,
  updateOrAddCredsCache,
  updatePeerConnectionsFromCore,
  updateRecentProfiles,
} from "../../../store/reducers/profileCache";
import {
  getAuthentication,
  getForceInitApp,
  getInitializationPhase,
  getIsOnline,
  getRecoveryCompleteNoInterruption,
  setAuthentication,
  setCameraDirection,
  setCurrentOperation,
  setInitializationPhase,
  setIsOnline,
  setIsSetupProfile,
  setPauseQueueIncomingRequest,
  setPendingJoinGroupMetadata,
  setQueueIncomingRequest,
  setToastMsg,
  showNoWitnessAlert,
} from "../../../store/reducers/stateCache";
import {
  IncomingRequestType,
  InitializationPhase,
  PendingJoinGroupMetadata,
} from "../../../store/reducers/stateCache/stateCache.types";
import { filterProfileData } from "../../../store/reducers/stateCache/utils";
import {
  setCredentialFavouriteIndex,
  setCredentialsFilters,
  setCredentialViewTypeCache,
  setFavouritesCredsCache,
} from "../../../store/reducers/viewTypeCache";
import { FavouriteCredential } from "../../../store/reducers/viewTypeCache/viewTypeCache.types";
import { OperationType, ToastMsgType } from "../../globals/types";
import { BIOMETRIC_SERVER_KEY } from "../../hooks/useBiometricsHook";
import { useProfile } from "../../hooks/useProfile";
import { CredentialsFilters } from "../../pages/Credentials/Credentials.types";
import { showError } from "../../utils/error";
import { Alert } from "../Alert";
import { CardListViewType } from "../SwitchCardView";
import "./AppWrapper.scss";
import {
  groupCreatedHandler,
  identifierAddedHandler,
  notificationStateChanged,
  operationCompleteHandler,
  operationFailureHandler,
} from "./coreEventListeners";
import { useActivityTimer } from "./hooks/useActivityTimer";
import { logSyncService, SyncMode } from "../../../core/services/LogSyncService";
import { logger } from "../../../utils/logger/Logger";
import { formatErrorContext } from "../../../utils/logger/loggerUtils";

const connectionStateChangedHandler = async (
  event: ConnectionStateChangedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (event.payload.status === ConnectionStatus.PENDING) {
    if (event.payload.isMultiSigInvite) return;

    dispatch(
      updateOrAddConnectionCache({
        id: event.payload.connectionId || "",
        contactId: event.payload.connectionId || "",
        identifier: event.payload.identifier || "",
        label: event.payload.label || "",
        status: event.payload.status,
        createdAtUTC: new Date().toString(),
      })
    );
    dispatch(setToastMsg(ToastMsgType.CONNECTION_REQUEST_PENDING));
    logger.debug("Connection request pending:", { connectionId: event.payload.connectionId, identifier: event.payload.identifier });
  } else {
    // @TODO - foconnor: Should be able to just update Redux without fetching from DB.
    const connectionRecordId = event.payload.connectionId;
    const identifier = event.payload.identifier;
    if (!connectionRecordId || !identifier) {
      return;
    }
    const connectionDetails =
      await Agent.agent.connections.getConnectionShortDetailById(
        connectionRecordId,
        identifier
      );
    dispatch(updateOrAddConnectionCache(connectionDetails));
    dispatch(setToastMsg(ToastMsgType.NEW_CONNECTION_ADDED));
    logger.debug("Connection updated:", { connectionId: connectionDetails.id, label: connectionDetails.label });
  }
};

const acdcChangeHandler = async (
  event: AcdcStateChangedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (event.payload.status === CredentialStatus.PENDING) {
    dispatch(setToastMsg(ToastMsgType.CREDENTIAL_REQUEST_PENDING));
    dispatch(updateOrAddCredsCache(event.payload.credential));
    logger.debug("Credential request pending:", { credentialId: event.payload.credential.id });
  } else if (event.payload.status === CredentialStatus.REVOKED) {
    dispatch(updateOrAddCredsCache(event.payload.credential));
  } else {
    dispatch(updateOrAddCredsCache(event.payload.credential));
    dispatch(setToastMsg(ToastMsgType.NEW_CREDENTIAL_ADDED));
    logger.debug("New credential added:", { credentialId: event.payload.credential.id, schemaId: event.payload.credential.schema });
  }
};

const peerConnectRequestSignChangeHandler = async (
  event: PeerConnectSigningEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  const connectedDAppAddress =
    PeerConnection.peerConnection.getConnectedDAppAddress();
  const peerConnectionRecord =
    await Agent.agent.peerConnectionPair.getPeerConnection(
      `${connectedDAppAddress}:${event.payload.identifier}`
    );

  if (peerConnectionRecord) {
    const peerConnection: DAppConnection = {
      meerkatId: peerConnectionRecord.meerkatId,
      name: peerConnectionRecord.name,
      url: peerConnectionRecord.url,
      createdAt: peerConnectionRecord.createdAt,
      iconB64: peerConnectionRecord.iconB64,
      selectedAid: peerConnectionRecord.selectedAid,
    };

    dispatch(
      setQueueIncomingRequest({
        signTransaction: event,
        peerConnection,
        type: IncomingRequestType.PEER_CONNECT_SIGN,
      })
    );
    logger.debug("Queueing peer connect sign request:", { dAppAddress: connectedDAppAddress, identifier: event.payload.identifier });
  }
};

const peerConnectedChangeHandler = async (
  event: PeerConnectedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  try {
    const existingConnections =
      await Agent.agent.peerConnectionPair.getAllPeerConnectionAccount();

    dispatch(updatePeerConnectionsFromCore(existingConnections));
    const newConnectionId = `${event.payload.dAppAddress}:${event.payload.identifier}`;
    const connectedWallet = existingConnections.find(
      (connection) =>
        `${connection.meerkatId}:${connection.selectedAid}` === newConnectionId
    );
    if (connectedWallet) {
      dispatch(setConnectedDApp(connectedWallet));
    }
    dispatch(setPendingDAppConnection(null));
    dispatch(setIsConnectingToDApp(false));
    dispatch(setToastMsg(ToastMsgType.CONNECT_WALLET_SUCCESS));
  } catch (error) {
    logger.error("Error handling peer connected event:", formatErrorContext(error));
    dispatch(setIsConnectingToDApp(false));
  }
};

const peerDisconnectedChangeHandler = async (
  event: PeerDisconnectedEvent,
  connectedWalletId: string | null,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  // The connectedWalletId is a composite key (dAppAddress:accountId),
  // while the event only provides the dAppAddress.
  if (
    connectedWalletId &&
    connectedWalletId.includes(event.payload.dAppAddress)
  ) {
    dispatch(setConnectedDApp(null));
    dispatch(setIsConnectingToDApp(false));
    dispatch(setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS));
  }
};

const peerConnectionBrokenChangeHandler = async (
  event: PeerConnectionBrokenEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  logger.debug("Peer connection broken event received.", { event });
  dispatch(setConnectedDApp(null));
  dispatch(setIsConnectingToDApp(false));
  dispatch(setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS));
};

const AppWrapper = (props: { children: ReactNode }) => {
  const isOnline = useAppSelector(getIsOnline);
  const dispatch = useAppDispatch();
  const authentication = useAppSelector(getAuthentication);
  const connectedDApp = useAppSelector(getConnectedDApp);
  const initializationPhase = useAppSelector(getInitializationPhase);
  const recoveryCompleteNoInterruption = useAppSelector(
    getRecoveryCompleteNoInterruption
  );
  const forceInitApp = useAppSelector(getForceInitApp);
  const [isAlertPeerBrokenOpen, setIsAlertPeerBrokenOpen] = useState(false);
  const { getRecentDefaultProfile, updateProfileHistories } = useProfile();
  useActivityTimer();

  const setOnlineStatus = useCallback(
    (value: boolean) => {
      dispatch(setIsOnline(value));
      logger.debug("Online status changed:", { isOnline: value });
    },
    [dispatch]
  );

  const checkWitness = useCallback(async () => {
    if (!authentication.ssiAgentIsSet || !isOnline) return;

    try {
      await Agent.agent.identifiers.getAvailableWitnesses();
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes(
          IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE
        ) ||
          e.message.includes(
            IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION
          ))
      ) {
        dispatch(showNoWitnessAlert(true));
        logger.warn("Witness check failed: Insufficient or misconfigured agent witnesses.", formatErrorContext(e));
        return;
      }

      logger.error("Unexpected error during witness check:", formatErrorContext(e));
      throw e;
    }
  }, [authentication.ssiAgentIsSet, dispatch, isOnline]);

  useEffect(() => {
    checkWitness();
  }, [checkWitness]);

  useEffect(() => {
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceInitApp]);

  useEffect(() => {
    const tapjack = async () => {
      if ((await Device.getInfo()).platform === "android") {
        await TapJacking.preventOverlays();
        logger.debug("TapJacking prevention applied for Android.");
      }
    };
    tapjack();
  }, []);

  useEffect(() => {
    if (authentication.loggedIn) {
      dispatch(setPauseQueueIncomingRequest(!isOnline));
      logger.debug("Incoming request queue pause state set:", { paused: !isOnline, loggedIn: authentication.loggedIn });
    } else {
      dispatch(setPauseQueueIncomingRequest(true));
      logger.debug("Incoming request queue paused: user not logged in.");
    }
  }, [isOnline, authentication.loggedIn, dispatch]);

  useEffect(() => {
    if (initializationPhase === InitializationPhase.PHASE_TWO) {
      if (authentication.loggedIn) {
        Agent.agent.keriaNotifications.startPolling();
        logger.debug("Keria notifications polling started.");
      } else {
        Agent.agent.keriaNotifications.stopPolling();
        logger.debug("Keria notifications polling stopped.");
      }
    }
  }, [authentication.loggedIn, initializationPhase]);

  useEffect(() => {
    if (initializationPhase === InitializationPhase.PHASE_TWO) {
      if (authentication.loggedIn) {
        if (logSyncService.syncMode === SyncMode.Auto) {
          logSyncService.start();
          logger.debug("Log synchronization service started.");
        }
      } else {
        logSyncService.stop();
        logger.debug("Log synchronization service stopped.");
      }
    }
    return () => {
      logSyncService.stop();
    };
  }, [authentication.loggedIn, initializationPhase]);

  useEffect(() => {
    if (!connectedDApp?.meerkatId) {
      return;
    }

    const eventHandler = async (event: PeerDisconnectedEvent) => {
      peerDisconnectedChangeHandler(event, connectedDApp.meerkatId, dispatch);
    };

    PeerConnection.peerConnection.onPeerDisconnectedStateChanged(eventHandler);

    return () => {
      PeerConnection.peerConnection.offPeerDisconnectedStateChanged(
        eventHandler
      );
    };
  }, [connectedDApp?.meerkatId, dispatch]);

  useEffect(() => {
    if (recoveryCompleteNoInterruption) {
      loadDb();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryCompleteNoInterruption]);

  useEffect(() => {
    const startAgent = async () => {
      // This small pause allows the LockPage to close fully in the UI before starting the agent.
      // Starting the agent causes the UI to freeze up in JS, so visually a jumpy spinner is better than
      // being momentarily frozen on entering the last diget of pincode and also having a (shorter) jumpy spinner.
      await new Promise((resolve) => setTimeout(resolve, 25));

      try {
        await Agent.agent.start(authentication.ssiAgentUrl);
        await recoverAndLoadDb();
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === Agent.KERIA_CONNECT_FAILED_BAD_NETWORK
        ) {
          dispatch(setInitializationPhase(InitializationPhase.PHASE_TWO)); // Show offline mode page

          // No await, background this task and continue initializing
          Agent.agent
            .connect(Agent.DEFAULT_RECONNECT_INTERVAL, false)
            .then(() => {
              recoverAndLoadDb();
            });
        } else {
          logger.error("Error starting agent:", formatErrorContext(e));
          throw e;
        }
      }
    };

    if (authentication.ssiAgentUrl && !authentication.firstAppLaunch) {
      startAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authentication.ssiAgentUrl, authentication.firstAppLaunch]);

  const loadDatabase = async () => {
    try {
      const allConnections = await Agent.agent.connections.getConnections();
      const allMultisigConnections =
        await Agent.agent.connections.getMultisigConnections();
      const credsCache = await Agent.agent.credentials.getCredentials();
      const credsArchivedCache = await Agent.agent.credentials.getCredentials(
        true
      );
      const storedIdentifiers = await Agent.agent.identifiers.getIdentifiers();
      const storedPeerConnections =
        await Agent.agent.peerConnectionPair.getAllPeerConnectionAccount();

      const notifications =
        await Agent.agent.keriaNotifications.getNotifications();

      // TODO: load current profile after load database
      const appDefaultProfileRecord = await Agent.agent.basicStorage.findById(
        MiscRecordId.DEFAULT_PROFILE
      );

      const profileHistoriesRecord = await Agent.agent.basicStorage.findById(
        MiscRecordId.PROFILE_HISTORIES
      );

      const profileHistories = profileHistoriesRecord
        ? (profileHistoriesRecord.content.value as string[])
        : [];

      if (profileHistories) {
        dispatch(updateRecentProfiles(profileHistories));
      }

      const identifiersDict = storedIdentifiers.reduce(
        (acc: Record<string, IdentifierShortDetails>, identifier) => {
          acc[identifier.id] = identifier;
          return acc;
        },
        {}
      );

      const profiles = storedIdentifiers.reduce(
        (acc: Record<string, Profile>, identifier) => {
          const {
            profileIdentifier,
            profileCredentials,
            profileArchivedCredentials,
            profileConnections,
            profileMultisigConnections,
            profilePeerConnections,
            profileNotifications,
          } = filterProfileData(
            identifiersDict,
            credsCache,
            credsArchivedCache,
            allConnections as RegularConnectionDetails[],
            allMultisigConnections as MultisigConnectionDetails[],
            storedPeerConnections,
            notifications,
            identifier
          );

          acc[identifier.id] = {
            identity: profileIdentifier,
            connections: profileConnections,
            multisigConnections: profileMultisigConnections,
            peerConnections: profilePeerConnections,
            credentials: profileCredentials,
            archivedCredentials: profileArchivedCredentials,
            notifications: profileNotifications,
          };

          return acc;
        },
        {}
      );

      let currentProfileAid = "";
      if (appDefaultProfileRecord) {
        currentProfileAid = (
          appDefaultProfileRecord.content as { defaultProfile: string }
        ).defaultProfile;
      } else {
        const { recentProfile, newProfileHistories } = getRecentDefaultProfile(
          profileHistories,
          profiles,
          ""
        );

        if (recentProfile) {
          currentProfileAid = recentProfile;
          updateProfileHistories(newProfileHistories);
        } else {
          if (storedIdentifiers.length > 0) {
            // If we have no default profile set, we will set the oldest identifier as default.
            const oldest = storedIdentifiers
              .slice()
              .sort((prev, next) =>
                prev.displayName.localeCompare(next.displayName)
              )[0];

            currentProfileAid = oldest?.id || "";

            await Agent.agent.basicStorage.createOrUpdateBasicRecord(
              new BasicRecord({
                id: MiscRecordId.DEFAULT_PROFILE,
                content: { defaultProfile: currentProfileAid },
              })
            );
          }
        }
      }

      dispatch(setProfiles(profiles));
      dispatch(setCurrentProfile(currentProfileAid));
    } catch (e) {
      logger.error("Failed to load database data:", formatErrorContext(e));
      showError("Failed to load database data", e, dispatch);
      return;
    }
    logger.info("Database loaded.");
  };

  const loadCacheBasicStorage = async () => {
    try {
      let credentialsSelectedFilter: CredentialsFilters =
        CredentialsFilters.All;
      const passcodeIsSet = await SecureStorage.keyExists(
        KeyStoreKeys.APP_PASSCODE
      );
      const seedPhraseIsSet = await SecureStorage.keyExists(
        KeyStoreKeys.SIGNIFY_BRAN
      );

      const passwordIsSet = await SecureStorage.keyExists(
        KeyStoreKeys.APP_OP_PASSWORD
      );
      const keriaConnectUrlRecord = await Agent.agent.basicStorage.findById(
        MiscRecordId.KERIA_CONNECT_URL
      );

      const recoveryWalletProgress = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_RECOVERY_WALLET
      );

      const credsFavourites = await Agent.agent.basicStorage.findById(
        MiscRecordId.CREDS_FAVOURITES
      );
      if (credsFavourites) {
        dispatch(
          setFavouritesCredsCache(
            credsFavourites.content.favourites as FavouriteCredential[]
          )
        );
      }

      const credViewType = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_CRED_VIEW_TYPE
      );

      if (credViewType) {
        dispatch(
          setCredentialViewTypeCache(
            credViewType.content.viewType as CardListViewType
          )
        );
      }

      const credentialsFilters = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_CRED_SELECTED_FILTER
      );
      if (credentialsFilters) {
        credentialsSelectedFilter = credentialsFilters.content
          .filter as CredentialsFilters;
      }
      if (credentialsSelectedFilter) {
        dispatch(setCredentialsFilters(credentialsSelectedFilter));
      }

      const appBiometrics = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_BIOMETRY
      );
      if (appBiometrics) {
        dispatch(
          setEnableBiometricsCache(appBiometrics.content.enabled as boolean)
        );
      }

      const credFavouriteIndex = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_CRED_FAVOURITE_INDEX
      );

      if (credFavouriteIndex) {
        dispatch(
          setCredentialFavouriteIndex(
            Number(credFavouriteIndex.content.favouriteIndex)
          )
        );
      }

      const cameraDirection = await Agent.agent.basicStorage.findById(
        MiscRecordId.CAMERA_DIRECTION
      );

      if (cameraDirection) {
        dispatch(
          setCameraDirection(cameraDirection.content.value as LensFacing)
        );
      }

      const firstInstall = await Agent.agent.basicStorage.findById(
        MiscRecordId.IS_SETUP_PROFILE
      );

      if (firstInstall) {
        dispatch(setIsSetupProfile(firstInstall.content.value as boolean));
      }

      const passwordSkipped = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_PASSWORD_SKIPPED
      );

      const loginAttempt = await Agent.agent.auth.getLoginAttempts();

      const individualFirstCreate = await Agent.agent.basicStorage.findById(
        MiscRecordId.INDIVIDUAL_FIRST_CREATE
      );

      if (individualFirstCreate) {
        dispatch(
          setIndividualFirstCreate(
            individualFirstCreate.content.value as boolean
          )
        );
      }

      const finishSetupBiometrics = await Agent.agent.basicStorage.findById(
        MiscRecordId.BIOMETRICS_SETUP
      );

      const pendingJoinGroupMetadata = await Agent.agent.basicStorage.findById(
        MiscRecordId.PENDING_JOIN_GROUP_METADATA
      );

      const isPendingJoinGroupMetadata = (
        data: unknown
      ): data is PendingJoinGroupMetadata => {
        return (
          typeof data === "object" &&
          data !== null &&
          typeof (data as Record<string, unknown>).isPendingJoinGroup ===
            "boolean" &&
          typeof (data as Record<string, unknown>).groupId === "string" &&
          typeof (data as Record<string, unknown>).groupName === "string"
        );
      };

      if (pendingJoinGroupMetadata) {
        const content = pendingJoinGroupMetadata.content;

        if (isPendingJoinGroupMetadata(content)) {
          dispatch(
            setPendingJoinGroupMetadata({
              isPendingJoinGroup: content.isPendingJoinGroup,
              groupId: content.groupId,
              groupName: content.groupName,
              initiatorName: content.initiatorName || null,
              connection: content.connection,
            })
          );
        }
      }

      dispatch(
        setAuthentication({
          ...authentication,
          passcodeIsSet,
          seedPhraseIsSet,
          passwordIsSet,
          passwordIsSkipped: !!passwordSkipped?.content.value,
          ssiAgentIsSet:
            !!keriaConnectUrlRecord && !!keriaConnectUrlRecord.content.url,
          ssiAgentUrl: (keriaConnectUrlRecord?.content?.url as string) ?? "",
          recoveryWalletProgress: !!recoveryWalletProgress?.content.value,
          loginAttempt,
          finishSetupBiometrics: !!finishSetupBiometrics?.content
            .value as boolean,
        })
      );

      logger.debug("Cache loaded.");
      return {
        keriaConnectUrlRecord,
      };
    } catch (e) {
      logger.error("Failed to load cache data:", formatErrorContext(e));
      showError("Failed to load cache data", e, dispatch);
      throw e;
    }
  };

  const setupEventServiceCallbacks = () => {
    Agent.agent.onKeriaStatusStateChanged((event) => {
      setOnlineStatus(event.payload.isOnline);
    });

    Agent.agent.connections.onConnectionStateChanged((event) => {
      return connectionStateChangedHandler(event, dispatch);
    });

    Agent.agent.credentials.onAcdcStateChanged((event) => {
      return acdcChangeHandler(event, dispatch);
    });

    PeerConnection.peerConnection.onPeerConnectRequestSignStateChanged(
      async (event) => {
        return peerConnectRequestSignChangeHandler(event, dispatch);
      }
    );
    PeerConnection.peerConnection.onPeerConnectedStateChanged(async (event) => {
      return peerConnectedChangeHandler(event, dispatch);
    });
    PeerConnection.peerConnection.onPeerConnectionBrokenStateChanged(
      async (event) => {
        setIsAlertPeerBrokenOpen(true);
        return peerConnectionBrokenChangeHandler(event, dispatch);
      }
    );

    Agent.agent.keriaNotifications.onNewNotification((event) => {
      notificationStateChanged(event, dispatch);
    });
    Agent.agent.keriaNotifications.onRemoveNotification((event) => {
      notificationStateChanged(event, dispatch);
    });
    Agent.agent.keriaNotifications.onLongOperationSuccess((event) => {
      operationCompleteHandler(event.payload, dispatch);
    });
    Agent.agent.keriaNotifications.onLongOperationFailure((event) => {
      operationFailureHandler(event.payload, dispatch);
    });

    Agent.agent.identifiers.onIdentifierAdded((event) => {
      identifierAddedHandler(event, dispatch);
    });

    Agent.agent.multiSigs.onGroupAdded((event) => {
      groupCreatedHandler(event, dispatch);
    });
  };

  const initApp = async () => {
    await Agent.agent.setupLocalDependencies();

    // Keystore wiped after re-installs so iOS is consistent with Android.
    const initState = await Agent.agent.basicStorage.findById(
      MiscRecordId.APP_ALREADY_INIT
    );

    if (!initState) {
      await SecureStorage.wipe();
      const platforms = (await Device.getInfo()).platform;
      if (platforms.includes("ios") || platforms.includes("android")) {
        await NativeBiometric.deleteCredentials({
          server: BIOMETRIC_SERVER_KEY,
        });
      }
    }

    // This will skip the onboarding screen with dev mode.
    if (process.env.DEV_SKIP_ONBOARDING === "true") {
      await Agent.agent.devPreload();
    }

    const { keriaConnectUrlRecord } = await loadCacheBasicStorage();

    // Ensure online/offline callback setup before connecting to KERIA
    setupEventServiceCallbacks();

    // Begin background polling of KERIA or local DB items
    // If we are still onboarding or in offline mode, won't call KERIA until online
    Agent.agent.keriaNotifications.pollNotifications();
    Agent.agent.keriaNotifications.pollLongOperations();

    dispatch(
      setInitializationPhase(
        keriaConnectUrlRecord?.content?.url
          ? InitializationPhase.PHASE_ONE
          : InitializationPhase.PHASE_TWO
      )
    );
    logger.debug("Wallet initialized.");
  };

  const recoverAndLoadDb = async () => {
    // Show spinner in case recovery takes time
    dispatch(setInitializationPhase(InitializationPhase.PHASE_ONE));
    const recoveryStatus = await Agent.agent.basicStorage.findById(
      MiscRecordId.CLOUD_RECOVERY_STATUS
    );
    if (recoveryStatus?.content?.syncing) {
      await Agent.agent.syncWithKeria();
    }

    await loadDb();
  };

  const loadDb = async () => {
    await loadDatabase();
    Agent.agent.markAgentStatus(true);
    dispatch(setInitializationPhase(InitializationPhase.PHASE_TWO));
  };

  return (
    <>
      {props.children}
      <Alert
        isOpen={isAlertPeerBrokenOpen}
        setIsOpen={setIsAlertPeerBrokenOpen}
        dataTestId="alert-confirm-connection-broken"
        headerText={i18n.t("connectdapp.connectionbrokenalert.message")}
        confirmButtonText={`${i18n.t(
          "connectdapp.connectionbrokenalert.confirm"
        )}`}
        actionConfirm={() => dispatch(setCurrentOperation(OperationType.IDLE))}
        actionDismiss={() => dispatch(setCurrentOperation(OperationType.IDLE))}
      />
    </>
  );
};

export {
  acdcChangeHandler,
  AppWrapper,
  connectionStateChangedHandler,
  peerConnectedChangeHandler,
  peerConnectionBrokenChangeHandler,
  peerConnectRequestSignChangeHandler,
  peerDisconnectedChangeHandler,
};
