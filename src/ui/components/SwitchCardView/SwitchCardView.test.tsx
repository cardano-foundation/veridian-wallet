import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { CardType } from "../../globals/types";
import { SwitchCardView } from "./SwitchCardView";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { connectionsMapFix } from "../../__fixtures__/connectionsFix";
import { makeTestStore } from "../../utils/makeTestStore";

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
  connectionsCache: {
    connections: connectionsMapFix,
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

  test("Renders switch view: identifier", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <SwitchCardView
          cardTypes={CardType.IDENTIFIERS}
          cardsData={identifierFix}
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

    act(() => {
      fireEvent.click(getByTestId("card-item-" + identifierFix[0].id));
    });

    await waitFor(() => {
      expect(historyPushMock).toBeCalledWith({
        pathname: `/tabs/identifiers/${identifierFix[0].id}`,
      });
    });
  });

  test("Renders switch view: cred", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <SwitchCardView
          cardTypes={CardType.CREDENTIALS}
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
});
