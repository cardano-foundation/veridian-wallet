const verifySecretMock = jest.fn().mockResolvedValue(true);

import { Clipboard } from "@capacitor/clipboard";
import { ionFireEvent } from "@ionic/react-test-utils";
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import { ConfigurationService } from "../../../core/configuration";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  addFavouriteIdentifierCache,
  removeFavouriteIdentifierCache,
} from "../../../store/reducers/identifiersCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { ToastMsgType } from "../../globals/types";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../utils/formatters";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { AccordionKey } from "./components/IdentifierAttributeDetailModal/IdentifierAttributeDetailModal.types";
import { IdentifierDetailModule } from "./IdentifierDetailModule";
import { CreationStatus } from "../../../core/agent/agent.types";

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

const path = TabsRoutePath.IDENTIFIERS + "/" + identifierFix[0].id;
const getIndentifier = jest.fn(() => identifierFix[0]);

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: identifierFix[0].id,
  }),
  useRouteMatch: () => ({ url: path }),
}));

const deleteStaleLocalIdentifierMock = jest.fn();

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const rotateIdentifierMock = jest.fn((id: string) => Promise.resolve(id));
const deleteIdentifier = jest.fn(() => Promise.resolve());
const markIdentifierPendingDelete = jest.fn(() => Promise.resolve());
const createOrUpdateMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA:
      "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.",
    agent: {
      identifiers: {
        getIdentifier: () => getIndentifier(),
        rotateIdentifier: (id: string) => rotateIdentifierMock(id),
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
        createOrUpdateBasicRecord: () => createOrUpdateMock(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();

const initialStateKeri = {
  stateCache: {
    routes: [TabsRoutePath.IDENTIFIERS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
      firstAppLaunch: false,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
    favourites: [],
  },
  connectionsCache: {
    multisigConnections: {},
  },
  biometricsCache: {
    enabled: false,
  },
};

const storeMockedAidKeri = {
  ...mockStore(initialStateKeri),
  dispatch: dispatchMock,
};

const history = createMemoryHistory();
history.push(TabsRoutePath.IDENTIFIER_DETAILS, {
  ...identifierFix[0],
});

const pageId = "identifier-card-details";

describe("Individual Identifier details page", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  beforeEach(() => {
    getIndentifier.mockReturnValue(identifierFix[0]);
    verifySecretMock.mockResolvedValue(true);
  });

  test("It renders Identifier Details", async () => {
    Clipboard.write = jest.fn();
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );
    // Render card template
    await waitFor(() =>
      expect(
        getByTestId("identifier-card-template-default-index-0")
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
    expect(getByTestId("rotate-keys-button")).toBeInTheDocument();
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
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );
    // Render card template
    await waitFor(() =>
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument()
    );

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.identifierdetail.showadvanced
      )
    );

    // Render Sequence number
    await waitFor(() => {
      expect(getByTestId("sequence-number")).toBeInTheDocument();
    });

    expect(getByText(identifierFix[0].s)).toBeInTheDocument();
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
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

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
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(getByTestId("identifier-id")).toBeInTheDocument()
    );

    expect(queryByTestId("identifier-options-modal")).toBeNull();

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("identifier-options-modal")).toBeVisible();
    });
  });

  test("It shows the button to access the editor", async () => {
    const { getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(getByTestId("identifier-options-button")).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("edit-identifier-option")).toBeInTheDocument();
    });
  });

  test("It asks to verify the password when users try to delete the identifier using the button in the modal", async () => {
    verifySecretMock.mockResolvedValue(false);

    const { getByTestId, getByText, unmount, findByText, queryByText } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(getByTestId("identifier-options-button")).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("delete-identifier-option")).toBeInTheDocument();
    });

    fireEvent.click(getByTestId("delete-button-identifier-card-details"));

    const alertTitle = await findByText(
      EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title
    );

    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
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
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByTestId("delete-button-identifier-card-details")
      ).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("delete-button-identifier-card-details"));
    });

    const alertTitle = await findByText(
      EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title
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
        queryByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
      ).toBeNull();
    });

    unmount();
  });

  test("Show loading when indetifier data is null", async () => {
    Agent.agent.identifiers.getIdentifiers = jest.fn().mockResolvedValue(null);

    const { getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(
        getByTestId("identifier-card-detail-spinner-container")
      ).toBeVisible()
    );
  });

  test("Hide loading after retrieved indetifier data", async () => {
    const { queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() =>
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      )
    );
  });

  test("Rotate key", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { queryByTestId, getByTestId, getByText } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );
    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    await waitFor(() =>
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      )
    );

    act(() => {
      fireEvent.click(getByTestId("rotate-keys-button"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.details.rotatekeys.message)
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.rotatekeys.description
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.rotatekeys.signingkey
        )
      ).toBeVisible();
      expect(getByTestId("rotate-keys-title").innerHTML).toBe(
        EN_TRANSLATIONS.tabs.identifiers.details.options.rotatekeys
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-rotate-key"));
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-0")).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-1")).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-2")).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-3")).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-4")).toBeVisible();
    });

    fireEvent.click(getByTestId("passcode-button-1"));

    await waitFor(() => {
      expect(getByTestId("circle-5")).toBeVisible();
    });

    await waitFor(() => {
      expect(rotateIdentifierMock).toBeCalledWith(identifierFix[0].id);
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.ROTATE_KEY_SUCCESS)
      );
    });
  });

  test("Can restrict view to not be able to delete identifier", async () => {
    verifySecretMock.mockResolvedValue(false);

    const { getByTestId, unmount, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
          restrictedOptions={true}
        />
      </Provider>
    );

    // Wait until normal page is loaded
    await waitFor(() =>
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument()
    );

    expect(
      queryByTestId("delete-button-identifier-card-details")
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(getByTestId("identifier-options-button")).toBeInTheDocument()
    );

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("share-identifier-option")).toBeInTheDocument();
    });

    expect(queryByTestId("delete-identifier-option")).not.toBeInTheDocument();

    unmount();
  });
});

describe("Group Identifier details page", () => {
  const initialStateKeri = {
    stateCache: {
      routes: [TabsRoutePath.IDENTIFIERS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
      isOnline: true,
    },
    seedPhraseCache: {
      seedPhrase: "",
      bran: "bran",
    },
    identifiersCache: {
      identifiers: {
        EJexLqpflqJr3HQhMNECkgFL_D5Z3xAMbSmlHyPhqYut: {
          displayName: "GG",
          id: "EJexLqpflqJr3HQhMNECkgFL_D5Z3xAMbSmlHyPhqYut",
          createdAtUTC: "2024-10-14T13:11:52.963Z",
          theme: 20,
          creationStatus: CreationStatus.COMPLETE,
          groupMemberPre: "ELUXM-ajSu0o1qyFvss-3QQfkj3DOke9aHNwt72Byi9x",
        },
      },
      favourites: [],
    },
    connectionsCache: {
      multisigConnections: {
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu": {
          id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
          label: "Member 0",
          connectionDate: "2024-10-14T13:11:44.501Z",
          status: "confirmed",
          oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
          groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
        },
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2": {
          id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
          label: "Member 1",
          connectionDate: "2024-10-14T13:11:44.501Z",
          status: "confirmed",
          oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
          groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
        },
      },
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const storeMockedAidKeri = {
    ...mockStore(initialStateKeri),
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

  test("It renders Identifier Details", async () => {
    Clipboard.write = jest.fn();

    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: {
          EJexLqpflqJr3HQhMNECkgFL_D5Z3xAMbSmlHyPhqYut: {
            displayName: "GG",
            id: "EJexLqpflqJr3HQhMNECkgFL_D5Z3xAMbSmlHyPhqYut",
            createdAtUTC: "2024-10-14T13:11:52.963Z",
            theme: 20,
            creationStatus: CreationStatus.COMPLETE,
            groupMemberPre: "ELUXM-ajSu0o1qyFvss-3QQfkj3DOke9aHNwt72Byi9x",
          },
        },
        favourites: [],
      },
      connectionsCache: {
        multisigConnections: {
          "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu": {
            id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
            label: "Member 0",
            connectionDate: "2024-10-14T13:11:44.501Z",
            status: "confirmed",
            oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
            groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
          },
          "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2": {
            id: "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
            label: "Member 1",
            connectionDate: "2024-10-14T13:11:44.501Z",
            status: "confirmed",
            oobi: "http://keria:3902/oobi/EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu/agent/EMrn5s4fG1bzxdlrtyRusPQ23fohlGuH6LkZBSRiDtKy?name=Brave&groupId=9a12f939-1412-4450-aa61-a9a8a697ceca",
            groupId: "9a12f939-1412-4450-aa61-a9a8a697ceca",
          },
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { getByTestId, getAllByText } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    // Render card template
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    // Render Group members
    expect(getByTestId("group-member-0-text-value").innerHTML).toBe("Member 0");
    expect(getByTestId("group-member-1-text-value").innerHTML).toBe("Member 1");
    expect(getByTestId("view-member")).toBeVisible();

    // Render Keys signing threshold
    expect(getByTestId("rotate-signing-key")).toBeVisible();
    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.identifiers.details.group.signingkeysthreshold.outof.replace(
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
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    // Render card template
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    // Render Group members
    expect(getByTestId("group-member-0-text-value").innerHTML).toBe("Member 0");
    expect(getByTestId("group-member-1-text-value").innerHTML).toBe("Member 1");
    expect(getByTestId("view-member")).toBeVisible();

    fireEvent.click(getByTestId("view-member"));

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.groupmember
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.groupmember
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Open signing threshold", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    // Render card template
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.group.signingkeysthreshold
          .title
      )
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.signingthreshold
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.signingthreshold
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Open advanced detail", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.identifierdetail.showadvanced
      )
    );

    // Render Sequence number
    await waitFor(() => {
      expect(getByTestId("sequence-number")).toBeInTheDocument();
    });

    expect(getByText(identifierFix[0].s)).toBeInTheDocument();
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

    expect(getByText(identifierFix[2].s)).toBeInTheDocument();
    // Render Last key rotation timestamp
    expect(
      getByText(
        `Last key event: ${
          formatShortDate(identifierFix[2].dt) +
          " - " +
          formatTimeToSec(identifierFix[2].dt)
        } (${getUTCOffset(identifierFix[0].dt)})`
      )
    ).toBeInTheDocument();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.advanceddetail.viewkey.replace(
          "{{keys}}",
          "1"
        )
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.advanceddetail.viewrotationkey.replace(
          "{{keys}}",
          "1"
        )
      )
    ).toBeInTheDocument();

    ionFireEvent.ionChange(getByTestId("key-list"), [
      AccordionKey.SIGNINGKEY,
    ] as never);

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.advanceddetail.hidekey.replace(
            "{{keys}}",
            "1"
          )
        )
      ).toBeInTheDocument();
    });

    ionFireEvent.ionChange(getByTestId("key-list"), [
      AccordionKey.ROTATIONKEY,
    ] as never);

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.advanceddetail.hiderotationkey.replace(
            "{{keys}}",
            "1"
          )
        )
      ).toBeInTheDocument();
    });
  });

  test("Open rotation threshold", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    // Render card template
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
          .title
      )
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Open group member from rotation threshold", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    // Render card template
    await waitFor(() => {
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
          .title
      )
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
            .propexplain.title
        )
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.details.detailmodal.rotationthreshold
            .propexplain.content
        )
      ).toBeVisible();
    });
  });

  test("Cannot rotate key", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: {
          [filteredIdentifierFix[2].id]: filteredIdentifierFix[2],
        },
        favourites: [],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

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

describe("Checking the Identifier Details Page when information is missing from the cloud", () => {
  beforeEach(() => {
    getIndentifier.mockImplementation(() => {
      throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: id`);
    });
    verifySecretMock.mockResolvedValue(true);
  });

  test("Identifier exists in the database but not on Signify", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText, unmount, queryByText } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("identifier-card-details-cloud-error-page")
      ).toBeVisible();

      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.details.clouderror, {
          normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
        })
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("delete-button-identifier-card-details"));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("alert-confirm-identifier-delete-details-confirm-button")
    );
    fireEvent.click(
      getByTestId("alert-confirm-identifier-delete-details-cancel-button")
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
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

describe("Favourite identifier", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  beforeEach(() => {
    getIndentifier.mockReturnValue(identifierFix[0]);
    verifySecretMock.mockResolvedValue(true);
  });

  test("It changes to favourite icon on click favourite button", async () => {
    const spy = jest
      .spyOn(global.Date, "now")
      .mockImplementation((() => 1466424490000) as never);

    const history = createMemoryHistory();
    history.push(path);

    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    act(() => {
      fireEvent.click(getByTestId("heart-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        addFavouriteIdentifierCache({
          id: identifierFix[0].id,
          time: 1466424490000,
        })
      );
    });

    spy.mockRestore();
  });

  test("Max favourite items", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [
          {
            id: filteredIdentifierFix[1].id,
            time: 0,
          },
          {
            id: filteredIdentifierFix[1].id,
            time: 0,
          },
          {
            id: filteredIdentifierFix[1].id,
            time: 0,
          },
          {
            id: filteredIdentifierFix[1].id,
            time: 0,
          },
          {
            id: filteredIdentifierFix[1].id,
            time: 0,
          },
        ],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(path);

    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    act(() => {
      fireEvent.click(getByTestId("heart-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.MAX_FAVOURITES_REACHED)
      );
    });
  });

  test("Change favourite identifier to normal identifier", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [
          {
            id: filteredIdentifierFix[0].id,
            time: 0,
          },
        ],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(path);

    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMockedAidKeri}>
        <IdentifierDetailModule
          identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
          onClose={jest.fn()}
          pageId={pageId}
          navAnimation
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    act(() => {
      fireEvent.click(getByTestId("heart-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        removeFavouriteIdentifierCache(identifierFix[0].id)
      );
    });
  });

  test("Delete favourite identifier", async () => {
    const initialStateKeri = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        bran: "bran",
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
        favourites: [
          {
            id: filteredIdentifierFix[0].id,
            time: 0,
          },
        ],
      },
      connectionsCache: {
        multisigConnections: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMockedAidKeri = {
      ...mockStore(initialStateKeri),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(path);

    const { getByTestId, queryByTestId, getByText, unmount, queryByText } =
      render(
        <Provider store={storeMockedAidKeri}>
          <IdentifierDetailModule
            identifierDetailId="ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb"
            onClose={jest.fn()}
            pageId={pageId}
            navAnimation
          />
        </Provider>
      );

    await waitFor(() => {
      expect(queryByTestId("identifier-card-detail-spinner-container")).toBe(
        null
      );
    });

    act(() => {
      fireEvent.click(getByTestId("delete-button-identifier-card-details"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("alert-confirm-identifier-delete-details-confirm-button")
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.identifiers.details.delete.alert.title)
      ).toBeNull();
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeInTheDocument();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markIdentifierPendingDelete).toBeCalled();
    });

    unmount();
  });
});
