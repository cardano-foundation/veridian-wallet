import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeTestStore } from "../../../utils/makeTestStore";
import { ProfileContent } from "./ProfileContent";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { identifierFix } from "../../../__fixtures__/identifierFix";

jest.mock("../../../../i18n", () => ({
  i18n: {
    t: jest.fn((key: string) => key),
  },
}));

jest.mock("../../EditProfile", () => ({
  EditProfile: () => <div data-testid="edit-profile">EditProfile</div>,
}));

jest.mock("../../ShareConnection", () => ({
  ShareConnection: () => (
    <div data-testid="share-connection">ShareConnection</div>
  ),
}));

jest.mock("../../Avatar", () => ({
  Avatar: ({ id }: { id: string }) => <div data-testid="avatar">{id}</div>,
  MemberAvatar: () => <div data-testid="member-avatar">MemberAvatar</div>,
}));

jest.mock("../../ListHeader", () => ({
  ListHeader: ({ title }: { title: string }) => (
    <div data-testid="list-header">{title}</div>
  ),
}));

jest.mock("../../CardDetails", () => ({
  CardDetailsContent: ({ mainContent }: { mainContent: string }) => (
    <div data-testid="card-details-content">{mainContent}</div>
  ),
}));

jest.mock("../../CardDetails/CardDetailsBlock", () => ({
  CardBlock: ({
    title,
    testId,
    onClick,
  }: {
    title: string;
    testId?: string;
    onClick?: () => void;
  }) => (
    <div
      data-testid={testId || "card-block"}
      onClick={onClick}
    >
      {title}
    </div>
  ),
  FlatBorderType: {
    BOT: "bot",
    TOP: "top",
  },
}));

jest.mock("../../CardDetails/CardDetailsItem", () => ({
  CardDetailsItem: ({ info }: { info: string }) => (
    <div data-testid="card-details-item">{info}</div>
  ),
}));

jest.mock(
  "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal",
  () => ({
    IdentifierAttributeDetailModal: () => (
      <div data-testid="identifier-attribute-detail-modal">
        IdentifierAttributeDetailModal
      </div>
    ),
  })
);

jest.mock(
  "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal.types",
  () => ({
    DetailView: {
      AdvancedDetail: "advanced-detail",
      GroupMember: "group-member",
      SigningThreshold: "signing-threshold",
      RotationThreshold: "rotation-threshold",
    },
  })
);

const defaultProfileId =
  profileCacheFixData.defaultProfile || "test-profile-id";

describe("ProfileContent", () => {
  const mockProps = {
    cardData: identifierFix[0],
    oobi: "test-oobi",
    setCardData: jest.fn(),
    onRotateKey: jest.fn(),
  };

  const renderComponent = (storeOverrides = {}) => {
    const store = makeTestStore({
      profilesCache: profileCacheFixData,
      ...storeOverrides,
    });

    return render(
      <Provider store={store}>
        <ProfileContent {...mockProps} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Profile Information Display", () => {
    it("Should render component correctly", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("avatar")).toHaveTextContent(mockProps.cardData.id);
      expect(getByTestId("edit-button")).toBeInTheDocument();
      expect(getByTestId("share-button")).toBeInTheDocument();
    });

    it("should display dynamic credential count from current profile", () => {
      renderComponent();

      const credentialsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.credentials"
      );
      const credentialsValue = credentialsLabel.previousElementSibling;

      expect(credentialsValue?.textContent).toBe("4");
    });

    it("should display dynamic connections count from current profile", () => {
      renderComponent();

      const connectionsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.connections"
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("0");
    });

    it("should display dynamic dapps count from current profile", () => {
      renderComponent();

      const dappsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.dapps"
      );
      const dappsValue = dappsLabel.previousElementSibling;

      expect(dappsValue?.textContent).toBe("5");
    });

    it("should display '0' when profile has no credentials", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [defaultProfileId]: {
              ...profileCacheFixData.profiles[defaultProfileId],
              credentials: [],
            },
          },
        },
      };

      renderComponent(storeWithEmptyProfile);

      const credentialsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.credentials"
      );
      const credentialsValue = credentialsLabel.previousElementSibling;

      expect(credentialsValue?.textContent).toBe("0");
    });

    it("should display '0' when profile has no connections", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [defaultProfileId]: {
              ...profileCacheFixData.profiles[defaultProfileId],
              connections: [],
              multisigConnections: [],
            },
          },
        },
      };

      renderComponent(storeWithEmptyProfile);

      const connectionsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.connections"
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("0");
    });

    it("should display '0' when profile has no dapp connections", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [defaultProfileId]: {
              ...profileCacheFixData.profiles[defaultProfileId],
              peerConnections: [],
            },
          },
        },
      };

      renderComponent(storeWithEmptyProfile);

      const dappsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.dapps"
      );
      const dappsValue = dappsLabel.previousElementSibling;

      expect(dappsValue?.textContent).toBe("0");
    });

    it("should display correct connections count excluding multisig connections", () => {
      const storeWithMixedConnections = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [defaultProfileId]: {
              ...profileCacheFixData.profiles[defaultProfileId],
              connections: [{ id: "conn1" }, { id: "conn2" }],
              multisigConnections: [
                { id: "multi1" },
                { id: "multi2" },
                { id: "multi3" },
              ],
            },
          },
        },
      };

      renderComponent(storeWithMixedConnections);

      const connectionsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.connections"
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("2");
    });

    it("should handle undefined connections gracefully", () => {
      const storeWithUndefinedConnections = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [defaultProfileId]: {
              ...profileCacheFixData.profiles[defaultProfileId],
              connections: undefined,
            },
          },
        },
      };

      renderComponent(storeWithUndefinedConnections);

      const connectionsLabel = screen.getByText(
        "profiledetails.identifierdetail.information.connections"
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("0");
    });
  });
});
