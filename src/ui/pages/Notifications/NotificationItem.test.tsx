import { AnyAction, Store } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import {
  deleteNotificationById,
  markNotificationAsRead,
} from "../../../store/reducers/profileCache";
import { connectionsForNotificationsValues } from "../../__fixtures__/connectionsFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { NotificationItem } from "./NotificationItem";

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const readNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const unreadNotificationMock = jest.fn((id: string) => Promise.resolve(id));

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

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
        readNotification: (id: string) => readNotificationMock(id),
        unreadNotification: (id: string) => unreadNotificationMock(id),
      },
    },
  },
}));

const mockNotification: KeriaNotification = {
  id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMmG",
  createdAt: "2024-06-25T12:38:36.988Z",
  a: {
    r: "/exn/ipex/grant",
    d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
    m: "",
  },
  connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
  read: false,
  groupReplied: false,
  receivingPre: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfA",
};

describe("NotificationItem", () => {
  const dispatchMock = jest.fn();
  let mockedStore: Store<unknown, AnyAction>;

  beforeEach(() => {
    jest.resetAllMocks();

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

    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    test("renders notification item with all elements", () => {
      const mockOnClick = jest.fn();
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={mockOnClick}
          />
        </Provider>
      );

      expect(
        getByTestId(`notifications-tab-item-${mockNotification.id}`)
      ).toBeInTheDocument();
      expect(getByTestId("notifications-tab-item-label")).toBeInTheDocument();
      expect(getByTestId("notifications-tab-item-logo")).toBeInTheDocument();
      expect(
        getByTestId(`toogle-read-button-${mockNotification.id}`)
      ).toBeInTheDocument();
      expect(
        getByTestId(`delete-button-${mockNotification.id}`)
      ).toBeInTheDocument();
    });

    test("applies unread class to unread notifications", () => {
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      const item = getByTestId(`notifications-tab-item-${mockNotification.id}`);
      expect(item).toHaveClass("unread");
    });

    test("does not apply unread class to read notifications", () => {
      const readNotification = { ...mockNotification, read: true };
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={readNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      const item = getByTestId(`notifications-tab-item-${mockNotification.id}`);
      expect(item).not.toHaveClass("unread");
    });
  });

  describe("Click Handlers", () => {
    test("calls onClick when notification item is clicked", () => {
      const mockOnClick = jest.fn();
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={mockOnClick}
          />
        </Provider>
      );

      fireEvent.click(
        getByTestId(`notifications-tab-item-${mockNotification.id}`)
      );

      expect(mockOnClick).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe("Read/Unread Toggle", () => {
    test("toggles from unread to read", async () => {
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      act(() => {
        fireEvent.click(
          getByTestId(`toogle-read-button-${mockNotification.id}`)
        );
      });

      await waitFor(() => {
        expect(readNotificationMock).toHaveBeenCalledWith(mockNotification.id);
        expect(dispatchMock).toHaveBeenCalledWith(
          markNotificationAsRead({
            id: mockNotification.id,
            read: true,
          })
        );
      });
    });

    test("toggles from read to unread", async () => {
      const readNotification = { ...mockNotification, read: true };
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={readNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      act(() => {
        fireEvent.click(
          getByTestId(`toogle-read-button-${mockNotification.id}`)
        );
      });

      await waitFor(() => {
        expect(unreadNotificationMock).toHaveBeenCalledWith(
          mockNotification.id
        );
        expect(dispatchMock).toHaveBeenCalledWith(
          markNotificationAsRead({
            id: mockNotification.id,
            read: false,
          })
        );
      });
    });

    test("displays correct button text for unread notification", () => {
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      const readButton = getByTestId(
        `toogle-read-button-${mockNotification.id}`
      );
      expect(readButton).toHaveTextContent(
        EN_TRANSLATIONS.tabs.notifications.tab.notificationitem.read
      );
    });

    test("displays correct button text for read notification", () => {
      const readNotification = { ...mockNotification, read: true };
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={readNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      const readButton = getByTestId(
        `toogle-read-button-${mockNotification.id}`
      );
      expect(readButton).toHaveTextContent(
        EN_TRANSLATIONS.tabs.notifications.tab.notificationitem.unread
      );
    });
  });

  describe("Delete Functionality", () => {
    test("shows delete confirmation alert when delete button is clicked", async () => {
      const { getByTestId } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      act(() => {
        fireEvent.click(getByTestId(`delete-button-${mockNotification.id}`));
      });

      await waitFor(() => {
        const alert = getByTestId(
          `alert-delete-notification-${mockNotification.id}`
        );
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute("is-open", "true");
      });
    });

    test("displays correct alert text", async () => {
      const { getByTestId, getByText } = render(
        <Provider store={mockedStore}>
          <NotificationItem
            item={mockNotification}
            onClick={jest.fn()}
          />
        </Provider>
      );

      act(() => {
        fireEvent.click(getByTestId(`delete-button-${mockNotification.id}`));
      });

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.tabs.notifications.tab.notificationitem.deletealert
              .text
          )
        ).toBeInTheDocument();
      });
    });
  });
});
