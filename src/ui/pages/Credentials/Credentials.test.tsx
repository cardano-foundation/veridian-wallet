import { IonReactMemoryRouter } from "@ionic/react-router";
import { AnyAction, Store } from "@reduxjs/toolkit";
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { setCredsCache } from "../../../store/reducers/profileCache";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { setCredentialsFilters } from "../../../store/reducers/viewTypeCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import {
  filteredCredsFix,
  pendingCredFix,
} from "../../__fixtures__/filteredCredsFix";
import {
  failedFilteredIdentifierMapFix,
  filteredIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { Credentials } from "./Credentials";
import { CredentialsFilters } from "./Credentials.types";

const deleteIdentifierMock = jest.fn();
const archiveIdentifierMock = jest.fn();
const markCredentialPendingDeletionMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA: "MISSING_DATA_ON_KERIA",
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
        deleteCredential: () => deleteIdentifierMock(),
        archiveCredential: () => archiveIdentifierMock(),
        getCredentials: jest.fn(() => Promise.resolve([])),
        markCredentialPendingDeletion: () =>
          markCredentialPendingDeletionMock(),
      },
      identifiers: {
        getIdentifier: jest.fn(),
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

const initialStatePendingEmpty = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {},
  profilesCache: {
    ...profileCacheFixData,
    defaultProfile: filteredIdentifierFix[2].id,
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

const initialStateEmpty = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {},
  profilesCache: {
    ...profileCacheFixData,
    defaultProfile: filteredIdentifierFix[1].id,
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
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      [filteredIdentifierFix[0].id]: {
        ...(profileCacheFixData.profiles as any)[filteredIdentifierFix[0].id],
        connections: connectionsFix,
      },
    },
  },
  viewTypeCache: {
    credential: {
      viewType: null,
      favouriteIndex: 0,
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
  },
  biometricsCache: {
    enabled: false,
  },
};

const archivedAndRevokedState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      defaultProfile: filteredIdentifierFix[0].id,
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      [filteredIdentifierFix[0].id]: {
        ...(profileCacheFixData.profiles as any)[filteredIdentifierFix[0].id],
        connections: connectionsFix,
      },
    },
  },
  viewTypeCache: {
    credential: {
      viewType: null,
      favouriteIndex: 0,
      favourites: [
        {
          id: filteredCredsFix[0].id,
          time: 1,
        },
      ],
    },
  },
  biometricsCache: {
    enabled: false,
  },
};

let mockedStore: Store<unknown, AnyAction>;

describe("Creds Tab", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    const dispatchMock = jest.fn();

    mockedStore = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
  });

  const history = createMemoryHistory();
  history.push(TabsRoutePath.CREDENTIALS);

  it("Renders favourites in Creds", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.tab.favourites)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });
  });

  test("Renders Creds Tab", async () => {
    const storeMocked = {
      ...makeTestStore(initialStatePendingEmpty),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.CREDENTIALS]}
      >
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </IonReactMemoryRouter>
    );

    expect(getByTestId("credentials-tab")).toBeInTheDocument();
    expect(getByText("Credentials")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("hidden")
      ).toBeTruthy();
    });
  });

  test("Open profile", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
    const { getByText, getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.CREDENTIALS]}
      >
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("hidden")
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByTestId("avatar-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("avatar-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeVisible();
    });
  });

  test("Renders Creds Card placeholder", async () => {
    const storeMocked = {
      ...makeTestStore(initialStatePendingEmpty),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.CREDENTIALS]}
      >
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </IonReactMemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("hidden")
      ).toBeTruthy();
    });

    expect(
      getByTestId("credentials-tab-cards-placeholder")
    ).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.credentials.tab.placeholder)
    ).toBeInTheDocument();
  });

  test("Renders Creds Card", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

    expect(getByTestId("keri-card-template-favs-index-0")).toBeInTheDocument();
  });

  test("Renders Creds Filters", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

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
    const store = makeTestStore(initialStatePendingEmpty);
    store.dispatch(setCredsCache([filteredCredsFix[0]]));

    const { getByTestId, getByText, queryByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.CREDENTIALS]}
      >
        <Provider store={store}>
          <Credentials />
        </Provider>
      </IonReactMemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("hidden")
      ).toBeTruthy();
    });

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
    const store = makeTestStore(initialStateFull);
    store.dispatch(setCredsCache([filteredCredsFix[3]]));
    store.dispatch(setCredentialsFilters(CredentialsFilters.All));

    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={store}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

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

  test("Remove pending cred alert", async () => {
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
      seedPhraseCache: {},
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
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[1].id,
        profiles: {
          ...profileCacheFixData.profiles,
          [filteredIdentifierFix[1].id]: {
            ...profileCacheFixData.profiles[filteredIdentifierFix[1].id],
            connections: connectionsFix,
          },
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
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
      expect(
        getByTestId("archive-button-container").classList.contains("hidden")
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByTestId(`card-item-${pendingCredFix.id}`)).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${pendingCredFix.id}`));
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
      ...makeTestStore(archivedAndRevokedState),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

    expect(getByTestId("cred-archived-revoked-button")).toBeVisible();
  });

  test("Open cred detail", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

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
      ...makeTestStore(archivedAndRevokedState),
      dispatch: dispatchMock,
    };
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDENTIALS]}>
        <Provider store={storeMocked}>
          <Credentials />
        </Provider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(
        getByTestId("archive-button-container").classList.contains("visible")
      ).toBeTruthy();
    });

    act(() => {
      fireEvent.click(getByTestId("cred-archived-revoked-button"));
    });

    await waitFor(() => {
      expect(getByTestId("archived-credentials")).toBeVisible();
    });
  });

  describe("Show profile error", () => {
    test("Show pending profile issue", async () => {
      const storeMocked = {
        ...makeTestStore(initialStatePendingEmpty),
        dispatch: dispatchMock,
      };
      const { getByText, getByTestId } = render(
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.CREDENTIALS]}
        >
          <Provider store={storeMocked}>
            <Credentials />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.pending)
        ).toBeVisible();
      });
    });

    test("Show creating error", async () => {
      const initialStateErrorEmpty = {
        stateCache: {
          routes: [TabsRoutePath.CREDENTIALS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
        seedPhraseCache: {},
        profilesCache: {
          profiles: {
            [failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id].id]: {
              identity:
                failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id],
              connections: [],
              multisigConnections: [],
              peerConnections: [],
              credentials: [],
              archivedCredentials: [],
              notifications: [],
            },
          },
          defaultProfile: filteredIdentifierFix[0].id,
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

      const storeMocked = {
        ...makeTestStore(initialStateErrorEmpty),
        dispatch: dispatchMock,
      };
      const { getByText } = render(
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.CREDENTIALS]}
        >
          <Provider store={storeMocked}>
            <Credentials />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.nowitness)
        ).toBeVisible();
      });
    });

    test("Show missing on cloud error", async () => {
      const storeMocked = {
        ...makeTestStore(initialStateEmpty),
        dispatch: dispatchMock,
      };

      jest
        .spyOn(Agent.agent.identifiers, "getIdentifier")
        .mockImplementation(() =>
          Promise.reject(new Error(Agent.MISSING_DATA_ON_KERIA))
        );

      const { getByText } = render(
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.CREDENTIALS]}
        >
          <Provider store={storeMocked}>
            <Credentials />
          </Provider>
        </IonReactMemoryRouter>
      );

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.profiledetails.loadprofileerror.missingoncloud,
            {
              normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
            }
          )
        ).toBeVisible();
      });
    });
  });
});
