const connectByOobiUrlMock = jest.fn();
const getPlatformMock = jest.fn(() => ["mobile"]);
const isNativePlatformMock = jest.fn(() => true);
const checkPermisson = jest.fn(() =>
  Promise.resolve({
    camera: "granted",
  })
);
const requestPermission = jest.fn();
const startScan = jest.fn();
const stopScan = jest.fn();

import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput } from "@ionic/react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { Route } from "react-router-dom";
import EN_Translation from "../../../locales/en/en.json";
import { RoutePath, TabsRoutePath } from "../../../routes/paths";
import {
  setMissingAliasConnection,
  setOpenConnectionId,
} from "../../../store/reducers/profileCache";
import {
  setToastMsg,
  showGenericError,
} from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { multisignIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
import { ShareProfile } from "../../components/ShareProfile";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { SetupGroupProfile } from "./SetupGroupProfile";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        connectByOobiUrl: (...arg: unknown[]) => connectByOobiUrlMock(...arg),
      },
    },
  },
}));

jest.mock("signify-ts", () => ({
  ...jest.requireActual("signify-ts"),
  Salter: jest.fn(() => ({
    qb64: "",
  })),
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  getPlatforms: () => getPlatformMock(),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("@capacitor/core", () => {
  return {
    ...jest.requireActual("@capacitor/core"),
    Capacitor: {
      isNativePlatform: () => isNativePlatformMock(),
    },
  };
});

jest.mock("@capgo/capacitor-native-biometric", () => ({
  ...jest.requireActual("@capgo/capacitor-native-biometric"),
  NativeBiometric: {
    isAvailable: jest.fn(),
    verifyIdentity: jest.fn(),
    getCredentials: jest.fn(),
    setCredentials: jest.fn(),
  },
}));

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

jest.mock("../../components/CustomInput", () => ({
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

describe("Setup Connections", () => {
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
    profilesCache: {
      ...profileCacheFixData,
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

    fireEvent(
      getByTestId("share-profile-segment"),
      new CustomEvent("ionChange", {
        detail: { value: "scan" },
      })
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
    });

    await waitFor(() => {
      expect(connectByOobiUrlMock).toBeCalledWith(
        barcodes[0].rawValue,
        profileCacheFixData.defaultProfile
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

    fireEvent(
      getByTestId("share-profile-segment"),
      new CustomEvent("ionChange", {
        detail: { value: "scan" },
      })
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setMissingAliasConnection({
          url: "http://keria:3902/oobi/EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6/agent/EJqSoWGc6xyYisiaFKsuut159p",
          identifier: profileCacheFixData.defaultProfile,
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

    fireEvent(
      getByTestId("share-profile-segment"),
      new CustomEvent("ionChange", {
        detail: { value: "scan" },
      })
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
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
    };

    // Seed the scanned connection id into the current profile for this test
    const defaultProfile = state.profilesCache.defaultProfile;
    if (defaultProfile) {
      const sampleConn = { ...connectionsFix[0] };
      sampleConn.id = "EKDTSzuyUb7ICP1rFzrFGXc1AwC4yFtTkzIHbbjoJDO6";

      state.profilesCache = {
        ...state.profilesCache,
        profiles: {
          ...state.profilesCache.profiles,
          [defaultProfile]: {
            ...state.profilesCache.profiles[defaultProfile],
            connections: [
              ...(state.profilesCache.profiles[defaultProfile].connections ||
                []),
              sampleConn,
            ],
          },
        },
      };
    }

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

    fireEvent(
      getByTestId("share-profile-segment"),
      new CustomEvent("ionChange", {
        detail: { value: "scan" },
      })
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
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

    fireEvent(
      getByTestId("share-profile-segment"),
      new CustomEvent("ionChange", {
        detail: { value: "scan" },
      })
    );

    await waitFor(() => {
      expect(getByTestId("scan")).toBeVisible();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
    });
  });

  test("Render default screen", async () => {
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
      profilesCache: {
        profiles: {
          [multisignIdentifierFix[0].id]: {
            identity: multisignIdentifierFix[0],
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        },
      },
    };

    const storeMocked = makeTestStore(initialState);

    const history = createMemoryHistory();
    history.push(
      RoutePath.GROUP_PROFILE_SETUP.replace(":id", multisignIdentifierFix[0].id)
    );

    const { getByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <Route
            path={RoutePath.GROUP_PROFILE_SETUP}
            component={SetupGroupProfile}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(multisignIdentifierFix[0].groupMetadata!.userName)
      ).toBeVisible();
    });
  });
});
