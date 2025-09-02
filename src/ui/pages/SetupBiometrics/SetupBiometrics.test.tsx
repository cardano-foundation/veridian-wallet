const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";

import { AuthService } from "../../../core/agent/services";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes/paths";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import { setToastMsg, showGenericError } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { SetupBiometrics } from "./SetupBiometrics";
import { Agent } from "../../../core/agent/agent";
import { BiometricAuthOutcome, useBiometricAuth } from "../../hooks/useBiometricsHook";
import { IonAlert } from "@ionic/react";

jest.mock("../../utils/passcodeChecker", () => ({
  isRepeat: () => false,
  isConsecutive: () => false,
  isReverseConsecutive: () => false,
}));

const saveItem = jest.fn(() => Promise.resolve());
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: () => saveItem(),
        update: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(() => Promise.resolve()),
      },
      auth: {
        verifySecret: verifySecretMock,
        storeSecret: storeSecretMock,
      },
    },
  },
}));

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

const enablePrivacy = jest.fn(() => Promise.resolve());
const disablePrivacy = jest.fn(() => Promise.resolve());
jest.mock("../../hooks/privacyScreenHook", () => ({
  usePrivacyScreen: () => ({
    enablePrivacy,
    disablePrivacy,
  }),
}));

jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(),
  BiometricAuthOutcome: {
    SUCCESS: 0,
    USER_CANCELLED: 1,
    TEMPORARY_LOCKOUT: 2,
    PERMANENT_LOCKOUT: 3,
    GENERIC_ERROR: 4,
    WEAK_BIOMETRY: 5,
    NOT_AVAILABLE: 6,
  },
}));

const initialState = {
  stateCache: {
    routes: [RoutePath.SETUP_BIOMETRICS],
    currentProfileId: "",
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      finishSetupBiometrics: false,
      seedPhraseIsSet: false,
      passwordIsSkipped: false,
      ssiAgentIsSet: false,
      ssiAgentUrl: "",
      recoveryWalletProgress: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: 0,
      },
      firstAppLaunch: false,
    },
    queueIncomingRequest: {
      isProcessing: false,
      queues: [],
      isPaused: false,
    },
    isOnline: true,
  },
};

const dispatchMock = jest.fn();
const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

describe("SetupBiometrics Page", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("@ionic/react", () => {
      const actualIonicReact = jest.requireActual("@ionic/react");
      return {
        ...actualIonicReact,
        getPlatforms: () => ["mobileweb"],
      };
    });
    verifySecretMock.mockRejectedValue(
      new Error(AuthService.SECRET_NOT_STORED)
    );

    (Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock).mockReset();
    (Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock).mockResolvedValue(undefined);

    enablePrivacy.mockReset();
    disablePrivacy.mockReset();

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: false,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: jest.fn(),
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null, // Allow null for lockoutEndTime
    });

  });

  const history = createMemoryHistory();

  test("Renders", async () => {
    const { getByText, getAllByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    expect(getAllByText(EN_TRANSLATIONS.setupbiometrics.title).length).toBe(2);
    expect(getByText(EN_TRANSLATIONS.setupbiometrics.description)).toBeVisible();
    expect(getByText(EN_TRANSLATIONS.setupbiometrics.button.skip)).toBeVisible();
  });

  test("Click on skip", async () => {
    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("action-button"));

    await waitFor(() => {
      expect(getByTestId("alert-cancel-biometry")).toHaveAttribute('is-open', 'true');
    });

    fireEvent.click(getByTestId("alert-cancel-biometry-confirm-button"));

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalled();
    });

    expect(dispatchMock).toBeCalled();
  });

  test("Click on setup", async () => {
    const setupBiometricsMock = jest.fn(() => Promise.resolve(BiometricAuthOutcome.SUCCESS));

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: setupBiometricsMock,
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null,
    });

    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    expect(dispatchMock).toBeCalledWith(setEnableBiometricsCache(true));
    expect(dispatchMock).toBeCalledWith(
      setToastMsg(ToastMsgType.SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS)
    );

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalled();
    });

    expect(dispatchMock).toBeCalled();
  });

  test("Click on setup with GENERIC_ERROR outcome", async () => {
    const setupBiometricsMock = jest.fn(() => Promise.resolve(BiometricAuthOutcome.GENERIC_ERROR));

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: setupBiometricsMock,
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null,
    });

    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    expect(dispatchMock).toBeCalledWith(showGenericError(true));
  });

  test("Click on setup with WEAK_BIOMETRY outcome", async () => {
    const setupBiometricsMock = jest.fn(() => Promise.resolve(BiometricAuthOutcome.WEAK_BIOMETRY));

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: setupBiometricsMock,
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null,
    });

    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    expect(dispatchMock).toBeCalledWith(showGenericError(true));
  });

  test("Click on setup with NOT_AVAILABLE outcome", async () => {
    const setupBiometricsMock = jest.fn(() => Promise.resolve(BiometricAuthOutcome.NOT_AVAILABLE));

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: setupBiometricsMock,
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null,
    });

    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    expect(dispatchMock).toBeCalledWith(showGenericError(true));
  });

  test("Privacy screen is disabled and enabled during biometrics setup", async () => {
    const setupBiometricsMock = jest.fn(() => Promise.resolve(BiometricAuthOutcome.SUCCESS));

    (useBiometricAuth as jest.Mock).mockReturnValue({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(),
      setBiometricsIsEnabled: jest.fn(),
      setupBiometrics: setupBiometricsMock,
      checkBiometrics: jest.fn(),
      remainingLockoutSeconds: 30,
      lockoutEndTime: null as number | null,
    });

    const { getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByTestId("primary-button"));

    await waitFor(() => {
      expect(disablePrivacy).toBeCalled();
      expect(setupBiometricsMock).toBeCalled();
      expect(enablePrivacy).toBeCalled();
    });
  });
});