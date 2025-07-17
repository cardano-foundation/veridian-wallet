import { AnyAction, ThunkAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { clearSeedPhraseCache } from "../../store/reducers/seedPhraseCache";
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
  updateRedux: (() => ThunkAction<void, RootState, undefined, AnyAction>)[];
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
    return TabsRoutePath.CREDENTIALS;
  }

  if (
    data.store.stateCache.authentication.passwordIsSet ||
    data.store.stateCache.authentication.passwordIsSkipped
  ) {
    return RoutePath.GENERATE_SEED_PHRASE;
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

  if (path === RoutePath.VERIFY_SEED_PHRASE) {
    path = RoutePath.GENERATE_SEED_PHRASE;
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

const backRoute: Record<string, any> = {
  [RoutePath.ROOT]: {
    updateRedux: [],
  },
  [RoutePath.ONBOARDING]: {
    updateRedux: [],
  },
  [RoutePath.GENERATE_SEED_PHRASE]: {
    updateRedux: [
      removeCurrentRoute,
      updateStoreSetCurrentRoute,
      clearSeedPhraseCache,
    ],
  },
  [RoutePath.VERIFY_SEED_PHRASE]: {
    updateRedux: [removeCurrentRoute, updateStoreSetCurrentRoute],
  },
  [RoutePath.VERIFY_RECOVERY_SEED_PHRASE]: {
    updateRedux: [removeCurrentRoute, updateStoreSetCurrentRoute],
  },
  [RoutePath.SSI_AGENT]: {
    updateRedux: [removeCurrentRoute],
  },
  [RoutePath.SET_PASSCODE]: {
    updateRedux: [removeCurrentRoute, updateStoreSetCurrentRoute],
  },
  [RoutePath.CREATE_PASSWORD]: {
    updateRedux: [removeCurrentRoute],
  },
  [TabsRoutePath.NOTIFICATION_DETAILS]: {
    updateRedux: [removeCurrentRoute],
  },
  [TabsRoutePath.CREDENTIAL_DETAILS]: {
    updateRedux: [removeCurrentRoute],
  },
};

export {
  backPath,
  calcPreviousRoute,
  getBackRoute,
  getPreviousRoute,
  updateStoreSetCurrentRoute,
};
