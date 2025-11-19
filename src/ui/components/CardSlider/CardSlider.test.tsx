import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CardSlider } from "./CardSlider";

const historyPushMock = jest.fn();
const createOrUpdateBasicRecordMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: () => createOrUpdateBasicRecordMock(),
      },
    },
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    ...jest.requireActual("react-router-dom").useHistory,
    push: (params: unknown) => historyPushMock(params),
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

describe("Card slider", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("Render credentials", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <CardSlider
          cardsData={filteredCredsFix}
          title="title"
          name="allcredential"
        />
      </Provider>
    );

    expect(getByText("title")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        getByTestId(`card-slide-container-${filteredCredsFix[0].id}`)
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("slide-pagination-0"));
      fireEvent.click(getByTestId("keri-card-template-allcredential-index-0"));
    });

    await waitFor(() => {
      expect(historyPushMock).toBeCalled();
    });
  });
});
