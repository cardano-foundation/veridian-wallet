const verifySecretMock = jest.fn();
const storeSecretMock = jest.fn();

import { BiometryType } from "@capgo/capacitor-native-biometric";
import { IonRouterOutlet } from "@ionic/react";
import { IonReactMemoryRouter, IonReactRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { Redirect, Route } from "react-router-dom";

import { AuthService } from "../../../core/agent/services";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { store } from "../../../store";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { CreateSSIAgent } from "../CreateSSIAgent";
import { SetPasscode } from "./SetPasscode";

jest.mock("../../utils/passcodeChecker", () => ({
  isRepeat: () => false,
  isConsecutive: () => false,
  isReverseConsecutive: () => false,
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(() => Promise.resolve()),
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

jest.mock("../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: false,
      hasCredentials: false,
      biometryType: BiometryType.FINGERPRINT,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
    setBiometricsIsEnabled: jest.fn(),
  })),
}));

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

  test("Renders Re-enter Passcode title and start over button when passcode is set", async () => {
    require("@ionic/react");
    const { getByText, getByTestId, findByText } = render(
      <Provider store={store}>
        <SetPasscode />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");
    const text = await findByText(EN_TRANSLATIONS.setpasscode.reenterpasscode);

    await waitFor(() => expect(text).toBeInTheDocument());

    expect(
      getByText(EN_TRANSLATIONS.createpasscodemodule.cantremember)
    ).toBeInTheDocument();
  });

  test("renders enter passcode restarting the process when start over button is clicked", async () => {
    require("@ionic/react");
    const { getByText, queryByText, getByTestId, findByText } = render(
      <Provider store={store}>
        <SetPasscode />
      </Provider>
    );

    await passcodeFiller(getByText, getByTestId, "193212");
    const text = await findByText(EN_TRANSLATIONS.setpasscode.reenterpasscode);

    await waitFor(() => expect(text).toBeInTheDocument());

    const startOverElement = getByText(
      EN_TRANSLATIONS.createpasscodemodule.cantremember
    );

    fireEvent.click(startOverElement);

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.setpasscode.enterpasscode)
      ).toBeInTheDocument()
    );
  });

  test("Back to enter passcode screen from re-enter passcode screen", async () => {
    const { getByText, getByTestId, queryByText, findByText } = render(
      <Provider store={store}>
        <SetPasscode />
      </Provider>
    );
    await passcodeFiller(getByText, getByTestId, "193213");

    const text = await findByText(EN_TRANSLATIONS.setpasscode.reenterpasscode);

    await waitFor(() => expect(text).toBeInTheDocument());

    fireEvent.click(getByTestId("close-button"));

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.setpasscode.enterpasscode)
      ).toBeInTheDocument()
    );
  });

  test("Redirects to next page when passcode is entered correctly", async () => {
    require("@ionic/react");
    const { getByText, queryByText, getByTestId, findByText } = render(
      <IonReactRouter>
        <IonRouterOutlet animated={false}>
          <Provider store={store}>
            <Route
              exact
              path={RoutePath.SET_PASSCODE}
              component={SetPasscode}
            />
          </Provider>
          <Route
            path={RoutePath.SSI_AGENT}
            component={CreateSSIAgent}
          />
          <Redirect
            exact
            from="/"
            to={RoutePath.SET_PASSCODE}
          />
        </IonRouterOutlet>
      </IonReactRouter>
    );

    await passcodeFiller(getByText, getByTestId, "193212");

    const text = await findByText(EN_TRANSLATIONS.setpasscode.reenterpasscode);

    await waitFor(() => expect(text).toBeInTheDocument());

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.generateseedphrase.onboarding.title)
      ).not.toBeInTheDocument()
    );

    await waitFor(() =>
      expect(storeSecretMock).toBeCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      )
    );
  });

  test("calls handleOnBack when back button is clicked", async () => {
    require("@ionic/react");

    const initialState = {
      stateCache: {
        routes: [RoutePath.SET_PASSCODE, RoutePath.ONBOARDING],
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
      ...makeTestStore(initialState),
    };

    const history = createMemoryHistory();
    history.push(RoutePath.SET_PASSCODE);

    const { queryByText, getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[RoutePath.SET_PASSCODE]}
      >
        <Provider store={storeMocked}>
          <SetPasscode />
        </Provider>
      </IonReactMemoryRouter>
    );
    const backButton = getByTestId("close-button");
    fireEvent.click(backButton);
    await waitFor(() =>
      expect(
        queryByText(EN_TRANSLATIONS.setpasscode.enterpasscode)
      ).toBeInTheDocument()
    );
  });
});
