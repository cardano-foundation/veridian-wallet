import { CreationStatus } from "../../core/agent/agent.types";
import { RootState } from "../../store";
import { setAuthentication } from "../../store/reducers/stateCache";
import { InitializationPhase } from "../../store/reducers/stateCache/stateCache.types";
import { OperationType } from "../../ui/globals/types";
import { CredentialsFilters } from "../../ui/pages/Credentials/Credentials.types";
import { RoutePath } from "../index";
import { TabsRoutePath } from "../paths";
import {
  getNextCreateSSIAgentRoute,
  getNextGenerateSeedPhraseRoute,
  getNextOnboardingRoute,
  getNextRootRoute,
  getNextRoute,
  getNextSetPasscodeRoute,
  getNextVerifySeedPhraseRoute,
  updateStoreAfterSetPasscodeRoute,
} from "./nextRoute";
import { DataProps } from "./nextRoute.types";

describe("NextRoute", () => {
  let localStorageMock: any;
  let storeMock: any;
  let data: any = {};

  beforeEach(() => {
    localStorageMock = {};
    storeMock = {
      stateCache: {
        isOnline: true,
        initializationPhase: InitializationPhase.PHASE_TWO,
        recoveryCompleteNoInterruption: false,
        routes: [],
        authentication: {
          loggedIn: false,
          userName: "",
          time: 0,
          passcodeIsSet: false,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: false,
          ssiAgentIsSet: false,
          ssiAgentUrl: "",
          recoveryWalletProgress: false,
          loginAttempt: {
            attempts: 0,
            lockedUntil: Date.now(),
          },
          firstAppLaunch: false,
          finishSetupBiometrics: false,
        },
        toastMsgs: [],
        currentOperation: OperationType.IDLE,
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
        pendingJoinGroupMetadata: null,
      },
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      profilesCache: {
        profiles: {},
        recentProfiles: [],
        multiSigGroup: undefined,
      },
      walletConnectionsCache: {
        connectedWallet: null,
        pendingConnection: null,
      },
      viewTypeCache: {
        credential: {
          viewType: null,
          favouriteIndex: 0,
          favourites: [],
          filters: CredentialsFilters.All,
        },
      },
      biometricsCache: {
        enabled: false,
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
    };
    data = {
      store: storeMock,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should return correct route for /onboarding when passcodeIsSet is true and seedPhrase is not set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue(null);
    storeMock.stateCache.authentication.passcodeIsSet = true;

    const result = getNextOnboardingRoute(data as DataProps);

    expect(result).toEqual({
      pathname: RoutePath.SETUP_BIOMETRICS,
    });
  });

  test("should return correct route for /onboarding when passcodeIsSet is false and seedPhrase is set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue("someSeedPhrase");

    const result = getNextOnboardingRoute(data as DataProps);

    expect(result).toEqual({
      pathname: RoutePath.SET_PASSCODE,
    });
  });

  test("should return correct route for /onboarding when passwordIsSet is true", () => {
    data = {
      store: {
        ...storeMock,
        stateCache: {
          initializationPhase: InitializationPhase.PHASE_TWO,
          routes: [],
          authentication: {
            loggedIn: false,
            userName: "",
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: false,
            passwordIsSet: true,
            passwordIsSkipped: false,
            ssiAgentIsUrl: "",
            finishSetupBiometrics: true,
          },
          currentOperation: OperationType.IDLE,
          queueIncomingRequest: {
            isProcessing: false,
            queues: [],
            isPaused: false,
          },
        },
      },
    };

    const result = getNextOnboardingRoute(data as DataProps);

    expect(result).toEqual({
      pathname: RoutePath.GENERATE_SEED_PHRASE,
    });
  });

  test("should return correct route for /onboarding when ssi agent URL set", () => {
    data = {
      store: {
        ...storeMock,
        stateCache: {
          initializationPhase: InitializationPhase.PHASE_TWO,
          routes: [],
          authentication: {
            loggedIn: false,
            userName: "",
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: false,
            passwordIsSet: true,
            passwordIsSkipped: false,
            ssiAgentIsSet: true,
            ssiAgentUrl: "http://keria.com",
            finishSetupBiometrics: true,
          },
          currentOperation: OperationType.IDLE,
          queueIncomingRequest: {
            isProcessing: false,
            queues: [],
            isPaused: false,
          },
        },
      },
    };

    const result = getNextOnboardingRoute(data as DataProps);

    expect(result).toEqual({
      pathname: TabsRoutePath.CREDENTIALS,
    });
  });

  test("should return correct route for /onboarding seedPhraseIsSet is true", () => {
    data = {
      store: {
        ...storeMock,
        stateCache: {
          initializationPhase: InitializationPhase.PHASE_TWO,
          routes: [],
          authentication: {
            loggedIn: false,
            userName: "",
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: true,
            passwordIsSet: true,
            passwordIsSkipped: false,
            ssiAgentIsSet: false,
            ssiAgentUrl: "",
            finishSetupBiometrics: true,
          },
          currentOperation: OperationType.IDLE,
          queueIncomingRequest: {
            isProcessing: false,
            queues: [],
            isPaused: false,
          },
        },
      },
    };

    const result = getNextOnboardingRoute(data as DataProps);

    expect(result).toEqual({
      pathname: RoutePath.SSI_AGENT,
    });
  });

  test("should return correct route for /setpasscode when seedPhrase is not set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue("someSeedPhrase");

    const result = getNextSetPasscodeRoute(storeMock);

    expect(result).toEqual({
      pathname: RoutePath.SETUP_BIOMETRICS,
    });
  });

  test("should update store correctly after /setpasscode route", () => {
    const expectedAuthentication = {
      ...storeMock.stateCache.authentication,
      loggedIn: true,
      time: expect.any(Number),
      passcodeIsSet: true,
    };

    const result = updateStoreAfterSetPasscodeRoute({ store: storeMock });

    expect(result).toEqual(setAuthentication(expectedAuthentication));
  });

  test("should return correct route for /generateseedphrase", () => {
    const result = getNextGenerateSeedPhraseRoute();

    expect(result).toEqual({
      pathname: RoutePath.VERIFY_SEED_PHRASE,
    });
  });

  test("should return correct route for /verifyseedphrase", () => {
    const result = getNextVerifySeedPhraseRoute();

    expect(result).toEqual({
      pathname: RoutePath.SSI_AGENT,
    });
  });

  test("should return correct route for /ssiagent", () => {
    const result = getNextCreateSSIAgentRoute({
      store: {} as any,
    });

    expect(result).toEqual({
      pathname: TabsRoutePath.CREDENTIALS,
    });
  });
});

describe("getNextRoute", () => {
  const storeMock: any = {
    stateCache: {
      isOnline: true,
      initializationPhase: InitializationPhase.PHASE_TWO,
      recoveryCompleteNoInterruption: false,
      routes: [],
      authentication: {
        loggedIn: false,
        userName: "",
        time: 0,
        passcodeIsSet: true,
        seedPhraseIsSet: false,
        passwordIsSet: false,
        passwordIsSkipped: false,
        ssiAgentIsSet: false,
        ssiAgentUrl: "",
        recoveryWalletProgress: false,
        loginAttempt: {
          attempts: 0,
          lockedUntil: Date.now(),
        },
        firstAppLaunch: false,
        finishSetupBiometrics: false,
      },
      toastMsgs: [],
      currentOperation: OperationType.IDLE,
      queueIncomingRequest: {
        isProcessing: false,
        queues: [],
        isPaused: false,
      },
      pendingJoinGroupMetadata: null,
    },
    profilesCache: {
      profiles: {},
      recentProfiles: [],
      multiSigGroup: undefined,
    },
    seedPhraseCache: {
      seedPhrase: "",
      bran: "",
    },
    walletConnectionsCache: {
      connectedWallet: null,
      pendingConnection: null,
    },
    viewTypeCache: {
      credential: {
        viewType: null,
        favouriteIndex: 0,
        favourites: [],
        filters: CredentialsFilters.All,
      },
    },
    biometricsCache: {
      enabled: false,
    },
    ssiAgentCache: {
      bootUrl: "",
      connectUrl: "",
    },
  };
  const state = {};
  const payload = {};

  test("should return the correct Onboarding next route", () => {
    let result = getNextRoute(RoutePath.ONBOARDING, {
      store: storeMock,
      state,
      payload,
    });

    expect(result.nextPath).toEqual({
      pathname: RoutePath.SETUP_BIOMETRICS,
    });

    storeMock.stateCache.authentication.passcodeIsSet = false;

    result = getNextRoute(RoutePath.ONBOARDING, {
      store: storeMock,
      state,
      payload,
    });

    expect(result.nextPath).toEqual({ pathname: RoutePath.SET_PASSCODE });
  });

  test("getNextSetPasscodeRoute should return the correct next path when seed phrase is set", () => {
    storeMock.seedPhraseCache = {
      seedPhrase: "example seed phrase 160",
      bran: "bran",
    };

    const result = getNextSetPasscodeRoute(storeMock);
    expect(result).toEqual({
      pathname: RoutePath.SSI_AGENT,
    });
  });

  test("getNextSetPasscodeRoute should return the correct next path when seed phrase is not set", () => {
    storeMock.seedPhraseCache.seedPhrase = "";

    const result = getNextSetPasscodeRoute(storeMock);
    expect(result).toEqual({
      pathname: RoutePath.SETUP_BIOMETRICS,
    });
  });

  test("should redirect to PROFILE_SETUP when isPendingJoinGroup is true", () => {
    const mockData = {
      store: {
        stateCache: {
          isPendingJoinGroup: true,
          initializationPhase: InitializationPhase.PHASE_TWO,
          routes: [],
          authentication: {
            loggedIn: false,
            userName: "",
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: false,
            passwordIsSet: true,
            passwordIsSkipped: false,
            ssiAgentIsSet: true,
            ssiAgentUrl: "http://keria.com",
            finishSetupBiometrics: true,
          },
          currentOperation: OperationType.IDLE,
          queueIncomingRequest: {
            isProcessing: false,
            queues: [],
            isPaused: false,
          },
        },
      },
    };

    const result = getNextRootRoute(mockData as any);

    expect(result.pathname).toEqual(RoutePath.PROFILE_SETUP);
  });

  test("should follow existing logic when isPendingJoinGroup is false", () => {
    const mockData = {
      store: {
        stateCache: {
          isPendingJoinGroup: false,
          initializationPhase: InitializationPhase.PHASE_TWO,
          routes: [],
          authentication: {
            loggedIn: false,
            userName: "",
            time: 0,
            passcodeIsSet: true,
            seedPhraseIsSet: false,
            passwordIsSet: true,
            passwordIsSkipped: false,
            ssiAgentIsSet: true,
            ssiAgentUrl: "http://keria.com",
            finishSetupBiometrics: true,
          },
          currentOperation: OperationType.IDLE,
          queueIncomingRequest: {
            isProcessing: false,
            queues: [],
            isPaused: false,
          },
        },
      },
    };

    const result = getNextRootRoute(mockData as any);

    expect(result.pathname).toEqual(TabsRoutePath.CREDENTIALS);
  });
});
