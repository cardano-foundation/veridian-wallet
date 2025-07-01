import { configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "../../store/reducers/biometricsCache";
import { connectionsCacheSlice } from "../../store/reducers/connectionsCache";
import { credsArchivedCacheSlice } from "../../store/reducers/credsArchivedCache";
import { credsCacheSlice } from "../../store/reducers/credsCache";
import { identifiersCacheSlice } from "../../store/reducers/identifiersCache";
import { notificationsCacheSlice } from "../../store/reducers/notificationsCache";
import { seedPhraseCacheSlice } from "../../store/reducers/seedPhraseCache";
import { ssiAgentSlice } from "../../store/reducers/ssiAgent";
import { stateCacheSlice } from "../../store/reducers/stateCache";
import { viewTypeCacheSlice } from "../../store/reducers/viewTypeCache";
import { walletConnectionsCacheSlice } from "../../store/reducers/walletConnectionsCache";

export function makeTestStore(preloadedState?: any) {
  return configureStore({
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
      notificationsCache: notificationsCacheSlice.reducer,
    },
    preloadedState,
  });
}
