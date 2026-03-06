const verifySecretMock = jest.fn().mockResolvedValue(true);

import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import {
  dequeueIncomingRequest,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { IncomingRequestType } from "../../../store/reducers/stateCache/stateCache.types";
import { signTransactionFix } from "../../__fixtures__/signTransactionFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { ToastMsgType } from "../../globals/types";
import { IncomingRequest } from "./IncomingRequest";

const mockApprovalCallback = jest.fn((status: boolean) => status);

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  IonModal: ({ children, isOpen, ...props }: any) => {
    const testId = props["data-testid"];

    if (!isOpen) {
      return null;
    }

    return <div data-testid={testId}>{children}</div>;
  },
}));

const requestData = {
  id: "abc123456",
  label: "Cardano",
  type: IncomingRequestType.PEER_CONNECT_SIGN,
  signTransaction: {
    ...signTransactionFix,
    payload: {
      ...signTransactionFix.payload,
      approvalCallback: (status: boolean) => mockApprovalCallback(status),
    },
  },
  peerConnection: { id: "id", name: "DApp", iconB64: "mock-icon" },
};

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
    },
    queueIncomingRequest: {
      isProcessing: true,
      queues: [requestData],
      isPaused: false,
    },
  },
  profilesCache: {
    ...profileCacheFixData,
    pendingConnection: null,
  },
  biometricsCache: {
    enabled: false,
  },
};

describe("Sign request", () => {
  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

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

  test("Cancel request", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.request.button.dontallow)
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.request.button.dontallow));
    });

    await waitFor(() => {
      expect(mockApprovalCallback).toBeCalledWith(false);
    });
  });

  test("Accept request", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(getByTestId("primary-button")).toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(mockApprovalCallback).toBeCalledWith(true);
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(dequeueIncomingRequest());
    });
  });

  test("dispatches SIGN_SUCCESSFUL toast after animation delay", async () => {
    jest.useFakeTimers();

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(mockApprovalCallback).toBeCalledWith(true);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      setToastMsg(ToastMsgType.SIGN_SUCCESSFUL)
    );

    jest.useRealTimers();
  });

  test("handles error when approvalCallback throws", async () => {
    const throwingState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: initialState.stateCache.authentication,
        queueIncomingRequest: {
          isProcessing: true,
          queues: [
            {
              ...requestData,
              signTransaction: {
                ...signTransactionFix,
                payload: {
                  ...signTransactionFix.payload,
                  approvalCallback: jest.fn().mockImplementation(() => {
                    throw new Error("sign error");
                  }),
                },
              },
            },
          ],
          isPaused: false,
        },
      },
      profilesCache: { ...profileCacheFixData, pendingConnection: null },
      biometricsCache: { enabled: false },
    };
    const errorStore = {
      ...makeTestStore(throwingState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={errorStore}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith(
        setToastMsg(ToastMsgType.SIGN_ERROR)
      );
    });
  });

  test("Incoming request is empty", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        queueIncomingRequest: {
          isProcessing: true,
          queues: [],
          isPaused: false,
        },
      },
      profilesCache: {
        ...profileCacheFixData,
        pendingConnection: null,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { queryByText } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(queryByText(requestData.peerConnection?.name)).toBeNull();
  });
});
