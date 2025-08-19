// Before imports to avoid hoisting issues
const incrementLoginAttemptMock = jest.fn();
const resetLoginAttemptsMock = jest.fn();
const storeSecretMock = jest.fn();
const verifySecretMock = jest.fn();

import { BiometryErrorType } from "@aparajita/capacitor-biometric-auth";
import {
  BiometryError,
  BiometryType,
} from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { IonReactRouter } from "@ionic/react-router";
import { act } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { OperationType } from "../../globals/types";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { SetPasscode } from "../SetPasscode";
import { LockPage } from "./LockPage";
import { KeyStoreKeys } from "../../../core/storage";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { makeTestStore } from "../../utils/makeTestStore";
import { rootReducer } from "../../../store"; // adjust path as needed
import { InitializationPhase } from "../../../store/reducers/stateCache/stateCache.types";

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

jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: true,
    biometricInfo: {
      isAvailable: true,
      hasCredentials: false,
      biometryType: BiometryType.fingerprintAuthentication,
      strongBiometryIsAvailable: true,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

jest.mock("@capacitor-community/privacy-screen", () => ({
  PrivacyScreen: {
    enable: jest.fn(),
    disable: jest.fn(),
  },
}));

interface StoreMockedProps {
  stateCache: {
    routes: RoutePath[];
    authentication: {
      loggedIn: boolean;
      time: number;
      passcodeIsSet: boolean;
      seedPhraseIsSet?: boolean;
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

const initialState = {
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
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("@ionic/react", () => {
      const actualIonicReact = jest.requireActual("@ionic/react");
      return {
        ...actualIonicReact,
        getPlatforms: () => ["ios"],
      };
    });
    isNativeMock.mockImplementation(() => false);
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
    const storeMocked = (initialState: StoreMockedProps) => {
      return {
        ...makeTestStore(initialState),
        dispatch: dispatchMock,
      };
    };

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

    const { getByText } = render(
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
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
          userName: "",
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
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      biometricsCache: {
        enabled: true,
      },
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
    jest.doMock("../../hooks/useBiometricsHook", () => ({
      useBiometricAuth: jest.fn(() => ({
        biometricsIsEnabled: true,
        biometricInfo: {
          isAvailable: true,
          hasCredentials: false,
          biometryType: BiometryType.fingerprintAuthentication,
          strongBiometryIsAvailable: true,
        },
        handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
        setBiometricsIsEnabled: jest.fn(),
      })),
    }));

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
    jest.doMock("../../hooks/useBiometricsHook", () => ({
      useBiometricAuth: jest.fn(() => ({
        biometricsIsEnabled: true,
        biometricInfo: {
          isAvailable: true,
          hasCredentials: false,
          biometryType: BiometryType.fingerprintAuthentication,
          strongBiometryIsAvailable: true,
        },
        handleBiometricAuth: jest.fn(() =>
          Promise.resolve(new BiometryError("", BiometryErrorType.userCancel))
        ),
        setBiometricsIsEnabled: jest.fn(),
      })),
    }));

    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMocked(initialState)}>
        <LockPage />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("passcode-button-#")).toBeInTheDocument();
    });

    jest.doMock("../../hooks/useBiometricsHook", () => ({
      useBiometricAuth: jest.fn(() => ({
        biometricsIsEnabled: true,
        biometricInfo: {
          isAvailable: true,
          hasCredentials: false,
          biometryType: BiometryType.fingerprintAuthentication,
          strongBiometryIsAvailable: true,
        },
        handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
        setBiometricsIsEnabled: jest.fn(),
      })),
    }));

    act(() => {
      fireEvent.click(getByTestId("passcode-button-#"));
    });

    await waitFor(() => {
      expect(queryByTestId("lock-page")).not.toBeInTheDocument();
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
    initialState.stateCache.authentication.loginAttempt.attempts = 2;

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
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
    initialState.stateCache.authentication.loginAttempt.attempts = 5;
    initialState.stateCache.authentication.loginAttempt.lockedUntil =
      Date.now() + 60000;

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <LockPage />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.lockpage.attemptalert.title)
    ).toBeInTheDocument();
  });

  test("Reset login attempt", async () => {
    verifySecretMock.mockResolvedValueOnce(true);
    initialState.stateCache.authentication.loginAttempt.attempts = 2;

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
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
