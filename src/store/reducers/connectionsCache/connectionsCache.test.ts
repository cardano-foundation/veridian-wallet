import { PayloadAction } from "@reduxjs/toolkit";
import {
  clearConnectionsCache,
  connectionsCacheSlice,
  getConnectionsCache,
  getMultisigConnectionsCache,
  getOpenConnectionId,
  removeConnectionCache,
  setConnectionsCache,
  setMultisigConnectionsCache,
  setOpenConnectionId,
  updateOrAddConnectionCache,
} from "./connectionsCache";
import { RootState } from "../../index";
import {
  ConnectionShortDetails,
  ConnectionStatus,
} from "../../../core/agent/agent.types";

const initialState = {
  connections: {},
  multisigConnections: {},
};

const multisigConnection: ConnectionShortDetails = {
  groupId: "group-id",
  id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
  contactId: "did:example:ebfeb1ebc6f1c276ef71212ec21",
  label: "Cambridge University",
  createdAtUTC: "2017-08-13T19:23:24Z",
  logo: "logo.png",
  status: ConnectionStatus.CONFIRMED,
};

const connection: ConnectionShortDetails = {
  id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
  contactId: "did:example:ebfeb1ebc6f1c276ef71212ec21",
  identifier: "did:example:some-identifier",
  label: "Cambridge University",
  createdAtUTC: "2017-08-13T19:23:24Z",
  logo: "logo.png",
  status: ConnectionStatus.PENDING,
};

describe("connectionsCacheSlice", () => {
  it("should return the initial state", () => {
    expect(
      connectionsCacheSlice.reducer(undefined, {} as PayloadAction)
    ).toEqual(initialState);
  });

  it("should handle setConnectionsCache", () => {
    const connections: ConnectionShortDetails[] = [connection];
    const newState = connectionsCacheSlice.reducer(
      initialState,
      setConnectionsCache(connections)
    );
    expect(newState.connections).toEqual({
      "did:example:ebfeb1ebc6f1c276ef71212ec21": connection,
    });
  });

  it("should handle updateOrAddConnectionCache", () => {
    const newState = connectionsCacheSlice.reducer(
      initialState,
      updateOrAddConnectionCache(connection)
    );
    expect(
      newState.connections["did:example:ebfeb1ebc6f1c276ef71212ec21"]
    ).toMatchObject(connection);
  });

  it("should handle setOpenConnectionId", () => {
    const newState = connectionsCacheSlice.reducer(
      initialState,
      setOpenConnectionId(connection.id)
    );

    expect(newState.openConnectionId).toEqual(connection.id);
  });

  it("should handle removeConnectionCache", () => {
    const newState = connectionsCacheSlice.reducer(
      initialState,
      removeConnectionCache(connection.id)
    );

    expect(newState.connections).toEqual({});
  });

  it("should handle clearConnectionsCache", () => {
    const newState = connectionsCacheSlice.reducer(
      initialState,
      clearConnectionsCache()
    );

    expect(newState).toEqual(initialState);
  });
});

describe("getConnectionsCache", () => {
  it("should return the connections cache from RootState", () => {
    const state = {
      connectionsCache: {
        connections: {
          "did:example:ebfeb1ebc6f1c276ef71212ec21": {
            id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
            label: "Cambridge University",
            connectionDate: "2017-08-13T19:23:24Z",
            logo: "logo.png",
            status: "pending",
          },
          "did:example:ebfeb1ebc6f1c276ef71212ec22": {
            id: "did:example:ebfeb1ebc6f1c276ef71212ec22",
            label: "Passport Office",
            connectionDate: "2017-08-13T19:23:24Z",
            logo: "logo.png",
            status: "confirmed",
          },
        },
      },
    } as unknown as RootState;
    const connectionsCache = getConnectionsCache(state);
    expect(connectionsCache).toEqual(state.connectionsCache.connections);
  });
});

describe("multisigConnectionsCacheSlice", () => {
  it("should handle setMultisigConnectionsCache", () => {
    const multisigConnections: ConnectionShortDetails[] = [multisigConnection];
    const newState = connectionsCacheSlice.reducer(
      initialState,
      setMultisigConnectionsCache(multisigConnections)
    );
    expect(newState.multisigConnections).toEqual({
      "did:example:ebfeb1ebc6f1c276ef71212ec21": multisigConnection,
    });
  });

  it("should handle updateOrAddConnectionCache", () => {
    const newState = connectionsCacheSlice.reducer(
      initialState,
      updateOrAddConnectionCache(connection)
    );
    expect(
      newState.connections["did:example:ebfeb1ebc6f1c276ef71212ec21"]
    ).toMatchObject(connection);
  });
});

describe("getMultisigConnectionsCache", () => {
  it("should return the multisig connections cache from RootState", () => {
    const state = {
      connectionsCache: {
        multisigConnections: {
          "did:example:ebfeb1ebc6f1c276ef71212ec21": multisigConnection,
        },
      },
    } as unknown as RootState;
    const multisigConnectionsCache = getMultisigConnectionsCache(state);
    expect(multisigConnectionsCache).toEqual(
      state.connectionsCache.multisigConnections
    );
  });

  it("should return the open connection detail", () => {
    const state = {
      connectionsCache: {
        openConnectionId: "mock-connect-id",
      },
    } as unknown as RootState;
    const openConnectionId = getOpenConnectionId(state);
    expect(openConnectionId).toEqual(state.connectionsCache.openConnectionId);
  });
});
