import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import TRANSLATIONS from "../../../locales/en/en.json";
import { showGenericError } from "../../../store/reducers/stateCache";
import { makeTestStore } from "../../utils/makeTestStore";
import { NoWitnessAlert } from "./NoWitnessAlert";

const getAvailableWitnessesMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      identifiers: {
        getAvailableWitnesses: () => getAvailableWitnessesMock(),
      },
    },
  },
}));

const dispatchMock = jest.fn();
describe("No witness alert", () => {
  let mockedStore: Store<unknown, AnyAction>;

  beforeEach(() => {
    jest.resetAllMocks();
    const initialState = {
      stateCache: {
        showNoWitnessAlert: true,
      },
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("Show witness alert and retry", async () => {
    const { getByText } = render(
      <Provider store={mockedStore}>
        <NoWitnessAlert />
      </Provider>
    );

    expect(getByText(TRANSLATIONS.nowitnesserror.title)).toBeVisible();
    expect(getByText(TRANSLATIONS.nowitnesserror.description)).toBeVisible();
    expect(getByText(TRANSLATIONS.nowitnesserror.button)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(TRANSLATIONS.nowitnesserror.button));
    });

    await waitFor(() => {
      expect(getAvailableWitnessesMock).toBeCalledWith();
    });
  });
});
