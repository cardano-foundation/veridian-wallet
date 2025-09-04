import { fireEvent, render } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { waitForIonicReact } from "@ionic/react-test-utils";
import { act } from "react";
import { TabsMenu, TabsRoutePath, tabsRoutes } from "./TabsMenu";
import { setCurrentRoute } from "../../../../store/reducers/stateCache";
import { notificationsFix } from "../../../__fixtures__/notificationsFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { filteredIdentifierFix } from "../../../__fixtures__/filteredIdentifierFix";

describe("Tab menu", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        time: 0,
        passcodeIsSet: true,
        seedPhraseIsSet: true,
        passwordIsSet: false,
        passwordIsSkipped: true,
        ssiAgentIsSet: true,
        ssiAgentUrl: "http://keria.com",
        recoveryWalletProgress: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: 0,
        },
      },
    },
    seedPhraseCache: {
      seedPhrase: "",
      bran: "",
    },
    profilesCache: profileCacheFixData,
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Render", async () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <TabsMenu
            tab={() => <></>}
            path={TabsRoutePath.CREDENTIALS}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitForIonicReact();

    tabsRoutes.forEach((tab) => {
      expect(getByText(tab.label)).toBeVisible();

      act(() => {
        fireEvent.click(
          getByTestId(
            "tab-button-" + tab.label.toLowerCase().replace(/\s/g, "-")
          )
        );
      });

      expect(dispatchMock).toBeCalledWith(setCurrentRoute({ path: tab.path }));
    });
  });

  test("Render 99+ notification", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        routes: [TabsRoutePath.CREDENTIALS],
      },
      profilesCache: {
        profiles: {
          [filteredIdentifierFix[0].id]: {
            identity: filteredIdentifierFix[0],
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: new Array(100).fill(notificationsFix[0]),
          },
        },
        defaultProfile: filteredIdentifierFix[0].id,
        recentProfiles: [],
        multiSigGroup: undefined,
      },
    };

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getAllByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <TabsMenu
            tab={() => <></>}
            path={TabsRoutePath.CREDENTIALS}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitForIonicReact();

    expect(getAllByText("99+").length).toBeGreaterThan(0);
  });

  test("Notifications counter is hidden when tab is selected", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        routes: [TabsRoutePath.NOTIFICATIONS],
      },
      profilesCache: profileCacheFixData,
    };

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { container } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <TabsMenu
            tab={() => <></>}
            path={TabsRoutePath.NOTIFICATIONS}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitForIonicReact();

    const counter = container.querySelector(".bubble-counter");
    expect(counter).not.toBeInTheDocument();
  });

  test("Notifications counter is visible when tab is not selected", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        routes: [TabsRoutePath.CREDENTIALS],
      },
      profilesCache: profileCacheFixData,
    };

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getAllByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <TabsMenu
            tab={() => <></>}
            path={TabsRoutePath.CREDENTIALS}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitForIonicReact();
    expect(getAllByText(7).length).toBeGreaterThan(0);
  });
});
