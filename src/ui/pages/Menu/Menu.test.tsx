import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { store } from "../../../store";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { Menu } from "./Menu";
import { SubMenuKey } from "./Menu.types";
import { makeTestStore } from "../../utils/makeTestStore";

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

const combineMock = jest.fn(() => TabsRoutePath.MENU);
const historyPushMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: (args: unknown) => {
      historyPushMock(args);
    },
    location: {
      pathname: combineMock(),
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

const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: ["/"],
    authentication: {
      loggedIn: true,
      userName: "Frank",
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  biometricsCache: {
    enable: false,
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  walletConnectionsCache: {
    showConnectWallet: false,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
};

const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

describe("Menu Tab", () => {
  test("Renders Menu Tab", () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    expect(getByTestId("menu-tab")).toBeInTheDocument();
    expect(getByText(EN_TRANSLATIONS.tabs.menu.tab.header)).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.profile.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.connections.title)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.title)
    ).toBeInTheDocument();
  });

  test("Open Cardano connect sub-menu", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <Menu />
      </Provider>
    );

    expect(getByTestId("menu-tab")).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.title)
    ).toBeInTheDocument();
    const connectButton = getByTestId(
      `menu-input-item-${SubMenuKey.ConnectWallet}`
    );

    act(() => {
      fireEvent.click(connectButton);
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.tabheader)
      ).toBeVisible();
    });
  });
});
