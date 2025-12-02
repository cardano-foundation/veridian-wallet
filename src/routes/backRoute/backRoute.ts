import { AnyAction, ThunkAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import {
  removeCurrentRoute,
  setCurrentRoute,
} from "../../store/reducers/stateCache";
import { DataProps, PayloadProps } from "../nextRoute/nextRoute.types";
import { RoutePath, TabsRoutePath } from "../paths";

const getBackRoute = (
  currentPath: string,
  data: DataProps
): {
  backPath: { pathname: string };
  updateRedux: ((
    data: DataProps
  ) => AnyAction | ThunkAction<void, RootState, undefined, AnyAction>)[];
} => {
  const { updateRedux } = backRoute[currentPath];
  const backPathUrl = backPath(data);

  return {
    backPath: backPathUrl,
    updateRedux: [...updateRedux],
  };
};

const updateStoreSetCurrentRoute = (data: DataProps) => {
  const prevPath = calcPreviousRoute(data.store.stateCache.routes);

  let path;
  if (prevPath) {
    path = prevPath.path;
  } else {
    path = RoutePath.ONBOARDING;
  }

  return setCurrentRoute({ path });
};

const getDefaultPath = (data: DataProps) => {
  if (data.store.stateCache.authentication.ssiAgentIsSet) {
    return TabsRoutePath.HOME;
  }

  if (
    data.store.stateCache.authentication.passwordIsSet ||
    data.store.stateCache.authentication.passwordIsSkipped
  ) {
    return RoutePath.SSI_AGENT;
  }

  return RoutePath.ONBOARDING;
};

const getPreviousRoute = (data: DataProps): { pathname: string } => {
  const routes = data.store.stateCache.routes;
  const prevPath = calcPreviousRoute(routes);

  let path;

  if (routes.length === 0) {
    path = RoutePath.ROOT;
  } else if (prevPath) {
    path = prevPath.path;
  } else {
    path = getDefaultPath(data);
  }

  return { pathname: path };
};

const calcPreviousRoute = (
  routes: { path: string; payload?: PayloadProps }[]
) => {
  if (!routes || routes.length < 2) return undefined;
  return routes[1];
};

const backPath = (data: DataProps) => getPreviousRoute(data);

const backRoute: Record<
  string,
  {
    updateRedux: ((
      data: DataProps
    ) => AnyAction | ThunkAction<void, RootState, undefined, AnyAction>)[];
  }
> = {
  [RoutePath.ROOT]: {
    updateRedux: [],
  },
  [RoutePath.ONBOARDING]: {
    updateRedux: [],
  },
  [RoutePath.VERIFY_RECOVERY_SEED_PHRASE]: {
    updateRedux: [() => removeCurrentRoute(), updateStoreSetCurrentRoute],
  },
  [RoutePath.SSI_AGENT]: {
    updateRedux: [() => removeCurrentRoute()],
  },
  [RoutePath.SET_PASSCODE]: {
    updateRedux: [() => removeCurrentRoute(), updateStoreSetCurrentRoute],
  },
  [RoutePath.CREATE_PASSWORD]: {
    updateRedux: [() => removeCurrentRoute()],
  },
  [TabsRoutePath.NOTIFICATION_DETAILS]: {
    updateRedux: [() => removeCurrentRoute()],
  },
  [TabsRoutePath.CREDENTIAL_DETAILS]: {
    updateRedux: [() => removeCurrentRoute()],
  },
};

export {
  backPath,
  calcPreviousRoute,
  getBackRoute,
  getPreviousRoute,
  updateStoreSetCurrentRoute,
};
