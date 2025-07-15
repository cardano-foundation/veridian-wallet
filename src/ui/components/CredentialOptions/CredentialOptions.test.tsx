import { ionFireEvent, waitForIonicReact } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CredentialOptions } from "./CredentialOptions";
import { makeTestStore } from "../../utils/makeTestStore";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

const dispatchMock = jest.fn();

describe("Credential Options modal", () => {
  let mockedStore: Store<unknown, AnyAction>;
  beforeEach(() => {
    jest.resetAllMocks();
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
    };
    mockedStore = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };
  });

  test("should display the modal", async () => {
    const setCredOptionsIsOpen = jest.fn();
    const optionDeleteMock = jest.fn();

    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <CredentialOptions
          optionsIsOpen={true}
          setOptionsIsOpen={setCredOptionsIsOpen}
          credsOptionAction={optionDeleteMock}
        />
      </Provider>
    );

    await waitForIonicReact();

    expect(getByTestId("creds-options-archive-button")).toBeVisible();
  });

  test("Click on archived option", async () => {
    const setCredOptionsIsOpen = jest.fn();
    const optionArchivedMock = jest.fn();

    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <CredentialOptions
          optionsIsOpen={true}
          setOptionsIsOpen={setCredOptionsIsOpen}
          credsOptionAction={optionArchivedMock}
        />
      </Provider>
    );

    await waitForIonicReact();

    expect(getByTestId("creds-options-archive-button")).toBeVisible();

    act(() => {
      ionFireEvent.click(getByTestId("creds-options-archive-button"));
    });

    await waitFor(() => {
      expect(optionArchivedMock).toBeCalledTimes(1);
      expect(setCredOptionsIsOpen).toBeCalledTimes(1);
    });
  });
});
