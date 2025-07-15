const verifySecretMock = jest.fn();

import { ionFireEvent } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { formatShortDate } from "../../utils/formatters";
import { makeTestStore } from "../../utils/makeTestStore";
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
    IonButton: (props: any) => <button {...props} />,
  };
});

const initialStateFull = {
  stateCache: {
    routes: [TabsRoutePath.CONNECTIONS],
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

describe("Connections tab", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockedStore = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    verifySecretMock.mockResolvedValue(true);
  });

  test("Render connections tab empty", async () => {
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
    const dispatchMock = jest.fn();

    const mockedStore = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("connections-tab-cards-placeholder")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connections-tab"));
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.shareprofile.shareoobi.title)
      ).toBeVisible();
    });
  });

  test("Open profile", async () => {
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
    const dispatchMock = jest.fn();

    const mockedStore = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId("avatar-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("avatar-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.profiles.title)).toBeVisible();
    });
  });

  test("It renders connections tab successfully", async () => {
    const { getByTestId, getByText, getAllByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );
    const addConnectionBtn = getByTestId("add-connection-button");
    expect(addConnectionBtn).toBeInTheDocument();
    expect(
      getByText(EN_TRANSLATIONS.tabs.connections.tab.title)
    ).toBeInTheDocument();
    expect(getByText(connectionsFix[0].label)).toBeInTheDocument();
    expect(
      getByText(formatShortDate(connectionsFix[0].createdAtUTC))
    ).toBeInTheDocument();
    expect(getAllByText(connectionsFix[0].status)[0]).toBeInTheDocument();
  });

  test("Search", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CONNECTIONS],
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
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <Connections />
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

  test("Redirect to connection detail when click on connection item", async () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.CONNECTIONS);

    getConnectionByIdMock.mockResolvedValueOnce(connectionsFix[2]);

    const { getByTestId, getByText } = render(
      <Provider store={mockedStore}>
        <Connections />
      </Provider>
    );

    await waitFor(() => {
      const addConnectionBtn = getByTestId("add-connection-button");
      expect(addConnectionBtn).toBeInTheDocument();
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.tab.title)
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId(`card-item-${connectionsFix[2].id}`));
    });

    await waitFor(() => {
      expect(getByTestId("connection-details-page")).toBeVisible();
    });
  });

  test("Remove pending connection alert", async () => {
    const dispatchMock = jest.fn();
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIER_DETAILS, TabsRoutePath.CONNECTIONS],
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
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText, unmount } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={storeMocked}>
          <Connections />
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
        getByText(EN_TRANSLATIONS.tabs.connections.tab.deletepending.title)
      ).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.connections.tab.deletepending.description
        )
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.tab.deletepending.button)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByText(EN_TRANSLATIONS.tabs.connections.tab.deletepending.button)
      );
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.connections.tab.deletepending.secondchecktitle
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId("connections-tab-delete-pending-modal-confirm-button")
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

  test("Click on alphabet list", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("alphabet-selector")).toBeVisible();
    expect(getByTestId("alphabet-selector-C")).toBeVisible();

    fireEvent.click(getByTestId("alphabet-selector-C"));

    await waitFor(() => {
      expect(getByTestId("connections-list-alphabetic-C")).toBeVisible();
    });
  });

  test("alphabet touch start and touch end", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("alphabet-selector")).toBeVisible();
    expect(getByTestId("alphabet-selector-C")).toBeVisible();

    ionFireEvent.touchStart(getByTestId("alphabet-selector-C"));

    await waitFor(() => {
      expect(
        getByTestId("alphabet-selector-C").classList.contains("active")
      ).toBeTruthy();
    });

    fireEvent.touchEnd(document);
    fireEvent.touchCancel(document);

    await waitFor(() => {
      expect(
        getByTestId("alphabet-selector-C").classList.contains("active")
      ).toBeFalsy();
    });
  });

  test("alphabet touch move", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CONNECTIONS]}>
        <Provider store={mockedStore}>
          <Connections />
        </Provider>
      </MemoryRouter>
    );

    expect(getByTestId("alphabet-selector")).toBeVisible();

    fireEvent.touchMove(document, {
      touches: [
        {
          clientX: 100,
          clientY: 100,
        },
      ],
    });

    await waitFor(() => {
      expect(
        getByTestId("alphabet-selector-C").classList.contains("active")
      ).toBeFalsy();
    });
  });
});
