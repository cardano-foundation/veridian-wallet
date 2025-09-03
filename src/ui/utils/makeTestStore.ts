import { configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "../../store/reducers/biometricsCache";
import { seedPhraseCacheSlice } from "../../store/reducers/seedPhraseCache";
import { ssiAgentSlice } from "../../store/reducers/ssiAgent";
import { stateCacheSlice } from "../../store/reducers/stateCache";
import { viewTypeCacheSlice } from "../../store/reducers/viewTypeCache";
import { profilesCacheSlice } from "../../store/reducers/profileCache";

export function makeTestStore(preloadedState?: any) {
  const transformedPreloaded = preloadedState
    ? { ...preloadedState }
    : undefined;

  // Keep a minimal compatibility helper: when callers provide a `profilesCache`
  // object but omit `defaultProfile`, pick the first available profile id so
  // selectors that depend on a current profile continue to function in tests.
  if (
    transformedPreloaded &&
    transformedPreloaded.profilesCache &&
    typeof transformedPreloaded.profilesCache === "object"
  ) {
    const pc = transformedPreloaded.profilesCache as any;
    if (!pc.defaultProfile && pc.profiles && typeof pc.profiles === "object") {
      const first = Object.keys(pc.profiles)[0];
      if (first) pc.defaultProfile = first;
    }
  }

  return configureStore({
    reducer: {
      stateCache: stateCacheSlice.reducer,
      seedPhraseCache: seedPhraseCacheSlice.reducer,
      viewTypeCache: viewTypeCacheSlice.reducer,
      biometricsCache: biometricsCacheSlice.reducer,
      ssiAgentCache: ssiAgentSlice.reducer,
      profilesCache: profilesCacheSlice.reducer,
    },
    preloadedState: transformedPreloaded,
  });
}
