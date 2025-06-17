import { IonReactMemoryRouter } from "@ionic/react-router";
import { mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor, cleanup } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { connectionsForNotifications } from "../../__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { notificationsFix } from "../../__fixtures__/notificationsFix";
import { NotificationFilters } from "./Notification.types";
import { Notifications } from "./Notifications";
import { NotificationRoute } from "../../../core/agent/services/keriaNotificationService.types";
import { NotificationItem } from "./NotificationItem";

mockIonicReact();

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        notifications: {
          fallbackIcon: false,
        },
      },
    },
  },
}));

const readNotificationMock = jest.fn((id: string) => Promise.resolve(id));
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      multiSigs: {
        getMultisigIcpDetails: jest.fn().mockResolvedValue({
          sender: {
            label: "CF Credential Issuance",
          },
        }),
      },
      keriaNotifications: {
        readNotification: (id: string) => readNotificationMock(id),
      },
      basicStorage: {
        deleteById: jest.fn(() => Promise.resolve()),
      },
      credentials: {
        getCredentialDetailsById: jest.fn(() =>
          Promise.resolve(credsFixAcdc[0])
        ),
        getCredentials: jest.fn(() => Promise.resolve([])),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(),
      },
    },
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: jest.fn(),
    location: {
      pathname: TabsRoutePath.NOTIFICATIONS,
    },
  }),
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  connectionsCache: {
    connections: {},
  },
  notificationsCache: {
    notifications: [],
  },
  biometricsCache: {
    enabled: false,
  },
};

const fullState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  connectionsCache: {
    connections: connectionsForNotifications,
    multisigConnectionsCache: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: notificationsFix,
  },
  credsCache: {
    creds: [],
  },
  biometricsCache: {
    enabled: false,
  },
};

const filterTestData = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: [notificationsFix[0], notificationsFix[3]],
  },
  biometricsCache: {
    enabled: false,
  },
};

const emptyConnection = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  connectionsCache: {
    connections: {},
  },
  notificationsCache: {
    notifications: [
      notificationsFix[0],
      notificationsFix[3],
      notificationsFix[4],
    ],
  },
  biometricsCache: {
    enabled: false,
  },
};

describe("Notifications Tab", () => {
  afterEach(() => {
    cleanup();
  });

  test("Renders empty Notifications Tab", () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.NOTIFICATIONS]}>
          <Notifications />
        </MemoryRouter>
      </Provider>
    );

    expect(getByTestId("notifications-tab")).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.tab.header)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.tab.chips.all)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.tab.chips.identifiers)
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.tab.chips.credentials)
    ).toBeInTheDocument();
    expect(queryByTestId("notifications-tab-section-new")).toBeNull();
    expect(queryByTestId("notifications-tab-section-earlier")).toBeNull();
  });

  test("Filter", async () => {
    const storeMocked = {
      ...mockStore(filterTestData),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.NOTIFICATIONS]}>
          <Notifications />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeVisible();
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`${NotificationFilters.Credential}-filter-btn`)
      );
    });

    await waitFor(() => {
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeVisible();
      expect(
        queryByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
      ).toBe(null);
    });

    act(() => {
      fireEvent.click(
        getByTestId(`${NotificationFilters.Identifier}-filter-btn`)
      );
    });

    await waitFor(() => {
      expect(
        queryByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBe(null);
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
      ).toBeVisible();
    });
  });

  test("Item should mark as readed when click", async () => {
    const storeMocked = {
      ...mockStore(filterTestData),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getByTestId, getByText, queryByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <Notifications />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeVisible();
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      );
    });

    expect(readNotificationMock).toBeCalledWith(notificationsFix[0].id);

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.tab.unknownissuer.text)
      ).toBeVisible();
    });
  });

  test("Cannot open notification from unknown issuer", async () => {
    const storeMocked = {
      ...mockStore(filterTestData),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getByTestId, getByText, findByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <Notifications />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      );
    });

    const unknownIssuerText = await findByText(
      EN_TRANSLATIONS.tabs.notifications.tab.unknownissuer.text
    );
    expect(unknownIssuerText).toBeInTheDocument();
  });

  test("Cannot open notification from unknown presentation connection", async () => {
    const storeMocked = {
      ...mockStore(emptyConnection),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <Notifications />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[4].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`notifications-tab-item-${notificationsFix[4].id}`)
      );
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.tab.unknownrequest.text)
      ).toBeVisible();
    });
  });

  test("Renders Notifications in Notifications Tab", async () => {
    const storeMocked = {
      ...mockStore(fullState),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText, getAllByText } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.NOTIFICATIONS]}>
          <Notifications />
        </MemoryRouter>
      </Provider>
    );

    expect(getByTestId("notifications-tab-section-new")).toBeInTheDocument();
    await waitFor(() => {
      const notificationElements = getAllByText(
        "has requested a credential from you"
      );
      notificationElements.forEach((element) => {
        expect(element).toBeVisible();
      });
      expect(
        getByTestId("notifications-tab-section-earlier")
      ).toBeInTheDocument();
      expect(getByText("10m")).toBeInTheDocument();
      expect(getByText("2w")).toBeInTheDocument();
      expect(getByText("2y")).toBeInTheDocument();
    });
  });

  test("Open revoked credential detail", async () => {
    const storeMocked = {
      ...mockStore(fullState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[TabsRoutePath.NOTIFICATIONS]}>
          <Notifications />
        </MemoryRouter>
      </Provider>
    );

    expect(getByTestId("notifications-tab-section-new")).toBeInTheDocument();
    expect(getByTestId("revoke-credential-modal")).not.toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId(
          "notifications-tab-item-AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm1"
        )
      );
    });

    await waitFor(() => {
      expect(getByTestId("revoke-credential-modal")).toBeVisible();
    });
  });

  test("Renders LocalSign notification with certificate name - direct component test", async () => {
    const item = {
      id: "local-sign-test-id",
      connectionId: "connection-test-id",
      read: false,
      createdAt: new Date().toISOString(),
      a: {
        r: NotificationRoute.RemoteSignReq,
        payload: {},
      },

      groupReplied: false,
      groupInitiator: false,
      groupInitiatorPre: "",
    };

    const mockOnClick = jest.fn();
    const mockOptionClick = jest.fn();
    const customConnectionName = "Test Connection";

    const { getByTestId } = render(
      <Provider
        store={mockStore({
          connectionsCache: {
            connections: {
              "connection-test-id": { label: customConnectionName },
            },
          },
        })}
      >
        <NotificationItem
          item={item}
          onClick={mockOnClick}
          onOptionButtonClick={mockOptionClick}
          data-testid="notification-item-test"
        />
      </Provider>
    );

    const notificationElement = getByTestId("notifications-tab-item-label");

    const stripHtmlTags = (html: string) => html.replace(/<[^>]*>/g, "");

    const expectedTextWithoutTime = stripHtmlTags(
      EN_TRANSLATIONS.tabs.notifications.tab.labels.sign.replace(
        "{{connection}}",
        customConnectionName
      )
    );

    const timeDifferenceText = "0m";
    const expectedText = `${expectedTextWithoutTime}${timeDifferenceText}`;

    expect(notificationElement).toHaveTextContent(expectedText);
  });
});
