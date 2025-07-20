import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput } from "@ionic/react";
import { ionFireEvent } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_Translation from "../../../locales/en/en.json";
import { makeTestStore } from "../../utils/makeTestStore";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { TabsRoutePath } from "../navigation/TabsMenu";
import {
  getCurrentProfileId,
  logout,
  setToastMsg,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { ShareProfile } from "./ShareProfile";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { ToastMsgType } from "../../globals/types";
import {
  setMissingAliasConnection,
  setOpenConnectionId,
} from "../../../store/reducers/connectionsCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";

const connectByOobiUrlMock = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        connectByOobiUrl: (...arg: unknown[]) => connectByOobiUrlMock(...arg),
      },
    },
  },
}));

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
      "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
    format: BarcodeFormat.QrCode,
    rawValue:
      "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
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
        onIonInput={(e) => {
          props.onChangeInput(e.detail.value as string);
        }}
      />
    );
  },
}));

describe("Share Profile", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.CONNECTIONS],
      currentProfileId: filteredIdentifierFix[0].id,
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
  };

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

  test("Renders QR", async () => {
    const storeMocked = makeTestStore(initialState);
    const closeModal = jest.fn();

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={closeModal}
        />
      </Provider>
    );

    expect(getByText(EN_Translation.shareprofile.buttons.close)).toBeVisible();
    expect(
      getByText(EN_Translation.shareprofile.shareoobi.title)
    ).toBeVisible();
    expect(getByTestId("share-profile-qr-code")).toBeVisible();
    expect(
      getByText(EN_Translation.shareprofile.buttons.provide)
    ).toBeVisible();
    expect(getByText(EN_Translation.shareprofile.buttons.scan)).toBeVisible();

    fireEvent.click(getByText(EN_Translation.shareprofile.buttons.close));
    expect(closeModal).toBeCalled();
  });

  test("Scan oobi: Success", async () => {
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

    const storeMocked = makeTestStore(initialState);

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={jest.fn()}
        />
      </Provider>
    );

    ionFireEvent.ionChange(getByTestId("share-profile-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
    });

    await waitFor(() => {
      expect(connectByOobiUrlMock).toBeCalledWith(
        barcodes[0].rawValue,
        initialState.stateCache.currentProfileId
      );
    });
  });

  test("Scan oobi: missing alias", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
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
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p",
                format: BarcodeFormat.QrCode,
                rawValue:
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p",
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

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={jest.fn()}
        />
      </Provider>
    );

    ionFireEvent.ionChange(getByTestId("share-profile-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setMissingAliasConnection({
          url: "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p",
          identifier: initialState.stateCache.currentProfileId,
        })
      );
    });
  });

  test("Scan oobi: invalid url", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
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
                  "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org/oobi/string1/?groupId=72e2f089cef6",
                format: BarcodeFormat.QrCode,
                rawValue: "http://dev",
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

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={jest.fn()}
        />
      </Provider>
    );

    ionFireEvent.ionChange(getByTestId("share-profile-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.SCANNER_ERROR)
      );
    });
  });

  test("Scan oobi: duplicate connection", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
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
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
                format: BarcodeFormat.QrCode,
                rawValue:
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
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

    const state = {
      ...initialState,
      connectionsCache: {
        connections: {
          EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6: connectionsFix[0],
        },
      },
    };

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(state),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={jest.fn()}
        />
      </Provider>
    );

    ionFireEvent.ionChange(getByTestId("share-profile-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setOpenConnectionId("EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6")
      );
    });
  });

  test("Scan oobi: unknown error", async () => {
    getPlatformMock.mockImplementation(() => ["ios"]);
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
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
                format: BarcodeFormat.QrCode,
                rawValue:
                  "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p?name=CF%20Credential%20Issuance",
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

    const dispatchMock = jest.fn();
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    connectByOobiUrlMock.mockImplementation(() =>
      Promise.reject(new Error("Error"))
    );

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <ShareProfile
          oobi="oobi"
          isOpen
          setIsOpen={jest.fn()}
        />
      </Provider>
    );

    ionFireEvent.ionChange(getByTestId("share-profile-segment"), "scan");

    await waitFor(() => {
      expect(getByTestId("profile-scanner")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
    });
  });
});
