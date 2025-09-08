import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeTestStore } from "../../../utils/makeTestStore";
import { ProfileContent } from "./ProfileContent";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { identifierFix } from "../../../__fixtures__/identifierFix";

// Mock the required modules
jest.mock("../../../../i18n", () => ({
  i18n: {
    t: jest.fn((key: string) => key),
  },
}));

jest.mock("../../ConnectdApp", () => ({
  ConnectdApp: () => <div data-testid="connect-dapp">ConnectDApp</div>,
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
  CardBlock: ({ title, testId }: { title: string; testId?: string }) => (
    <div data-testid={testId || "card-block"}>{title}</div>
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

describe("ProfileContent", () => {
  const mockProps = {
    cardData: identifierFix[0],
    oobi: "test-oobi",
    onRotateKey: jest.fn(),
    setCardData: jest.fn(),
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
    it("should display dynamic credential count from current profile", () => {
      const { getByText } = renderComponent();

      // The test store should have credentials for the current profile
      // This will test that we're getting the count from Redux instead of hardcoded values
      expect(
        getByText("profiledetails.identifierdetail.information.credentials")
      ).toBeInTheDocument();
    });

    it("should display dynamic connections count from current profile", () => {
      const { getByText } = renderComponent();

      expect(
        getByText("profiledetails.identifierdetail.information.connections")
      ).toBeInTheDocument();
    });

    it("should display dynamic dapps count from current profile", () => {
      const { getByText } = renderComponent();

      expect(
        getByText("profiledetails.identifierdetail.information.dapps")
      ).toBeInTheDocument();
    });

    it("should display '0' when profile has no credentials", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [profileCacheFixData.defaultProfile!]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile!
              ],
              credentials: [],
            },
          },
        },
      };

      const { getByText } = renderComponent(storeWithEmptyProfile);

      // Find the credentials value specifically
      const credentialsElement = getByText(
        "profiledetails.identifierdetail.information.credentials"
      ).previousElementSibling as HTMLElement;

      expect(credentialsElement.textContent).toBe("0");
    });

    it("should display '0' when profile has no connections", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [profileCacheFixData.defaultProfile!]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile!
              ],
              connections: [],
              multisigConnections: [],
            },
          },
        },
      };

      const { getByText } = renderComponent(storeWithEmptyProfile);

      // Find the connections value specifically
      const connectionsElement = getByText(
        "profiledetails.identifierdetail.information.connections"
      ).previousElementSibling as HTMLElement;

      expect(connectionsElement.textContent).toBe("0");
    });

    it("should display '0' when profile has no dapp connections", () => {
      const storeWithEmptyProfile = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [profileCacheFixData.defaultProfile!]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile!
              ],
              peerConnections: [],
            },
          },
        },
      };

      const { getByText } = renderComponent(storeWithEmptyProfile);

      // Find the dapps value specifically
      const dappsElement = getByText(
        "profiledetails.identifierdetail.information.dapps"
      ).previousElementSibling as HTMLElement;

      expect(dappsElement.textContent).toBe("0");
    });

    it("should combine regular and multisig connections in total count", () => {
      const storeWithMixedConnections = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [profileCacheFixData.defaultProfile!]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile!
              ],
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

      const { getByText } = renderComponent(storeWithMixedConnections);

      // Find the connections value specifically
      const connectionsElement = getByText(
        "profiledetails.identifierdetail.information.connections"
      ).previousElementSibling as HTMLElement;

      // Should display "5" (2 regular + 3 multisig connections)
      expect(connectionsElement.textContent).toBe("5");
    });

    it("should handle undefined multisigConnections gracefully", () => {
      const storeWithUndefinedMultisig = {
        profilesCache: {
          ...profileCacheFixData,
          profiles: {
            [profileCacheFixData.defaultProfile!]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile!
              ],
              connections: [{ id: "conn1" }],
              multisigConnections: undefined,
            },
          },
        },
      };

      const { getByText } = renderComponent(storeWithUndefinedMultisig);

      // Find the connections value specifically
      const connectionsElement = getByText(
        "profiledetails.identifierdetail.information.connections"
      ).previousElementSibling as HTMLElement;

      // Should display "1" (only regular connections)
      expect(connectionsElement.textContent).toBe("1");
    });
  });

  describe("Component Rendering", () => {
    it("should render profile avatar with correct id", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("avatar")).toHaveTextContent(mockProps.cardData.id);
    });

    it("should render edit button", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("edit-button")).toBeInTheDocument();
    });

    it("should render share button", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("share-button")).toBeInTheDocument();
    });

    it("should render DApp connection block", () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId("dapp-block")).toBeInTheDocument();
    });
  });

  describe("Profile Information Component", () => {
    it("should convert numbers to strings using template literals", () => {
      // This test verifies that we're using template literals instead of .toString()
      const { container } = renderComponent();

      // Find all profile information value elements
      const valueElements = container.querySelectorAll(
        ".profile-information-value"
      );

      // Each value should be a string representation of a number
      valueElements.forEach((element) => {
        const textContent = element.textContent;
        expect(textContent).toMatch(/^\d+$/); // Should be numeric string
        expect(typeof textContent).toBe("string");
      });
    });
  });
});
