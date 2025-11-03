import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "./reducers/biometricsCache";
import { profilesCacheSlice } from "./reducers/profileCache";
import { seedPhraseCacheSlice } from "./reducers/seedPhraseCache";
import { stateCacheSlice } from "./reducers/stateCache";
import { viewTypeCacheSlice } from "./reducers/viewTypeCache";

export const rootReducer = combineReducers({
  stateCache: stateCacheSlice.reducer,
  seedPhraseCache: seedPhraseCacheSlice.reducer,
  viewTypeCache: viewTypeCacheSlice.reducer,
  biometricsCache: biometricsCacheSlice.reducer,
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

export { store };
export type { AppDispatch, RootState };
