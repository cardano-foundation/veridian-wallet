import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Store, AnyAction } from "@reduxjs/toolkit";
import { act } from "react-dom/test-utils";
import { ionFireEvent, waitForIonicReact } from "@ionic/react-test-utils";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CredentialOptions } from "./CredentialOptions";
import { credsFixAcdc } from "../../__fixtures__/credsFix";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children }: { children: any }) => children,
}));

// Temporary test for grant present ACDC
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: credsFixAcdc[0].id,
  }),
}));

const dispatchMock = jest.fn();

describe("Credential Options modal", () => {
  let mockedStore: Store<unknown, AnyAction>;
  beforeEach(() => {
    jest.resetAllMocks();
    const mockStore = configureStore();
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
      ...mockStore(initialState),
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
