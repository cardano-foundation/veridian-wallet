import { IonReactMemoryRouter } from "@ionic/react-router";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { makeTestStore } from "../../utils/makeTestStore";
import { Home } from "./Home";

afterEach(() => {
  cleanup();
});

describe("Home page", () => {
  test("renders Home tab and opens ScanToLogin when scan tile clicked", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.HOME],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      profilesCache: {
        profiles: {
          "test-profile": {
            identity: {
              id: "test-profile",
              displayName: "Alice",
              createdAtUTC: "2000-01-01T00:00:00.000Z",
            },
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        },
        defaultProfile: "test-profile",
      },
      biometricsCache: { enabled: false },
    };

    const store = makeTestStore(initialState);

    const history = createMemoryHistory();
    history.push(TabsRoutePath.HOME);

    const { getByTestId } = render(
      <Provider store={store}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.HOME]}
        >
          <Home />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("home-tab")).toBeInTheDocument();

    const scanTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.scan.title as string;

    const tile = getByTestId(`tile-${scanTitle}`);
    fireEvent.click(tile);

    await waitFor(() => {
      expect(getByTestId("scan-to-login")).toBeInTheDocument();
    });
  });

  test("clicking avatar opens Profiles modal", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.HOME],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      profilesCache: {
        profiles: {
          "test-profile": {
            identity: {
              id: "test-profile",
              displayName: "Alice",
              createdAtUTC: "2000-01-01T00:00:00.000Z",
            },
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        },
        defaultProfile: "test-profile",
      },
      biometricsCache: { enabled: false },
    };

    const store = makeTestStore(initialState);

    const history = createMemoryHistory();
    history.push(TabsRoutePath.HOME);

    const { getByTestId } = render(
      <Provider store={store}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.HOME]}
        >
          <Home />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("avatar-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("avatar-button"));

    await waitFor(() => {
      expect(getByTestId("profiles")).toBeInTheDocument();
    });
  });
});
