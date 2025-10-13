import { IonReactMemoryRouter } from "@ionic/react-router";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { NotificationRoute } from "../../../core/agent/services/keriaNotificationService.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { connectionsForNotificationsValues } from "../../__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../__fixtures__/notificationsFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { NotificationFilters } from "./Notification.types";
import { NotificationItem } from "./NotificationItem";
import { Notifications } from "./Notifications";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";

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
  profilesCache: {
    ...profileCacheFixData,
    defaultProfile: filteredIdentifierFix[2].id,
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
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB: {
        identity: {
          id: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
          displayName: (
            connectionsForNotificationsValues.find(
              (c) => c.id === "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB"
            ) || { label: "" }
          ).label,
          createdAtUTC: "2000-01-01T00:00:00.000Z",
        },
        connections: [
          connectionsForNotificationsValues.find(
            (c) => c.id === "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB"
          ) || {},
        ],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    },
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
  profilesCache: profileCacheFixData,
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
  profilesCache: profileCacheFixData,
  biometricsCache: {
    enabled: false,
  },
};

describe("Notifications Tab", () => {
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  const filterStore = {
    ...makeTestStore(filterTestData),
    dispatch: dispatchMock,
  };

  afterEach(() => {
    cleanup();
  });

  test("Renders empty Notifications Tab", () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.NOTIFICATIONS]}
        >
          <Notifications />
        </IonReactMemoryRouter>
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

  test("Open profile", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.NOTIFICATIONS]}
        >
          <Notifications />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("avatar-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("avatar-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeVisible();
    });
  });

  test("Filter", async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={filterStore}>
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
    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={filterStore}>
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
    const history = createMemoryHistory();
    history.push(TabsRoutePath.NOTIFICATIONS);

    const { getByTestId, findByTestId, findAllByTestId } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={filterStore}>
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

    const alerts = await findAllByTestId("alert-unknown-issuer");
    expect(alerts[0]).toBeInTheDocument();
    expect(alerts[0]).toHaveAttribute(
      "header",
      EN_TRANSLATIONS.tabs.notifications.tab.unknownissuer.text
    );
  });

  test("Cannot open notification from unknown presentation connection", async () => {
    const storeMocked = {
      ...makeTestStore(emptyConnection),
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
      ...makeTestStore(fullState),
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
      ...makeTestStore(fullState),
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
      receivingPre: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfA",
    };

    const mockOnClick = jest.fn();
    const mockOptionClick = jest.fn();
    const customConnectionName = "Test Connection";

    const { getByTestId } = render(
      <Provider
        store={makeTestStore({
          profilesCache: {
            ...profileCacheFixData,
            defaultProfile: "connection-test-profile",
            profiles: {
              ...profileCacheFixData.profiles,
              "connection-test-profile": {
                identity: {
                  id: "connection-test-profile",
                  displayName: customConnectionName,
                  createdAtUTC: "2000-01-01T00:00:00.000Z",
                },
                connections: [
                  {
                    id: "connection-test-id",
                    label: customConnectionName,
                    contactId: "connection-test-id",
                  },
                ],
                multisigConnections: [],
                peerConnections: [],
                credentials: [],
                archivedCredentials: [],
                notifications: [],
              },
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
