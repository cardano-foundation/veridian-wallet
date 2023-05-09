import { PayloadAction } from "@reduxjs/toolkit";

import {
  AuthenticationCacheProps,
  CurrentRouteCacheProps,
  getAuthentication,
  getCurrentRoute,
  getStateCache,
  initialState,
  setAuthentication,
  setCurrentRoute,
  StateCacheSlice,
} from "./StateCache";
import { RootState } from "../../index";
import { ROUTES } from "../../../routes";

describe("State Cache", () => {
  test("should return the initial state on first run", () => {
    expect(StateCacheSlice.reducer(undefined, {} as PayloadAction)).toEqual(
      initialState
    );
  });

  test("should set the current route cache", () => {
    const currentRoute: CurrentRouteCacheProps = {
      path: ROUTES.ONBOARDING_ROUTE,
      payload: {},
    };
    const action = setCurrentRoute(currentRoute);
    const nextState = StateCacheSlice.reducer(initialState, action);

    expect(nextState.routes[0]).toEqual(currentRoute);
    expect(nextState).not.toBe(initialState);

    const rootState = { stateCache: nextState } as RootState;
    expect(getCurrentRoute(rootState)).toEqual(nextState.routes[0]);
    expect(getStateCache(rootState)).toEqual(nextState);
  });

  test("should set the authentication cache", () => {
    const authentication: AuthenticationCacheProps = {
      loggedIn: false,
      time: 0,
      passcodeIsSet: false,
    };
    const action = setAuthentication(authentication);
    const nextState = StateCacheSlice.reducer(initialState, action);

    expect(nextState.authentication).toEqual(authentication);
    expect(nextState).not.toBe(initialState);

    const rootState = { stateCache: nextState } as RootState;
    expect(getAuthentication(rootState)).toEqual(nextState.authentication);
    expect(getStateCache(rootState)).toEqual(nextState);
  });
});
