import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { ConnectionOptions } from "./ConnectionOptions";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: never }) => children,
}));

const dispatchMock = jest.fn();

describe("Connection Options modal", () => {
  let mockedStore: Store<unknown, AnyAction>;
  beforeEach(() => {
    jest.resetAllMocks();
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
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("Connection options modal", async () => {
    const setCredOptionsIsOpen = jest.fn();
    const optionDeleteMock = jest.fn();
    const editNotesMock = jest.fn();

    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <ConnectionOptions
          optionsIsOpen={true}
          setOptionsIsOpen={setCredOptionsIsOpen}
          handleDelete={optionDeleteMock}
          handleEdit={editNotesMock}
        />
      </Provider>
    );

    expect(getByTestId("connection-options-manage-button")).toBeVisible();
    expect(getByTestId("delete-button-connection-options")).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("connection-options-manage-button"));
    });

    expect(editNotesMock).toBeCalledTimes(1);
    expect(setCredOptionsIsOpen).toBeCalledTimes(1);

    act(() => {
      fireEvent.click(getByTestId("delete-button-connection-options"));
    });

    expect(optionDeleteMock).toBeCalledTimes(1);
  });

  test("can exclude restricted options in certain flows", async () => {
    const { queryByTestId } = render(
      <Provider store={mockedStore}>
        <ConnectionOptions
          optionsIsOpen={true}
          setOptionsIsOpen={jest.fn()}
          handleDelete={jest.fn()}
          handleEdit={jest.fn()}
          restrictedOptions={true}
        />
      </Provider>
    );

    await waitFor(() =>
      expect(
        queryByTestId("connection-options-manage-button")
      ).toBeInTheDocument()
    );
    expect(
      queryByTestId("delete-button-connection-options")
    ).not.toBeInTheDocument();
  });
});
