jest.mock("../../../utils/clipboard", () => ({
  writeToClipboard: jest.fn(),
}));
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { render, waitFor } from "@testing-library/react";
import { SignRequest } from "./SignRequest";
import { writeToClipboard } from "../../../utils/clipboard";
import {
  signObjectFix,
  signTransactionFix,
} from "../../../__fixtures__/signTransactionFix";
import { IncomingRequestType } from "../../../../store/reducers/stateCache/stateCache.types";
import { initialState } from "../../../../store/reducers/stateCache/stateCache";
import { makeTestStore } from "../../../utils/makeTestStore";
jest.mock("../../../components/Verification", () => ({
  Verification: ({ onVerify }: any) => {
    if (onVerify) onVerify();
    return <div data-testid="verify-passcode" />;
  },
}));

global.ResizeObserver = class {
  observe() {
    jest.fn();
  }
  unobserve() {
    jest.fn();
  }
  disconnect() {
    jest.fn();
  }
};

const store = { ...makeTestStore(initialState), dispatch: jest.fn() };

const baseRequestData = {
  pageId: "test-page",
  activeStatus: true,
  initiateAnimation: false,
  handleAccept: jest.fn(),
  handleCancel: jest.fn(),
  requestData: {
    id: "abc123456",
    label: "Cardano",
    type: IncomingRequestType.PEER_CONNECT_SIGN,
    signTransaction: {
      ...signTransactionFix,
      payload: {
        ...signTransactionFix.payload,
        approvalCallback: jest.fn(),
      },
    },
    peerConnection: {
      meerkatId: "meerkat-1",
      selectedAid: "aid-1",
      id: "id",
      name: "DApp",
      iconB64: "mock-icon",
      url: "https://dapp.example",
    },
  },
};

describe("SignRequest component", () => {
  test("copy button copies identifier", async () => {
    (writeToClipboard as jest.Mock).mockClear();
    const identifier = signTransactionFix.payload.identifier;
    const testRequestData = {
      ...baseRequestData,
      requestData: {
        ...baseRequestData.requestData,
        signTransaction: {
          ...baseRequestData.requestData.signTransaction,
          payload: {
            ...baseRequestData.requestData.signTransaction.payload,
            identifier,
          },
        },
      },
    };
    const { findByTestId } = render(
      <Provider store={store}>
        <SignRequest {...testRequestData} />
      </Provider>
    );
    const copyButton = await findByTestId("identifier-copy-button");
    expect(copyButton).toBeEnabled();
    await userEvent.click(copyButton);
    expect(writeToClipboard).toHaveBeenCalledWith(identifier);
  });

  test("expand/collapse button appears for large content", async () => {
    const originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = jest.fn().mockImplementation((cb: () => void) => ({
      observe: jest.fn((el: Element) => {
        Object.defineProperty(el, "clientHeight", {
          value: 200,
          configurable: true,
        });
        cb();
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as unknown as typeof ResizeObserver;

    const largePayload = JSON.stringify({ foo: "a".repeat(500) });
    const requestData = {
      ...baseRequestData,
      requestData: {
        ...baseRequestData.requestData,
        signTransaction: {
          ...signTransactionFix,
          payload: {
            ...signTransactionFix.payload,
            payload: largePayload,
            approvalCallback: jest.fn(),
          },
        },
      },
    };
    const { container } = render(
      <Provider store={store}>
        <SignRequest {...requestData} />
      </Provider>
    );
    await waitFor(() => {
      expect(
        container.querySelector('[data-testid="expand-footer"]')
      ).toBeInTheDocument();
    });

    global.ResizeObserver = originalResizeObserver;
  });

  test("renders string payload", () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <SignRequest {...baseRequestData} />
      </Provider>
    );
    expect(getByText("DApp")).toBeVisible();
    expect(getByTestId("sign-logo")).toBeInTheDocument();
    expect(getByText(signTransactionFix.payload.payload)).toBeVisible();
  });

  test("displays fallback image when iconB64 is empty", () => {
    const requestData = {
      ...baseRequestData,
      requestData: {
        ...baseRequestData.requestData,
        peerConnection: {
          ...baseRequestData.requestData.peerConnection,
          iconB64: "",
        },
      },
    };
    const { getByTestId } = render(
      <Provider store={store}>
        <SignRequest {...requestData} />
      </Provider>
    );
    expect(getByTestId("sign-logo")).toBeInTheDocument();
    expect(getByTestId("sign-logo").getAttribute("src")).not.toBe(undefined);
  });

  test("renders JSON payload", () => {
    const requestData = {
      ...baseRequestData,
      requestData: {
        ...baseRequestData.requestData,
        signTransaction: {
          ...signObjectFix,
          payload: {
            ...signObjectFix.payload,
            approvalCallback: jest.fn(),
          },
        },
      },
    };
    const { getByText } = render(
      <Provider store={store}>
        <SignRequest {...requestData} />
      </Provider>
    );
    expect(
      getByText(JSON.parse(signObjectFix.payload.payload).data.id)
    ).toBeVisible();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
