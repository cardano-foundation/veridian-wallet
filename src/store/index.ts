import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "./reducers/biometricsCache";
import { connectionsCacheSlice } from "./reducers/connectionsCache";
import { profilesCacheSlice } from "./reducers/profileCache";
import { seedPhraseCacheSlice } from "./reducers/seedPhraseCache";
import { ssiAgentSlice } from "./reducers/ssiAgent";
import { stateCacheSlice } from "./reducers/stateCache";
import { viewTypeCacheSlice } from "./reducers/viewTypeCache";
import { walletConnectionsCacheSlice } from "./reducers/walletConnectionsCache";

export const rootReducer = combineReducers({
  stateCache: stateCacheSlice.reducer,
  seedPhraseCache: seedPhraseCacheSlice.reducer,
  connectionsCache: connectionsCacheSlice.reducer,
  walletConnectionsCache: walletConnectionsCacheSlice.reducer,
  viewTypeCache: viewTypeCacheSlice.reducer,
  biometricsCache: biometricsCacheSlice.reducer,
  ssiAgentCache: ssiAgentSlice.reducer,
  profilesCache: profilesCacheSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: [
          "payload.signTransaction.payload.approvalCallback",
        ],
      },
    }),
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export type { AppDispatch, RootState };
export { store };
