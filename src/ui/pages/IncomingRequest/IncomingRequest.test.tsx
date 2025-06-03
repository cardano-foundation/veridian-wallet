const verifySecretMock = jest.fn().mockResolvedValue(true);

import { mockIonicReact, waitForIonicReact } from "@ionic/react-test-utils";
import { act } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { KeyStoreKeys } from "../../../core/storage";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { dequeueIncomingRequest } from "../../../store/reducers/stateCache";
import { IncomingRequestType } from "../../../store/reducers/stateCache/stateCache.types";
import {
  signObjectFix,
  signTransactionFix,
} from "../../__fixtures__/signTransactionFix";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { IncomingRequest } from "./IncomingRequest";
mockIonicReact();

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
    routes: [TabsRoutePath.IDENTIFIERS],
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
  biometricsCache: {
    enabled: false,
  },
};

describe("Sign request", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("It renders content for BALLOT_TRANSACTION_REQUEST ", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    await waitForIonicReact();

    expect(getByText(requestData.peerConnection?.name)).toBeVisible();
    expect(
      getByText(requestData.signTransaction.payload.payload)
    ).toBeVisible();
    expect(
      getByText(requestData.signTransaction.payload.identifier)
    ).toBeVisible();
  });

  test("Display fallback image when provider logo is empty: BALLOT_TRANSACTION_REQUEST", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        queueIncomingRequest: {
          isProcessing: true,
          queues: [
            {
              ...requestData,
              peerConnection: { id: "id", name: "DApp", iconB64: "" },
            },
          ],
          isPaused: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(getByTestId("sign-logo")).toBeInTheDocument();

    expect(getByTestId("sign-logo").getAttribute("src")).not.toBe(undefined);
  });

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

  test("Render JSON object", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        queueIncomingRequest: {
          isProcessing: true,
          queues: [
            {
              ...requestData,
              signTransaction: signObjectFix,
            },
          ],
          isPaused: false,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <IncomingRequest
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(getByText(requestData.peerConnection?.name)).toBeVisible();
    expect(
      getByText(JSON.parse(signObjectFix.payload.payload).data.id)
    ).toBeVisible();
  });

  test("Incoming request is empty", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
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
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
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
