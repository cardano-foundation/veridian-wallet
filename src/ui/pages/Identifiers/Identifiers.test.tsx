import { AnyAction, Store } from "@reduxjs/toolkit";
import {
  fireEvent,
  render,
  RenderResult,
  waitFor,
} from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import configureStore from "redux-mock-store";
import { createMemoryHistory } from "history";
import { IonReactMemoryRouter } from "@ionic/react-router";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { showConnections } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import {
  filteredIdentifierFix,
  multisignIdentifierFix,
  pendingMultisignIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";
import {
  CLEAR_STATE_DELAY,
  NAVIGATION_DELAY,
} from "../../components/CardsStack";
import { OperationType } from "../../globals/types";
import { IdentifierDetails } from "../IdentifierDetails";
import { Identifiers } from "./Identifiers";
import { setMultiSigGroupCache } from "../../../store/reducers/identifiersCache";
import { IdentifiersFilters } from "./Identifiers.types";

const deleteIdentifierMock = jest.fn();

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
      },
      basicStorage: {
        deleteById: jest.fn(() => Promise.resolve()),
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => Promise.resolve(),
      },
    },
  },
}));

jest.mock("../../../core/storage", () => ({
  ...jest.requireActual("../../../core/storage"),
  SecureStorage: {
    get: () => "111111",
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
};
jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div {...props}>{children}</div> : null,
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
    const mockStore = configureStore();
    const state = {
      ...initialState,
      identifiersCache: {
        identifiers: [filteredIdentifierFix[0]],
        favourites: [],
      },
    };

    const storeMocked = {
      ...mockStore(state),
    };
    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
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
    const mockStore = configureStore();
    const state = {
      ...initialState,
      identifiersCache: {
        identifiers: [filteredIdentifierFix[3]],
        favourites: [],
      },
    };

    const storeMocked = {
      ...mockStore(state),
    };
    const { getByTestId, getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
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

    expect(
      getByText(EN_TRANSLATIONS.tabs.identifiers.details.done)
    ).toBeVisible();

    jest.advanceTimersByTime(CLEAR_STATE_DELAY);

    const doneButton = getByTestId("close-button");

    act(() => {
      fireEvent.click(doneButton);
    });
    expect(
      queryByText(EN_TRANSLATIONS.tabs.identifiers.tab.title)
    ).toBeVisible();
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
        identifiers: [],
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
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
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
        getByText(EN_TRANSLATIONS.tabs.identifiers.detelepending.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.detelepending.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.identifiers.detelepending.button)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.tabs.identifiers.detelepending.button)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.detelepending.secondchecktitle
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

    clickButtonRepeatedly(getByText, "1", 6);

    await waitFor(() => {
      expect(deleteIdentifierMock).toBeCalled();
    });
  });

  test("Remove pending multisig identifier alert", async () => {
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
        identifiers: pendingMultisignIdentifierFix,
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
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
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
        getByTestId(`card-item-${filteredIdentifierFix[0].id}`)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${filteredIdentifierFix[0].id}`));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.identifiers.detelepending.mutilsigdescription
        )
      ).toBeVisible();
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
        identifiers: pendingMultisignIdentifierFix,
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
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.IDENTIFIERS}
            component={Identifiers}
          />
        </Provider>
      </MemoryRouter>
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

const clickButtonRepeatedly = (
  getByText: RenderResult["getByText"],
  buttonLabel: string,
  times: number
) => {
  for (let i = 0; i < times; i++) {
    act(() => {
      fireEvent.click(getByText(buttonLabel));
    });
  }
};
