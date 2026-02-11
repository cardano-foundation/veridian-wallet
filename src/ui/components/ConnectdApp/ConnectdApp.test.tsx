import {
  BarcodeFormat,
  BarcodesScannedEvent,
  BarcodeValueType,
} from "@capacitor-mlkit/barcode-scanning";
import { IonInput } from "@ionic/react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  setPeerConnections,
  setPendingDAppConnection,
} from "../../../store/reducers/profileCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { walletConnectionsFix } from "../../__fixtures__/walletConnectionsFix";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { CustomInputProps } from "../CustomInput/CustomInput.types";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { ConnectdApp } from "./ConnectdApp";
import { Agent } from "../../../core/agent/agent";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      peerConnectionAccounts: {
        getAll: jest.fn().mockImplementation(() => walletConnectionsFix),
        deleteById: jest.fn().mockResolvedValue(true),
        deletePeerConnectionPairRecord: jest.fn(),
      },
      peerConnectionPair: {
        deletePeerConnectionPairRecord: jest.fn().mockResolvedValue(true),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      basicStorage: {
        findById: jest.fn(),
      },
    },
  },
}));

jest.mock("../../../core/cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      disconnectDApp: jest.fn(),
      start: jest.fn(),
      connectWithDApp: jest.fn(),
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const dispatchMock = jest.fn();
const initialState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
    },
    toastMsgs: [],
  },
  profilesCache: {
    ...profileCacheFixData,
    connectedDApp: walletConnectionsFix[1],
  },
  biometricsCache: {
    enabled: false,
  },
};

const storeMocked = {
  ...makeTestStore(initialState),
  dispatch: dispatchMock,
};

jest.mock("../../hooks/useBiometricsHook", () => ({
  ...jest.requireActual("../../hooks/useBiometricsHook"),
  useBiometricAuth: () => ({
    biometricInfo: { isAvailable: false },
    setupBiometrics: jest.fn(),
    checkBiometrics: jest.fn(),
    handleBiometricAuth: jest.fn(),
    remainingLockoutSeconds: 0,
    lockoutEndTime: null,
  }),
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
    displayValue: "bWt4YGfkwhj9YTMLoZrRtPp426Zd8h7ehY",
    format: BarcodeFormat.QrCode,
    rawValue: "bWt4YGfkwhj9YTMLoZrRtPp426Zd8h7ehY",
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

describe("Wallet connect: empty history", () => {
  afterEach(() => {
    document.getElementsByTagName("body")[0].innerHTML = "";
  });

  test("Confirm connect modal render empty history screen", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
        toastMsgs: [],
      },
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[2].id,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.connectdapp.connectbtn)).toBeVisible();
    });
  });

  test("Connect wallet modal: open scan when other connection connected", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
        },
        toastMsgs: [],
      },
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[2].id,
        connectedDApp: walletConnectionsFix[1],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, queryByText, getByTestId } = render(
      <MemoryRouter>
        <Provider store={storeMocked}>
          <ConnectdApp
            isOpen
            setIsOpen={jest.fn}
          />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.connectdapp.connectbtn)).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.connectdapp.connectbtn));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.connectdapp.disconnectbeforecreatealert.message
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("alert-disconnect-wallet-cancel-button"));
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.connectdapp.disconnectbeforecreatealert.message
        )
      ).toBeNull();
    });
  });

  test("Scan connection and delete when connecting", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
        toastMsgs: [],
      },
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[2].id,
        pendingDAppConnection: {
          meerkatId: "bWt4YGfkwhj9YTMLoZrRtPp426Zd8h7ehY",
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Provider store={storeMocked}>
          <ConnectdApp
            isOpen
            setIsOpen={jest.fn}
          />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.connectdapp.connectbtn)).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.connectdapp.connectbtn));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.PEER_ID_SUCCESS)
      );
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connectdapp.request.stageone.message)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.connectdapp.request.button.accept)
    );

    await waitFor(() => {
      expect(getByTestId("add-connection-modal")).toBeVisible();
    });

    fireEvent.click(getByTestId("action-button"));

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.connectdapp.connectionhistory.deletealert.message
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(
        EN_TRANSLATIONS.connectdapp.connectionhistory.deletealert.confirm
      )
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(PeerConnection.peerConnection.disconnectDApp).not.toBeCalled();
      expect(
        Agent.agent.peerConnectionPair.deletePeerConnectionPairRecord
      ).toBeCalledWith(
        `${barcodes[0].rawValue}:${filteredIdentifierFix[2].id}`
      );
    });
  });
});

describe("Wallet connect", () => {
  test("Wallet connect render", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connectdapp.connectionhistory.title)
      ).toBeVisible();
    });
    expect(getByText(walletConnectionsFix[0].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[0].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[1].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[1].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[2].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[2].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[3].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[3].url as string)).toBeVisible();
    expect(getByTestId("connected-wallet-check-mark")).toBeVisible();
  });

  test("Confirm connect modal render", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connectdapp.connectionhistory.title)
      ).toBeVisible();
    });
    expect(getByText(walletConnectionsFix[0].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[0].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[1].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[1].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[2].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[2].url as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[3].name as string)).toBeVisible();
    expect(getByText(walletConnectionsFix[3].url as string)).toBeVisible();
    expect(getByTestId("connected-wallet-check-mark")).toBeVisible();
  });

  test("Delete wallet connections", async () => {
    const { getByText, getByTestId, queryByText, findByText } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connectdapp.connectionhistory.title)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`delete-connections-${walletConnectionsFix[0].meerkatId}`)
      );
    });

    const alerTitle = await findByText(
      EN_TRANSLATIONS.connectdapp.connectionhistory.deletealert.message
    );

    await waitFor(() => {
      expect(alerTitle).toBeVisible();
    });

    const deleteConfirmButton = await findByText(
      EN_TRANSLATIONS.connectdapp.connectionhistory.deletealert.confirm
    );

    fireEvent.click(deleteConfirmButton);

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.WALLET_CONNECTION_DELETED)
      );
    });
  });

  test("Open and delete pending wallet connections", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          firstAppLaunch: true,
        },
        toastMsgs: [],
      },
      profilesCache: {
        ...profileCacheFixData,
        pendingDAppConnection: walletConnectionsFix[0],
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.connectdapp.connectionhistory.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId(`delete-connections-${walletConnectionsFix[0].meerkatId}`)
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.connectdapp.connectionhistory.deletealert.message
        )
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-delete-confirm-button"));

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setPeerConnections(walletConnectionsFix.slice(1))
      );
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.WALLET_CONNECTION_DELETED)
      );
      expect(dispatchMock).toBeCalledWith(setPendingDAppConnection(null));
    });
  });

  test("Connect to exist connection", async () => {
    const { getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <ConnectdApp
          isOpen
          setIsOpen={jest.fn}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.connectdapp.connectionhistory.title)
    ).toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId(`card-item-${walletConnectionsFix[0].meerkatId}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("confirm-connect-btn")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("confirm-connect-btn"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.connectdapp.disconnectbeforecreatealert.message
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.connectdapp.disconnectbeforecreatealert.confirm)
    );

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.connectdapp.disconnectbeforecreatealert.message
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setPendingDAppConnection(walletConnectionsFix[0])
      );
    });

    act(() => {
      fireEvent.click(
        getByTestId(`card-item-${walletConnectionsFix[1].meerkatId}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("confirm-connect-btn")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("confirm-connect-btn"));
    });

    await waitFor(() => {
      expect(PeerConnection.peerConnection.disconnectDApp).toBeCalledWith(
        walletConnectionsFix[1].meerkatId
      );
    });
  });
});
