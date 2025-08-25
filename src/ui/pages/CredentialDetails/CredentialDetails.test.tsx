import { waitForIonicReact } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { setCredsCache } from "../../../store/reducers/profileCache";
import {
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { ToastMsgType } from "../../globals/types";
import { makeTestStore } from "../../utils/makeTestStore";
import { CredentialDetails } from "./CredentialDetails";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";

const path = TabsRoutePath.CREDENTIALS + "/" + credsFixAcdc[0].id;

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA:
      "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.",
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
        restoreCredential: jest.fn(() => Promise.resolve(true)),
        getCredentialShortDetailsById: jest.fn(() => Promise.resolve([])),
        getCredentials: jest.fn(() => Promise.resolve(true)),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(() => Promise.resolve([])),
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: jest.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

jest.mock("../../hooks/appIonRouterHook", () => ({
  useAppIonRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: credsFixAcdc[0].id,
  }),
  useRouteMatch: () => ({ url: path }),
}));

const dispatchMock = jest.fn();

const initialStateNoPasswordCurrent = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      passwordIsSkipped: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  biometricsCache: {
    enabled: false,
  },
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      ...(profileCacheFixData.defaultProfile
        ? {
            [profileCacheFixData.defaultProfile as string]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile as string
              ],
              connections: connectionsFix,
            },
          }
        : {}),
    },
  },
};

const initialStateNoPasswordArchived = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      passwordIsSkipped: true,
    },
    isOnline: true,
  },
  seedPhraseCache: {
    seedPhrase:
      "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
    bran: "bran",
  },
  biometricsCache: {
    enabled: false,
  },
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      ...(profileCacheFixData.defaultProfile
        ? {
            [profileCacheFixData.defaultProfile as string]: {
              ...profileCacheFixData.profiles[
                profileCacheFixData.defaultProfile as string
              ],
              connections: connectionsFix,
            },
          }
        : {}),
    },
  },
};

describe("Cred Details page - current not archived credential", () => {
  let storeMocked: Store<unknown, AnyAction>;
  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(credsFixAcdc[0]);
  });
  beforeEach(() => {
    const dispatchMock = jest.fn();
    storeMocked = {
      ...makeTestStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };
  });

  test("It renders Card Details", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[path]}>
          <Route
            path={path}
            component={CredentialDetails}
          />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => {
      expect(getByTestId("card-details-content")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(getByTestId("credential-card-details-footer")).toBeInTheDocument();
    });
  });

  test("Nav back from credential", async () => {
    const initialStateNoPasswordCurrent = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
          passwordIsSkipped: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {
        seedPhrase:
          "example1 example2 example3 example4 example5 example6 example7 example8 example9 example10 example11 example12 example13 example14 example15",
        bran: "bran",
      },

      biometricsCache: {
        enabled: false,
      },
    };

    storeMocked = {
      ...makeTestStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[path]}>
          <Route
            path={path}
            component={CredentialDetails}
          />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("close-button-label")).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("close-button-label"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setCurrentRoute({
          path: TabsRoutePath.CREDENTIALS,
        })
      );
    });
  });
});

describe("Checking the Credential Details Page when information is missing from the cloud", () => {
  let storeMocked: Store<unknown, AnyAction>;
  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockImplementation(() => {
        throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: id`);
      });
  });
  beforeEach(() => {
    const dispatchMock = jest.fn();
    storeMocked = {
      ...makeTestStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };
  });

  test("Credential exists in the database but not on Signify", async () => {
    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIAL_DETAILS, {
      ...credsFixAcdc[0],
    });

    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <MemoryRouter initialEntries={[path]}>
          <Route
            path={path}
            component={CredentialDetails}
          />
        </MemoryRouter>
      </Provider>
    );

    await waitForIonicReact();

    await waitFor(() => {
      expect(
        getByTestId("credential-card-details-cloud-error-page")
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.clouderror, {
          normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
        })
      ).toBeVisible();
    });
  });
});
