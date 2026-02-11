import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ConnectionService } from "../../../../core/agent/services";
import ENG_TRANS from "../../../../locales/en/en.json";
import { identifierFix } from "../../../__fixtures__/identifierFix";
import { profileCacheFixData } from "../../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../../utils/makeTestStore";
import { TabsRoutePath } from "../../navigation/TabsMenu";
import { ProfileContent } from "./ProfileContent";

const getOobiMock = jest.fn(() => Promise.resolve("oobi"));
jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getOobi: () => getOobiMock(),
      },
    },
  },
}));

jest.mock("../../../../i18n", () => ({
  i18n: {
    t: jest.fn((key: string) => key),
  },
}));

jest.mock("../../EditProfile", () => ({
  EditProfile: () => <div data-testid="edit-profile">EditProfile</div>,
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
    onAfterScan: jest.fn(),
  };

  const renderComponent = (storeOverrides = {}) => {
    const store = makeTestStore({
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
        isOnline: true,
      },
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

      expect(getByTestId("avatar-button")).toHaveTextContent(
        identifierFix[0].displayName.at(0) || ""
      );
      expect(getByTestId("edit-button")).toBeInTheDocument();
      expect(getByTestId("share-button")).toBeInTheDocument();
    });

    it("should display dynamic credential count from current profile", () => {
      renderComponent();

      const credentialsLabel = screen.getByText(
        ENG_TRANS.profiledetails.identifierdetail.information.credentials
      );
      const credentialsValue = credentialsLabel.previousElementSibling;

      expect(credentialsValue?.textContent).toBe("4");
    });

    it("should display dynamic connections count from current profile", () => {
      renderComponent();

      const connectionsLabel = screen.getByText(
        ENG_TRANS.profiledetails.identifierdetail.information.connections
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("0");
    });

    it("should display dynamic dapps count from current profile", () => {
      renderComponent();

      const dappsLabel = screen.getByText(
        ENG_TRANS.profiledetails.identifierdetail.information.dapps
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
        ENG_TRANS.profiledetails.identifierdetail.information.credentials
      );
      const credentialsValue = credentialsLabel.previousElementSibling;

      expect(credentialsValue?.textContent).toBe("0");
    });

    it("Render with threshold greater than 1", () => {
      const store = makeTestStore({
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
            passwordIsSet: false,
          },
          toastMsgs: [],
          isOnline: true,
        },
        seedPhraseCache: {
          seedPhrase:
            "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
          bran: "bran",
        },
        profilesCache: {
          profiles: {
            ...profileCacheFixData.profiles,
            ...(profileCacheFixData.defaultProfile
              ? {
                  [profileCacheFixData.defaultProfile as string]: {
                    ...profileCacheFixData.profiles[
                      profileCacheFixData.defaultProfile as string
                    ],
                    multisigConnections: [
                      {
                        id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
                        label: "Member 0",
                        connectionDate: "2024-10-14T13:11:44.501Z",
                        status: "confirmed",
                        oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
                        groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
                      },
                      {
                        id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
                        label: "Member 1",
                        connectionDate: "2024-10-14T13:11:44.501Z",
                        status: "confirmed",
                        oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
                        groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
                      },
                    ],
                  },
                }
              : {}),
          },
        },
        biometricsCache: {
          enabled: false,
        },
      });

      const mockProps = {
        cardData: {
          ...identifierFix[0],
          groupMemberPre: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
          members: [
            "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
            "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
          ],
        },
        oobi: "test-oobi",
        setCardData: jest.fn(),
        onRotateKey: jest.fn(),
        onAfterScan: jest.fn(),
      };

      const { getByText } = render(
        <Provider store={store}>
          <ProfileContent {...mockProps} />
        </Provider>
      );

      expect(
        getByText(
          ENG_TRANS.profiledetails.group.signingkeysthreshold.members.replace(
            "{{member}}",
            String(identifierFix[0].kt)
          )
        )
      );

      expect(
        getByText(
          ENG_TRANS.profiledetails.group.rotationthreshold.members.replace(
            "{{member}}",
            String(identifierFix[0].nt)
          )
        )
      );
    });

    it("Render with threshold equals 1", () => {
      const store = makeTestStore({
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
            passwordIsSet: false,
          },
          toastMsgs: [],
          isOnline: true,
        },
        seedPhraseCache: {
          seedPhrase:
            "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
          bran: "bran",
        },
        profilesCache: {
          profiles: {
            ...profileCacheFixData.profiles,
            ...(profileCacheFixData.defaultProfile
              ? {
                  [profileCacheFixData.defaultProfile as string]: {
                    ...profileCacheFixData.profiles[
                      profileCacheFixData.defaultProfile as string
                    ],
                    multisigConnections: [
                      {
                        id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
                        label: "Member 0",
                        connectionDate: "2024-10-14T13:11:44.501Z",
                        status: "confirmed",
                        oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
                        groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
                      },
                      {
                        id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
                        label: "Member 1",
                        connectionDate: "2024-10-14T13:11:44.501Z",
                        status: "confirmed",
                        oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
                        groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
                      },
                    ],
                  },
                }
              : {}),
          },
        },
        biometricsCache: {
          enabled: false,
        },
      });

      const mockProps = {
        cardData: {
          ...identifierFix[0],
          groupMemberPre: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
          nt: "1",
          kt: "1",
          members: [
            "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
            "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
          ],
        },
        oobi: "test-oobi",
        setCardData: jest.fn(),
        onRotateKey: jest.fn(),
        onAfterScan: jest.fn(),
      };

      const { getAllByText } = render(
        <Provider store={store}>
          <ProfileContent {...mockProps} />
        </Provider>
      );

      expect(
        getAllByText(
          ENG_TRANS.profiledetails.group.signingkeysthreshold.member.replace(
            "{{member}}",
            "1"
          )
        ).length
      ).toBe(2);
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
        ENG_TRANS.profiledetails.identifierdetail.information.dapps
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
        ENG_TRANS.profiledetails.identifierdetail.information.connections
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
        ENG_TRANS.profiledetails.identifierdetail.information.connections
      );
      const connectionsValue = connectionsLabel.previousElementSibling;

      expect(connectionsValue?.textContent).toBe("0");
    });

    test("retry to get oobi when fetchOobi throw ConnectionService.CANNOT_GET_OOBI", async () => {
      getOobiMock
        .mockImplementationOnce(() =>
          Promise.reject(new Error(ConnectionService.CANNOT_GET_OOBI))
        )
        .mockImplementationOnce(() =>
          Promise.reject(new Error(ConnectionService.CANNOT_GET_OOBI))
        )
        .mockImplementationOnce(() => Promise.resolve("oobi-value"));

      renderComponent();

      await waitFor(() => {
        expect(getOobiMock).toBeCalledTimes(3);
      });
    });
  });
});
