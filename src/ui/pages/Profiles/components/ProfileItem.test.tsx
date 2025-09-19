import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { CreationStatus } from "../../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../../core/agent/services/keriaNotificationService.types";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { ProfileItem } from "./ProfileItem";

jest.mock("../../../components/Avatar", () => ({
  Avatar: ({ id }: { id: string }) => (
    <div data-testid={`avatar-${id}`}>Avatar</div>
  ),
}));

jest.mock("../../../components/BubbleCounter", () => ({
  BubbleCounter: ({ counter }: { counter: number }) => {
    if (counter === undefined || counter <= 0) {
      return null;
    }
    return <div data-testid="bubble-counter">{counter}</div>;
  },
}));

const mockIdentifier: IdentifierShortDetails = {
  id: "test-profile-id",
  displayName: "Test Profile",
  createdAtUTC: "2023-01-01T19:23:24Z",
  theme: 0,
  creationStatus: CreationStatus.COMPLETE,
};

const mockNotifications: KeriaNotification[] = [
  {
    id: "notification-1",
    receivingPre: "test-profile-id",
    read: false,
  } as KeriaNotification,
  {
    id: "notification-2",
    receivingPre: "test-profile-id",
    read: true,
  } as KeriaNotification,
  {
    id: "notification-3",
    receivingPre: "other-profile-id",
    read: false,
  } as KeriaNotification,
];

const initialState = {
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      "test-profile-id": {
        identity: mockIdentifier,
        connections: [],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: mockNotifications.filter(
          (n) => n.receivingPre === "test-profile-id"
        ),
      },
    },
  },
};

describe("ProfileItem", () => {
  const storeMocked = makeTestStore(initialState);

  test("renders profile item with correct data", () => {
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={mockIdentifier}
          onClick={onClickMock}
        />
      </Provider>
    );

    expect(screen.getByText("Test Profile")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-test-profile-id")).toBeInTheDocument();
    expect(
      screen.getByTestId("profiles-list-item-test-profile-id")
    ).toBeInTheDocument();
  });

  test("displays pending status chip when creationStatus is PENDING", () => {
    const pendingIdentifier = {
      ...mockIdentifier,
      creationStatus: CreationStatus.PENDING,
    };
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={pendingIdentifier}
          onClick={onClickMock}
        />
      </Provider>
    );

    expect(
      screen.getByTestId("profiles-list-item-test-profile-id-status")
    ).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  test("does not display pending status chip when creationStatus is not PENDING", () => {
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={mockIdentifier}
          onClick={onClickMock}
        />
      </Provider>
    );

    expect(
      screen.queryByTestId("profiles-list-item-test-profile-id-status")
    ).not.toBeInTheDocument();
  });

  test("displays correct notification count", () => {
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={mockIdentifier}
          onClick={onClickMock}
        />
      </Provider>
    );

    // Should show 1 unread notification (notification-1 is unread, notification-2 is read)
    expect(screen.getByTestId("bubble-counter")).toHaveTextContent("1");
  });

  test("does not display bubble counter when no unread notifications", () => {
    const identifierWithNoUnread = {
      ...mockIdentifier,
      id: "other-profile-id",
    };
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={identifierWithNoUnread}
          onClick={onClickMock}
        />
      </Provider>
    );

    // Should not show bubble counter since there are no unread notifications
    expect(screen.queryByTestId("bubble-counter")).not.toBeInTheDocument();
  });

  test("calls onClick when clicked", () => {
    const onClickMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={mockIdentifier}
          onClick={onClickMock}
        />
      </Provider>
    );

    const profileItem = screen.getByTestId(
      "profiles-list-item-test-profile-id"
    );
    fireEvent.click(profileItem);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  test("does not render when identifier is null", () => {
    const onClickMock = jest.fn();

    const { container } = render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={undefined}
          onClick={onClickMock}
        />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  test("does not render when identifier is undefined", () => {
    const onClickMock = jest.fn();

    const { container } = render(
      <Provider store={storeMocked}>
        <ProfileItem
          identifier={undefined}
          onClick={onClickMock}
        />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  test("handles onClick being undefined", () => {
    render(
      <Provider store={storeMocked}>
        <ProfileItem identifier={mockIdentifier} />
      </Provider>
    );

    const profileItem = screen.getByTestId(
      "profiles-list-item-test-profile-id"
    );
    // Should not throw error when onClick is undefined
    expect(() => fireEvent.click(profileItem)).not.toThrow();
  });
});
