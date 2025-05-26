import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { OobiType } from "../../../core/agent/agent.types";
import { TabsRoutePath } from "../../../routes/paths";
import { showConnections } from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { OperationType } from "../../globals/types";
import { Scan } from "./Scan";
import { StorageMessage } from "../../../core/storage/storage.types";

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
              "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=72e2f089cef6",
            format: BarcodeFormat.QrCode,
            rawValue:
              "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/agent/string2?groupId=72e2f089cef6",
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

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => true,
    },
  };
});

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: jest.fn(),
  },
}));

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "",
  })),
}));

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
jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
}));

const connectByOobiUrlMock = jest.fn();
const getMultisigLinkedContactsMock = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        connectByOobiUrl: () => connectByOobiUrlMock(),
        getMultisigLinkedContacts: (args: unknown) =>
          getMultisigLinkedContactsMock(args),
      },
    },
  },
}));

const historyPushMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: (args: unknown) => {
      historyPushMock(args);
    },
    location: {
      pathname: TabsRoutePath.SCAN,
    },
  }),
}));

describe("Scan Tab", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();

  test("Renders Scan Tab", async () => {
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
      identifiersCache: {
        identifiers: {},
        scanGroupId: "72e2f089cef6",
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Scan />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("qr-code-scanner").classList.contains("no-permission")
      ).toBeFalsy();
    });

    expect(getByTestId("scan-tab")).toBeInTheDocument();
  });

  test("Reset after scan", async () => {
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
      identifiersCache: {
        identifiers: {},
        scanGroupId: "72e2f089cef6",
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    connectByOobiUrlMock.mockImplementation(() => {
      return {
        type: OobiType.NORMAL,
        connection: connectionsFix[0],
      };
    });

    const { unmount } = render(
      <Provider store={storeMocked}>
        <Scan />
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showConnections(true));
    });

    unmount();
  });

  test("Nav to identifier after scan duplicate multisig", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.SCAN, TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        currentOperation: OperationType.IDLE,
        toastMsgs: [],
      },
      identifiersCache: {
        identifiers: {},
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    connectByOobiUrlMock.mockImplementation(() => {
      return Promise.reject(
        new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
      );
    });

    render(
      <Provider store={storeMocked}>
        <Scan />
      </Provider>
    );

    await waitFor(() => {
      expect(historyPushMock).toBeCalledWith({
        pathname: TabsRoutePath.IDENTIFIERS,
      });
    });
  });
});
