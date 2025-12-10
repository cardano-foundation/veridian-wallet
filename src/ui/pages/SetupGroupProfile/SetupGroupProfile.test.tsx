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
import { render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { Route } from "react-router-dom";
import { RoutePath, TabsRoutePath } from "../../../routes/paths";
import { multisignIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { CustomInputProps } from "../../components/CustomInput/CustomInput.types";
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
        getByText(multisignIdentifierFix[0].groupMetadata?.proposedUsername || "")
      ).toBeVisible();
    });
  });
});
