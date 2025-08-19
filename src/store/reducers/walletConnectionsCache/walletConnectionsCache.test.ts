import { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../index";
import {
  clearWalletConnection,
  getConnectedWallet,
  getIsConnecting,
  getPendingConnection,
  getShowConnectWallet,
  setConnectedWallet,
  setIsConnecting,
  setPendingConnection,
  showConnectWallet,
  walletConnectionsCacheSlice,
} from "./walletConnectionsCache";
import { WalletConnectState } from "./walletConnectionsCache.types";
import { ConnectionData } from "../profileCache";

describe("walletConnectionsCacheSlice", () => {
  const initialState: WalletConnectState = {
    connectedWallet: null,
    pendingConnection: null,
    isConnecting: false,
    showConnectWallet: false,
  };

  it("should return the initial state", () => {
    expect(
      walletConnectionsCacheSlice.reducer(undefined, {} as PayloadAction)
    ).toEqual(initialState);
  });

  it("should handle clearWalletConnection", () => {
    const connections: ConnectionData[] = [
      {
        meerkatId: "2",
        name: "Wallet name #2",
        selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRc",
        url: "http://localhost:3001/",
      },
    ];
    const newState = walletConnectionsCacheSlice.reducer(
      {
        ...initialState,
      },
      clearWalletConnection()
    );
    expect(newState).toEqual(initialState);
  });

  it("should handle setConnectedWallet", () => {
    const connection: ConnectionData = {
      meerkatId: "2",
      name: "Wallet name #2",
      selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRc",
      url: "http://localhost:3001/",
    };
    const newState = walletConnectionsCacheSlice.reducer(
      initialState,
      setConnectedWallet(connection)
    );
    expect(newState.connectedWallet).toEqual(connection);
  });
  it("should handle setPendingConnection", () => {
    const newState = walletConnectionsCacheSlice.reducer(
      initialState,
      setPendingConnection({
        meerkatId: "pending-meerkat",
      })
    );
    expect(newState.pendingConnection?.meerkatId).toEqual("pending-meerkat");
  });
  it("should handle setIsConnecting", () => {
    const newState = walletConnectionsCacheSlice.reducer(
      initialState,
      setIsConnecting(true)
    );
    expect(newState.isConnecting).toEqual(true);
  });

  it("should show connect wallet", () => {
    const newState = walletConnectionsCacheSlice.reducer(
      initialState,
      showConnectWallet(true)
    );
    expect(newState.showConnectWallet).toEqual(true);
  });
});

describe("Get wallet connections cache", () => {
  it("should return connected wallet from RootState", () => {
    const state = {
      walletConnectionsCache: {
        connectedWallet: {
          meerkatId: "1",
        },
      },
    } as RootState;
    const connectionCache = getConnectedWallet(state);
    expect(connectionCache).toEqual(
      state.walletConnectionsCache.connectedWallet
    );
  });
  it("should return pending DApp MeerKat from RootState", () => {
    const state = {
      walletConnectionsCache: {
        pendingConnection: {
          meerkatId: "pending-meerkat",
        },
      },
    } as RootState;
    const pendingMeerKatCache = getPendingConnection(state);
    expect(pendingMeerKatCache).toEqual(
      state.walletConnectionsCache.pendingConnection
    );
  });
  it("should get is connecting", () => {
    const state = {
      walletConnectionsCache: {
        isConnecting: false,
      },
    } as RootState;
    const pendingMeerKatCache = getIsConnecting(state);
    expect(pendingMeerKatCache).toEqual(
      state.walletConnectionsCache.isConnecting
    );
  });
  it("should get show wallet connect", () => {
    const state = {
      walletConnectionsCache: {
        showConnectWallet: false,
      },
    } as RootState;
    const showConnectWallet = getShowConnectWallet(state);
    expect(showConnectWallet).toEqual(
      state.walletConnectionsCache.showConnectWallet
    );
  });
});
