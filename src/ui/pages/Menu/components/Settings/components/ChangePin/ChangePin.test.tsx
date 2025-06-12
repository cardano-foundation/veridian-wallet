const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();

import { BiometryType } from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { KeyStoreKeys } from "../../../../../../../core/storage";
import EN_TRANSLATIONS from "../../../../../../../locales/en/en.json";
import { store } from "../../../../../../../store";
import { passcodeFiller } from "../../../../../../utils/passcodeFiller";
import { ChangePin } from "./ChangePin";

jest.mock("../../../../../../utils/passcodeChecker", () => ({
  isRepeat: () => false,
  isConsecutive: () => false,
  isReverseConsecutive: () => false,
}));

const mockSetIsOpen = jest.fn();

jest.mock("../../../../../../../core/agent/agent", () => ({
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

jest.mock("../../../../../../hooks/useBiometricsHook", () => ({
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

describe("ChangePin Modal", () => {
  beforeEach(() => {
    jest.resetModules();
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
        biometryType: BiometryType.fingerprintAuthentication,
        strongBiometryIsAvailable: false,
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
          isOpen={true}
          setIsOpen={mockSetIsOpen}
        />
      </Provider>
    );

    expect(getByTestId("close-button")).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
          .createpasscode
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
          .cancel
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
          .description
      )
    ).toBeInTheDocument();
    expect(getByTestId("passcode-module-container")).toBeInTheDocument();
    expect(getByTestId("change-pin-footer")).toHaveClass("hide");
  });

  test("Renders Re-enter Passcode when first time passcode is set", async () => {
    require("@ionic/react");
    const { getByText, queryByText, getByTestId, findByText } = render(
      <Provider store={store}>
        <ChangePin
          isOpen={true}
          setIsOpen={mockSetIsOpen}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    const text = await findByText(
      EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
        .reenterpasscode
    );

    await waitFor(() => expect(text).toBeInTheDocument());

    await waitFor(() =>
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
            .back
        )
      ).toBeInTheDocument()
    );
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
        biometryType: BiometryType.fingerprintAuthentication,
        strongBiometryIsAvailable: false,
      },
      handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
      setBiometricsIsEnabled: jest.fn(),
    }));

    const { getByText, getByTestId, findByText } = render(
      <Provider store={store}>
        <ChangePin
          isOpen={true}
          setIsOpen={mockSetIsOpen}
        />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");
    const text = await findByText(
      EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
        .reenterpasscode
    );

    await waitFor(() => {
      expect(text).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(storeSecretMock).toBeCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });
  });

  test("Cancel change pin", async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ChangePin
          isOpen={true}
          setIsOpen={mockSetIsOpen}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
            .cancel
        )
      );
    });

    await waitFor(() => {
      expect(mockSetIsOpen).toBeCalledWith(false);
    });
  });
});
