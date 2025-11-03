const incrementLoginAttemptMock = jest.fn();
const resetLoginAttemptsMock = jest.fn();
const storeSecretMock = jest.fn();
const verifySecretMock = jest.fn();

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { IonReactRouter } from "@ionic/react-router";
import { configureStore } from "@reduxjs/toolkit";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { rootReducer } from "../../../store";
import { InitializationPhase } from "../../../store/reducers/stateCache/stateCache.types";
import { RoutePath } from "../../../routes";
import { OperationType } from "../../globals/types";
import {
  useBiometricAuth,
  BiometricAuthOutcome,
} from "../../hooks/useBiometricsHook";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { SetPasscode } from "../SetPasscode";
import { LockPage } from "./LockPage";

function makeRealStore(
  preloadedState?: Partial<ReturnType<typeof rootReducer>>
) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActionPaths: [
            "payload.signTransaction.payload.approvalCallback",
          ],
        },
      }),
  });
}

const deleteSecureStorageMock = jest.fn();
jest.mock("../../../core/storage", () => ({
  ...jest.requireActual("../../../core/storage"),
  SecureStorage: {
    delete: (params: unknown) => deleteSecureStorageMock(params),
  },
}));

const deleteById = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  ...jest.requireActual("../../../core/agent/agent"),
  Agent: {
    agent: {
      auth: {
        incrementLoginAttempts: incrementLoginAttemptMock,
        resetLoginAttempts: resetLoginAttemptsMock,
        storeSecret: storeSecretMock,
        verifySecret: verifySecretMock,
      },
      basicStorage: {
        deleteById: (args: unknown) => deleteById(args),
      },
    },
  },
}));

const isNativeMock = jest.fn();
jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativeMock(),
    },
  };
});

const hideMock = jest.fn();
jest.mock("@capacitor/keyboard", () => {
  return {
    ...jest.requireActual("@capacitor/keyboard"),
    Keyboard: {
      hide: () => hideMock(),
    },
  };
});

jest.mock("@capacitor-community/privacy-screen", () => ({
  PrivacyScreen: {
    enable: jest.fn(),
    disable: jest.fn(),
  },
}));

jest.mock("../../hooks/useBiometricsHook");

interface StoreMockedProps {
  stateCache: {
    routes: RoutePath[];
    authentication: {
      loggedIn: boolean;
      time: number;
      passcodeIsSet: boolean;
      seedPhraseIsSet?: boolean;
      loginAttempt: {
        attempts: number;
        lockedUntil: number;
      };
    };
    currentOperation: OperationType;
  };
  seedPhraseCache: {
    seedPhrase: string;
    bran: string;
  };
  biometricsCache: {
    enabled: boolean;
  };
}

const dispatchMock = jest.fn();
const storeMocked = (initialState: StoreMockedProps) => {
  return {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };
};

const initialState: StoreMockedProps = {
  stateCache: {
    routes: [RoutePath.GENERATE_SEED_PHRASE],
    authentication: {
      loggedIn: false,
      time: Date.now(),
      passcodeIsSet: true,
      seedPhraseIsSet: true,
      loginAttempt: {
        attempts: 0,
        lockedUntil: Date.now(),
      },
    },
    currentOperation: OperationType.IDLE,
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
  biometricsCache: {
    enabled: true,
  },
};

describe("Lock Page", () => {
  let handleBiometricAuthMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    handleBiometricAuthMock = jest.fn(() => Promise.resolve(true));

    jest.doMock("@ionic/react", () => {
      const actualIonicReact = jest.requireActual("@ionic/react");
      return {
        ...actualIonicReact,
        getPlatforms: () => ["ios"],
      };
    });
    isNativeMock.mockImplementation(() => false);

    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricsIsEnabled: true,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: handleBiometricAuthMock,
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: jest.fn(),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 0,
      lockoutEndTime: null,
    }));
  });

  test("Renders Lock modal with title and description", () => {
    const { getByText } = render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );
    expect(getByText(EN_TRANSLATIONS.lockpage.title)).toBeInTheDocument();
    expect(getByText(EN_TRANSLATIONS.lockpage.description)).toBeInTheDocument();
  });

  test("The user can add and remove digits from the passcode", () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );
    fireEvent.click(getByText(/1/));
    const circleElement = getByTestId("circle-0");
    expect(circleElement.classList).toContain("passcode-module-circle-fill");
    const backspaceButton = getByTestId("setpasscode-backspace-button");
    fireEvent.click(backspaceButton);
    expect(circleElement.classList).not.toContain(
      "passcode-module-circle-fill"
    );
  });

  test("Hide keyboard when display lock page", async () => {
    isNativeMock.mockImplementation(() => true);

    render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    await waitFor(() => {
      expect(hideMock).toBeCalled();
    });
  });

  test("I click on I forgot my passcode, I can start over", async () => {
    const { getByText, findByText, getByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <MemoryRouter initialEntries={[RoutePath.ROOT]}>
          <IonReactRouter>
            <LockPage />
            <Route
              path={RoutePath.SET_PASSCODE}
              component={SetPasscode}
            />
          </IonReactRouter>
        </MemoryRouter>
      </Provider>
    );
    await passcodeFiller(getByText, getByTestId, "193213");
    expect(await findByText(EN_TRANSLATIONS.lockpage.error)).toBeVisible();
    fireEvent.click(getByText(EN_TRANSLATIONS.lockpage.forgotten.button));
    expect(
      await findByText(EN_TRANSLATIONS.lockpage.alert.text.verify)
    ).toBeVisible();
    fireEvent.click(getByText(EN_TRANSLATIONS.lockpage.alert.button.verify));

    expect(
      await findByText(EN_TRANSLATIONS.forgotauth.passcode.title)
    ).toBeVisible();
  });

  test("Forgot passcode before verify seedphrase", async () => {
    const customInitialState = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        authentication: {
          ...initialState.stateCache.authentication,
          seedPhraseIsSet: false,
        },
      },
    };

    const { getByText } = render(
      <Provider store={storeMocked(customInitialState)}>
        <MemoryRouter initialEntries={[RoutePath.ROOT]}>
          <IonReactRouter>
            <LockPage />
            <Route
              path={RoutePath.SET_PASSCODE}
              component={SetPasscode}
            />
          </IonReactRouter>
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.lockpage.forgotten.button));

    await waitFor(() => {
      expect(deleteSecureStorageMock).toBeCalledWith(KeyStoreKeys.APP_PASSCODE);
      expect(deleteSecureStorageMock).toBeCalledWith(
        KeyStoreKeys.APP_OP_PASSWORD
      );
      expect(deleteById).toBeCalledWith(MiscRecordId.OP_PASS_HINT);
      expect(deleteById).toBeCalledWith(MiscRecordId.APP_PASSWORD_SKIPPED);
      expect(deleteById).toBeCalledWith(MiscRecordId.APP_ALREADY_INIT);
      expect(deleteById).toBeCalledWith(MiscRecordId.APP_BIOMETRY);
    });
  });

  test("Verifies passcode and hides page upon correct input", async () => {
    verifySecretMock.mockResolvedValueOnce(true);

    const store = makeRealStore({
      stateCache: {
        routes: [{ path: RoutePath.GENERATE_SEED_PHRASE }],
        authentication: {
          loggedIn: false,
          time: Date.now(),
          passcodeIsSet: true,
          seedPhraseIsSet: true,
          loginAttempt: { attempts: 0, lockedUntil: Date.now() },
          passwordIsSet: false,
          passwordIsSkipped: false,
          ssiAgentIsSet: false,
          ssiAgentUrl: "",
          recoveryWalletProgress: false,
          firstAppLaunch: false,
        },
        currentOperation: OperationType.IDLE,
        initializationPhase: InitializationPhase.PHASE_ONE,
        recoveryCompleteNoInterruption: false,
        isOnline: true,
        queueIncomingRequest: {
          isPaused: false,
          isProcessing: false,
          queues: [],
        },
        toastMsgs: [],
        pendingJoinGroupMetadata: null,
      },
      seedPhraseCache: { seedPhrase: "", bran: "" },
      biometricsCache: { enabled: true },
    });

    const { getByText, queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <LockPage />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("lock-page-title")).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(queryByTestId("lock-page-title")).not.toBeInTheDocument();
    });
  });

  test("Login using biometrics", async () => {
    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(true));

    const { queryByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("lock-page")).not.toBeInTheDocument();
    });
  });

  test("Cancel login using biometrics and re-enabling", async () => {
    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(false));

    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("passcode-button-0")).toBeInTheDocument();
    });

    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(true));

    act(() => {
      fireEvent.click(getByTestId("passcode-button-0"));
    });

    await waitFor(() => {
      expect(queryByTestId("lock-page")).not.toBeInTheDocument();
    });
  });

  test("should display temporary lockout message when biometrics fails with TEMPORARY_LOCKOUT", async () => {
    // Override the useBiometricAuth mock for this specific test case
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricsIsEnabled: true,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      // Ensure the handleBiometricAuth mock resolves with the lockout outcome
      handleBiometricAuth: jest
        .fn()
        .mockResolvedValue(BiometricAuthOutcome.TEMPORARY_LOCKOUT),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: jest.fn(),
      checkBiometrics: jest.fn(),
      // Provide the specific lockout data needed by the component to render the alert
      remainingLockoutSeconds: 30,
      lockoutEndTime: Date.now() + 30000,
    }));

    render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    // Wait for the asynchronous biometric auth process and the subsequent UI update
    await waitFor(async () => {
      // Check that the correct alert is displayed
      const lockoutAlert = await screen.findByTestId("alert-max-attempts");
      expect(lockoutAlert).toBeInTheDocument();

      // Verify the alert contains the correct, interpolated text
      const expectedText = EN_TRANSLATIONS.biometry.lockoutheader.replace(
        "{{seconds}}",
        "30"
      );
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  test("should display permanent lockout message when biometrics fails with PERMANENT_LOCKOUT", async () => {
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricsIsEnabled: true,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest
        .fn()
        .mockResolvedValue(BiometricAuthOutcome.PERMANENT_LOCKOUT),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: jest.fn(),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 0,
      lockoutEndTime: null,
    }));

    render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    await waitFor(async () => {
      const lockoutAlert = await screen.findByTestId("alert-permanent-lockout");
      expect(lockoutAlert).toBeInTheDocument();
      expect(lockoutAlert).toHaveTextContent(
        EN_TRANSLATIONS.biometry.permanentlockoutheader
      );
    });
  });
});

describe("Lock Page: Max login attempt", () => {
  const initialState = {
    stateCache: {
      routes: [RoutePath.GENERATE_SEED_PHRASE],
      authentication: {
        loggedIn: false,
        time: Date.now(),
        passcodeIsSet: true,
        seedPhraseIsSet: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: Date.now(),
        },
      },
      currentOperation: OperationType.IDLE,
    },
    seedPhraseCache: {
      seedPhrase: "",
      bran: "",
    },
    biometricsCache: {
      enabled: true,
    },
  };

  test("Show remain login error", async () => {
    const customInitialState = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        authentication: {
          ...initialState.stateCache.authentication,
          loginAttempt: {
            ...initialState.stateCache.authentication.loginAttempt,
            attempts: 2,
          },
        },
      },
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked(customInitialState)}>
        <LockPage />
      </Provider>
    );

    expect(getByText(EN_TRANSLATIONS.lockpage.title)).toBeInTheDocument();
    expect(getByText(EN_TRANSLATIONS.lockpage.description)).toBeInTheDocument();

    await passcodeFiller(getByText, getByTestId, "193213");

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.lockpage.attempterror.replace("{{attempt}}", "3")
        )
      ).toBeInTheDocument();
      expect(incrementLoginAttemptMock).toBeCalled();
    });
  });

  test("Show max login attemp alert", async () => {
    const customInitialState = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        authentication: {
          ...initialState.stateCache.authentication,
          loginAttempt: {
            attempts: 5,
            lockedUntil: Date.now() + 60000,
          },
        },
      },
    };

    const { getByText } = render(
      <Provider store={storeMocked(customInitialState)}>
        <LockPage />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.lockpage.attemptalert.title)
    ).toBeInTheDocument();
  });

  test("Reset login attempt", async () => {
    verifySecretMock.mockResolvedValueOnce(true);
    const customInitialState = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        authentication: {
          ...initialState.stateCache.authentication,
          loginAttempt: {
            ...initialState.stateCache.authentication.loginAttempt,
            attempts: 2,
          },
        },
      },
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked(customInitialState)}>
        <LockPage />
      </Provider>
    );

    expect(getByText(EN_TRANSLATIONS.lockpage.title)).toBeInTheDocument();
    expect(getByText(EN_TRANSLATIONS.lockpage.description)).toBeInTheDocument();

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(resetLoginAttemptsMock).toBeCalled();
    });
  });
});

export type { StoreMockedProps };
