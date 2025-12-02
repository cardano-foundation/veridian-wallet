import { AnyAction, ThunkAction } from "@reduxjs/toolkit";
import { CreationStatus } from "../../core/agent/agent.types";
import { RootState } from "../../store";
import {
  clearSeedPhraseCache,
  setSeedPhraseCache,
} from "../../store/reducers/seedPhraseCache";
import {
  setAuthentication,
  setCurrentRoute,
  setIsSetupProfile,
  StateCacheProps,
} from "../../store/reducers/stateCache";
import { RoutePath, TabsRoutePath } from "../paths";
import { DataProps, NextRoute, StoreState } from "./nextRoute.types";

const getNextRootRoute = (data: DataProps) => {
  const authentication = data.store.stateCache.authentication;

  let path: string = RoutePath.ONBOARDING;

  if (authentication.passcodeIsSet) {
    path = RoutePath.SETUP_BIOMETRICS;
  }

  if (authentication.finishSetupBiometrics) {
    path = RoutePath.CREATE_PASSWORD;
  }

  if (authentication.passwordIsSet || authentication.passwordIsSkipped) {
    path = authentication.recoveryWalletProgress
      ? RoutePath.VERIFY_RECOVERY_SEED_PHRASE
      : RoutePath.SSI_AGENT;
  }

  if (authentication.ssiAgentIsSet) {
    path = data.store.stateCache.isSetupProfile
      ? RoutePath.PROFILE_SETUP
      : TabsRoutePath.HOME;
  }

  const { currentProfile } = data.store;
  if (
    currentProfile &&
    data.store.stateCache.routes[0]?.path !== RoutePath.PROFILE_SETUP
  ) {
    // If group is in setup phrase or status of group is pending (waiting other member approve it), show group detail page

    const profile = currentProfile.identity;
    const isGroupProfile = !!(profile.groupMemberPre || profile.groupMetadata);
    // We have 2 phrase group profile is pending: after create and after accept to join group
    // This flag use to check group profile is pending after create
    const isPendingAfterCreate =
      profile.creationStatus === CreationStatus.PENDING &&
      !profile.groupMemberPre;

    const isCreatedGroup =
      profile.groupMemberPre &&
      profile.creationStatus === CreationStatus.COMPLETE;

    path =
      isGroupProfile && !isCreatedGroup && !isPendingAfterCreate
        ? RoutePath.GROUP_PROFILE_SETUP.replace(
          ":id",
          currentProfile.identity.id
        )
        : path;
  }

  if (
    data.store.stateCache.pendingJoinGroupMetadata?.isPendingJoinGroup ||
    (data.store.stateCache as StateCacheProps & { isPendingJoinGroup?: boolean })
      .isPendingJoinGroup
  ) {
    path = RoutePath.PROFILE_SETUP;
  }

  return { pathname: path };
};

const getNextOnboardingRoute = (data: DataProps) => {
  const nextRoute = getNextRootRoute(data);

  if (nextRoute.pathname === RoutePath.ONBOARDING) {
    return {
      pathname: RoutePath.TERMS_AND_PRIVACY,
    };
  }

  return nextRoute;
};

const getNextTermPrivacy = () => {
  return {
    pathname: RoutePath.SET_PASSCODE,
  };
};

const getNextCredentialDetailsRoute = () => {
  const path = TabsRoutePath.CREDENTIALS;
  return { pathname: path };
};

const getNextNotificationsRoute = () => {
  const path = TabsRoutePath.NOTIFICATION_DETAILS;
  return { pathname: path };
};

const getNextNotificationDetailsRoute = () => {
  const path = TabsRoutePath.NOTIFICATIONS;
  return { pathname: path };
};

const getNextSetPasscodeRoute = (store: StoreState) => {
  const seedPhraseIsSet = !!store.seedPhraseCache?.seedPhrase;
  const ssiAgentIsSet = store.stateCache.authentication.ssiAgentIsSet;

  let nextPath: string = RoutePath.SETUP_BIOMETRICS;

  if (store.stateCache.authentication.finishSetupBiometrics) {
    nextPath = RoutePath.CREATE_PASSWORD;
  }

  if (seedPhraseIsSet) {
    nextPath = RoutePath.SSI_AGENT;
  }

  if (ssiAgentIsSet) {
    nextPath = TabsRoutePath.HOME;
  }

  return { pathname: nextPath };
};

const updateStoreAfterSetPasscodeRoute = (data: DataProps) => {
  return setAuthentication({
    ...data.store.stateCache.authentication,
    loggedIn: true,
    time: Date.now(),
    passcodeIsSet: true,
    firstAppLaunch: false,
  });
};

const updateStoreAfterSetupSSI = (data: DataProps) => {
  return setAuthentication({
    ...data.store.stateCache.authentication,
    ssiAgentIsSet: true,
    recoveryWalletProgress: false,
  });
};

const updateStoreRecoveryWallet = (data: DataProps) => {
  return setAuthentication({
    ...data.store.stateCache.authentication,
    recoveryWalletProgress: data.state?.recoveryWalletProgress ?? false,
  });
};

const getNextVerifySeedPhraseRoute = () => {
  const nextPath = RoutePath.SSI_AGENT;
  return { pathname: nextPath };
};

const getNextCreateSSIAgentRoute = (data: DataProps) => {
  const nextPath = data.state?.shouldSetupProfile
    ? RoutePath.PROFILE_SETUP
    : TabsRoutePath.HOME;
  return { pathname: nextPath };
};

const updateStoreSetSeedPhrase = (data: DataProps) => {
  return setSeedPhraseCache({
    seedPhrase: data.state?.seedPhrase ?? "",
    bran: data.state?.bran ?? "",
  });
};
const updateStoreCurrentRoute = (data: DataProps) => {
  return setCurrentRoute({ path: data.state?.nextRoute ?? "" });
};

const getNextCreatePasswordRoute = (data: DataProps) => {
  if (data.store.stateCache.authentication.recoveryWalletProgress) {
    return { pathname: RoutePath.VERIFY_RECOVERY_SEED_PHRASE };
  }

  return { pathname: RoutePath.SSI_AGENT };
};

const getNextProfileSetupRoute = () => {
  return { pathname: TabsRoutePath.HOME };
};

const updateStoreAfterCreatePassword = (data: DataProps) => {
  const skipped = data.state?.skipped;
  return setAuthentication({
    ...data.store.stateCache.authentication,
    passwordIsSet: !skipped,
    passwordIsSkipped: !!skipped,
  });
};

const updateStoreAfterSetupProfile = (data: DataProps) => {
  return setIsSetupProfile(data.state?.isSetupProfile ?? false);
};

const updateAfterSetupBiometrics = (data: DataProps) => {
  const finishedSetup = data.state?.finishedSetup;
  return setAuthentication({
    ...data.store.stateCache.authentication,
    finishSetupBiometrics: finishedSetup ?? false,
  });
};

const getNextRoute = (
  currentPath: string,
  data: DataProps
): {
  nextPath: { pathname: string };
  updateRedux: ((
    data: DataProps
  ) => AnyAction | ThunkAction<void, RootState, undefined, AnyAction>)[];
} => {
  const { nextPath, updateRedux } = nextRoute[currentPath];
  const updateReduxFn = [...updateRedux, updateStoreCurrentRoute];
  return {
    nextPath: nextPath(data),
    updateRedux: updateReduxFn,
  };
};

const nextRoute: Record<string, NextRoute> = {
  [RoutePath.ROOT]: {
    nextPath: (data: DataProps) => getNextRootRoute(data),
    updateRedux: [],
  },
  [RoutePath.ONBOARDING]: {
    nextPath: (data: DataProps) => getNextOnboardingRoute(data),
    updateRedux: [updateStoreRecoveryWallet],
  },
  [RoutePath.TERMS_AND_PRIVACY]: {
    nextPath: () => getNextTermPrivacy(),
    updateRedux: [],
  },
  [RoutePath.SET_PASSCODE]: {
    nextPath: (data: DataProps) => getNextSetPasscodeRoute(data.store),
    updateRedux: [updateStoreAfterSetPasscodeRoute],
  },
  [RoutePath.SETUP_BIOMETRICS]: {
    nextPath: (data: DataProps) => getNextRootRoute(data),
    updateRedux: [updateAfterSetupBiometrics],
  },
  [RoutePath.VERIFY_RECOVERY_SEED_PHRASE]: {
    nextPath: () => getNextVerifySeedPhraseRoute(),
    updateRedux: [],
  },
  [RoutePath.SSI_AGENT]: {
    nextPath: (data: DataProps) => getNextCreateSSIAgentRoute(data),
    updateRedux: [updateStoreAfterSetupSSI, () => clearSeedPhraseCache()],
  },
  [RoutePath.CREATE_PASSWORD]: {
    nextPath: (data: DataProps) => getNextCreatePasswordRoute(data),
    updateRedux: [updateStoreAfterCreatePassword],
  },
  [RoutePath.PROFILE_SETUP]: {
    nextPath: () => getNextProfileSetupRoute(),
    updateRedux: [updateStoreAfterSetupProfile],
  },
  [TabsRoutePath.CREDENTIAL_DETAILS]: {
    nextPath: () => getNextCredentialDetailsRoute(),
    updateRedux: [],
  },
  [TabsRoutePath.NOTIFICATIONS]: {
    nextPath: () => getNextNotificationsRoute(),
    updateRedux: [],
  },
  [TabsRoutePath.NOTIFICATION_DETAILS]: {
    nextPath: () => getNextNotificationDetailsRoute(),
    updateRedux: [],
  },
};

export {
  getNextCreatePasswordRoute,
  getNextCreateSSIAgentRoute,
  getNextOnboardingRoute,
  getNextRootRoute,
  getNextRoute,
  getNextSetPasscodeRoute,
  getNextVerifySeedPhraseRoute,
  updateStoreAfterCreatePassword,
  updateStoreAfterSetPasscodeRoute,
  updateStoreCurrentRoute,
  updateStoreSetSeedPhrase,
};
