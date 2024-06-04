import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { identifierFix } from "../../../../__fixtures__/identifierFix";
import { walletConnectionsFix } from "../../../../__fixtures__/walletConnectionsFix";
import { ToastMsgType } from "../../../../globals/types";
import { ConfirmConnectModal } from "./ConfirmConnectModal";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen }: any) => (
    <div
      style={{ display: isOpen ? "block" : "none" }}
      data-testid="add-connection-modal"
    >
      {children}
    </div>
  ),
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();
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
  identifiersCache: {
    identifiers: [...identifierFix],
  },
};

const storeMocked = {
  ...mockStore(initialState),
  dispatch: dispatchMock,
};

describe("Confirm connect modal", () => {
  test("Confirm connect modal render", async () => {
    const closeFn = jest.fn();
    const confirmFn = jest.fn();
    const deleteFn = jest.fn();

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConfirmConnectModal
          openModal={true}
          closeModal={closeFn}
          onConfirm={confirmFn}
          onDeleteConnection={deleteFn}
          connectionData={{
            ...walletConnectionsFix[0],
            iconB64: "imagelink",
          }}
          isConnectModal={true}
        />
      </Provider>
    );

    expect(getByTestId("wallet-connection-logo")).toBeVisible();

    expect(getByText(walletConnectionsFix[0].name as string)).toBeVisible();
    expect(
      getByText(walletConnectionsFix[0].selectedAid as string)
    ).toBeVisible();

    const ellipsisLink =
      (walletConnectionsFix[0].url as string).substring(0, 5) +
      "..." +
      (walletConnectionsFix[0].url as string).slice(-5);

    expect(getByText(ellipsisLink)).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("connection-id"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD)
      );
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    expect(deleteFn).toBeCalled();

    act(() => {
      fireEvent.click(getByTestId("confirm-connect-btn"));
    });

    expect(confirmFn).toBeCalled();
  });
  test("Confirm connect modal render: display fallback logo", async () => {
    const closeFn = jest.fn();
    const confirmFn = jest.fn();
    const deleteFn = jest.fn();

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConfirmConnectModal
          openModal={true}
          closeModal={closeFn}
          onConfirm={confirmFn}
          onDeleteConnection={deleteFn}
          connectionData={{
            ...walletConnectionsFix[0],
            iconB64: undefined,
          }}
          isConnectModal={false}
        />
      </Provider>
    );

    expect(getByTestId("wallet-connection-fallback-logo")).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.menu.tab.items.connectwallet.connectionhistory
          .confirmconnect.disconnectbtn
      )
    ).toBeVisible();
  });

  test("Confirm connect modal render: has no data", async () => {
    const closeFn = jest.fn();
    const confirmFn = jest.fn();
    const deleteFn = jest.fn();

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConfirmConnectModal
          openModal={true}
          closeModal={closeFn}
          onConfirm={confirmFn}
          onDeleteConnection={deleteFn}
          isConnectModal={false}
        />
      </Provider>
    );

    expect(getByTestId("wallet-connection-fallback-logo")).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.menu.tab.items.connectwallet.connectionhistory
          .confirmconnect.disconnectbtn
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("connection-id"));
    });

    await waitFor(() => {
      expect(dispatchMock).not.toBeCalled();
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    expect(deleteFn).not.toBeCalled();
  });
});
