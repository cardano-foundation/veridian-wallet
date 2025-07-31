import { configureStore } from "@reduxjs/toolkit";
import { seedPhraseCacheSlice } from "./reducers/seedPhraseCache";
import { stateCacheSlice } from "./reducers/stateCache";
import { identifiersCacheSlice } from "./reducers/identifiersCache";
import { credsCacheSlice } from "./reducers/credsCache";
import { connectionsCacheSlice } from "./reducers/connectionsCache";
import { walletConnectionsCacheSlice } from "./reducers/walletConnectionsCache";
import { viewTypeCacheSlice } from "./reducers/viewTypeCache";
import { biometricsCacheSlice } from "./reducers/biometricsCache";
import { credsArchivedCacheSlice } from "./reducers/credsArchivedCache";
import { ssiAgentSlice } from "./reducers/ssiAgent";
import { profilesCacheSlice } from "./reducers/profileCache";

const store = configureStore({
  reducer: {
    stateCache: stateCacheSlice.reducer,
    seedPhraseCache: seedPhraseCacheSlice.reducer,
    identifiersCache: identifiersCacheSlice.reducer,
    credsCache: credsCacheSlice.reducer,
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

export type { RootState, AppDispatch };

export { store };
