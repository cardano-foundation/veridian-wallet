import { act , createRef } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { KeriaNotification } from "../../../../core/agent/services/keriaNotificationService.types";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../routes/paths";
import { connectionsForNotificationsValues } from "../../../__fixtures__/connectionsFix";
import { notificationsFix } from "../../../__fixtures__/notificationsFix";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { NotificationSection } from "./NotificationSection";
import { NotificationSectionRef } from "./NotificationSection.types";

jest.mock("../../../../core/configuration", () => ({
  ...jest.requireActual("../../../../core/configuration"),
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

jest.mock("../../../../core/agent/agent", () => ({
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
        readNotification: jest.fn(),
        unreadNotification: jest.fn(),
        deleteNotificationRecordById: jest.fn(),
      },
    },
  },
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
    profiles: {
      ...profileCacheFixData.profiles,
      ...(profileCacheFixData.defaultProfile
        ? {
            [profileCacheFixData.defaultProfile as string]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile as string
              ],
              connections: connectionsForNotificationsValues,
            },
          }
        : {}),
    },
  },
};

describe("NotificationSection", () => {
  const storeMocked = {
    ...makeTestStore({
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
          ...(profileCacheFixData.defaultProfile
            ? {
                [profileCacheFixData.defaultProfile as string]: {
                  ...profileCacheFixData.profiles[
                    profileCacheFixData.defaultProfile as string
                  ],
                  connections: connectionsForNotificationsValues,
                },
              }
            : {}),
        },
      },
    }),
    dispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("Rendering", () => {
    test("renders section with title and data", () => {
      const { getByTestId, getByText } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="New"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix.slice(0, 2)}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("test-section")).toBeInTheDocument();
      expect(getByText("New")).toBeInTheDocument();
      expect(getByTestId("notifications-items")).toBeInTheDocument();
    });

    test("does not render when data is empty", () => {
      const { queryByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="New"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={[]}
            testId="test-section"
          />
        </Provider>
      );

      expect(queryByTestId("test-section")).not.toBeInTheDocument();
    });

    test("renders initial notifications when infinite scroll is disabled", () => {
      const testData = notificationsFix.slice(0, 5);
      const { getByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="New"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={testData}
            enableInfiniteScroll={false}
            initialDisplayCount={3}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("test-section")).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${testData[0].id}`)
      ).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${testData[1].id}`)
      ).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${testData[2].id}`)
      ).toBeInTheDocument();
    });

    test("uses default values when optional props are not provided", () => {
      const testData = notificationsFix.slice(0, 3);
      const { getByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Test"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={testData}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("test-section")).toBeInTheDocument();
      testData.forEach((notification: KeriaNotification) => {
        expect(
          getByTestId(`notifications-tab-item-${notification.id}`)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Infinite Scroll", () => {
    test("renders only initial count when enabled", () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("test-section")).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[1].id}`)
      ).toBeInTheDocument();
      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[2].id}`)
      ).toBeInTheDocument();

      if (notificationsFix.length > 3) {
        expect(
          queryByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
        ).not.toBeInTheDocument();
      }
    });

    test("shows expand button when enabled and initial count is displayed", () => {
      const { getByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("show-earlier-btn")).toBeInTheDocument();
      expect(getByTestId("show-earlier-btn")).toHaveTextContent(
        EN_TRANSLATIONS.tabs.notifications.tab.sections.earlier.buttons
          .showealier
      );
    });

    test("does not show expand button when disabled", () => {
      const { queryByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="New"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={false}
            testId="test-section"
          />
        </Provider>
      );

      expect(queryByTestId("show-earlier-btn")).not.toBeInTheDocument();
    });

    test("loads more notifications when expand button is clicked", async () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            loadMoreCount={2}
            testId="test-section"
          />
        </Provider>
      );

      expect(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      ).toBeInTheDocument();

      if (notificationsFix.length > 3) {
        expect(
          queryByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
        ).not.toBeInTheDocument();
      }

      fireEvent.click(getByTestId("show-earlier-btn"));

      await waitFor(() => {
        if (notificationsFix.length > 3) {
          expect(
            getByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
          ).toBeInTheDocument();
        }
        if (notificationsFix.length > 4) {
          expect(
            getByTestId(`notifications-tab-item-${notificationsFix[4].id}`)
          ).toBeInTheDocument();
        }
      });
    });

    test("hides expand button after all notifications are loaded", async () => {
      const smallDataSet = notificationsFix.slice(0, 4);
      const { getByTestId, queryByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={smallDataSet}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            loadMoreCount={5}
            testId="test-section"
          />
        </Provider>
      );

      expect(getByTestId("show-earlier-btn")).toBeInTheDocument();

      fireEvent.click(getByTestId("show-earlier-btn"));

      await waitFor(() => {
        smallDataSet.forEach((notification: KeriaNotification) => {
          expect(
            getByTestId(`notifications-tab-item-${notification.id}`)
          ).toBeInTheDocument();
        });

        expect(queryByTestId("show-earlier-btn")).not.toBeInTheDocument();
      });
    });

    test("reset method resets display count to initial value", async () => {
      const ref = createRef<NotificationSectionRef>();
      const { getByTestId, queryByTestId, rerender } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            loadMoreCount={2}
            testId="test-section"
            ref={ref}
          />
        </Provider>
      );

      fireEvent.click(getByTestId("show-earlier-btn"));

      await waitFor(() => {
        if (notificationsFix.length > 3) {
          expect(
            getByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
          ).toBeInTheDocument();
        }
      });

      await act(async () => {
        ref.current?.reset();
      });

      rerender(
        <Provider store={storeMocked}>
          <NotificationSection
            title="Earlier"
            pageId="notification-page"
            onNotificationClick={jest.fn()}
            data={notificationsFix}
            enableInfiniteScroll={true}
            initialDisplayCount={3}
            loadMoreCount={2}
            testId="test-section"
            ref={ref}
          />
        </Provider>
      );

      await waitFor(() => {
        if (notificationsFix.length > 3) {
          expect(
            queryByTestId(`notifications-tab-item-${notificationsFix[3].id}`)
          ).not.toBeInTheDocument();
        }
      });
    });
  });

  describe("Click Handlers", () => {
    test("calls onNotificationClick when a notification is clicked", () => {
      const mockOnClick = jest.fn();
      const { getByTestId } = render(
        <Provider store={storeMocked}>
          <NotificationSection
            title="New"
            pageId="notification-page"
            onNotificationClick={mockOnClick}
            data={notificationsFix.slice(0, 2)}
            testId="test-section"
          />
        </Provider>
      );

      fireEvent.click(
        getByTestId(`notifications-tab-item-${notificationsFix[0].id}`)
      );

      expect(mockOnClick).toHaveBeenCalledWith(notificationsFix[0]);
    });
  });
});
