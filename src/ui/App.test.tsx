import { Style, StyleOptions } from "@capacitor/status-bar";
import { act, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import { startFreeRASP } from "capacitor-freerasp";
import { IdentifierService } from "../core/agent/services";
import Eng_Trans from "../locales/en/en.json";
import { TabsRoutePath } from "../routes/paths";
import { store } from "../store";
import {
  showGenericError,
  showNoWitnessAlert,
} from "../store/reducers/stateCache";
import { App } from "./App";
import { OperationType } from "./globals/types";
import {
  ANDROID_MIN_VERSION,
  IOS_MIN_VERSION,
  WEBVIEW_MIN_VERSION,
} from "./globals/constants";
import { InitializationPhase } from "../store/reducers/stateCache/stateCache.types";

jest.mock("capacitor-freerasp", () => ({
  startFreeRASP: jest.fn(),
}));

const mockInitDatabase = jest.fn();
const getAvailableWitnessesMock = jest.fn();
const setBackgroundColorMock = jest.fn();

jest.mock("../core/agent/agent", () => ({
  Agent: {
    agent: {
      start: jest.fn(),
      setupLocalDependencies: () => mockInitDatabase(),
      markAgentStatus: jest.fn(),
      getBranAndMnemonic: jest.fn(() =>
        Promise.resolve({
          bran: "",
          mnemonic: "",
        })
      ),
      identifiers: {
        getIdentifiers: jest.fn().mockResolvedValue([]),
        syncKeriaIdentifiers: jest.fn(),
        onIdentifierAdded: jest.fn(),
        getAvailableWitnesses: () => getAvailableWitnessesMock(),
      },
      multiSigs: {
        onGroupAdded: jest.fn(),
      },
      connections: {
        getConnections: jest.fn().mockResolvedValue([]),
        getMultisigConnections: jest.fn().mockResolvedValue([]),
        onConnectionStateChanged: jest.fn(),
        getConnectionShortDetails: jest.fn(),
        isConnectionRequestSent: jest.fn(),
        isConnectionResponseReceived: jest.fn(),
        isConnectionRequestReceived: jest.fn(),
        isConnectionResponseSent: jest.fn(),
        isConnectionConnected: jest.fn(),
        getConnectionShortDetailById: jest.fn(),
        getUnhandledConnections: jest.fn(),
        syncKeriaContacts: jest.fn(),
      },
      credentials: {
        getCredentials: jest.fn().mockResolvedValue([]),
        onCredentialStateChanged: jest.fn(),
        isCredentialOfferReceived: jest.fn(),
        isCredentialRequestSent: jest.fn(),
        createMetadata: jest.fn(),
        isCredentialDone: jest.fn(),
        updateMetadataCompleted: jest.fn(),
        onAcdcStateChanged: jest.fn(),
        syncKeriaCredentials: jest.fn(),
      },
      messages: {
        onBasicMessageStateChanged: jest.fn(),
        pickupMessagesFromMediator: jest.fn(),
      },
      keriaNotifications: {
        pollNotifications: jest.fn(),
        pollLongOperations: jest.fn(),
        getNotifications: jest.fn(),
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        onNewNotification: jest.fn(),
        onLongOperationSuccess: jest.fn(),
        onLongOperationFailure: jest.fn(),
        onRemoveNotification: jest.fn(),
      },
      onKeriaStatusStateChanged: jest.fn(),
      peerConnectionMetadataStorage: {
        getAllPeerConnectionMetadata: jest.fn(),
        getPeerConnectionMetadata: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
      },
      auth: {
        getLoginAttempts: jest.fn(() =>
          Promise.resolve({
            attempts: 0,
            lockedUntil: Date.now(),
          })
        ),
      },
    },
  },
}));

jest.mock("../core/configuration/configurationService", () => ({
  ConfigurationService: {
    env: {
      security: {
        rasp: {
          enabled: true,
        },
      },
      features: {
        cut: [],
        customContent: [],
      },
    },
  },
}));

const getDeviceInfo = jest.fn();

jest.mock("@capacitor/device", () => ({
  ...jest.requireActual("@capacitor/device"),
  Device: {
    getInfo: () => getDeviceInfo(),
  },
}));

const setStyleMock = jest.fn();
jest.mock("@capacitor/status-bar", () => ({
  ...jest.requireActual("@capacitor/status-bar"),
  StatusBar: {
    setStyle: (params: StyleOptions) => setStyleMock(params),
    setBackgroundColor: () => setBackgroundColorMock(),
  },
}));

const lockScreenOrientationMock = jest.fn();
jest.mock("@capacitor/screen-orientation", () => ({
  ...jest.requireActual("@capacitor/status-bar"),
  ScreenOrientation: {
    lock: (params: StyleOptions) => lockScreenOrientationMock(params),
    unlock: () => jest.fn(),
  },
}));

const getPlatformsMock = jest.fn(() => ["android"]);

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  getPlatforms: () => getPlatformsMock(),
}));

const isNativeMock = jest.fn(() => false);
jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativeMock(),
    },
  };
});

const addKeyboardEventMock = jest.fn();

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: (...params: any[]) => addKeyboardEventMock(...params),
    hide: jest.fn(),
  },
}));

jest.mock("@capacitor-community/privacy-screen", () => ({
  PrivacyScreen: {
    enable: jest.fn(),
    disable: jest.fn(),
  },
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: [TabsRoutePath.IDENTIFIERS],
    authentication: {
      loggedIn: true,
      userName: "",
      time: Date.now(),
      passcodeIsSet: true,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
    },
    toastMsgs: [],
    showConnections: false,
    currentOperation: OperationType.IDLE,
    queueIncomingRequest: {
      isProcessing: false,
      queues: [],
      isPaused: false,
    },
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  identifiersCache: {
    identifiers: {},
    favourites: [],
    multiSigGroup: {
      groupId: "",
      connections: [],
    },
  },
  credsCache: { creds: [], favourites: [] },
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
    identifier: {
      viewType: null,
      favouriteIndex: 0,
    },
    credential: {
      viewType: null,
      favouriteIndex: 0,
    },
  },
  biometricsCache: {
    enabled: false,
  },
  ssiAgentCache: {
    bootUrl: "",
    connectUrl: "",
  },
  notificationsCache: {
    notifications: [],
  },
};

const storeMocked = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

describe("App", () => {
  beforeEach(() => {
    isNativeMock.mockImplementation(() => false);
    mockInitDatabase.mockClear();
    getPlatformsMock.mockImplementation(() => ["android"]);
    getAvailableWitnessesMock.mockClear();

    const deviceInfo = {
      platform: "ios",
      osVersion: "18.0",
      model: "",
      operatingSystem: "ios",
      manufacturer: "",
      isVirtual: false,
      webViewVersion: "131.0.6778.260",
    };

    getDeviceInfo.mockImplementation(() => Promise.resolve(deviceInfo));
  });

  test("Mobile header hidden when app not in preview mode", async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("mobile-preview-header")).not.toBeInTheDocument();
      expect(queryByTestId("offline-page")).toBe(null);
    });
  });

  test("Force status bar style is dark mode on ios", async () => {
    getPlatformsMock.mockImplementation(() => ["ios"]);
    isNativeMock.mockImplementation(() => true);

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(setStyleMock).toBeCalledWith({
        style: Style.Light,
      });
    });
  });

  test("Should not force status bar style is dark mode on android or browser", async () => {
    getPlatformsMock.mockImplementation(() => ["android", "mobileweb"]);
    isNativeMock.mockImplementation(() => true);

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(setStyleMock).toBeCalledTimes(0);
    });
  });

  test("Should lock screen orientation to portrait mode", async () => {
    getPlatformsMock.mockImplementation(() => ["android"]);
    isNativeMock.mockImplementation(() => true);

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(lockScreenOrientationMock).toBeCalledTimes(1);
      expect(lockScreenOrientationMock).toBeCalledWith({
        orientation: "portrait",
      });
    });
  });

  test("Should show offline page", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        isOnline: false,
        initializationPhase: InitializationPhase.PHASE_TWO,
        authentication: {
          passcodeIsSet: true,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: true,
          loggedIn: true,
          userName: "",
          time: 0,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
      },
    };

    const storeMocked = {
      ...mockStore(state),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("offline-page")).toBeVisible();
    });
  });

  test("Should show spinner after login while booting agent", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        isOnline: false,
        initializationPhase: InitializationPhase.PHASE_ONE,
        authentication: {
          passcodeIsSet: true,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: true,
          loggedIn: true,
          userName: "",
          time: 0,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
      },
    };

    const storeMocked = {
      ...mockStore(state),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("loading-page")).toBeVisible();
    });
  });

  test("Show error when unhandledrejection event fired", async () => {
    const spy = jest
      .spyOn(window, "addEventListener")
      .mockImplementation((type, listener: any) => {
        if (type === "unhandledrejection") {
          listener({
            preventDefault: jest.fn(),
            promise: Promise.reject(new Error("Failed")),
          });
        }
      });

    render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
    });

    spy.mockClear();
  });

  test("Show error when error fired", async () => {
    const spy = jest
      .spyOn(window, "addEventListener")
      .mockImplementation((type, listener: any) => {
        if (type === "error") {
          listener({
            preventDefault: jest.fn(),
            error: new Error("Failed"),
          });
        }
      });

    render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
    });

    spy.mockClear();
  });
  test("It renders SetUserName modal", async () => {
    const initialState = {
      stateCache: {
        routes: [{ path: TabsRoutePath.ROOT }],
        authentication: {
          loggedIn: true,
          userName: "",
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
        toastMsgs: [],
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      identifiersCache: {
        identifiers: {},
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
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
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      notificationsCache: {
        notifications: [],
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(Eng_Trans.inputrequest.title.username)
      ).toBeInTheDocument();
    });
  });
});

describe("Witness availability", () => {
  test("No witness availability", async () => {
    getAvailableWitnessesMock.mockRejectedValue(
      new Error(IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE)
    );

    const initialState = {
      stateCache: {
        isOnline: true,
        routes: [{ path: TabsRoutePath.ROOT }],
        authentication: {
          loggedIn: true,
          userName: "",
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
        toastMsgs: [],
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      identifiersCache: {
        identifiers: [],
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
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
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      notificationsCache: {
        notifications: [],
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showNoWitnessAlert(true));
    });
  });

  test("Throw error", async () => {
    getAvailableWitnessesMock.mockRejectedValue(
      new Error(IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION)
    );

    const initialState = {
      stateCache: {
        isOnline: true,
        routes: [{ path: TabsRoutePath.ROOT }],
        authentication: {
          loggedIn: true,
          userName: "",
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
        toastMsgs: [],
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      identifiersCache: {
        identifiers: [],
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
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
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      notificationsCache: {
        notifications: [],
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showNoWitnessAlert(true));
    });
  });
});

describe("System copatibility alert", () => {
  beforeEach(() => {
    isNativeMock.mockImplementation(() => true);
    mockInitDatabase.mockClear();
    getPlatformsMock.mockImplementation(() => ["android"]);
    getAvailableWitnessesMock.mockClear();
  });

  afterEach(() => {
    getDeviceInfo.mockClear();
  });

  test("Android", async () => {
    const deviceInfo = {
      platform: "android",
      osVersion: "9.0",
      model: "",
      operatingSystem: "android",
      manufacturer: "",
      isVirtual: false,
      webViewVersion: "131.0.6778.260",
    };

    getDeviceInfo.mockImplementation(() => Promise.resolve(deviceInfo));

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(getDeviceInfo).toBeCalled();
    });

    expect(getByText(Eng_Trans.systemcompatibility.title)).toBeVisible();
    expect(getByText(Eng_Trans.systemcompatibility.android.os)).toBeVisible();
    expect(
      getByText(Eng_Trans.systemcompatibility.android.youros)
    ).toBeVisible();
    expect(
      getByText(Eng_Trans.systemcompatibility.android.webview)
    ).toBeVisible();
    expect(
      getByText(Eng_Trans.systemcompatibility.android.yourwebview)
    ).toBeVisible();
    expect(
      getByText(Eng_Trans.systemcompatibility.android.storage)
    ).toBeVisible();

    expect(getByText("9.0")).toBeVisible();
    expect(getByText("131.0.6778.260")).toBeVisible();
    expect(getByText(`${ANDROID_MIN_VERSION}+`)).toBeVisible();
    expect(getByText(`${WEBVIEW_MIN_VERSION}+`)).toBeVisible();
    expect(getByText("N/A")).toBeVisible();

    expect(getByTestId("met")).toBeVisible();
    expect(getByTestId("not-met")).toBeVisible();
  });

  test("Ios", async () => {
    const deviceInfo = {
      platform: "ios",
      osVersion: "11.0",
      model: "",
      operatingSystem: "ios",
      manufacturer: "",
      isVirtual: false,
      webViewVersion: "131.0.6778.260",
    };

    getDeviceInfo.mockImplementation(() => Promise.resolve(deviceInfo));

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(getDeviceInfo).toBeCalled();
    });

    expect(getByText(Eng_Trans.systemcompatibility.title)).toBeVisible();
    expect(getByText(Eng_Trans.systemcompatibility.ios.os)).toBeVisible();
    expect(getByText(Eng_Trans.systemcompatibility.ios.youros)).toBeVisible();
    expect(getByText(Eng_Trans.systemcompatibility.ios.storage)).toBeVisible();

    expect(getByText("11.0")).toBeVisible();
    expect(getByText(`${IOS_MIN_VERSION}+`)).toBeVisible();
    expect(getByText("N/A")).toBeVisible();

    expect(getByTestId("not-met")).toBeVisible();
  });
});

describe("System threat alert", () => {
  let startFreeRASPMock: jest.Mock;

  beforeEach(() => {
    isNativeMock.mockImplementation(() => true);
    getPlatformsMock.mockImplementation(() => ["android"]);
    mockInitDatabase.mockClear();
    getAvailableWitnessesMock.mockClear();

    const deviceInfo = {
      platform: "android",
      osVersion: "12.0",
      model: "",
      operatingSystem: "android",
      manufacturer: "",
      isVirtual: false,
      webViewVersion: "131.0.6778.260",
    };
    getDeviceInfo.mockImplementation(() => Promise.resolve(deviceInfo));
  });

  afterEach(() => {
    startFreeRASPMock.mockClear();
  });

  test("Shows SystemThreatAlert when freeRASP initialization fails", async () => {
    startFreeRASPMock = startFreeRASP as jest.Mock;
    startFreeRASPMock.mockRejectedValue(
      new Error("freeRASP initialization failed")
    );

    const { getByText } = render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(startFreeRASPMock).toHaveBeenCalled();
      expect(getByText("Threats Detected")).toBeVisible();
    });
  });

  test("Catch a threat and show SystemThreatAlert", async () => {
    startFreeRASPMock = startFreeRASP as jest.Mock;
    startFreeRASPMock.mockResolvedValue(true);

    const { getByText } = render(
      <Provider store={storeMocked}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(startFreeRASPMock).toHaveBeenCalled();
    });

    await act(async () => {
      const simulatorAction = (startFreeRASPMock.mock.calls[0][1] as any)
        .simulator;

      simulatorAction();
    });

    await waitFor(() => {
      expect(getByText("Threats Detected")).toBeVisible();
      expect(getByText(Eng_Trans.systemthreats.rules.simulator)).toBeVisible();
    });
  });

  test("Catches a threat after renders SetUserName modal", async () => {
    const initialState = {
      stateCache: {
        routes: [{ path: TabsRoutePath.ROOT }],
        authentication: {
          loggedIn: true,
          userName: "",
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
        },
        toastMsgs: [],
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      identifiersCache: {
        identifiers: {},
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
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
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      notificationsCache: {
        notifications: [],
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    startFreeRASPMock = startFreeRASP as jest.Mock;
    startFreeRASPMock.mockResolvedValue(true);

    const { getByText } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(startFreeRASPMock).toHaveBeenCalled();
      expect(
        getByText(Eng_Trans.inputrequest.title.username)
      ).toBeInTheDocument();
    });

    await act(async () => {
      const privilegedAccessAction = (startFreeRASPMock.mock.calls[0][1] as any)
        .privilegedAccess;
      privilegedAccessAction();
    });

    await waitFor(() => {
      expect(getByText("Threats Detected")).toBeVisible();
      expect(
        getByText(Eng_Trans.systemthreats.rules.privilegedaccess)
      ).toBeVisible();
    });
  });
});
