import {
  BiometryType,
  BiometricAuthError,
  NativeBiometric,
} from "@capgo/capacitor-native-biometric";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Browser } from "@capacitor/browser";
import { act } from "react";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { store } from "../../../store";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { DOCUMENTATION_LINK } from "../../globals/constants";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { Settings } from "./Settings";
import { OptionIndex } from "./Settings.types";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import {
  BiometricAuthOutcome,
  BIOMETRIC_SERVER_KEY,
  useBiometricAuth,
} from "../../hooks/useBiometricsHook";

jest.mock("../../../store/utils", () => ({
  CLEAR_STORE_ACTIONS: [],
}));

jest.mock("@capacitor-community/privacy-screen", () => ({
  PrivacyScreen: {
    enable: jest.fn(),
    disable: jest.fn(),
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: (props: any) =>
    props.isOpen ? (
      <div data-testid={props["data-testid"]}>{props.children}</div>
    ) : null,
}));

jest.mock("@capacitor/browser", () => ({
  Browser: {
    open: jest.fn(),
  },
}));

jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: {
      isNativePlatform: jest.fn(() => true),
      getPlatform: jest.fn(() => "web"),
    },
    registerPlugin: jest.fn(() => ({
      requestPermissions: jest.fn(() =>
        Promise.resolve({ display: "granted" })
      ),
      schedule: jest.fn(() => Promise.resolve()),
      addListener: jest.fn(() => Promise.resolve()),
      removeAllListeners: jest.fn(() => Promise.resolve()),
      cancel: jest.fn(() => Promise.resolve()),
      getPending: jest.fn(() => Promise.resolve({ notifications: [] })),
      getDeliveredNotifications: jest.fn(() =>
        Promise.resolve({ notifications: [] })
      ),
      checkPermissions: jest.fn(() => Promise.resolve({ display: "granted" })),
      createChannel: jest.fn(() => Promise.resolve()),
    })),
  };
});

jest.mock("@capgo/capacitor-native-biometric", () => ({
  NativeBiometric: {
    isAvailable: jest.fn(() =>
      Promise.resolve({ isAvailable: true, biometryType: "fingerprint" })
    ),
    verifyIdentity: jest.fn(() => Promise.resolve()),
    getCredentials: jest.fn(() => Promise.reject(new Error("No credentials"))),
    setCredentials: jest.fn(() => Promise.resolve()),
    deleteCredentials: jest.fn(() => Promise.resolve()),
  },
  BiometryType: {
    FINGERPRINT: "fingerprint",
    FACE_ID: "faceId",
    TOUCH_ID: "touchId",
    IRIS_AUTHENTICATION: "iris",
    MULTIPLE: "multiple",
    NONE: "none",
  },
  BiometricAuthError: {
    USER_CANCEL: 1,
    USER_TEMPORARY_LOCKOUT: 2,
    USER_LOCKOUT: 3,
    BIOMETRICS_UNAVAILABLE: 4,
    UNKNOWN_ERROR: 5,
    BIOMETRICS_NOT_ENROLLED: 6,
  },
}));

jest.mock("@evva/capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
    getVault: jest.fn(),
    setVault: jest.fn(),
    removeVault: jest.fn(),
    clearVault: jest.fn(),
  },
}));

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    hide: jest.fn(),
    show: jest.fn(),
    setAccessoryBarVisible: jest.fn(),
    setScroll: jest.fn(),
    setResizeMode: jest.fn(),
  },
}));

jest.mock("@capacitor-mlkit/barcode-scanning", () => ({
  BarcodeScanner: {
    isSupported: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    startScan: jest.fn(),
    stopScan: jest.fn(),
    readBarcodesFromImage: jest.fn(),
    readBarcodesFromVideo: jest.fn(),
    install: jest.fn(),
    installGoogleBarcodeScannerModule: jest.fn(),
    isGoogleBarcodeScannerModuleAvailable: jest.fn(),
  },
}));

jest.mock("@capacitor/share", () => ({
  Share: {
    canShare: jest.fn(),
    share: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    exitApp: jest.fn(),
    getInfo: jest.fn(),
    getLaunchUrl: jest.fn(),
    getState: jest.fn(),
    minimizeApp: jest.fn(),
  },
}));

jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(),
  BIOMETRIC_SERVER_KEY: "org.cardanofoundation.idw.biometrics.key",
  BiometricAuthOutcome: {
    SUCCESS: 0,
    USER_CANCELLED: 1,
    TEMPORARY_LOCKOUT: 2,
    PERMANENT_LOCKOUT: 3,
    GENERIC_ERROR: 4,
    NOT_AVAILABLE: 6,
  },
}));

const openSettingMock = jest.fn(() => Promise.resolve(true));
jest.mock("capacitor-native-settings", () => ({
  NativeSettings: {
    open: jest.fn(),
  },
  AndroidSettings: {},
  IOSSettings: {},
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        createOrUpdateBasicRecord: jest.fn().mockResolvedValue(undefined),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      deleteWallet: jest.fn(),
      getMnemonic: jest.fn().mockResolvedValue("some test mnemonic"),
    },
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    ...jest.requireActual("react-router-dom").useHistory,
    push: jest.fn(),
  }),
}));

describe("Settings page", () => {
  beforeEach(() => {
    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricInfo: {
        isAvailable: true,
        biometryType: BiometryType.FINGERPRINT,
      },
      setupBiometrics: jest.fn(),
      handleBiometricAuth: jest.fn(),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null,
    });
  });

  test("Renders Settings page", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.changepin.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.biometry)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.managepassword.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.seedphrase.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.contact)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.learnmore)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.terms.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.version)
    ).toBeInTheDocument();
  });

  test("Enable biometrics toggle", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = makeTestStore(initialState);

    (useBiometricAuth as jest.Mock).mockReturnValueOnce({
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.SUCCESS)
      ),
      setupBiometrics: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.SUCCESS)
      ),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null,
    });

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.biometry)
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(getByTestId("settings-security-list-item-0"));
    });

    await waitFor(() => {
      expect(storeMocked.getState().biometricsCache.enabled).toBe(true);
    });

    // Optionally, you can still check if the agent's method was called, but the Redux state is more direct.
    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
        expect.objectContaining({
          id: MiscRecordId.APP_BIOMETRY,
          content: {
            enabled: true,
          },
        })
      );
    });
  });

  test("Disable biometrics toggle", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: true,
      },
    };

    const storeMocked = makeTestStore(initialState);

    (useBiometricAuth as jest.Mock).mockReturnValueOnce({
      biometricInfo: {
        isAvailable: true,
        hasCredentials: true,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.SUCCESS)
      ),
      setupBiometrics: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.SUCCESS)
      ),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null,
    });

    (NativeBiometric.deleteCredentials as jest.Mock).mockResolvedValueOnce(
      undefined
    );

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.biometry)
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(getByTestId("settings-security-list-item-0"));
    });

    await waitFor(() => {
      expect(storeMocked.getState().biometricsCache.enabled).toBe(false);
    });

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
        expect.objectContaining({
          id: MiscRecordId.APP_BIOMETRY,
          content: {
            enabled: false,
          },
        })
      );
    });

    await waitFor(() => {
      expect(NativeBiometric.deleteCredentials).toBeCalledWith({
        server: BIOMETRIC_SERVER_KEY,
      });
    });
  });

  test("Open setting page when biometrics not available", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = makeTestStore(initialState);

    (useBiometricAuth as jest.Mock).mockReturnValueOnce({
      biometricInfo: {
        isAvailable: false,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
        code: BiometricAuthError.BIOMETRICS_NOT_ENROLLED,
      },
      handleBiometricAuth: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.NOT_AVAILABLE)
      ),
      setupBiometrics: jest.fn(() =>
        Promise.resolve(BiometricAuthOutcome.NOT_AVAILABLE)
      ),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null,
    });

    const { queryByText } = render(
      <Provider store={storeMocked}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      queryByText(EN_TRANSLATIONS.settings.sections.security.biometry)
    ).not.toBeInTheDocument();
  });

  test("Open documentation link", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.contact)
    ).toBeInTheDocument();

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.learnmore)
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-support-list-item-${OptionIndex.Documentation}`)
      );
    });

    await waitFor(() => {
      expect(Browser.open).toBeCalledWith({
        url: DOCUMENTATION_LINK,
      });
    });
  });

  test("Open term and privacy", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.support.terms.title)
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-support-list-item-${OptionIndex.Term}`)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.settings.sections.support.terms.submenu.privacy
        )
      );
      expect(
        getByText(
          EN_TRANSLATIONS.settings.sections.support.terms.submenu.termsofuse
        )
      );
    });
  });

  test("Open manage password", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.managepassword.title)
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-security-list-item-${OptionIndex.ManagePassword}`)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.settings.sections.security.managepassword.page.title
        )
      );
    });
  });

  test("Open seedphrase screen", async () => {
    const { getByTestId, getAllByText } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByTestId(
        `settings-security-list-item-${OptionIndex.RecoverySeedPhrase}`
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId(
          `settings-security-list-item-${OptionIndex.RecoverySeedPhrase}`
        )
      );
    });

    await waitFor(() => {
      expect(
        getAllByText(
          EN_TRANSLATIONS.settings.sections.security.seedphrase.page.title
        ).length
      ).toBeGreaterThan(0);
    });
  });

  test("Open change passcode", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.settings.sections.security.changepin.title)
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-security-list-item-${OptionIndex.ChangePin}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.settings.sections.security.changepin.createpasscode
        )
      ).toBeVisible();
    });
  });
  test("Delete account", async () => {
    const state = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
      },
      profilesCache: {
        ...profileCacheFixData,
        profiles: {
          ...profileCacheFixData.profiles,
          ...(profileCacheFixData.defaultProfile
            ? {
                [profileCacheFixData.defaultProfile as string]: {
                  ...profileCacheFixData.profiles[
                    profileCacheFixData.defaultProfile as string
                  ],
                  multisigConnections: [],
                },
              }
            : {}),
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings
          show
          setShow={jest.fn()}
        />
      </Provider>
    );

    fireEvent.click(
      getByText(EN_TRANSLATIONS.settings.sections.deletewallet.button)
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.settings.sections.deletewallet.alert.title)
      );
    });

    fireEvent.click(getByTestId("delete-account-alert-confirm-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title));
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(Agent.agent.deleteWallet).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.DELETE_ACCOUNT_SUCCESS)
      );
    });
  });
});
