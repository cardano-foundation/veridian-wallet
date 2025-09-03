import { setupIonicReact } from "@ionic/react";
import { mockIonicReact, waitForIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act, ReactNode } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { IdentifierSelectorModal } from "./IdentifierSelectorModal";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";

setupIonicReact();
mockIonicReact();

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen }: { children: ReactNode; isOpen: true }) => (
    <div style={{ display: isOpen ? "block" : "none" }}>{children}</div>
  ),
}));

describe("Identifier Selector Modal", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.CREDENTIALS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
    profilesCache: {
      ...profileCacheFixData,
      connectedDApp: null,
      pendingDAppConnection: null,
      isConnectingToDApp: false,
      showDAppConnect: false,
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  const setOpenMock = jest.fn();
  const submitMock = jest.fn();

  test("Renders content ", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IdentifierSelectorModal
          open={true}
          setOpen={setOpenMock}
          onSubmit={submitMock}
        />
      </Provider>
    );

    await waitForIonicReact();

    expect(
      getByText(EN_TRANSLATIONS.tabs.connections.tab.indentifierselector.title)
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.connections.tab.indentifierselector.message
      )
    ).toBeVisible();

    expect(
      getByTestId(`card-item-${filteredIdentifierFix[1].id}`)
    ).toBeVisible();

    expect(getByTestId("primary-button")).toBeVisible();

    expect(getByTestId("primary-button")).toBeDisabled();
  });

  test("Click to confirm button", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <IdentifierSelectorModal
          open={true}
          setOpen={setOpenMock}
          onSubmit={submitMock}
        />
      </Provider>
    );

    await waitForIonicReact();

    expect(
      getByTestId("identifier-select-" + filteredIdentifierFix[1].id)
    ).toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId("identifier-select-" + filteredIdentifierFix[1].id)
      );
    });

    await waitFor(() => {
      expect(getByTestId("primary-button").getAttribute("disabled")).toBe(
        "false"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(submitMock).toBeCalled();
    });
  });
});
