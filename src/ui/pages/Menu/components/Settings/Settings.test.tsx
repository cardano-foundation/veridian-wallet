import {
  BiometryErrorType,
  BiometryType,
} from "@aparajita/capacitor-biometric-auth/dist/esm/definitions";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act, useState } from "react";
import { Provider } from "react-redux";

import { Agent } from "../../../../../core/agent/agent";
import { MiscRecordId } from "../../../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { store } from "../../../../../store";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { DOCUMENTATION_LINK } from "../../../../globals/constants";
import { ToastMsgType } from "../../../../globals/types";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { SubMenuKey } from "../../Menu.types";
import { Settings } from "./Settings";
import { OptionIndex } from "./Settings.types";
import { makeTestStore } from "../../../../utils/makeTestStore";

jest.mock("../../../../../store/utils", () => ({
  CLEAR_STORE_ACTIONS: [],
}));

jest.mock("@capacitor-community/privacy-screen", () => ({
  PrivacyScreen: {
    enable: jest.fn(),
    disable: jest.fn(),
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: (props: any) => (
    <div
      data-testid={props["data-testid"]}
      style={{ display: props.isOpen ? "block" : "none" }}
    >
      {props.children}
    </div>
  ),
}));

const browserMock = jest.fn(({ link }: { link: string }) =>
  Promise.resolve(link)
);
jest.mock("@capacitor/browser", () => ({
  ...jest.requireActual("@capacitor/browser"),
  Browser: {
    open: (params: never) => browserMock(params),
  },
}));

let useBiometricAuthMock = jest.fn(() => {
  const [biometricsIsEnabled, setBiometricsIsEnabled] = useState(true);

  return {
    biometricsIsEnabled,
    biometricInfo: {
      isAvailable: true,
      hasCredentials: false,
      biometryType: BiometryType.fingerprintAuthentication,
      strongBiometryIsAvailable: true,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
    setBiometricsIsEnabled,
  };
});

jest.mock("../../../../hooks/useBiometricsHook", () => {
  return {
    useBiometricAuth: () => useBiometricAuthMock(),
  };
});

const openSettingMock = jest.fn(() => Promise.resolve(true));
const deleteAccount = jest.fn();
jest.mock("capacitor-native-settings", () => ({
  ...jest.requireActual("capacitor-native-settings"),
  NativeSettings: {
    open: () => openSettingMock(),
  },
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
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      deleteAccount: () => deleteAccount(),
    },
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    ...jest.requireActual("react-router-dom").useHistory,
    push: jest.fn(),
  }),
}));

describe("Settings page", () => {
  test("Renders Settings page", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.title)
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin.title
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.biometry
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.managepassword
          .title
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase
          .title
      )
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.contact)
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.learnmore
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.terms.title
      )
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.version)
    ).toBeInTheDocument();
  });

  test("Enable biometrics toggle", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.biometry
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("settings-item-0"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode-content-page")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

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
  });

  test("Disable biometrics toggle", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: true,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.biometry
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("settings-item-0"));
    });

    await waitFor(() => {
      expect(
        Agent.agent.basicStorage.createOrUpdateBasicRecord
      ).toBeCalledTimes(1);
    });

    await waitFor(() => {
      expect(Agent.agent.basicStorage.createOrUpdateBasicRecord).toBeCalledWith(
        expect.objectContaining({
          id: MiscRecordId.APP_BIOMETRY,
          content: {
            enabled: false,
          },
        })
      );
    });
  });

  test("Open setting page when biometrics not available", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    useBiometricAuthMock = jest.fn(() => {
      const [biometricsIsEnabled, setBiometricsIsEnabled] = useState(true);

      return {
        biometricsIsEnabled,
        biometricInfo: {
          isAvailable: true,
          hasCredentials: false,
          biometryType: BiometryType.fingerprintAuthentication,
          strongBiometryIsAvailable: false,
          code: BiometryErrorType.biometryNotEnrolled,
        },
        handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
        setBiometricsIsEnabled,
      };
    });

    const { queryByText } = render(
      <Provider store={storeMocked}>
        <Settings />
      </Provider>
    );

    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.biometry
      )
    ).not.toBeInTheDocument();
  });

  test("Open documentation link", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.contact)
    ).toBeInTheDocument();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.learnmore
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-item-${OptionIndex.Documentation}`)
      );
    });

    await waitFor(() => {
      expect(browserMock).toBeCalledWith({
        url: DOCUMENTATION_LINK,
      });
    });
  });

  test("Switch page", async () => {
    const switchViewMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings switchView={switchViewMock} />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.support.terms.title
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId(`settings-item-${OptionIndex.Term}`));
    });

    await waitFor(() => {
      expect(switchViewMock).toBeCalledWith(SubMenuKey.TermsAndPrivacy);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.managepassword
          .title
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-item-${OptionIndex.ManagePassword}`)
      );
    });

    await waitFor(() => {
      expect(switchViewMock).toBeCalledWith(SubMenuKey.ManagePassword);
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.seedphrase
          .title
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        getByTestId(`settings-item-${OptionIndex.RecoverySeedPhrase}`)
      );
    });

    await waitFor(() => {
      expect(switchViewMock).toBeCalledWith(SubMenuKey.RecoverySeedPhrase);
    });
  });

  test("Open change passcode", async () => {
    const switchViewMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings switchView={switchViewMock} />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin.title
      )
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId(`settings-item-${OptionIndex.ChangePin}`));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.settings.sections.security.changepin
            .createpasscode
        )
      ).toBeVisible();
    });
  });
  test("Delete account", async () => {
    const state = {
      stateCache: {
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
      },
      credsCache: { creds: [], favourites: [] },
      credsArchivedCache: { creds: [] },
      identifiersCache: {
        identifiers: [],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enable: false,
      },
    };

    const dispatchMock = jest.fn();

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const switchViewMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <Settings switchView={switchViewMock} />
      </Provider>
    );

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.settings.sections.deleteaccount.button
      )
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.settings.sections.deleteaccount.alert
            .title
        )
      );
    });

    fireEvent.click(getByTestId("delete-account-alert-confirm-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title));
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(deleteAccount).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.DELETE_ACCOUNT_SUCCESS)
      );
    });
  });
});
