import { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../index";
import {
  clearWalletConnection,
  getConnectedWallet,
  getIsConnecting,
  getPendingConnection,
  getShowConnectWallet,
  getWalletConnectionsCache,
  setConnectedWallet,
  setIsConnecting,
  setPendingConnection,
  setWalletConnectionsCache,
  showConnectWallet,
  walletConnectionsCacheSlice,
} from "./walletConnectionsCache";
import {
  ConnectionData,
  WalletConnectState,
} from "./walletConnectionsCache.types";

describe("walletConnectionsCacheSlice", () => {
  const initialState: WalletConnectState = {
    walletConnections: [],
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

  it("should handle setWalletConnectionsCache", () => {
    const connections: ConnectionData[] = [
      {
        meerkatId: "2",
        name: "Wallet name #2",
        selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRc",
        url: "http://localhost:3001/",
      },
    ];
    const newState = walletConnectionsCacheSlice.reducer(
      initialState,
      setWalletConnectionsCache(connections)
    );
    expect(newState.walletConnections).toEqual(connections);
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
        walletConnections: connections,
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
  it("should return the wallet connetions cache from RootState", () => {
    const state = {
      walletConnectionsCache: {
        walletConnections: [
          {
            meerkatId: "1",
            name: "Wallet name #1",
            selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRd",
            image: "",
            url: "http://localhost:3001/",
          },
          {
            meerkatId: "2",
            name: "Wallet name #2",
            selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRc",
            url: "http://localhost:3001/",
          },
        ],
      },
    } as RootState;
    const connectionCache = getWalletConnectionsCache(state);
    expect(connectionCache).toEqual(
      state.walletConnectionsCache.walletConnections
    );
  });

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
