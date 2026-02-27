import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import TRANSLATIONS from "../../../locales/en/en.json";
import { RoutePath } from "../../../routes";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
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
    const { getByText, queryByText } = render(
      <MemoryRouter initialEntries={[RoutePath.PROFILE_SETUP]}>
        <Provider store={mockedStore}>
          <NoWitnessAlert />
        </Provider>
      </MemoryRouter>
    );

    expect(getByText(TRANSLATIONS.nowitnesserror.title)).toBeVisible();
    expect(getByText(TRANSLATIONS.nowitnesserror.description)).toBeVisible();
    expect(getByText(TRANSLATIONS.nowitnesserror.button)).toBeVisible();
    expect(queryByText(TRANSLATIONS.nowitnesserror.close)).toBeNull();

    act(() => {
      fireEvent.click(getByText(TRANSLATIONS.nowitnesserror.button));
    });

    await waitFor(() => {
      expect(getAvailableWitnessesMock).toBeCalledWith();
    });
  });

  test("Show close button when missing witness outside onboarding", async () => {
    const { getByText, queryByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.HOME]}>
        <Provider store={mockedStore}>
          <NoWitnessAlert />
        </Provider>
      </MemoryRouter>
    );

    expect(getByText(TRANSLATIONS.nowitnesserror.close)).toBeVisible();
  });
});
