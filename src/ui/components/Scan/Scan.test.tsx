import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput } from "@ionic/react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_Translation from "../../../locales/en/en.json";
import { makeTestStore } from "../../utils/makeTestStore";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { Scan } from "./Scan";
import { logout } from "../../../store/reducers/stateCache";

const getPlatformMock = jest.fn(() => ["mobile"]);

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  getPlatforms: () => getPlatformMock(),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const isNativePlatformMock = jest.fn(() => true);

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativePlatformMock(),
    },
  };
});

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

const addListener = jest.fn(
  (eventName: string, listenerFunc: (result: BarcodesScannedEvent) => void) => {
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

const checkPermisson = jest.fn(() =>
  Promise.resolve({
    camera: "granted",
  })
);

const requestPermission = jest.fn();
const startScan = jest.fn();
const stopScan = jest.fn();
jest.mock("@capacitor-mlkit/barcode-scanning", () => {
  return {
    ...jest.requireActual("@capacitor-mlkit/barcode-scanning"),
    BarcodeScanner: {
      checkPermissions: () => checkPermisson(),
      requestPermissions: () => requestPermission(),
      addListener: (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => addListener(eventName, listenerFunc),
      startScan: () => startScan(),
      stopScan: () => stopScan(),
      removeAllListeners: jest.fn(),
    },
  };
});

jest.mock("../CustomInput", () => ({
  CustomInput: (props: CustomInputProps) => {
    return (
      <IonInput
        data-testid={props.dataTestId}
        value={props.value}
        onIonInput={(e) => {
          props.onChangeInput(e.detail.value as string);
        }}
      />
    );
  },
}));

describe("Scan", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.CONNECTIONS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
  };

  const storeMocked = makeTestStore(initialState);

  const onFinishScan = jest.fn();

  beforeEach(() => {
    checkPermisson.mockImplementation(() =>
      Promise.resolve({
        camera: "granted",
      })
    );

    getPlatformMock.mockClear();

    isNativePlatformMock.mockImplementation(() => true);

    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes,
          });
        }, 10000);

        return {
          remove: jest.fn(),
        };
      }
    );
  });

  test("Renders spinner", async () => {
    const { getByTestId, unmount } = render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    expect(getByTestId("scan")).toBeVisible();
    expect(getByTestId("scan-spinner-container")).toBeVisible();

    unmount();
  });

  test("Use input modal to scan", async () => {
    getPlatformMock.mockImplementation(() => ["mobileweb"]);

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
      expect(getByTestId("paste-content-button")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("paste-content-button"));
    });

    await waitFor(() => {
      expect(getByTestId("scan-input")).toBeVisible();
    });

    act(() => {
      const input = getByTestId("scan-input");
      const event = new CustomEvent("ionInput", {
        detail: { value: "bd54hj38aK2sGhE5K9mPqR79Jkd4b23hJf5sL36nHk" },
      });
      fireEvent(input, event);
    });

    await waitFor(() => {
      expect(getByTestId("action-button").getAttribute("disabled")).toBe(
        "false"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    await waitFor(() => {
      expect(onFinishScan).toBeCalledWith(
        "bd54hj38aK2sGhE5K9mPqR79Jkd4b23hJf5sL36nHk"
      );
    });
  });

  test("Scan success", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
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

    render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(onFinishScan).toBeCalledWith(barcodes[0].rawValue);
    });
  });

  test("Scan failed because result data is empty", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes: [],
          });
        }, 100);

        return {
          remove: jest.fn(),
        };
      }
    );

    render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(onFinishScan).not.toBeCalled();
    });
  });

  test("Request permission: prompt", async () => {
    checkPermisson.mockImplementation(() =>
      Promise.resolve({
        camera: "prompt",
      })
    );

    requestPermission.mockImplementation(() =>
      Promise.resolve({
        camera: "granted",
      })
    );

    render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(requestPermission).toBeCalled();
    });
  });

  test("Request permission: prompt-with-rationale", async () => {
    checkPermisson.mockImplementation(() =>
      Promise.resolve({
        camera: "prompt-with-rationale",
      })
    );

    requestPermission.mockImplementation(() =>
      Promise.resolve({
        camera: "granted",
      })
    );

    render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(requestPermission).toBeCalled();
    });
  });

  test("Unable to access camera", async () => {
    startScan.mockImplementationOnce(() => Promise.reject("Error"));

    const { getByText } = render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_Translation.tabs.scan.tab.cameraunavailable)
      ).toBeVisible();
    });
  });

  test("Stop scan when display login", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
    addListener.mockImplementation(
      (
        eventName: string,
        listenerFunc: (result: BarcodesScannedEvent) => void
      ) => {
        setTimeout(() => {
          listenerFunc({
            barcodes,
          });
        }, 100000);

        return {
          remove: jest.fn(),
        };
      }
    );

    render(
      <Provider store={storeMocked}>
        <Scan onFinishScan={onFinishScan} />
      </Provider>
    );

    await waitFor(() => {
      expect(addListener).toBeCalled();
    });

    act(() => {
      storeMocked.dispatch(logout());
    });

    await waitFor(() => {
      expect(stopScan).toBeCalled();
    });
  });
});
