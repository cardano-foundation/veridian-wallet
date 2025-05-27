const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();

import { BiometryType } from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { AuthService } from "../../../core/agent/services";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes/paths";
import { setEnableBiometricsCache } from "../../../store/reducers/biometricsCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ToastMsgType } from "../../globals/types";
import { SetupBiometrics } from "./SetupBiometrics";

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
        createOrUpdateBasicRecord: jest.fn(),
      },
      auth: {
        verifySecret: verifySecretMock,
        storeSecret: storeSecretMock,
      },
    },
  },
}));
const handleBiometricAuthMock = jest.fn(() => Promise.resolve(true));
jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: false,
      hasCredentials: false,
      biometryType: BiometryType.fingerprintAuthentication,
      strongBiometryIsAvailable: false,
    },
    handleBiometricAuth: () => handleBiometricAuthMock(),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => true,
    },
  };
});

jest.mock("../../hooks/privacyScreenHook", () => ({
  usePrivacyScreen: () => ({
    enablePrivacy: jest.fn(),
    disablePrivacy: jest.fn(),
  }),
}));

const mockStore = configureStore();

const initialState = {
  stateCache: {
    routes: [RoutePath.SETUP_BIOMETRICS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      finishSetupBiometrics: false,
      userName: "",
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
  identifiersCache: {
    identifiers: {},
  },
};

const dispatchMock = jest.fn();
const storeMocked = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

describe("SetPasscode Page", () => {
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

    expect(
      getByText(EN_TRANSLATIONS.setupbiometrics.description)
    ).toBeVisible();
    expect(
      getByText(EN_TRANSLATIONS.setupbiometrics.button.skip)
    ).toBeVisible();
  });

  test("Click on skip", async () => {
    const { getByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SETUP_BIOMETRICS]}
      >
        <Provider store={storeMocked}>
          <SetupBiometrics />
        </Provider>
      </IonReactMemoryRouter>
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.setupbiometrics.button.skip));

    await waitFor(() => {
      expect(saveItem).toBeCalled();
    });

    expect(dispatchMock).toBeCalled();
  });

  test("Click on setup", async () => {
    require("@ionic/react");
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
      expect(handleBiometricAuthMock).toBeCalled();
    });

    expect(dispatchMock).toBeCalledWith(setEnableBiometricsCache(true));
    expect(dispatchMock).toBeCalledWith(
      setToastMsg(ToastMsgType.SETUP_BIOMETRIC_AUTHENTICATION_SUCCESS)
    );

    await waitFor(() => {
      expect(saveItem).toBeCalled();
    });

    expect(dispatchMock).toBeCalled();
  });
});
