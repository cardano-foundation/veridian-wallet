const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { KeyStoreKeys } from "../../../../../core/storage";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { store } from "../../../../../store";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { ChangePin } from "./ChangePin";

jest.mock("../../../../utils/passcodeChecker", () => ({
  isRepeat: () => false,
  isConsecutive: () => false,
  isReverseConsecutive: () => false,
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
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

const useBiometricAuthMock = jest.fn();

jest.mock("../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: () => useBiometricAuthMock(),
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "",
  })),
}));

const mockHandleClose = jest.fn();
const mockSetChangePinStep = jest.fn();

describe("ChangePin Modal", () => {
  beforeEach(() => {
    jest.resetModules();
    mockHandleClose.mockClear();
    mockSetChangePinStep.mockClear();
    jest.doMock("@ionic/react", () => {
      const actualIonicReact = jest.requireActual("@ionic/react");
      return {
        ...actualIonicReact,
        getPlatforms: () => ["mobileweb"],
      };
    });
    useBiometricAuthMock.mockImplementation(() => ({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
      setBiometricsIsEnabled: jest.fn(),
    }));
    verifySecretMock.mockResolvedValue(false);
  });

  test("Renders ChangePin Modal and initial UI components", async () => {
    require("@ionic/react");
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <ChangePin
          changePinStep={0}
          setChangePinStep={mockSetChangePinStep}
          handleClose={mockHandleClose}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.settings.sections.security.changepin.description
      )
    ).toBeInTheDocument();
    expect(getByTestId("passcode-module-container")).toBeInTheDocument();
    expect(getByTestId("change-pin-footer")).toHaveClass("hide");
  });

  test("Shows footer when first passcode is set", async () => {
    require("@ionic/react");
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={store}>
        <ChangePin
          changePinStep={0}
          setChangePinStep={mockSetChangePinStep}
          handleClose={mockHandleClose}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      ).toBeVisible()
    );
    expect(getByTestId("change-pin-footer")).not.toHaveClass("hide");
  });

  test("Set passcode and close modal when second passcode is entered correctly", async () => {
    require("@ionic/react");

    useBiometricAuthMock.mockImplementation(() => ({
      biometricsIsEnabled: false,
      biometricInfo: {
        isAvailable: true,
        hasCredentials: false,
        biometryType: BiometryType.FINGERPRINT,
      },
      handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
      setBiometricsIsEnabled: jest.fn(),
    }));

    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <ChangePin
          changePinStep={0}
          setChangePinStep={mockSetChangePinStep}
          handleClose={mockHandleClose}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(getByTestId("change-pin-footer")).not.toHaveClass("hide");
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(storeSecretMock).toBeCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });
  });

  test("Reset passcode when can't remember is clicked", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <ChangePin
          changePinStep={0}
          setChangePinStep={mockSetChangePinStep}
          handleClose={mockHandleClose}
        />
      </Provider>
    );

    // First enter a passcode to show the "can't remember" button
    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(getByTestId("change-pin-footer")).not.toHaveClass("hide");
    });

    // Click "can't remember" button - this resets the passcode entry
    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
      );
    });

    // After clicking "can't remember", the footer should be hidden again (state is reset)
    await waitFor(() => {
      expect(getByTestId("change-pin-footer")).toHaveClass("hide");
    });
  });
});
