import { BiometryType } from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import TRANSLATIONS from "../../../../../../../locales/en/en.json";
import { RoutePath } from "../../../../../../../routes";
import { OperationType } from "../../../../../../globals/types";
import { passcodeFiller } from "../../../../../../utils/passcodeFiller";
import { RecoverySeedPhrase } from "./RecoverySeedPhrase";

jest.mock("../../../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      getMnemonic: jest.fn(() => Promise.resolve("")),
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

jest.mock("../../../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: false,
      hasCredentials: false,
      biometryType: BiometryType.fingerprintAuthentication,
      strongBiometryIsAvailable: true,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(false)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const initialState = {
  stateCache: {
    routes: [RoutePath.GENERATE_SEED_PHRASE],
    authentication: {
      loggedIn: false,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      seedPhraseIsSet: false,
    },
    isOnline: true,
    currentOperation: OperationType.IDLE,
  },
  biometricsCache: {
    enabled: false,
  },
};

const mockStore = configureStore();
const dispatchMock = jest.fn();
const storeMocked = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

describe("Recovery Phrase", () => {
  test("Render", async () => {
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhrase onClose={jest.fn} />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .tips.one
        )
      ).toBeVisible();
      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .tips.two
        )
      ).toBeVisible();
      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .tips.three
        )
      ).toBeVisible();
      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .button.view
        )
      ).toBeVisible();
      expect(
        queryByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .button.hide
        )
      ).toBe(null);
    });

    expect(
      getByTestId("seed-phrase-module").classList.contains("seed-phrase-hidden")
    ).toBe(true);
  });

  test("Show phrase", async () => {
    const { queryByTestId, getByTestId, getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <RecoverySeedPhrase onClose={jest.fn} />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .tips.one
        )
      ).toBeVisible();

      expect(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .button.view
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(
        TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
          .button.view
      )
    );

    expect(getByTestId("confirm-view-seedpharse")).toBeVisible();
    expect(getByTestId("primary-button-confirm-view-seedpharse")).toBeVisible();
    expect(
      getByTestId("primary-button-confirm-view-seedpharse").getAttribute(
        "disabled"
      )
    ).toBe("true");

    fireEvent.click(getByTestId("condition-item-0"));
    fireEvent.click(getByTestId("condition-item-1"));
    fireEvent.click(getByTestId("condition-item-2"));

    await waitFor(() => {
      expect(
        getByTestId("primary-button-confirm-view-seedpharse").getAttribute(
          "disabled"
        )
      ).toBe("false");
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-confirm-view-seedpharse"));
    });

    await waitFor(() => {
      expect(getByText(TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(queryByText(TRANSLATIONS.verifypasscode.title)).toBeNull();
      expect(
        getByTestId("seed-phrase-module").classList.contains(
          "seed-phrase-visible"
        )
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(queryByTestId("confirm-view-seedpharse")).toBe(null);
      expect(
        getByTestId("seed-phrase-module").classList.contains(
          "seed-phrase-visible"
        )
      ).toBe(true);
      expect(
        queryByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .button.hide
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(
          TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase.page
            .button.hide
        )
      );
    });

    await waitFor(() => {
      expect(
        getByTestId("seed-phrase-module").classList.contains(
          "seed-phrase-hidden"
        )
      ).toBe(true);
    });
  });
});
