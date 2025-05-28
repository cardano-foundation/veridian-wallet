import { TapJacking } from "@capacitor-community/tap-jacking";
import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import { Device } from "@capacitor/device";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionStatus,
  MiscRecordId,
} from "../../../core/agent/agent.types";
import {
  AcdcStateChangedEvent,
  ConnectionStateChangedEvent,
} from "../../../core/agent/event.types";
import { IdentifierService } from "../../../core/agent/services";
import { CredentialStatus } from "../../../core/agent/services/credentialService.types";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import {
  PeerConnectSigningEvent,
  PeerConnectedEvent,
  PeerConnectionBrokenEvent,
  PeerDisconnectedEvent,
} from "../../../core/cardano/walletConnect/peerConnection.types";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import {
  setConnectionsCache,
  setMultisigConnectionsCache,
  updateOrAddConnectionCache,
} from "../../../store/reducers/connectionsCache";
import { setCredsArchivedCache } from "../../../store/reducers/credsArchivedCache";
import {
  setCredentialsFilters,
  setCredsCache,
  setFavouritesCredsCache,
  updateOrAddCredsCache,
} from "../../../store/reducers/credsCache";
import {
  setFavouritesIdentifiersCache,
  setIdentifiersCache,
  setIdentifiersFilters,
  setIndividualFirstCreate,
} from "../../../store/reducers/identifiersCache";
import { FavouriteIdentifier } from "../../../store/reducers/identifiersCache/identifiersCache.types";
import { setNotificationsCache } from "../../../store/reducers/notificationsCache";
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
  setPauseQueueIncomingRequest,
  setQueueIncomingRequest,
  setShowWelcomePage,
  setToastMsg,
  showNoWitnessAlert,
} from "../../../store/reducers/stateCache";
import {
  IncomingRequestType,
  InitializationPhase,
} from "../../../store/reducers/stateCache/stateCache.types";
import {
  setCredentialViewTypeCache,
  setIdentifierFavouriteIndex,
  setIdentifierViewTypeCache,
} from "../../../store/reducers/viewTypeCache";
import {
  getConnectedWallet,
  setConnectedWallet,
  setPendingConnection,
  setWalletConnectionsCache,
} from "../../../store/reducers/walletConnectionsCache";
import { OperationType, ToastMsgType } from "../../globals/types";
import { CredentialsFilters } from "../../pages/Credentials/Credentials.types";
import { IdentifiersFilters } from "../../pages/Identifiers/Identifiers.types";
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

const connectionStateChangedHandler = async (
  event: ConnectionStateChangedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (event.payload.status === ConnectionStatus.PENDING) {
    if (event.payload.isMultiSigInvite) return;

    dispatch(
      updateOrAddConnectionCache({
        id: event.payload.connectionId || "",
        label: event.payload.label || "",
        status: event.payload.status,
        createdAtUTC: new Date().toString(),
      })
    );
    dispatch(setToastMsg(ToastMsgType.CONNECTION_REQUEST_PENDING));
  } else {
    // @TODO - foconnor: Should be able to just update Redux without fetching from DB.
    const connectionRecordId = event.payload.connectionId!;
    const connectionDetails =
      await Agent.agent.connections.getConnectionShortDetailById(
        connectionRecordId
      );
    dispatch(updateOrAddConnectionCache(connectionDetails));
    dispatch(setToastMsg(ToastMsgType.NEW_CONNECTION_ADDED));
  }
};

const acdcChangeHandler = async (
  event: AcdcStateChangedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (event.payload.status === CredentialStatus.PENDING) {
    dispatch(setToastMsg(ToastMsgType.CREDENTIAL_REQUEST_PENDING));
    dispatch(updateOrAddCredsCache(event.payload.credential));
  } else if (event.payload.status === CredentialStatus.REVOKED) {
    dispatch(updateOrAddCredsCache(event.payload.credential));
  } else {
    dispatch(updateOrAddCredsCache(event.payload.credential));
    dispatch(setToastMsg(ToastMsgType.NEW_CREDENTIAL_ADDED));
  }
};

const peerConnectRequestSignChangeHandler = async (
  event: PeerConnectSigningEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  const connectedDAppAddress =
    PeerConnection.peerConnection.getConnectedDAppAddress();
  const peerConnection =
    await Agent.agent.peerConnectionMetadataStorage.getPeerConnection(
      connectedDAppAddress
    );
  dispatch(
    setQueueIncomingRequest({
      signTransaction: event,
      peerConnection,
      type: IncomingRequestType.PEER_CONNECT_SIGN,
    })
  );
};

const peerConnectedChangeHandler = async (
  event: PeerConnectedEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  const existingConnections =
    await Agent.agent.peerConnectionMetadataStorage.getAllPeerConnectionMetadata();
  dispatch(setWalletConnectionsCache(existingConnections));
  const connectedWallet = existingConnections.find(
    (connection) => connection.id === event.payload.dAppAddress
  );
  if (connectedWallet) {
    dispatch(setConnectedWallet(connectedWallet));
  }
  dispatch(setPendingConnection(null));
  dispatch(setToastMsg(ToastMsgType.CONNECT_WALLET_SUCCESS));
};

const peerDisconnectedChangeHandler = async (
  event: PeerDisconnectedEvent,
  connectedMeerKat: string | null,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (connectedMeerKat === event.payload.dAppAddress) {
    dispatch(setConnectedWallet(null));
    dispatch(setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS));
  }
};

const peerConnectionBrokenChangeHandler = async (
  event: PeerConnectionBrokenEvent,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  dispatch(setConnectedWallet(null));
  dispatch(setToastMsg(ToastMsgType.DISCONNECT_WALLET_SUCCESS));
};

const AppWrapper = (props: { children: ReactNode }) => {
  const isOnline = useAppSelector(getIsOnline);
  const dispatch = useAppDispatch();
  const authentication = useAppSelector(getAuthentication);
  const connectedWallet = useAppSelector(getConnectedWallet);
  const initializationPhase = useAppSelector(getInitializationPhase);
  const recoveryCompleteNoInterruption = useAppSelector(
    getRecoveryCompleteNoInterruption
  );
  const forceInitApp = useAppSelector(getForceInitApp);
  const [isAlertPeerBrokenOpen, setIsAlertPeerBrokenOpen] = useState(false);
  useActivityTimer();

  const setOnlineStatus = useCallback(
    (value: boolean) => {
      dispatch(setIsOnline(value));
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
        return;
      }

      throw e;
    }
  }, [authentication.ssiAgentIsSet, dispatch, isOnline]);

  useEffect(() => {
    checkWitness();
  }, [checkWitness]);

  useEffect(() => {
    initApp();
  }, [forceInitApp]);

  useEffect(() => {
    const tapjack = async () => {
      if ((await Device.getInfo()).platform === "android") {
        await TapJacking.preventOverlays();
      }
    };
    tapjack();
  }, []);

  useEffect(() => {
    if (authentication.loggedIn) {
      dispatch(setPauseQueueIncomingRequest(!isOnline));
    } else {
      dispatch(setPauseQueueIncomingRequest(true));
    }
  }, [isOnline, authentication.loggedIn, dispatch]);

  useEffect(() => {
    if (initializationPhase === InitializationPhase.PHASE_TWO) {
      if (authentication.loggedIn) {
        Agent.agent.keriaNotifications.startPolling();
      } else {
        Agent.agent.keriaNotifications.stopPolling();
      }
    }
  }, [authentication.loggedIn, initializationPhase]);

  useEffect(() => {
    if (!connectedWallet?.id) {
      return;
    }

    const eventHandler = async (event: PeerDisconnectedEvent) => {
      peerDisconnectedChangeHandler(event, connectedWallet.id, dispatch);
    };

    PeerConnection.peerConnection.onPeerDisconnectedStateChanged(eventHandler);

    return () => {
      PeerConnection.peerConnection.offPeerDisconnectedStateChanged(
        eventHandler
      );
    };
  }, [connectedWallet?.id, dispatch]);

  useEffect(() => {
    if (recoveryCompleteNoInterruption) {
      loadDb();
    }
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
          throw e;
        }
      }
    };

    if (authentication.ssiAgentUrl && !authentication.firstAppLaunch) {
      startAgent();
    }
  }, [authentication.ssiAgentUrl, authentication.firstAppLaunch]);

  const loadDatabase = async () => {
    try {
      const connectionsDetails = await Agent.agent.connections.getConnections();
      const multisigConnectionsDetails =
        await Agent.agent.connections.getMultisigConnections();

      const credsCache = await Agent.agent.credentials.getCredentials();
      const credsArchivedCache = await Agent.agent.credentials.getCredentials(
        true
      );
      const storedIdentifiers = await Agent.agent.identifiers.getIdentifiers();
      const storedPeerConnections =
        await Agent.agent.peerConnectionMetadataStorage.getAllPeerConnectionMetadata();
      const notifications =
        await Agent.agent.keriaNotifications.getNotifications();

      dispatch(setIdentifiersCache(storedIdentifiers));
      dispatch(setCredsCache(credsCache));
      dispatch(setCredsArchivedCache(credsArchivedCache));
      dispatch(setConnectionsCache(connectionsDetails));
      dispatch(setMultisigConnectionsCache(multisigConnectionsDetails));
      dispatch(setWalletConnectionsCache(storedPeerConnections));
      dispatch(setNotificationsCache(notifications));
    } catch (e) {
      showError("Failed to load database data", e, dispatch);
    }
  };

  const loadCacheBasicStorage = async () => {
    try {
      let userName: { userName: string } = { userName: "" };
      let identifiersSelectedFilter: IdentifiersFilters =
        IdentifiersFilters.All;
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

      const identifiersFavourites = await Agent.agent.basicStorage.findById(
        MiscRecordId.IDENTIFIERS_FAVOURITES
      );
      if (identifiersFavourites)
        dispatch(
          setFavouritesIdentifiersCache(
            identifiersFavourites.content.favourites as FavouriteIdentifier[]
          )
        );

      const credsFavourites = await Agent.agent.basicStorage.findById(
        MiscRecordId.CREDS_FAVOURITES
      );
      if (credsFavourites) {
        dispatch(
          setFavouritesCredsCache(
            credsFavourites.content.favourites as FavouriteIdentifier[]
          )
        );
      }
      const indentifierViewType = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_IDENTIFIER_VIEW_TYPE
      );
      if (indentifierViewType) {
        dispatch(
          setIdentifierViewTypeCache(
            indentifierViewType.content.viewType as CardListViewType
          )
        );
      }

      const indentifiersFilters = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_IDENTIFIER_SELECTED_FILTER
      );
      if (indentifiersFilters) {
        identifiersSelectedFilter = indentifiersFilters.content
          .filter as IdentifiersFilters;
      }
      if (identifiersSelectedFilter) {
        dispatch(setIdentifiersFilters(identifiersSelectedFilter));
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

      const appUserNameRecord = await Agent.agent.basicStorage.findById(
        MiscRecordId.USER_NAME
      );
      if (appUserNameRecord) {
        userName = appUserNameRecord.content as { userName: string };
      }

      const identifierFavouriteIndex = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_IDENTIFIER_FAVOURITE_INDEX
      );

      if (identifierFavouriteIndex) {
        dispatch(
          setIdentifierFavouriteIndex(
            Number(identifierFavouriteIndex.content.favouriteIndex)
          )
        );
      }

      const credFavouriteIndex = await Agent.agent.basicStorage.findById(
        MiscRecordId.APP_CRED_FAVOURITE_INDEX
      );

      if (credFavouriteIndex) {
        dispatch(
          setIdentifierFavouriteIndex(
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
        MiscRecordId.APP_FIRST_INSTALL
      );

      if (firstInstall) {
        dispatch(setShowWelcomePage(firstInstall.content.value as boolean));
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

      dispatch(
        setAuthentication({
          ...authentication,
          userName: userName.userName as string,
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

      return {
        keriaConnectUrlRecord,
      };
    } catch (e) {
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
        headerText={i18n.t(
          "tabs.menu.tab.items.connectwallet.connectionbrokenalert.message"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.menu.tab.items.connectwallet.connectionbrokenalert.confirm"
        )}`}
        actionConfirm={() => dispatch(setCurrentOperation(OperationType.IDLE))}
        actionDismiss={() => dispatch(setCurrentOperation(OperationType.IDLE))}
      />
    </>
  );
};

export {
  AppWrapper,
  acdcChangeHandler,
  connectionStateChangedHandler,
  peerConnectRequestSignChangeHandler,
  peerConnectedChangeHandler,
  peerConnectionBrokenChangeHandler,
  peerDisconnectedChangeHandler,
};
