const verifySecretMock = jest.fn().mockResolvedValue(true);

import { Clipboard } from "@capacitor/clipboard";
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  waitFor,
} from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { ConfigurationService } from "../../../core/configuration";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { updateRecentProfiles } from "../../../store/reducers/profileCache";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../utils/formatters";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { ProfileDetailsModal } from "./ProfileDetailsModal";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock("@ionic/react", () => {
  const actual = jest.requireActual("@ionic/react");
  return {
    ...actual,
    IonAlert: (props: any) =>
      props.isOpen ? (
        <div data-testid="mock-ion-alert">
          <h2>{props.header}</h2>
          {props.subHeader && <h3>{props.subHeader}</h3>}
          {props.message && <p>{props.message}</p>}
          {props.buttons?.map((button: any, index: number) => (
            <button
              key={index}
              data-testid={
                button.htmlAttributes?.["data-testid"] ||
                button["data-testid"] ||
                `alert-button-${index}`
              }
              onClick={button.handler}
            >
              {button.text}
            </button>
          ))}
        </div>
      ) : null,
    IonModal: ({ children, isOpen, ...props }: any) =>
      isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
  };
});

const deleteIdentifier = jest.fn(() => Promise.resolve());
const markIdentifierPendingDelete = jest.fn(() => Promise.resolve());
const createOrUpdateMock = jest.fn().mockResolvedValue(undefined);

const getIndentifier = jest.fn(() => identifierFix[0]);
const deleteStaleLocalIdentifierMock = jest.fn();

jest.mock("../../components/Alert", () => ({
  Alert: ({
    isOpen,
    setIsOpen,
    dataTestId,
    headerText,
    confirmButtonText,
    cancelButtonText,
    actionConfirm,
    actionCancel,
  }: any) =>
    isOpen ? (
      <div data-testid="mock-ion-alert">
        <h2>{headerText}</h2>
        <button
          data-testid={`${dataTestId}-confirm-button`}
          onClick={() => {
            setIsOpen(false);
            actionConfirm && actionConfirm();
          }}
        >
          {confirmButtonText}
        </button>
        <button
          data-testid={`${dataTestId}-cancel-button`}
          onClick={() => {
            setIsOpen(false);
            actionCancel && actionCancel();
          }}
        >
          {cancelButtonText}
        </button>
      </div>
    ) : null,
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA:
      "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.",
    agent: {
      identifiers: {
        getIdentifier: () => getIndentifier(),
        deleteStaleLocalIdentifier: () => deleteStaleLocalIdentifierMock(),
        deleteIdentifier: () => deleteIdentifier(),
        markIdentifierPendingDelete: () => markIdentifierPendingDelete(),
      },
      connections: {
        getOobi: jest.fn(() => Promise.resolve("oobi")),
        getMultisigConnections: jest.fn().mockResolvedValue([]),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: (param: unknown) =>
          createOrUpdateMock(param),
        deleteById: jest.fn(() => Promise.resolve(true)),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

const dispatchMock = jest.fn();

const initialStateKeri = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
      firstAppLaunch: false,
    },
    toastMsgs: [],
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  profilesCache: profileCacheFixData,
  biometricsCache: {
    enabled: false,
  },
};

const storeMockedAidKeri = {
  ...makeTestStore(initialStateKeri),
  dispatch: dispatchMock,
};

const pageId = "identifier-card-details";

describe("Individual profile details page", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  beforeEach(() => {
    getIndentifier.mockReturnValue(identifierFix[0]);
    verifySecretMock.mockResolvedValue(true);
  });

  test("It renders profile Details", async () => {
    Clipboard.write = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(
        getByText(filteredIdentifierFix[0].displayName)
      ).toBeInTheDocument()
    );
    // Render Information
    expect(getByTestId("identifier-id-text-value").innerHTML).toBe(
      identifierFix[0].id.substring(0, 5) +
        "..." +
        identifierFix[0].id.slice(-5)
    );
    expect(getByTestId("creation-timestamp")).toBeVisible();
    // Render List of signing keys
    expect(getByTestId("signing-key-0")).toBeInTheDocument();
    expect(
      getByText(
        identifierFix[0].k[0].substring(0, 5) +
          "..." +
          identifierFix[0].k[0].slice(-5)
      )
    ).toBeInTheDocument();
  });

  test("Render advanced modal", async () => {
    Clipboard.write = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();
    // Render card template
    await waitFor(() =>
      expect(
        getByText(filteredIdentifierFix[0].displayName)
      ).toBeInTheDocument()
    );

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.identifierdetail.showadvanced)
    );

    // Render Sequence number
    await waitFor(() => {
      expect(getByTestId("sequence-number")).toBeInTheDocument();
    });

    // Render Last key rotation timestamp
    expect(
      getByText(
        `Last key event: ${
          formatShortDate(identifierFix[0].dt) +
          " - " +
          formatTimeToSec(identifierFix[0].dt)
        } (${getUTCOffset(identifierFix[0].dt)})`
      )
    ).toBeInTheDocument();
  });

  test("It opens the sharing modal", async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();
    await waitFor(() => {
      expect(getByTestId("share-button")).toBeInTheDocument();
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    expect(queryByTestId("share-connection-modal")).toBeNull();

    act(() => {
      fireEvent.click(getByTestId("share-button"));
    });

    await waitFor(() => {
      expect(getByTestId("share-connection-modal")).toBeVisible();
    });
  });

  test("It opens the edit modal", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(getByTestId("identifier-id")).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("edit-button"));
    });

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.options.inner.label)
      ).toBeInTheDocument()
    );
  });

  test("It asks to verify the password when users try to delete the identifier using the button in the modal", async () => {
    verifySecretMock.mockResolvedValue(false);

    const { getByText, unmount, findByText, queryByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.delete.button)
      ).toBeInTheDocument()
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.profiledetails.delete.button));

    const alertTitle = await findByText(
      EN_TRANSLATIONS.profiledetails.delete.alert.title
    );

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.delete.alert.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    const verifyTitle = await findByText(EN_TRANSLATIONS.verifypassword.title);

    await waitFor(() => {
      expect(verifyTitle).toBeVisible();
    });

    unmount();
  });

  test("It shows the warning when I click on the big delete button", async () => {
    const { getByTestId, queryByText, findByText, unmount } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(
        getByTestId("delete-button-identifier-card-details")
      ).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("delete-button-identifier-card-details"));
    });

    const alertTitle = await findByText(
      EN_TRANSLATIONS.profiledetails.delete.alert.title
    );

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("alert-confirm-identifier-delete-details-cancel-button")
      );
    });

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    unmount();
  });

  test("Show loading when indetifier data is null", async () => {
    Agent.agent.identifiers.getIdentifiers = jest.fn().mockResolvedValue(null);

    const { getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(
        getByTestId("identifier-card-detail-spinner-container")
      ).toBeVisible()
    );
  });

  test("Hide loading after retrieved indetifier data", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      )
    );
  });

  test("Can restrict view to not be able to delete identifier", async () => {
    verifySecretMock.mockResolvedValue(false);

    const { getByTestId, unmount, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          restrictedOptions={true}
          showProfiles={jest.fn}
        />
      </Provider>
    );
    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    expect(
      queryByTestId("delete-button-identifier-card-details")
    ).not.toBeInTheDocument();
  });
});

describe("Group profile details page", () => {
  const initialStateKeri = {
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
      seedPhrase: "",
      bran: "bran",
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
  };

  const storeMockedAidKeri = {
    ...makeTestStore(initialStateKeri),
    dispatch: dispatchMock,
  };

  beforeAll(async () => {
    await new ConfigurationService().start();
  });
  beforeEach(() => {
    getIndentifier.mockReturnValue({
      ...identifierFix[2],
      members: [
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB3",
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB4",
      ],
    });
  });

  test("It renders profile Details", async () => {
    Clipboard.write = jest.fn();

    const initialStateKeri = {
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
        seedPhrase: "",
        bran: "bran",
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
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { getByTestId, getAllByText } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );
    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() => {
      expect(getAllByText(identifierFix[2].displayName).length).toBe(1);
      getAllByText(identifierFix[2].displayName).forEach((item) => {
        expect(item).toBeVisible();
      });
    });

    // Render Group members
    expect(getByTestId("group-member-0-text-value").innerHTML).toBe("Member 0");
    expect(getByTestId("group-member-1-text-value").innerHTML).toBe("Member 1");
    expect(getByTestId("view-member")).toBeVisible();

    // Render Keys signing threshold
    expect(getByTestId("signing-threshold-block")).toBeVisible();
    expect(
      getAllByText(
        EN_TRANSLATIONS.profiledetails.group.signingkeysthreshold.outof.replace(
          "{{threshold}}",
          "4"
        )
      )[0]
    ).toBeVisible();

    // Render Keys rotate threshold
    expect(getByTestId("rotate-threshold-block")).toBeVisible();
    expect(
      getAllByText(
        EN_TRANSLATIONS.profiledetails.group.rotationthreshold.outof.replace(
          "{{threshold}}",
          "4"
        )
      )[0]
    ).toBeVisible();

    // Render Information
    expect(getByTestId("identifier-card-details-page")).toBeInTheDocument();
    expect(getByTestId("identifier-id-text-value").innerHTML).toBe(
      identifierFix[2].id.substring(0, 5) +
        "..." +
        identifierFix[2].id.slice(-5)
    );
  });

  test("Open group member", async () => {
    const { getByText, getByTestId, getAllByText } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() => {
      expect(getAllByText(identifierFix[2].displayName).length).toBe(1);
      getAllByText(identifierFix[2].displayName).forEach((item) => {
        expect(item).toBeVisible();
      });
    });

    // Render Group members
    expect(getByTestId("group-member-0-text-value").innerHTML).toBe("Member 0");
    expect(getByTestId("group-member-1-text-value").innerHTML).toBe("Member 1");
    expect(getByTestId("view-member")).toBeVisible();

    fireEvent.click(getByTestId("view-member"));

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.groupmember.propexplain
            .title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.groupmember.propexplain
            .content
        )
      ).toBeVisible();
    });
  });

  test("Open signing threshold", async () => {
    const { getByText, getAllByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );
    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() => {
      expect(getAllByText(identifierFix[2].displayName).length).toBe(1);
      getAllByText(identifierFix[2].displayName).forEach((item) => {
        expect(item).toBeVisible();
      });
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.group.signingkeysthreshold.title)
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.signingthreshold
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.signingthreshold
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Open rotation threshold", async () => {
    const { getByText, getAllByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() => {
      expect(getAllByText(identifierFix[2].displayName).length).toBe(1);
      getAllByText(identifierFix[2].displayName).forEach((item) => {
        expect(item).toBeVisible();
      });
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.group.rotationthreshold.title)
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.rotationthreshold
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.detailsmodal.rotationthreshold
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Cannot rotate key", async () => {
    const initialStateKeri = {
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
        seedPhrase: "",
        bran: "bran",
      },
      profilesCache: profileCacheFixData,
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-card-detail-spinner-container")
    ).toBeVisible();

    await waitFor(() =>
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      )
    );

    await waitFor(() =>
      expect(queryByTestId("signing-key-0-action-icon")).toBe(null)
    );
  });
});

describe("Checking the profile details page when information is missing from the cloud", () => {
  beforeEach(() => {
    getIndentifier.mockImplementation(() => {
      throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: id`);
    });
    verifySecretMock.mockResolvedValue(true);
  });

  test("profile exists in the database but not on Signify", async () => {
    const initialStateKeri = {
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
      profilesCache: profileCacheFixData,

      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText, unmount, queryByText } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-details-cloud-error-page")
      ).toBeVisible();

      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.loadprofileerror.missingoncloud,
          {
            normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
          }
        )
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("delete-button-identifier-card-details"));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("alert-confirm-identifier-delete-details-confirm-button")
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(deleteStaleLocalIdentifierMock).toBeCalled();
    });

    unmount();
  });
});

describe("Set default profile when delete profile", () => {
  test("Set recent profile as default profile", async () => {
    const initialStateKeri = {
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
      profilesCache: {
        ...profileCacheFixData,
        recentProfiles: [
          filteredIdentifierFix[0].id,
          filteredIdentifierFix[2].id,
          filteredIdentifierFix[1].id,
        ],
      },
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { findByText, getByText, queryByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId={filteredIdentifierFix[0].id}
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.delete.button)
      ).toBeInTheDocument()
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.profiledetails.delete.button));

    const alertTitle = await findByText(
      EN_TRANSLATIONS.profiledetails.delete.alert.title
    );

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.delete.alert.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    const verifyTitle = await findByText(EN_TRANSLATIONS.verifypasscode.title);

    await waitFor(() => {
      expect(verifyTitle).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "997887");

    await waitFor(() => {
      expect(createOrUpdateMock).toBeCalledWith(
        expect.objectContaining({
          id: MiscRecordId.DEFAULT_PROFILE,
          content: { defaultProfile: filteredIdentifierFix[1].id },
        })
      );
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        updateRecentProfiles([
          filteredIdentifierFix[0].id,
          filteredIdentifierFix[2].id,
        ])
      );
    });
  });

  test("Set default profile is first profile in the alphabet", async () => {
    const initialStateKeri = {
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
      profilesCache: {
        ...profileCacheFixData,
        recentProfiles: [],
      },
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { findByText, getByText, queryByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <ProfileDetailsModal
          profileId={filteredIdentifierFix[0].id}
          pageId={pageId}
          isOpen
          setIsOpen={jest.fn}
          showProfiles={jest.fn}
        />
      </Provider>
    );
    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.delete.button)
      ).toBeInTheDocument()
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.profiledetails.delete.button));

    const alertTitle = await findByText(
      EN_TRANSLATIONS.profiledetails.delete.alert.title
    );

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.profiledetails.delete.alert.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    const verifyTitle = await findByText(EN_TRANSLATIONS.verifypasscode.title);

    await waitFor(() => {
      expect(verifyTitle).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "997887");

    await waitFor(() => {
      expect(createOrUpdateMock).toBeCalledWith(
        expect.objectContaining({
          id: MiscRecordId.DEFAULT_PROFILE,
          content: { defaultProfile: filteredIdentifierFix[3].id },
        })
      );

      expect(dispatchMock).toBeCalledWith(updateRecentProfiles([]));
    });
  });

  test("Clear default profile cache and remove profile histories when no matching profile", async () => {
    const initialStateKeri = {
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
        profileHistories: [],
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
          },
        },
        defaultProfile: filteredIdentifierFix[0].id,
        recentProfiles: [],
      },
    };

    const storeMockedAidKeri = {
      ...makeTestStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { findByText, getByText, queryByText, getByTestId, findByTestId } =
      render(
        <Provider store={storeMockedAidKeri}>
          <ProfileDetailsModal
            profileId={filteredIdentifierFix[0].id}
            pageId={pageId}
            isOpen
            setIsOpen={jest.fn}
            showProfiles={jest.fn}
          />
        </Provider>
      );
    await waitFor(() =>
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.delete.button)
      ).toBeInTheDocument()
    );

    fireEvent.click(getByText(EN_TRANSLATIONS.profiledetails.delete.button));

    const alertTitle = await findByTestId("mock-ion-alert");

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    // Click the confirm button in the mocked alert
    const confirmButton = getByTestId(
      "alert-confirm-identifier-delete-details-confirm-button"
    );
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.profiledetails.delete.alert.title)
      ).toBeNull();
    });

    const verifyTitle = await findByText(EN_TRANSLATIONS.verifypasscode.title);

    await waitFor(() => {
      expect(verifyTitle).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "997887");

    await waitFor(() => {
      expect(Agent.agent.basicStorage.deleteById).toBeCalledWith(
        MiscRecordId.DEFAULT_PROFILE
      );
      expect(Agent.agent.basicStorage.deleteById).toBeCalledWith(
        MiscRecordId.PROFILE_HISTORIES
      );
      expect(dispatchMock).toBeCalledWith(updateRecentProfiles([]));
    });
  });
});
