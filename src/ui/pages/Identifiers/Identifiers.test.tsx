const verifySecretMock = jest.fn();

import { IonReactMemoryRouter } from "@ionic/react-router";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { store } from "../../../store";
import {
  setIdentifiersCache,
  setIdentifiersFilters,
  setMultiSigGroupCache,
} from "../../../store/reducers/identifiersCache";
import { showConnections } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import {
  failedFilteredIdentifierMapFix,
  failedMultisignIdentifierFix,
  filteredIdentifierFix,
  multisignIdentifierFix,
  pendingMemberIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";
import {
  CLEAR_STATE_DELAY,
  NAVIGATION_DELAY,
} from "../../components/CardsStack";
import { OperationType } from "../../globals/types";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { IdentifierDetails } from "../IdentifierDetails";
import { Identifiers } from "./Identifiers";
import { IdentifiersFilters } from "./Identifiers.types";

const deleteIdentifierMock = jest.fn();
const markIdentifierPendingDelete = jest.fn();

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

jest.mock("react-qrcode-logo", () => {
  return {
    ...jest.requireActual("react-qrcode-logo"),
    QRCode: () => <div></div>,
  };
});

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        getIdentifier: jest.fn().mockResolvedValue({}),
        deleteIdentifier: () => deleteIdentifierMock(),
        markIdentifierPendingDelete: () => markIdentifierPendingDelete(),
      },
      basicStorage: {
        deleteById: jest.fn(() => Promise.resolve()),
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => Promise.resolve(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
      connections: {
        getOobi: jest.fn(),
        getMultisigLinkedContacts: jest.fn(),
      },
    },
  },
}));

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.IDENTIFIERS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
    },
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
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    brand: "brand",
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
    favourites: [
      {
        id: filteredIdentifierFix[0].id,
        time: 1,
      },
      {
        id: filteredIdentifierFix[1].id,
        time: 1,
      },
    ],
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  biometricsCache: {
    enabled: false,
  },
};
jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

let mockedStore: Store<unknown, AnyAction>;
describe("Identifiers Tab", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const mockStore = configureStore();
    const dispatchMock = jest.fn();

    mockedStore = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    store.dispatch(setIdentifiersCache([]));
    store.dispatch(setIdentifiersFilters(IdentifiersFilters.All));

    verifySecretMock.mockResolvedValue(true);
  });

  test("Renders favourites in Identifiers", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    expect(
      getByText(EN_TRANSLATIONS.tabs.identifiers.tab.favourites)
    ).toBeInTheDocument();
  });

  test("Open individual identifier that create fail", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
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
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        brand: "brand",
      },
      identifiersCache: {
        identifiers: failedFilteredIdentifierMapFix,
      },
      connectionsCache: {
        connections: connectionsFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const mockStore = configureStore();
    const dispatchMock = jest.fn();

    mockedStore = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText(filteredIdentifierFix[2].displayName)).toBeVisible();
    });

    fireEvent.click(getByText(filteredIdentifierFix[2].displayName));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.witnesserror)
      ).toBeVisible();
    });
  });

  test("Renders Identifiers Tab and all elements in it", () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("identifiers-tab")).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.identifiers.tab.title)
    ).toBeInTheDocument();
    expect(getByTestId("connections-button")).toBeInTheDocument();
    expect(getByTestId("add-button")).toBeInTheDocument();
    expect(getByTestId("pending-identifiers-list")).toBeInTheDocument();
    expect(
      getByTestId(`card-item-${filteredIdentifierFix[2].id}`)
    ).toBeInTheDocument();
  });

  test("Renders Identifiers Filters", () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.identifiers.tab.filters.all
    );
    expect(individualFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.identifiers.tab.filters.individual
    );
    expect(groupFilterBtn).toHaveTextContent(
      EN_TRANSLATIONS.tabs.identifiers.tab.filters.group
    );
  });

  test("Toggle Identifiers Filters show Individual", async () => {
    store.dispatch(setIdentifiersCache([filteredIdentifierFix[0]]));

    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={store}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveClass("selected");

    await waitFor(() => {
      expect(getByText(filteredIdentifierFix[0].displayName)).toBeVisible();
    });

    act(() => {
      fireEvent.click(individualFilterBtn);
    });

    await waitFor(() => {
      expect(getByText(filteredIdentifierFix[0].displayName)).toBeVisible();
    });

    act(() => {
      fireEvent.click(groupFilterBtn);
    });

    await waitFor(() => {
      expect(queryByText(filteredIdentifierFix[0].displayName)).toBeNull();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.tab.filters.placeholder.replace(
            "{{ type }}",
            IdentifiersFilters.Group
          )
        )
      ).toBeVisible();
    });
  });

  test("Toggle Identifiers Filters show Group", async () => {
    store.dispatch(setIdentifiersCache([filteredIdentifierFix[3]]));
    store.dispatch(setIdentifiersFilters(IdentifiersFilters.All));

    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={store}>
          <Identifiers />
        </Provider>
      </MemoryRouter>
    );

    const allFilterBtn = getByTestId("all-filter-btn");
    const individualFilterBtn = getByTestId("individual-filter-btn");
    const groupFilterBtn = getByTestId("group-filter-btn");

    expect(allFilterBtn).toHaveClass("selected");

    await waitFor(() => {
      expect(getByText(filteredIdentifierFix[3].displayName)).toBeVisible();
    });

    act(() => {
      fireEvent.click(individualFilterBtn);
    });

    await waitFor(() => {
      expect(queryByText(filteredIdentifierFix[3].displayName)).toBeNull();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.tab.filters.placeholder.replace(
            "{{ type }}",
            IdentifiersFilters.Individual
          )
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(groupFilterBtn);
    });

    await waitFor(() => {
      expect(getByText(filteredIdentifierFix[3].displayName)).toBeVisible();
    });
  });

  test("Navigate from Identifiers Tab to Card Details and back", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIER_DETAILS, TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
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

    jest.useFakeTimers();
    const { getByText, getByTestId, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
          <Route
            path={TabsRoutePath.IDENTIFIER_DETAILS}
            component={IdentifierDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    expect(
      getByText(
        filteredIdentifierFix[0].id.substring(0, 5) +
          "..." +
          filteredIdentifierFix[0].id.slice(-5)
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId("identifier-card-template-allidentifiers-index-0")
      );
      jest.advanceTimersByTime(NAVIGATION_DELAY);
    });

    await waitFor(() => {
      expect(
        getByTestId("identifiers-tab").classList.contains(
          "cards-identifier-nav"
        )
      ).toBeFalsy();
    });

    await waitFor(() => {
      expect(
        getByTestId("identifiers-tab").classList.contains(
          "cards-identifier-nav"
        )
      ).toBeFalsy();
      expect(
        getByTestId("card-stack").classList.contains("transition-start")
      ).toBeFalsy();
    });

    expect(
      getByText(EN_TRANSLATIONS.tabs.identifiers.details.done)
    ).toBeVisible();

    jest.advanceTimersByTime(CLEAR_STATE_DELAY);

    fireEvent.click(getByTestId("close-button"));

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.identifiers.tab.title)
      ).toBeVisible();
    });
  });

  test("Open multisig", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        currentOperation: OperationType.OPEN_MULTISIG_IDENTIFIER,
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: multisignIdentifierFix,
        multiSigGroup: {
          groupId: multisignIdentifierFix[0].groupMetadata?.groupId,
        },
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
        connections: [],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.IDENTIFIERS]}
      >
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.title)
      ).toBeVisible();
    });
  });

  test("Open group identifier that create fail", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        currentOperation: OperationType.OPEN_MULTISIG_IDENTIFIER,
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: failedMultisignIdentifierFix,
        multiSigGroup: {
          groupId: failedMultisignIdentifierFix[0].groupMetadata?.groupId,
        },
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
        connections: [],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByText } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.IDENTIFIERS]}
      >
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(failedMultisignIdentifierFix[0].displayName)
      ).toBeVisible();
    });

    fireEvent.click(getByText(failedMultisignIdentifierFix[0].displayName));

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.witnesserror)
      ).toBeVisible();
    });
  });

  test("Open duplicate multisig", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        currentOperation: OperationType.IDLE,
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: multisignIdentifierFix,
        openMultiSigId: multisignIdentifierFix[0].groupMetadata?.groupId,
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
        connections: [],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.title)
      ).toBeVisible();
    });
  });

  test("Open Connections tab", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: {},
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
        connections: [],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("connections-button")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    expect(dispatchMock).toBeCalledWith(showConnections(true));
  });

  test("Remove pending identifier alert", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIER_DETAILS, TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
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

    const { getByTestId, getByText, unmount } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId(`card-item-${filteredIdentifierFix[2].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${filteredIdentifierFix[2].id}`));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.button)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.tabs.identifiers.deletepending.button)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.deletepending.secondchecktitle
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("identifiers-tab-delete-pending-modal-confirm-button")
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markIdentifierPendingDelete).toBeCalled();
    });

    unmount();
  });

  test("Open pending group identifier", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIER_DETAILS, TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: pendingMemberIdentifierFix,
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

    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByTestId, getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByTestId(`card-item-${filteredIdentifierFix[0].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${filteredIdentifierFix[0].id}`));
    });

    await waitFor(() => {
      expect(getByTestId("create-group-identifier-modal")).toBeVisible();
    });
  });

  test("Close create identifier", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIER_DETAILS, TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        currentOperation: OperationType.IDLE,
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: pendingMemberIdentifierFix,
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

    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          history={history}
          initialEntries={[TabsRoutePath.IDENTIFIERS]}
        >
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("add-button"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.add.title)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("close-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(setMultiSigGroupCache(undefined));
    });
  });

  test("Open multisig", async () => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        currentOperation: OperationType.IDLE,
      },
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: multisignIdentifierFix,
        multiSigGroup: {
          groupId: multisignIdentifierFix[0].groupMetadata?.groupId,
        },
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
        connections: [],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    const { getByText, getByTestId } = render(
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.IDENTIFIERS]}
      >
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </IonReactMemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId(`card-item-${multisignIdentifierFix[0].id}`));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.share.title)
      ).toBeVisible();
    });
  });
});
