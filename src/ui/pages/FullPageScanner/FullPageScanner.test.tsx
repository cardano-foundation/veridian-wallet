import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
  LensFacing,
} from "@capacitor-mlkit/barcode-scanning";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";

import { OobiType } from "../../../core/agent/agent.types";
import { TabsRoutePath } from "../../../routes/paths";
import {
  setCameraDirection,
  setCurrentOperation,
} from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { OperationType } from "../../globals/types";
import { FullPageScanner } from "./FullPageScanner";
import { makeTestStore } from "../../utils/makeTestStore";

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

const addListener = jest.fn(
  (eventName: string, listenerFunc: (result: BarcodesScannedEvent) => void) => {
    setTimeout(() => {
      listenerFunc({
        barcodes: [
          {
            displayValue:
              "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
            format: BarcodeFormat.QrCode,
            rawValue:
              "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
            valueType: BarcodeValueType.Url,
          },
        ],
      });
    }, 100);

    return {
      remove: jest.fn(),
    };
  }
);

jest.mock("@capacitor-mlkit/barcode-scanning", () => {
  return {
    ...jest.requireActual("@capacitor-mlkit/barcode-scanning"),
    BarcodeScanner: {
      checkPermissions: () =>
        Promise.resolve({
          camera: "granted",
        }),
      addListener: (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => addListener(eventName, listenerFunc),
      startScan: jest.fn(),
      stopScan: jest.fn(),
      removeAllListeners: jest.fn(),
    },
  };
});

const isNativeMock = jest.fn();
jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativeMock(),
    },
  };
});

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
}));

const addKeyboardEventMock = jest.fn();

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: (...params: unknown[]) => addKeyboardEventMock(...params),
  },
}));

const connectByOobiUrlMock = jest.fn();
const getMultisigLinkedContactsMock = jest.fn();
const createOrUpdateBasicRecordMock = jest.fn(() => Promise.resolve());
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        connectByOobiUrl: () => connectByOobiUrlMock(),
        getMultisigLinkedContacts: (args: never) =>
          getMultisigLinkedContactsMock(args),
      },
      basicStorage: {
        createOrUpdateBasicRecord: () => createOrUpdateBasicRecordMock(),
      },
    },
  },
}));

const barcodes = [
  {
    displayValue:
      "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
    format: BarcodeFormat.QrCode,
    rawValue:
      "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
    valueType: BarcodeValueType.Url,
  },
];

describe("Full page scanner", () => {
  beforeEach(() => {
    isNativeMock.mockImplementation(() => false);
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes,
          });
        }, 100);

        return {
          remove: jest.fn(),
        };
      }
    );
  });

  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.SCAN],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
      currentOperation: OperationType.SCAN_WALLET_CONNECTION,
      toastMsgs: [],
    },
    connectionsCache: {
      connections: {},
      multisigConnections: {},
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Renders content", async () => {
    isNativeMock.mockImplementation(() => true);
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <FullPageScanner
          showScan={true}
          setShowScan={jest.fn()}
        />
      </Provider>
    );

    expect(getByTestId("qr-code-scanner")).toBeVisible();
    expect(getByTestId("scanner-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(getByTestId("qr-code-scanner")).toBeVisible();
      expect(getByTestId("secondary-button")).toBeVisible();
    });
  });

  test("Reset after scan", async () => {
    isNativeMock.mockImplementation(() => true);

    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.SCAN],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        currentOperation: OperationType.MULTI_SIG_RECEIVER_SCAN,
        toastMsgs: [],
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    connectByOobiUrlMock.mockImplementation(() => {
      return {
        type: OobiType.NORMAL,
      };
    });

    getMultisigLinkedContactsMock.mockReturnValue([connectionsFix[0]]);

    const setShowScanMock = jest.fn();

    render(
      <Provider store={storeMocked}>
        <FullPageScanner
          showScan={true}
          setShowScan={setShowScanMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(setShowScanMock).toBeCalled();
    });
  });

  test("Change direction", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.SCAN],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        currentOperation: OperationType.MULTI_SIG_RECEIVER_SCAN,
        toastMsgs: [],
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes: [
              {
                displayValue:
                  "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
                format: BarcodeFormat.QrCode,
                rawValue:
                  "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi?groupId=72e2f089cef6",
                valueType: BarcodeValueType.Url,
              },
            ],
          });
        }, 10000000);

        return {
          remove: jest.fn(),
        };
      }
    );

    isNativeMock.mockImplementation(() => true);

    const setShowScanMock = jest.fn();

    const { getByTestId, unmount } = render(
      <Provider store={storeMocked}>
        <FullPageScanner
          showScan={true}
          setShowScan={setShowScanMock}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("qr-code-scanner").classList.contains("no-permission")
      ).toBeFalsy();
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    await waitFor(() => {
      expect(createOrUpdateBasicRecordMock).toBeCalled();
      expect(dispatchMock).toBeCalledWith(setCameraDirection(LensFacing.Front));
    });

    unmount();
  });

  test("Close scan screen", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.SCAN],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        currentOperation: OperationType.MULTI_SIG_RECEIVER_SCAN,
        toastMsgs: [],
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    connectByOobiUrlMock.mockImplementation(() => {
      return {
        type: OobiType.NORMAL,
      };
    });

    getMultisigLinkedContactsMock.mockReturnValue([connectionsFix[0]]);

    const setShowScanMock = jest.fn();

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <FullPageScanner
          showScan={true}
          setShowScan={setShowScanMock}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("close-button"));
    });

    await waitFor(() => {
      expect(setShowScanMock).toBeCalled();
      expect(dispatchMock).toBeCalledWith(
        setCurrentOperation(OperationType.IDLE)
      );
    });
  });
});
