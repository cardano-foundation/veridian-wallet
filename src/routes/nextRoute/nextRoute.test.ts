import {
  getNextGenerateSeedPhraseRoute,
  getNextOnboardingRoute,
  getNextPasscodeLoginRoute,
  getNextSetPasscodeRoute,
  getNextRoute,
  updateStoreAfterGenerateSeedPhraseRoute,
  updateStoreAfterPasscodeLoginRoute,
  updateStoreAfterSetPasscodeRoute,
} from "./nextRoute";
import { RootState } from "../../store";
import { RoutePaths } from "../index";
import { setAuthentication } from "../../store/reducers/stateCache";
import { setSeedPhraseCache } from "../../store/reducers/seedPhraseCache";

describe("NextRules", () => {
  let localStorageMock: any;
  let storeMock: RootState;
  const state = {};

  beforeEach(() => {
    localStorageMock = {};
    storeMock = {
      stateCache: {
        routes: [],
        authentication: {
          loggedIn: false,
          time: 0,
          passcodeIsSet: false,
        },
      },
      seedPhraseCache: {
        seedPhrase: "",
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should return correct route for /onboarding when passcodeIsSet is true and seedPhrase is not set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue(null);
    storeMock.stateCache.authentication.passcodeIsSet = true;

    const result = getNextOnboardingRoute(storeMock);

    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
    });
  });

  test("should return correct route for /onboarding when passcodeIsSet is false and seedPhrase is set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue("someSeedPhrase");

    const result = getNextOnboardingRoute(storeMock);

    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.SET_PASSCODE_ROUTE,
    });
  });

  test("should return correct route for /setpasscode when seedPhrase is not set", () => {
    localStorageMock.getItem = jest.fn().mockReturnValue("someSeedPhrase");

    const result = getNextSetPasscodeRoute(storeMock);

    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
    });
  });

  test("should update store correctly after /setpasscode route", () => {
    const expectedAuthentication = {
      ...storeMock.stateCache.authentication,
      loggedIn: true,
      time: expect.any(Number),
      passcodeIsSet: true,
    };

    const result = updateStoreAfterSetPasscodeRoute(storeMock);

    expect(result).toEqual(setAuthentication(expectedAuthentication));
  });

  test("should return correct route for /passcodelogin when the current routes path is empty", () => {
    storeMock.stateCache.routes = [];
    storeMock.stateCache.authentication.passcodeIsSet = true;
    const result = getNextPasscodeLoginRoute(storeMock, state);

    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
    });
  });

  test("should update store correctly after /passcodelogin route", () => {
    storeMock.stateCache.authentication.passcodeIsSet = true;
    const expectedAuthentication = {
      ...storeMock.stateCache.authentication,
      loggedIn: true,
      time: expect.any(Number),
    };
    const result = updateStoreAfterPasscodeLoginRoute(storeMock, state);

    expect(result).toEqual(setAuthentication(expectedAuthentication));
  });

  test("should return correct route for /generateseedphrase", () => {
    const result = getNextGenerateSeedPhraseRoute();

    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.VERIFY_SEED_PHRASE_ROUTE,
    });
  });

  test("should update store correctly after /generateseedphrase route", () => {
    const expectedSeedPhrase = "yourSeedPhrase";
    const state = {
      seedPhrase: expectedSeedPhrase,
    };
    const expectedAction = setSeedPhraseCache(expectedSeedPhrase);

    const result = updateStoreAfterGenerateSeedPhraseRoute(state);

    expect(result).toEqual(expectedAction);
  });
});

describe("getNextRoute", () => {
  const storeMock: RootState = {
    stateCache: {
      routes: [],
      authentication: {
        loggedIn: false,
        time: 0,
        passcodeIsSet: true,
      },
    },
    seedPhraseCache: {
      seedPhrase: "",
    },
  };
  const state = {};
  const payload = {};

  test("should return the correct Onboarding next route", () => {
    let result = getNextRoute(RoutePaths.ONBOARDING_ROUTE, {
      store: storeMock,
      state,
      payload,
    });

    expect(result).toEqual({
      nextPath: {
        pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
        canNavigate: true,
      },
      updateRedux: [],
    });

    storeMock.stateCache.authentication.passcodeIsSet = false;

    result = getNextRoute(RoutePaths.ONBOARDING_ROUTE, {
      store: storeMock,
      state,
      payload,
    });

    expect(result).toEqual({
      nextPath: {
        pathname: RoutePaths.SET_PASSCODE_ROUTE,
        canNavigate: true,
      },
      updateRedux: [],
    });

    storeMock.stateCache.authentication.passcodeIsSet = true;
    storeMock.seedPhraseCache.seedPhrase = "example-seed-phrase";

    result = getNextRoute(RoutePaths.ONBOARDING_ROUTE, {
      store: storeMock,
      state,
      payload,
    });

    expect(result).toEqual({
      nextPath: {
        pathname: RoutePaths.DIDS_ROUTE,
        canNavigate: true,
      },
      updateRedux: [],
    });
  });

  test("getNextSetPasscodeRoute should return the correct next path when seed phrase is set", () => {
    storeMock.seedPhraseCache = {
      seedPhrase: "example seed phrase",
    };

    const result = getNextSetPasscodeRoute(storeMock);
    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.DIDS_ROUTE,
    });
  });

  test("getNextSetPasscodeRoute should return the correct next path when seed phrase is not set", () => {
    storeMock.seedPhraseCache.seedPhrase = "";

    const result = getNextSetPasscodeRoute(storeMock);
    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
    });
  });

  test("getNextPasscodeLoginRoute should return the correct next path when routes include onboarding", () => {
    storeMock.stateCache.routes = [{ path: RoutePaths.ONBOARDING_ROUTE }];

    const result = getNextPasscodeLoginRoute(storeMock, state);
    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.ONBOARDING_ROUTE,
    });
  });

  test("getNextPasscodeLoginRoute should return the correct next path when routes do not include onboarding", () => {
    storeMock.stateCache.routes = [
      { path: RoutePaths.GENERATE_SEED_PHRASE_ROUTE },
      { path: "/" },
    ];

    const result = getNextPasscodeLoginRoute(storeMock, state);
    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.GENERATE_SEED_PHRASE_ROUTE,
    });
  });

  test("getNextGenerateSeedPhraseRoute should return the correct next path", () => {
    const result = getNextGenerateSeedPhraseRoute();
    expect(result).toEqual({
      canNavigate: true,
      pathname: RoutePaths.VERIFY_SEED_PHRASE_ROUTE,
    });
  });

  test("updateStoreAfterGenerateSeedPhraseRoute should return the updated store with the seed phrase", () => {
    const seedPhrase = "example seed phrase";
    const state = {
      seedPhrase: seedPhrase,
    };
    const expectedAction = setSeedPhraseCache(seedPhrase);

    const result = updateStoreAfterGenerateSeedPhraseRoute(state);
    expect(result).toEqual(expectedAction);
  });
});
