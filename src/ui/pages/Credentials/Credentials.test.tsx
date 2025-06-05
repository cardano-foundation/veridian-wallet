import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import { CredentialStatus } from "../../../core/agent/services/credentialService.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { store } from "../../../store";
import {
  setCredentialsFilters,
  setCredsCache,
} from "../../../store/reducers/credsCache";
import {
  setCurrentRoute,
  showConnections,
} from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { pendingCredFixs } from "../../__fixtures__/credsFix";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { Credentials } from "./Credentials";
import { CredentialsFilters } from "./Credentials.types";

const deleteIdentifierMock = jest.fn();
const archiveIdentifierMock = jest.fn();
const markCredentialPendingDeletionMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
        deleteCredential: () => deleteIdentifierMock(),
        archiveCredential: () => archiveIdentifierMock(),
        getCredentials: jest.fn(),
        markCredentialPendingDeletion: () =>
          markCredentialPendingDeletionMock(),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => Promise.resolve(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const initialStateEmpty = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    isOnline: true,
    showConnections: false,
  },
  seedPhraseCache: {},
  credsCache: {
    creds: [],
  },
  credsArchivedCache: {
    creds: filteredCredsFix,
  },
  connectionsCache: {
    connections: [],
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  viewTypeCache: {
    identifier: {
      viewType: null,
      favouriteIndex: 0,
    },
    credential: {
      viewType: null,
      favouriteIndex: 0,
    },
  },
  biometricsCache: {
    enabled: false,
  },
};

const initialStateFull = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
  credsCache: {
    creds: filteredCredsFix,
    favourites: [
      {
        id: filteredCredsFix[0].id,
        time: 1,
      },
      {
        id: filteredCredsFix[1].id,
        time: 2,
      },
    ],
  },
  credsArchivedCache: {
    creds: filteredCredsFix,
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  viewTypeCache: {
    identifier: {
      viewType: null,
      favouriteIndex: 0,
    },
    credential: {
      viewType: null,
      favouriteIndex: 0,
    },
  },
  biometricsCache: {
    enabled: false,
  },
};

const archivedAndRevokedState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
  credsCache: {
    creds: [
      filteredCredsFix[0],
      {
        ...filteredCredsFix[1],
        status: CredentialStatus.REVOKED,
      },
    ],
    favourites: [
      {
        id: filteredCredsFix[0].id,
        time: 1,
      },
    ],
  },
  credsArchivedCache: {
    creds: filteredCredsFix,
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  notificationsCache: {
    notifications: [],
  },
  viewTypeCache: {
    identifier: {
      viewType: null,
      favouriteIndex: 0,
    },
    credential: {
      viewType: null,
      favouriteIndex: 0,
    },
  },
  biometricsCache: {
    enabled: false,
  },
};

let mockedStore: Store<unknown, AnyAction>;

describe("Creds Tab", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();

  beforeEach(() => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();

    mockedStore = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };

    store.dispatch(setCredsCache([]));
    store.dispatch(setCredentialsFilters(CredentialsFilters.All));
  });

  test("Renders favourites in Creds", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={mockedStore}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.tab.favourites)
    ).toBeInTheDocument();
  });

  test("Renders Creds Tab", () => {
    const storeMocked = {
      ...mockStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("credentials-tab")).toBeInTheDocument();
    expect(getByText("Credentials")).toBeInTheDocument();
  });

  test("Renders Creds Card placeholder", () => {
    const storeMocked = {
      ...mockStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(
      getByTestId("credentials-tab-cards-placeholder")
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.tab.placeholder)
    ).toBeInTheDocument();
  });

  test("Renders Creds Card", () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("keri-card-template-favs-index-0")).toBeInTheDocument();
  });

  test("Renders Creds Filters", () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.credentials.tab.filters.all
    );
    expect(individualFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.credentials.tab.filters.individual
    );
    expect(groupFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.credentials.tab.filters.group
    );
  });

  test("Toggle Creds Filters show Individual", async () => {
    store.dispatch(setCredsCache([filteredCredsFix[0]]));

    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={store}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveClass("selected");

    await waitFor(() => {
      expect(getByText(filteredCredsFix[0].credentialType)).toBeVisible();
    });

    act(() => {
      fireEvent.click(individualFilterBtn);
    });

    await waitFor(() => {
      expect(getByText(filteredCredsFix[0].credentialType)).toBeVisible();
    });

    act(() => {
      fireEvent.click(groupFilterBtn);
    });

    await waitFor(() => {
      expect(queryByText(filteredCredsFix[0].credentialType)).toBeNull();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.tab.filters.placeholder.replace(
            "{{ type }}",
            CredentialsFilters.Group
          )
        )
      ).toBeVisible();
    });
  });

  test("Toggle Creds Filters show Group", async () => {
    store.dispatch(setCredsCache([filteredCredsFix[3]]));
    store.dispatch(setCredentialsFilters(CredentialsFilters.All));

    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={store}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveClass("selected");

    await waitFor(() => {
      expect(getByText(filteredCredsFix[3].credentialType)).toBeVisible();
    });

    act(() => {
      fireEvent.click(individualFilterBtn);
    });

    await waitFor(() => {
      expect(queryByText(filteredCredsFix[3].credentialType)).toBeNull();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.tab.filters.placeholder.replace(
            "{{ type }}",
            CredentialsFilters.Individual
          )
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(groupFilterBtn);
    });

    await waitFor(() => {
      expect(getByText(filteredCredsFix[3].credentialType)).toBeVisible();
    });
  });

  test("Toggle Connections view", async () => {
    const storeMocked = {
      ...mockStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showConnections(true));
    });
  });

  test("Show Connections placeholder", async () => {
    const storeMocked = {
      ...mockStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showConnections(true));
    });
  });

  test("Remove pending cred alert", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      credsCache: {
        creds: pendingCredFixs,
        favourites: [],
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: filteredIdentifierFix,
      },

      credsArchivedCache: {
        creds: [],
      },
      viewTypeCache: {
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      connectionsCache: {
        connections: connectionsFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId(`card-item-${pendingCredFixs[0].id}`)).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${pendingCredFixs[0].id}`));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.tab.deletepending.title)
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.tab.deletepending.description
        )
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.tab.deletepending.button)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.tabs.credentials.tab.deletepending.button)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.tab.deletepending.secondchecktitle
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("credentials-tab-delete-pending-modal-confirm-button")
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markCredentialPendingDeletionMock).toBeCalled();
      expect(archiveIdentifierMock).toBeCalled();
    });
  });

  test("Show archived & revoked credentials", async () => {
    const storeMocked = {
      ...mockStore(archivedAndRevokedState),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("cred-archived-revoked-button")).toBeVisible();
  });

  test("Open cred detail", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("keri-card-template-allcreds-index-0"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setCurrentRoute({
          path: `${TabsRoutePath.CREDENTIALS}/${filteredCredsFix[0].id}`,
        })
      );

      expect(
        getByTestId("favourite-container-element").getAttribute("style")
      ).not.toBe(null);
    });

    await waitFor(() => {
      expect(
        getByTestId("favourite-container-element").getAttribute("style")
      ).toBe(null);
    });
  });

  test("Open cred archived modal", async () => {
    const storeMocked = {
      ...mockStore(archivedAndRevokedState),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("cred-archived-revoked-button"));
    });

    await waitFor(() => {
      expect(getByTestId("archived-credentials")).toBeVisible();
    });
  });
});
