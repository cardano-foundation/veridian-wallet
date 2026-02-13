import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
// connectionsMapFix is not needed here; keep fixture imports minimal
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { SwitchCardView } from "./SwitchCardView";
import ENG_trans from "../../../locales/en/en.json";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { connectionsFix } from "../../__fixtures__/connectionsFix";

const historyPushMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => Promise.resolve(),
      },
    },
  },
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    ...jest.requireActual("react-router-dom").useHistory,
    push: (params: any) => historyPushMock(params),
  }),
}));

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: true,
    },
  },
  profilesCache: {
    profiles: {
      [filteredIdentifierFix[0].id]: {
        identity: filteredIdentifierFix[0],
        connections: connectionsFix,
      },
    },
    defaultProfile: filteredIdentifierFix[0].id,
    recentProfiles: [],
    multiSigGroup: undefined,
    connectedDApp: null,
    pendingDAppConnection: null,
    isConnectingToDApp: false,
    showDAppConnect: false,
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
};
let mockedStore: Store<unknown, AnyAction>;
const dispatchMock = jest.fn();

describe("Card switch view list Tab", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("Renders switch view: cred", async () => {
    const { getByText, getByTestId, getAllByText } = render(
      <Provider store={mockedStore}>
        <SwitchCardView
          cardsData={filteredCredsFix}
          title="title"
          name="allidentifiers"
        />
      </Provider>
    );

    expect(getByText("title")).toBeInTheDocument();

    await waitFor(() => {
      expect(getByTestId("card-stack")).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("list-header-second-icon"));
    });

    expect(getByTestId("card-list")).toBeInTheDocument();

    expect(getAllByText(connectionsFix[0].label)[0]).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("card-item-" + filteredCredsFix[0].id));
    });

    await waitFor(() => {
      expect(historyPushMock).toBeCalledWith({
        pathname: `${TabsRoutePath.CREDENTIALS}/${filteredCredsFix[0].id}`,
      });
    });

    act(() => {
      fireEvent.click(getByTestId("list-header-first-icon"));
    });

    await waitFor(() => {
      expect(getByTestId("card-stack")).toBeInTheDocument();
    });
  });

  test("Render unknown text when the issuer is missing", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
      },
      profilesCache: {
        profiles: {
          [filteredIdentifierFix[0].id]: {
            identity: filteredIdentifierFix[0],
            connections: [],
          },
        },
        defaultProfile: filteredIdentifierFix[0].id,
        recentProfiles: [],
        multiSigGroup: undefined,
        connectedDApp: null,
        pendingDAppConnection: null,
        isConnectingToDApp: false,
        showDAppConnect: false,
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
    };

    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId, getAllByText } = render(
      <Provider store={mockedStore}>
        <SwitchCardView
          cardsData={filteredCredsFix}
          title="title"
          name="allidentifiers"
        />
      </Provider>
    );

    expect(getByText("title")).toBeInTheDocument();

    await waitFor(() => {
      expect(getByTestId("card-stack")).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("list-header-second-icon"));
    });

    expect(getByTestId("card-list")).toBeInTheDocument();

    expect(getAllByText(ENG_trans.tabs.connections.unknown)[0]).toBeVisible();
  });
});
