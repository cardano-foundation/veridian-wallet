import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { ToastMsgType } from "../../globals/types";
import { CustomToast } from "./CustomToast";
import { ToastStack } from "./ToastStack";
import { makeTestStore } from "../../utils/makeTestStore";

describe("Custom toast", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        userName: "Test",
        time: Date.now(),
        passcodeIsSet: true,
      },
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("It renders generic message successfully", async () => {
    const toastMsg = {
      id: "1",
      message: ToastMsgType.COPIED_TO_CLIPBOARD,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CustomToast
          toastMsg={toastMsg}
          index={0}
        />
      </Provider>
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "message",
      EN_TRANSLATIONS.toast.copiedtoclipboard
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "color",
      "secondary"
    );
  });

  test("It renders message with user name successfully", async () => {
    const toastMsg = {
      id: "1",
      message: ToastMsgType.USERNAME_CREATION_SUCCESS,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CustomToast
          toastMsg={toastMsg}
          index={0}
        />
      </Provider>
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "message",
      "Welcome, Test!"
    );
  });

  test("It renders error message successfully", async () => {
    const toastMsg = {
      id: "1",
      message: ToastMsgType.USERNAME_CREATION_ERROR,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CustomToast
          toastMsg={toastMsg}
          index={0}
        />
      </Provider>
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "message",
      EN_TRANSLATIONS.toast.usernamecreationerror
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "color",
      "danger"
    );
  });
});

describe("Toast stack", () => {
  const dispatchMock = jest.fn();
  const initialState = {
    stateCache: {
      routes: ["/"],
      authentication: {
        loggedIn: true,
        userName: "Test",
        time: Date.now(),
        passcodeIsSet: true,
      },
      toastMsgs: [
        {
          id: "1",
          message: ToastMsgType.COPIED_TO_CLIPBOARD,
        },
        {
          id: "2",
          message: ToastMsgType.UNABLE_CONNECT_WALLET,
        },
      ],
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Render ", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ToastStack />
      </Provider>
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "message",
      EN_TRANSLATIONS.toast.copiedtoclipboard
    );
    expect(getByTestId("confirmation-toast-1")).toHaveAttribute(
      "color",
      "secondary"
    );
    expect(getByTestId("confirmation-toast-2")).toHaveAttribute(
      "message",
      EN_TRANSLATIONS.toast.unableconnectwalleterror
    );
    expect(getByTestId("confirmation-toast-2")).toHaveAttribute(
      "color",
      "danger"
    );
  });
});
