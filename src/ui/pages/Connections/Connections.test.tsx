const verifySecretMock = jest.fn();

import { ionFireEvent } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { formatShortDate } from "../../utils/formatters";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { Connections } from "./Connections";

const deleteConnectionByIdMock = jest.fn();
const getConnectionByIdMock = jest.fn();

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

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getConnectionById: () => getConnectionByIdMock(),
        getConnectionHistoryById: jest.fn(),
        createMediatorInvitation: jest.fn(),
        getShortenUrl: jest.fn(),
        deleteStaleLocalConnectionById: () => deleteConnectionByIdMock(),
        getConnectionShortDetailById: jest.fn(() => Promise.resolve([])),
      },
      auth: {
        verifySecret: verifySecretMock,
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

jest.mock("@ionic/react", () => {
  const { forwardRef } = jest.requireActual("react");

  return {
    ...jest.requireActual("@ionic/react"),
    IonModal: ({ children, isOpen, ...props }: any) =>
      isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
    IonSearchbar: forwardRef((props: any, ref: any) => {
      const { onIonInput, onIonFocus, onIonBlur } = props;

      return (
        <input
          value={props.value}
          data-testid="search-bar"
          onChange={onIonInput}
          onBlur={onIonBlur}
          onFocus={onIonFocus}
        />
      );
    }),
  };
});

const mockSetShowConnections = jest.fn();

const initialStateFull = {
  stateCache: {
    routes: [TabsRoutePath.IDENTIFIERS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
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
  seedPhraseCache: {},
  credsCache: {
    creds: filteredCredsFix,
    favourites: [
      {
        id: filteredCredsFix[0].id,
        time: 1,
      },
    ],
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  biometricsCache: {
    enabled: false,
  },
};

let mockedStore: Store<unknown, AnyAction>;

describe("Connections page", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    const mockStore = configureStore();

    mockedStore = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };

    verifySecretMock.mockResolvedValue(true);
  });

  test("Render connections page empty", async () => {
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
        ],
      },
      connectionsCache: {
        connections: [],
      },
      identifiersCache: {
        identifiers: filteredIdentifierFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };
    const mockStore = configureStore();
    const dispatchMock = jest.fn();

    const mockedStore = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Connections
            setShowConnections={mockSetShowConnections}
            showConnections={true}
          />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("connections-cards-placeholder")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connections"));
    });

    await waitFor(() => {
      expect(getByTestId("add-a-connection-title")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("add-connection-modal-provide-qr-code"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connections.page.indentifierselector.title)
      ).toBeVisible();
    });
  });

  test("Render connections page empty (no self pagination)", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.MENU],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
      credsCache: {
        creds: [],
        favourites: [],
      },
      connectionsCache: {
        connections: [],
      },
      identifiersCache: {
        identifiers: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };
    const mockStore = configureStore();
    const dispatchMock = jest.fn();

    const mockedStore = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Connections
            setShowConnections={mockSetShowConnections}
            showConnections={true}
          />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("connections-cards-placeholder")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connections"));
    });

    await waitFor(() => {
      expect(getByTestId("add-a-connection-title")).toBeVisible();
    });
  });

  test("It renders connections page successfully", async () => {
    const { getByTestId, getByText, getAllByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.IDENTIFIERS]}>
        <Provider store={mockedStore}>
          <Connections
            setShowConnections={mockSetShowConnections}
            showConnections={true}
          />
        </Provider>
      </MemoryRouter>
    );
    const addConnectionBtn = getByTestId("add-connection-button");
    expect(addConnectionBtn).toBeInTheDocument();
    const title = getByTestId("connections-title");
    expect(title).toBeInTheDocument();
    expect(getByText(connectionsFix[0].label)).toBeInTheDocument();
    expect(
      getByText(formatShortDate(connectionsFix[0].createdAtUTC))
    ).toBeInTheDocument();
    expect(getAllByText(connectionsFix[0].status)[0]).toBeInTheDocument();
  });

  test("It shows available sharing ID", async () => {
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <Connections
          setShowConnections={mockSetShowConnections}
          showConnections={true}
        />
      </Provider>
    );
    act(() => {
      fireEvent.click(getByTestId("add-connection-button"));
    });

    await waitFor(() => {
      expect(getByTestId("add-connection-modal-provide-qr-code")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("add-connection-modal-provide-qr-code"));
    });

    await waitFor(() => {
      expect(getByTestId("connection-identifier-selector-page")).toBeVisible();
      expect(
        getByTestId(
          `card-item-${initialStateFull.identifiersCache.identifiers[0].id}`
        )
      ).toBeVisible();
    });
  });

  test("It shows and dismiss an Alert when no Identifiers are available", async () => {
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
    const { getByTestId, queryByText, findByText, unmount } = render(
      <Provider store={storeMocked}>
        <Connections
          setShowConnections={mockSetShowConnections}
          showConnections={true}
        />
      </Provider>
    );

    fireEvent.click(getByTestId("primary-button-connections"));

    await waitFor(() => {
      expect(getByTestId("add-connection-modal-provide-qr-code")).toBeVisible();
    });

    fireEvent.click(getByTestId("add-connection-modal-provide-qr-code"));

    const text = await findByText(
      EN_TRANSLATIONS.connections.page.alert.message
    );
    await waitFor(() => {
      expect(text).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-create-keri-cancel-button"));

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.connections.page.alert.message)
      ).toBeNull();
    });

    unmount();
  });

  test("Search", async () => {
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

    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <Connections
          showConnections={true}
          setShowConnections={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("search-bar")).toBeVisible();
    });

    const searchBar = getByTestId("search-bar");

    act(() => {
      ionFireEvent.ionFocus(searchBar);
    });

    act(() => {
      ionFireEvent.change(searchBar, {
        target: {
          value: "Cambridge",
        },
      });
    });

    await waitFor(() => {
      expect(getByTestId("search-connection")).toBeVisible();
      expect(queryByTestId("empty-search-connection")).toBe(null);
      expect(queryByTestId("connection-group-0")).toBe(null);
      expect(getByText("Cambridge University")).toBeVisible();
    });

    act(() => {
      ionFireEvent.change(searchBar, {
        target: {
          value: "Nothing",
        },
      });
    });

    await waitFor(() => {
      expect(queryByTestId("search-connection")).toBe(null);
      expect(getByTestId("empty-search-connection")).toBeVisible();
      expect(queryByTestId("connection-group-0")).toBe(null);
    });
  });
});

describe("Connections page from Credentials tab", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    const mockStore = configureStore();

    mockedStore = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };

    verifySecretMock.mockResolvedValue(true);
  });

  test("It allows to create an Identifier when no Identifiers are available", async () => {
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
      seedPhraseCache: {},
      identifiersCache: {
        identifiers: {},
      },
      credsCache: {
        creds: [],
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

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <Connections
          showConnections={true}
          setShowConnections={jest.fn()}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("primary-button-connections"));
    });

    await waitFor(() => {
      expect(getByTestId("add-connection-modal-provide-qr-code")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("add-connection-modal-provide-qr-code"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connections.page.alert.message)
      ).toBeVisible();
    });
  });

  test("Redirect to connection detail when click on connection item", async () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.IDENTIFIERS);

    getConnectionByIdMock.mockResolvedValueOnce(connectionsFix[2]);

    const { getByTestId, getByText } = render(
      <Provider store={mockedStore}>
        <Connections
          setShowConnections={mockSetShowConnections}
          showConnections={true}
        />
      </Provider>
    );

    await waitFor(() => {
      const addConnectionBtn = getByTestId("add-connection-button");
      expect(addConnectionBtn).toBeInTheDocument();
      const title = getByTestId("connections-title");
      expect(title).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${connectionsFix[2].id}`));
    });

    await waitFor(() => {
      expect(getByTestId("connection-details-page")).toBeVisible();
    });
  });

  test("Remove pending connection alert", async () => {
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
          <Connections
            setShowConnections={mockSetShowConnections}
            showConnections={true}
          />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId(`card-item-${connectionsFix[4].id}`)).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${connectionsFix[4].id}`));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connections.page.deletepending.title)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.connections.page.deletepending.description)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.connections.page.deletepending.button)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.connections.page.deletepending.button)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.connections.page.deletepending.secondchecktitle
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("connections-delete-pending-modal-confirm-button")
      );
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(deleteConnectionByIdMock).toBeCalled();
    });

    unmount();
  });
});
