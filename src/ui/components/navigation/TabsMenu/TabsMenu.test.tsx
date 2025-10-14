import { render, waitFor , getDefaultNormalizer } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { TabsMenu, TabsRoutePath, tabsRoutes } from "./TabsMenu";
import { notificationsFix } from "../../../__fixtures__/notificationsFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import {
  filteredIdentifierFix,
  failedFilteredIdentifierMapFix,
} from "../../../__fixtures__/filteredIdentifierFix";
import { Agent } from "../../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA: "MISSING_DATA_ON_KERIA",
    agent: {
      identifiers: {
        getIdentifier: jest.fn(),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

describe("Tab menu", () => {
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

    tabsRoutes.forEach((tab) => {
      expect(getByText(tab.label)).toBeVisible();

      const tabButton = getByTestId(
        "tab-button-" + tab.label.toLowerCase().replace(/\s/g, "-")
      );

      expect(tabButton).toHaveAttribute("href", tab.path);
      expect(tabButton.onclick).toBeDefined();
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

    expect(getAllByText(7).length).toBeGreaterThan(0);
  });

  describe("ProfileStateModal - Show profile error states", () => {
    test("Show pending profile issue", async () => {
      const initialStatePendingEmpty = {
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
        seedPhraseCache: {},
        profilesCache: {
          ...profileCacheFixData,
          defaultProfile: filteredIdentifierFix[2].id,
        },
        viewTypeCache: {
          identifier: {
            viewType: null,
            favouriteIndex: 0,
          },
          credential: {
            viewType: null,
            favouriteIndex: 0,
          },
        },
        biometricsCache: {
          enabled: false,
        },
      };

      const storeMocked = {
        ...makeTestStore(initialStatePendingEmpty),
      };

      const history = createMemoryHistory();
      history.push(TabsRoutePath.CREDENTIALS);

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <TabsMenu
              tab={() => <></>}
              path={TabsRoutePath.CREDENTIALS}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.pending)
        ).toBeVisible();
      });
    });

    test("Show creating error", async () => {
      const initialStateErrorEmpty = {
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
        seedPhraseCache: {},
        profilesCache: {
          profiles: {
            [failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id].id]: {
              identity:
                failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id],
              connections: [],
              multisigConnections: [],
              peerConnections: [],
              credentials: [],
              archivedCredentials: [],
              notifications: [],
            },
          },
          defaultProfile: filteredIdentifierFix[0].id,
          showProfileState: true,
        },
        viewTypeCache: {
          identifier: {
            viewType: null,
            favouriteIndex: 0,
          },
          credential: {
            viewType: null,
            favouriteIndex: 0,
          },
        },
        biometricsCache: {
          enabled: false,
        },
      };

      const storeMocked = {
        ...makeTestStore(initialStateErrorEmpty),
      };

      const history = createMemoryHistory();
      history.push(TabsRoutePath.CREDENTIALS);

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <TabsMenu
              tab={() => <></>}
              path={TabsRoutePath.CREDENTIALS}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.nowitness)
        ).toBeVisible();
      });
    });

    test("Show missing on cloud error", async () => {
      const initialStateEmpty = {
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
        seedPhraseCache: {},
        profilesCache: {
          ...profileCacheFixData,
          defaultProfile: filteredIdentifierFix[1].id,
        },
        viewTypeCache: {
          identifier: {
            viewType: null,
            favouriteIndex: 0,
          },
          credential: {
            viewType: null,
            favouriteIndex: 0,
          },
        },
        biometricsCache: {
          enabled: false,
        },
      };

      const storeMocked = {
        ...makeTestStore(initialStateEmpty),
      };

      jest
        .spyOn(Agent.agent.identifiers, "getIdentifier")
        .mockImplementation(() =>
          Promise.reject(new Error(Agent.MISSING_DATA_ON_KERIA))
        );

      const history = createMemoryHistory();
      history.push(TabsRoutePath.CREDENTIALS);

      const { getByText } = render(
        <IonReactMemoryRouter history={history}>
          <Provider store={storeMocked}>
            <TabsMenu
              tab={() => <></>}
              path={TabsRoutePath.CREDENTIALS}
            />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.profiledetails.loadprofileerror.missingoncloud,
            {
              normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
            }
          )
        ).toBeVisible();
      });
    });
  });
});
