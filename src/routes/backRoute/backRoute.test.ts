import { RootState } from "../../store";
import { OperationType } from "../../ui/globals/types";
import { DataProps } from "../nextRoute/nextRoute.types";
import { calcPreviousRoute, getBackRoute, getPreviousRoute } from "./backRoute";

jest.mock("../../store/reducers/stateCache", () => ({
  removeCurrentRoute: jest.fn(),
  setCurrentRoute: jest.fn(),
  setAuthentication: jest.fn(),
}));

jest.mock("../../store/reducers/seedPhraseCache", () => ({
  clearSeedPhraseCache: jest.fn(),
}));

describe("getBackRoute", () => {
  let storeMock: RootState;
  const state = {};
  beforeEach(() => {
    storeMock = {
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      stateCache: {
        initialized: true,
        routes: [{ path: "/route1" }, { path: "/route2" }, { path: "/route3" }],
        authentication: {
          passcodeIsSet: true,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: true,
          loggedIn: false,
          userName: "",
          time: 0,
          ssiAgentIsSet: false,
          recoveryWalletProgress: false,
        },
        currentOperation: OperationType.IDLE,
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      identifiersCache: {
        identifiers: [],
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
      credsArchivedCache: { creds: [] },
      connectionsCache: {
        connections: [],
      },
      walletConnectionsCache: {
        walletConnections: [],
        connectedWallet: null,
        pendingConnection: null,
      },
      identifierViewTypeCacheCache: {
        viewType: null,
        favouriteIndex: 0,
      },
      biometryCache: {
        enabled: false,
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should return the correct 'backPath' and 'updateRedux' when currentPath is '/'", () => {
    const currentPath = "/";
    const data: DataProps = {
      store: storeMock,
    };

    const result = getBackRoute(currentPath, data);

    expect(result.backPath).toEqual({ pathname: "/route2" });
    expect(result.updateRedux).toHaveLength(1);
  });

  test("should return the correct back path when currentPath is /generateseedphrase", () => {
    const currentPath = "/generateseedphrase";
    const data: DataProps = {
      store: storeMock,
    };

    const result = getBackRoute(currentPath, data);

    expect(result.backPath).toEqual({ pathname: "/route2" });
    expect(result.updateRedux).toHaveLength(4);
  });

  test("should return the correct back path when currentPath is /verifyseedphrase", () => {
    const currentPath = "/verifyseedphrase";
    const data: DataProps = {
      store: storeMock,
    };

    const result = getBackRoute(currentPath, data);

    expect(result.backPath).toEqual({ pathname: "/route2" });
    expect(result.updateRedux).toHaveLength(3);
  });

  test("should return the correct back path when currentPath is /setpasscode", () => {
    const currentPath = "/setpasscode";
    const data: DataProps = {
      store: storeMock,
    };

    const result = getBackRoute(currentPath, data);

    expect(result.backPath).toEqual({ pathname: "/route2" });
    expect(result.updateRedux).toHaveLength(3);
  });
});

describe("calcPreviousRoute", () => {
  test("should return the correct previous route", () => {
    const routes = [
      { path: "/", payload: {} },
      { path: "/generateseedphrase", payload: {} },
      { path: "/verifyseedphrase", payload: {} },
      { path: "/setpasscode", payload: {} },
    ];

    const result = calcPreviousRoute(routes);

    expect(result).toEqual({ path: "/generateseedphrase", payload: {} });
  });
});

describe("getPreviousRoute", () => {
  let storeMock: RootState;
  beforeEach(() => {
    storeMock = {
      seedPhraseCache: {
        seedPhrase: "",
        bran: "",
      },
      ssiAgentCache: {
        bootUrl: "",
        connectUrl: "",
      },
      stateCache: {
        initialized: true,
        routes: [{ path: "/route1" }, { path: "/route2" }, { path: "/route3" }],
        authentication: {
          passcodeIsSet: true,
          seedPhraseIsSet: false,
          passwordIsSet: false,
          passwordIsSkipped: true,
          loggedIn: false,
          userName: "",
          time: 0,
          ssiAgentIsSet: false,
          recoveryWalletProgress: false,
        },
        currentOperation: OperationType.IDLE,
        queueIncomingRequest: {
          isProcessing: false,
          queues: [],
          isPaused: false,
        },
      },
      identifiersCache: {
        identifiers: [],
        favourites: [],
        multiSigGroup: {
          groupId: "",
          connections: [],
        },
      },
      credsCache: { creds: [], favourites: [] },
      credsArchivedCache: { creds: [] },
      connectionsCache: {
        connections: [],
      },
      walletConnectionsCache: {
        walletConnections: [],
        connectedWallet: null,
        pendingConnection: null,
      },
      identifierViewTypeCacheCache: {
        viewType: null,
        favouriteIndex: 0,
      },
      biometryCache: {
        enabled: false,
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  test("should return the correct previous route pathname", () => {
    const data: DataProps = {
      store: storeMock,
    };

    const result = getPreviousRoute(data);

    expect(result).toEqual({ pathname: "/route2" });
  });

  test("should return the ROOT path if no previous route exists", () => {
    const data: DataProps = {
      store: storeMock,
    };

    const storeWithoutRoutes = {
      ...storeMock,
      stateCache: {
        ...storeMock.stateCache,
        routes: [],
      },
    };

    const result = getPreviousRoute({
      ...data,
      store: storeWithoutRoutes,
    });

    expect(result).toEqual({ pathname: "/" });
  });
});
