const storeSecretMock = jest.fn();
const verifySecretMock = jest.fn();

import { BiometryErrorType } from "@aparajita/capacitor-biometric-auth";
import {
  BiometryError,
  BiometryType,
} from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { IonRouterOutlet } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { act } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { store } from "../../../store";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { CreatePasscodeModule } from "./CreatePasscodeModule";

const isRepeativeMock = jest.fn(() => false);
const isConsecutiveMock = jest.fn(() => false);
const isReverseConsecutiveMock = jest.fn(() => false);

jest.mock("../../utils/passcodeChecker", () => ({
  isRepeat: () => isRepeativeMock(),
  isConsecutive: () => isConsecutiveMock(),
  isReverseConsecutive: () => isReverseConsecutiveMock(),
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(),
      },
      auth: {
        storeSecret: storeSecretMock,
        verifySecret: verifySecretMock,
      },
    },
  },
}));

const handleBiometricAuthMock = jest.fn(() => Promise.resolve(true));

const useBiometricInfoMock = jest.fn(() => ({
  biometricsIsEnabled: false,
  biometricInfo: {
    isAvailable: true,
    hasCredentials: false,
    biometryType: BiometryType.fingerprintAuthentication,
    strongBiometryIsAvailable: true,
  },
  handleBiometricAuth: () => handleBiometricAuthMock(),
  setBiometricsIsEnabled: jest.fn(),
}));

jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: () => useBiometricInfoMock(),
}));

const getPlatformsMock = jest.fn(() => ["android"]);

jest.mock("@ionic/react", () => {
  return {
    ...jest.requireActual("@ionic/react"),
    getPlatforms: () => getPlatformsMock(),
  };
});

const mockStore = configureStore();
const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: ["/"],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {
    seedPhrase: "",
    bran: "",
  },
};

const storeMocked = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

describe("SetPasscode Page", () => {
  afterEach(() => {
    cleanup();
  });
  beforeEach(() => {
    jest.resetModules();
    getPlatformsMock.mockImplementation(() => ["mobileweb"]);
    isReverseConsecutiveMock.mockImplementation(() => false);
    isConsecutiveMock.mockImplementation(() => false);
    isRepeativeMock.mockImplementation(() => false);
    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(true));
    useBiometricInfoMock.mockImplementation(() => ({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.fingerprintAuthentication,
        strongBiometryIsAvailable: true,
      },
      handleBiometricAuth: () => handleBiometricAuthMock(),
      setBiometricsIsEnabled: jest.fn(),
    }));
  });

  test("Renders Create Passcode page with title and description", () => {
    require("@ionic/react");
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.enterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
      </Provider>
    );
    expect(
      getByText(EN_TRANSLATIONS.setpasscode.enterpasscode)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.setpasscode.description)
    ).toBeInTheDocument();
    expect(getByTestId("set-passcode-footer")).toHaveClass("hide");
  });

  test("The user can add and remove digits from the passcode", () => {
    require("@ionic/react");
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.enterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
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

  test("Entering a wrong passcode at the passcode confirmation returns an error", async () => {
    verifySecretMock.mockResolvedValue(false);
    require("@ionic/react");
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={store}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193213");

    await waitFor(() => {
      const labelElement = getByText(
        EN_TRANSLATIONS.setpasscode.reenterpasscode
      );
      expect(labelElement).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193214");

    await waitFor(
      () =>
        expect(queryByText(EN_TRANSLATIONS.createpasscodemodule.errornomatch))
          .toBeVisible
    );
  });

  test("Entering an existing passcode returns an error", async () => {
    verifySecretMock.mockResolvedValue(true);
    require("@ionic/react");
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193213");

    await waitFor(
      () =>
        expect(queryByText(EN_TRANSLATIONS.createpasscodemodule.errornomatch))
          .toBeVisible
    );
  });

  test("Display repeat passcode message", async () => {
    verifySecretMock.mockResolvedValue(true);
    isRepeativeMock.mockImplementation(() => true);
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193213");

    await waitFor(
      () =>
        expect(queryByText(EN_TRANSLATIONS.createpasscodemodule.repeat))
          .toBeVisible
    );
  });

  test("Display a consecutive passcode", async () => {
    verifySecretMock.mockResolvedValue(true);
    isReverseConsecutiveMock.mockImplementation(() => true);
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CreatePasscodeModule
          title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
          description={EN_TRANSLATIONS.setpasscode.description}
          testId="set-passcode"
          onCreateSuccess={jest.fn()}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193213");

    await waitFor(
      () =>
        expect(queryByText(EN_TRANSLATIONS.createpasscodemodule.consecutive))
          .toBeVisible
    );
  });

  test("Setup passcode and Android biometrics", async () => {
    getPlatformsMock.mockImplementation(() => ["android"]);
    verifySecretMock.mockResolvedValue(false);

    const { getByText, queryByText, getByTestId } = render(
      <IonReactRouter>
        <IonRouterOutlet animated={false}>
          <Provider store={store}>
            <CreatePasscodeModule
              title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
              description={EN_TRANSLATIONS.setpasscode.description}
              testId="set-passcode"
              onCreateSuccess={jest.fn()}
            />
          </Provider>
        </IonRouterOutlet>
      </IonReactRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.setpasscode.reenterpasscode)
    ).toBeInTheDocument();

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      ).toBeInTheDocument()
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeInTheDocument()
    );

    fireEvent.click(getByTestId("alert-setup-biometry-confirm-button"));

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

    await waitFor(() => {
      expect(storeSecretMock).toBeCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });
  });

  test("Setup passcode and cancel Android biometrics", async () => {
    verifySecretMock.mockResolvedValue(false);
    getPlatformsMock.mockImplementation(() => ["android"]);
    require("@ionic/react");

    const { getByText, queryByText, getByTestId } = render(
      <IonReactRouter>
        <IonRouterOutlet animated={false}>
          <Provider store={store}>
            <CreatePasscodeModule
              title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
              description={EN_TRANSLATIONS.setpasscode.description}
              testId="set-passcode"
              onCreateSuccess={jest.fn()}
            />
          </Provider>
        </IonRouterOutlet>
      </IonReactRouter>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.setpasscode.reenterpasscode)
      ).toBeInTheDocument();

      expect(
        getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      ).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("alert-setup-biometry-cancel-button"));
    });

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.biometry.setupbiometrycancel)
      ).toBeInTheDocument()
    );
  });

  test("Setup passcode and iOS biometrics", async () => {
    verifySecretMock.mockResolvedValue(false);
    useBiometricInfoMock.mockImplementation(() => ({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.faceId,
        strongBiometryIsAvailable: true,
      },
      handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
      setBiometricsIsEnabled: jest.fn(),
    }));
    getPlatformsMock.mockImplementation(() => ["ios"]);

    const onCreateSuccessMock = jest.fn();
    const { getByText, queryByText, getByTestId } = render(
      <IonReactRouter>
        <IonRouterOutlet animated={false}>
          <Provider store={store}>
            <CreatePasscodeModule
              title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
              description={EN_TRANSLATIONS.setpasscode.description}
              testId="set-passcode"
              onCreateSuccess={onCreateSuccessMock}
            />
          </Provider>
        </IonRouterOutlet>
      </IonReactRouter>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      ).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.setpasscode.reenterpasscode)
      ).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.click(getByTestId("alert-setup-biometry-confirm-button"));
    });

    await waitFor(() => {
      expect(
        Agent.agent.basicStorage.createOrUpdateBasicRecord
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: MiscRecordId.APP_BIOMETRY,
          content: {
            enabled: true,
          },
        })
      );
    });

    await waitFor(() => {
      expect(storeSecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(onCreateSuccessMock).toHaveBeenCalled();
    });
  });

  test("Setup passcode and cancel iOS biometrics", async () => {
    verifySecretMock.mockResolvedValue(false);
    jest.doMock("../../hooks/useBiometricsHook", () => ({
      useBiometricAuth: jest.fn(() => ({
        biometricsIsEnabled: false,
        biometricInfo: {
          isAvailable: true,
          hasCredentials: false,
          biometryType: BiometryType.faceId,
          strongBiometryIsAvailable: true,
        },
        handleBiometricAuth: jest.fn(() =>
          Promise.resolve(new BiometryError("", BiometryErrorType.userCancel))
        ),
        setBiometricsIsEnabled: jest.fn(),
      })),
    }));
    getPlatformsMock.mockImplementation(() => ["ios"]);
    require("@ionic/react");

    const { getByText, queryByText, getByTestId } = render(
      <IonReactRouter>
        <IonRouterOutlet animated={false}>
          <Provider store={store}>
            <CreatePasscodeModule
              title={EN_TRANSLATIONS.setpasscode.reenterpasscode}
              description={EN_TRANSLATIONS.setpasscode.description}
              testId="set-passcode"
              onCreateSuccess={jest.fn()}
            />
          </Provider>
        </IonRouterOutlet>
      </IonReactRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.setpasscode.reenterpasscode)
    ).toBeInTheDocument();

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toBeCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      ).toBeInTheDocument();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.biometry.setupbiometrycancel)
      ).toBeInTheDocument()
    );
  });
});
