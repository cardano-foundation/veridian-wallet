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
import { TabsRoutePath } from "../navigation/TabsMenu";
import { ConnectdApp } from "./ConnectdApp";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      peerConnectionAccounts: {
        getAll: jest.fn().mockImplementation(() => walletConnectionsFix),
        deleteById: jest.fn().mockResolvedValue(true),
      },
      peerConnectionPair: {
        deletePeerConnectionPairRecord: jest.fn().mockResolvedValue(true),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

jest.mock("../../../core/cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      disconnectDApp: jest.fn(),
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

  test("Connect wallet modal: scan QR when other connection connected", async () => {
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

  test.skip("Connect wallet modal: scan QR", async () => {
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

  test("Delete pending wallet connections", async () => {
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

  test("Connect wallet", async () => {
    const { getByText, getByTestId, queryByText, getAllByText } = render(
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
