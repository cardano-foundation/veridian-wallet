import { configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "./reducers/biometricsCache";
import { connectionsCacheSlice } from "./reducers/connectionsCache";
import { credsArchivedCacheSlice } from "./reducers/credsArchivedCache";
import { identifiersCacheSlice } from "./reducers/identifiersCache";
import { profilesCacheSlice } from "./reducers/profileCache";
import { seedPhraseCacheSlice } from "./reducers/seedPhraseCache";
import { ssiAgentSlice } from "./reducers/ssiAgent";
import { stateCacheSlice } from "./reducers/stateCache";
import { viewTypeCacheSlice } from "./reducers/viewTypeCache";
import { walletConnectionsCacheSlice } from "./reducers/walletConnectionsCache";

const store = configureStore({
  reducer: {
    stateCache: stateCacheSlice.reducer,
    seedPhraseCache: seedPhraseCacheSlice.reducer,
    identifiersCache: identifiersCacheSlice.reducer,
    credsArchivedCache: credsArchivedCacheSlice.reducer,
    connectionsCache: connectionsCacheSlice.reducer,
    walletConnectionsCache: walletConnectionsCacheSlice.reducer,
    viewTypeCache: viewTypeCacheSlice.reducer,
    biometricsCache: biometricsCacheSlice.reducer,
    ssiAgentCache: ssiAgentSlice.reducer,
    profilesCache: profilesCacheSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
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
