import { IonInput, IonLabel } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { setAuthentication } from "../../../../../store/reducers/stateCache";
import { CustomInputProps } from "../../../../components/CustomInput/CustomInput.types";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { Menu } from "../../Menu";
import { SubMenuKey } from "../../Menu.types";

jest.mock("../../../../../core/configuration", () => ({
  ...jest.requireActual("../../../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: jest.fn(() => Promise.resolve()),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

jest.mock("../../../../components/CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <>
        <IonLabel
          position="stacked"
          data-testid={`${props.title
            ?.toLowerCase()
            .replace(/\s/g, "-")}-input-title`}
        >
          {props.title}
          {props.optional && (
            <span className="custom-input-optional">(optional)</span>
          )}
        </IonLabel>
        <IonInput
          data-testid={props.dataTestId}
          onIonInput={(e) => {
            props.onChangeInput(e.detail.value as string);
          }}
          onIonFocus={() => props.onChangeFocus?.(true)}
          onIonBlur={() => props.onChangeFocus?.(false)}
        />
      </>
    );
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    location: {
      pathname: TabsRoutePath.MENU,
    },
  }),
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

const initialState = {
  stateCache: {
    routes: ["/"],
    authentication: {
      loggedIn: true,
      time: 1,
      passcodeIsSet: true,
      userName: "Frank",
      seedPhraseIsSet: false,
      passwordIsSet: false,
      passwordIsSkipped: false,
      ssiAgentIsSet: true,
      ssiAgentUrl: "http://keria.com",
      recoveryWalletProgress: false,
      loginAttempt: {
        attempts: 0,
        lockedUntil: 0,
      },
      firstAppLaunch: false,
    },
  },
  walletConnectionsCache: {
    showConnectWallet: false,
  },
};

const dispatchMock = jest.fn();

const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

describe("Profile page", () => {
  test("Change username", async () => {
    const { getByTestId, getByText, findByText } = render(
      <Provider store={storeMocked}>
        <Menu />
      </Provider>
    );

    expect(getByTestId("menu-tab")).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.title)
    ).toBeInTheDocument();
    const profileButton = getByTestId(`menu-input-item-${SubMenuKey.Profile}`);

    act(() => {
      fireEvent.click(profileButton);
    });

    await waitFor(() => {
      expect(getByTestId("profile-title")).toHaveTextContent(
        EN_TRANSLATIONS.tabs.menu.tab.items.profile.tabheader
      );
    });

    const actionButton = getByTestId("action-button");

    expect(getByTestId("profile-title")).toHaveTextContent(
      EN_TRANSLATIONS.tabs.menu.tab.items.profile.tabheader
    );
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionedit)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.name)
    ).toBeInTheDocument();
    expect(actionButton).toHaveTextContent(
      EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionedit
    );
    expect(getByTestId("profile-item-view-name")).toHaveTextContent(
      EN_TRANSLATIONS.tabs.menu.tab.items.profile.name + "Frank"
    );

    act(() => {
      fireEvent.click(actionButton);
    });

    await waitFor(() => {
      expect(getByTestId("edit-profile-title")).toHaveTextContent(
        EN_TRANSLATIONS.tabs.menu.tab.items.profile.tabedit
      );
      expect(actionButton).toHaveTextContent(
        EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionconfirm
      );
      expect(getByTestId("name-input-title")).toHaveTextContent(
        EN_TRANSLATIONS.tabs.menu.tab.items.profile.name
      );
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("profile-item-edit-name"), "Carl");
    });

    act(() => {
      fireEvent.click(actionButton);
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setAuthentication({
          loggedIn: true,
          time: 1,
          passcodeIsSet: true,
          userName: "Carl",
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: false,
          ssiAgentIsSet: true,
          ssiAgentUrl: "http://keria.com",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: 0,
          },
          firstAppLaunch: false,
        })
      );
    });
  });

  test("Validate user name", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <Menu />
      </Provider>
    );

    expect(getByTestId("menu-tab")).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.title)
    ).toBeInTheDocument();
    const profileButton = getByTestId(`menu-input-item-${SubMenuKey.Profile}`);

    act(() => {
      fireEvent.click(profileButton);
    });

    await waitFor(() => {
      expect(getByTestId("profile-title")).toHaveTextContent(
        EN_TRANSLATIONS.tabs.menu.tab.items.profile.tabheader
      );
    });

    const actionButton = getByTestId("action-button");
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionedit)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.name)
    ).toBeInTheDocument();
    expect(actionButton).toHaveTextContent(
      EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionedit
    );
    expect(getByTestId("profile-item-view-name")).toHaveTextContent(
      EN_TRANSLATIONS.tabs.menu.tab.items.profile.name + "Frank"
    );

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.actionedit)
    );

    await waitFor(() => {
      expect(getByTestId("profile-item-edit-name")).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("profile-item-edit-name"), "");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("profile-item-edit-name"), "   ");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.onlyspace)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(
        getByTestId("profile-item-edit-name"),
        "Duke Duke Duke Duke  Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke Duke"
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.maxlength)).toBeVisible();
    });

    act(() => {
      ionFireEvent.ionInput(getByTestId("profile-item-edit-name"), "Duke@@");
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.nameerror.hasspecialchar)).toBeVisible();
    });
  });
});
