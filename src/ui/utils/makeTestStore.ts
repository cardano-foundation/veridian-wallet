import { configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "../../store/reducers/biometricsCache";
import { connectionsCacheSlice } from "../../store/reducers/connectionsCache";
import { seedPhraseCacheSlice } from "../../store/reducers/seedPhraseCache";
import { ssiAgentSlice } from "../../store/reducers/ssiAgent";
import { stateCacheSlice } from "../../store/reducers/stateCache";
import { viewTypeCacheSlice } from "../../store/reducers/viewTypeCache";
import { walletConnectionsCacheSlice } from "../../store/reducers/walletConnectionsCache";
import { profilesCacheSlice } from "../../store/reducers/profileCache";

export function makeTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      stateCache: stateCacheSlice.reducer,
      seedPhraseCache: seedPhraseCacheSlice.reducer,
      connectionsCache: connectionsCacheSlice.reducer,
      walletConnectionsCache: walletConnectionsCacheSlice.reducer,
      viewTypeCache: viewTypeCacheSlice.reducer,
      biometricsCache: biometricsCacheSlice.reducer,
      ssiAgentCache: ssiAgentSlice.reducer,
      profilesCache: profilesCacheSlice.reducer,
    },
    preloadedState,
  });
}
