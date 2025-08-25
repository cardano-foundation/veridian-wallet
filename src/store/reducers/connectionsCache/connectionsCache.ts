import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { RootState } from "../../index";
import {
  getConnectionsCache as getProfileConnectionsCache,
  getMultisigConnectionsCache as getProfileMultisigConnectionsCache,
  getOpenConnectionId as getProfileOpenConnectionId,
  getMissingAliasConnection as getProfileMissingAliasConnection,
} from "../profileCache/profilesCache";
import {
  ConnectionsCacheState,
  MissingAliasConnection,
} from "./connectionsCache.types";
const initialState: ConnectionsCacheState = {
  connections: {},
  multisigConnections: {},
};
const connectionsCacheSlice = createSlice({
  name: "connectionsCache",
  initialState,
  reducers: {
    setConnectionsCache: (
      state,
      action: PayloadAction<ConnectionShortDetails[]>
    ) => {
      const newConnections = action.payload.reduce(
        (acc: { [key: string]: ConnectionShortDetails }, connection) => {
          acc[connection.id] = connection;
          return acc;
        },
        {}
      );

      state.connections = newConnections;
    },

    updateOrAddConnectionCache: (
      state,
      action: PayloadAction<ConnectionShortDetails>
    ) => {
      state.connections = {
        ...state.connections,
        [action.payload.id]: action.payload,
      };
    },

    removeConnectionCache: (state, action: PayloadAction<string>) => {
      delete state.connections[action.payload];
    },

    setMultisigConnectionsCache: (
      state,
      action: PayloadAction<ConnectionShortDetails[]>
    ) => {
      const multisigConnection = action.payload.reduce(
        (acc: { [key: string]: ConnectionShortDetails }, connection) => {
          acc[connection.id] = connection;
          return acc;
        },
        {}
      );

      state.multisigConnections = multisigConnection;
    },

    updateOrAddMultisigConnectionCache: (
      state,
      action: PayloadAction<ConnectionShortDetails>
    ) => {
      state.multisigConnections = {
        ...state.multisigConnections,
        [action.payload.id]: action.payload,
      };
    },

    setOpenConnectionId: (state, action: PayloadAction<string | undefined>) => {
      state.openConnectionId = action.payload;
    },
    setMissingAliasConnection: (
      state,
      action: PayloadAction<MissingAliasConnection | undefined>
    ) => {
      state.missingAliasUrl = action.payload;
    },
    clearConnectionsCache() {
      return initialState;
    },
  },
});

export { connectionsCacheSlice, initialState };

export const {
  setConnectionsCache,
  setMultisigConnectionsCache,
  updateOrAddConnectionCache,
  removeConnectionCache,
  updateOrAddMultisigConnectionCache,
  setOpenConnectionId,
  setMissingAliasConnection,
  clearConnectionsCache,
} = connectionsCacheSlice.actions;

// Backwards-compat selectors: prefer the new profilesCache selectors when
// `profilesCache` exists on the RootState, but if tests or legacy callers
// provide only the old `connectionsCache` slice, fall back to reading those
// legacy fields so consumers remain working during the staged migration.
const getConnectionsCache = (state: RootState) => {
  // If profilesCache is present, use the profile-based selector
  if ((state as any) && (state as any).profilesCache) {
    return getProfileConnectionsCache(state);
  }

  // Otherwise, fall back to the legacy shape
  return (state as any).connectionsCache?.connections || {};
};

const getMultisigConnectionsCache = (state: RootState) => {
  if ((state as any) && (state as any).profilesCache) {
    return getProfileMultisigConnectionsCache(state);
  }

  return (state as any).connectionsCache?.multisigConnections || {};
};

const getOpenConnectionId = (state: RootState) => {
  if ((state as any) && (state as any).profilesCache) {
    return getProfileOpenConnectionId(state);
  }

  return (state as any).connectionsCache?.openConnectionId;
};

const getMissingAliasConnection = (state: RootState) => {
  if ((state as any) && (state as any).profilesCache) {
    return getProfileMissingAliasConnection(state);
  }

  return (state as any).connectionsCache?.missingAliasUrl;
};

export {
  getConnectionsCache,
  getMissingAliasConnection,
  getMultisigConnectionsCache,
  getOpenConnectionId,
};
