import { configureStore } from "@reduxjs/toolkit";
import { stateCacheSlice } from "./reducers/stateCache";
import connectionsReducer from "./reducers/connectionsSlice";
import schemasReducer from "./reducers/schemasSlice";

const store = configureStore({
  reducer: {
    stateCache: stateCacheSlice.reducer,
    connections: connectionsReducer,
    schemasCache: schemasReducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export type { AppDispatch, RootState };

export { store };
