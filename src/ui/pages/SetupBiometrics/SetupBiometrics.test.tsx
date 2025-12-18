const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();
const setupBiometricsMock = jest.fn();

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { IonReactMemoryRouter } from "@ionic/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";

import { Agent } from "../../../core/agent/agent";
import { AuthService } from "../../../core/agent/services";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes/paths";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import {
  setToastMsg,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import {
  useBiometricAuth,
  BiometricAuthOutcome,
} from "../../hooks/useBiometricsHook";
import { makeTestStore } from "../../utils/makeTestStore";
import { SetupBiometrics } from "./SetupBiometrics";

jest.mock("../../hooks/useBiometricsHook");

jest.mock("../../components/Alert", () => ({
  Alert: ({
    isOpen,
    headerText,
    subheaderText,
    confirmButtonText,
    actionConfirm,
    dataTestId,
  }: any) => {
    return isOpen ? (
      <div data-testid={dataTestId}>
        <h1>{headerText}</h1>
        <p>{subheaderText}</p>
        <button onClick={actionConfirm}>{confirmButtonText}</button>
      </div>
    ) : null;
  },
}));

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
      loginAttempt: { attempts: 0, lockedUntil: 0 },
      firstAppLaunch: false,
    },
    queueIncomingRequest: { isProcessing: false, queues: [], isPaused: false },
    isOnline: true,
  },
};

const dispatchMock = jest.fn();
const storeMocked = { ...makeTestStore(initialState), dispatch: dispatchMock };

const EN_TRANSLATIONS_ACTUAL = jest.requireActual(
  "../../../locales/en/en.json"
);

describe("SetupBiometrics Page", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
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
      lockoutEndTime: null,
    }));
    (
      Agent.agent.basicStorage.createOrUpdateBasicRecord as jest.Mock
    ).mockResolvedValue(undefined);
    verifySecretMock.mockRejectedValue(
      new Error(AuthService.SECRET_NOT_STORED)
    );
  });

  const history = createMemoryHistory();
  const renderComponent = () =>
    render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

  test("Renders", async () => {
    const { getByText, getAllByText } = renderComponent();
    expect(getAllByText(EN_TRANSLATIONS.setupbiometrics.title).length).toBe(2);
    expect(
      getByText(EN_TRANSLATIONS.setupbiometrics.description)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupbiometrics.button.skip)
    ).toBeVisible();
  });

  test("Click on skip", async () => {
    const { getByTestId, findByText, getByText } = renderComponent();
    fireEvent.click(getByTestId("action-button"));
    expect(
      await findByText(EN_TRANSLATIONS.biometry.cancelbiometryheader)
    ).toBeInTheDocument();
    fireEvent.click(getByText(EN_TRANSLATIONS.biometry.setupbiometryconfirm));
    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalled();
    });
    expect(dispatchMock).toBeCalled();
  });

  test("Click on setup", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.SUCCESS);
    const { getByTestId } = renderComponent();
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
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.GENERIC_ERROR);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId("primary-button"));
    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });
    expect(dispatchMock).toBeCalledWith(showGenericError(true));
  });

  test("Click on setup with NOT_AVAILABLE outcome", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.NOT_AVAILABLE);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId("primary-button"));
    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });
    expect(dispatchMock).toBeCalledWith(showGenericError(true));
  });

  test("Privacy screen is disabled and enabled during biometrics setup", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.SUCCESS);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId("primary-button"));
    await waitFor(() => {
      expect(disablePrivacy).toBeCalled();
      expect(setupBiometricsMock).toBeCalled();
      expect(enablePrivacy).toBeCalled();
    });
  });

  test("Should display cancel message when status is USER_CANCELLED", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.USER_CANCELLED);
    const { getByTestId, findByText } = renderComponent();
    fireEvent.click(getByTestId("primary-button"));
    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });
    expect(
      await findByText(EN_TRANSLATIONS.biometry.cancelbiometryheader)
    ).toBeInTheDocument();
  });
});
