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
    notificationsCache: {
      notifications: [],
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Render", async () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <TabsMenu
            tab={() => <></>}
            path={TabsRoutePath.IDENTIFIERS}
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

  test("Render notification", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        routes: [TabsRoutePath.NOTIFICATIONS],
      },
      notificationsCache: {
        notifications: notificationsFix,
      },
    };

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getAllByText } = render(
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

    expect(getAllByText(notificationsFix.length).length).toBeGreaterThan(0);
  });

  test("Render 99+ notification", async () => {
    const state = {
      ...initialState,
      stateCache: {
        ...initialState.stateCache,
        routes: [TabsRoutePath.NOTIFICATIONS],
      },
      notificationsCache: {
        notifications: new Array(100).fill(notificationsFix[0]),
      },
    };

    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getAllByText } = render(
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

    expect(getAllByText("99+").length).toBeGreaterThan(0);
  });
});
