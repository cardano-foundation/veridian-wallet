import { ThunkAction } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { DataProps } from "../routes/nextRoute/nextRoute.types";
import { RootState } from "./index";
import { clearBiometricsCache } from "./reducers/biometricsCache";
import { clearNotificationsPreferences } from "./reducers/notificationsPreferences/notificationsPreferences";
import { clearDAppConnection, clearProfiles } from "./reducers/profileCache";
import { clearSeedPhraseCache } from "./reducers/seedPhraseCache";
import { clearStateCache } from "./reducers/stateCache";
import { clearViewTypeCache } from "./reducers/viewTypeCache";

const updateReduxState = (
  nextRoute: string,
  data: DataProps,
  dispatch: ThunkDispatch<RootState, undefined, AnyAction>,
  functions: ((
    data: DataProps
  ) => AnyAction | ThunkAction<void, RootState, undefined, AnyAction>)[]
) => {
  if (data.state) {
    data.state.nextRoute = nextRoute;
  } else {
    data.state = { nextRoute };
  }
  functions.forEach((fn) => {
    if (fn) dispatch(fn(data));
  });
};

const CLEAR_STORE_ACTIONS = [
  clearProfiles,
  clearBiometricsCache,
  clearNotificationsPreferences,
  clearSeedPhraseCache,
  clearStateCache,
  clearViewTypeCache,
  clearDAppConnection,
];

export { CLEAR_STORE_ACTIONS, updateReduxState };
