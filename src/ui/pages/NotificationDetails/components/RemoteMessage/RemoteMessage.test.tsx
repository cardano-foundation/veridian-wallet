import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { RemoteMessage } from "./RemoteMessage";

const mockStore = (initialState: any) => createStore(() => initialState);
const dispatchMock = jest.fn();

const initialState = {
  stateCache: {
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
};

const getHumanReadableMessageMock = jest.fn();
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getHumanReadableMessage: () => getHumanReadableMessageMock(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

const openBrowserMock = jest.fn();
jest.mock("@capacitor/browser", () => ({
  Browser: {
    open: () => openBrowserMock(),
  },
}));

describe("RemoteMessage", () => {
  test("renders the component with correct title, subtitle, and description", async () => {
    const mockValue = {
      m: "Message",
      t: "Message title",
      st: "Message sub title",
      c: ["paragraph 1", "paragraph 2"],
      l: { t: "Link", a: "https://www.google.com/" },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    getHumanReadableMessageMock.mockResolvedValue(mockValue);
    const mockNotificationDetails = {
      id: "123",
      createdAt: new Date().toISOString(),
      a: {},
      connectionId: "connection-456",
      read: false,
      groupReplied: false,
    };

    render(
      <Provider store={storeMocked}>
        <RemoteMessage
          pageId="sign-confirmation"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={mockNotificationDetails}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockValue.t)).toBeVisible();
    });
    expect(screen.getByText(mockValue.st)).toBeVisible();
    expect(screen.getByText(mockValue.c.join(""))).toBeVisible();
    expect(screen.getByText(mockValue.l.t)).toBeVisible();

    fireEvent.click(screen.getByText(mockValue.l.t));

    expect(openBrowserMock).toBeCalled();
  });

  test("Hidden link button when link is empty", async () => {
    const mockValue = {
      m: "Message",
      t: "Message title",
      st: "Message sub title",
      c: ["paragraph 1", "paragraph 2"],
    };

    getHumanReadableMessageMock.mockResolvedValue(mockValue);

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const mockNotificationDetails = {
      id: "123",
      createdAt: new Date().toISOString(),
      a: {},
      connectionId: "connection-456",
      read: false,
      groupReplied: false,
    };

    const { queryByTestId } = render(
      <Provider store={storeMocked}>
        <RemoteMessage
          pageId="sign-confirmation"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={mockNotificationDetails}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockValue.t)).toBeVisible();
    });

    expect(queryByTestId("primary-button")).toBeNull();
  });
});
