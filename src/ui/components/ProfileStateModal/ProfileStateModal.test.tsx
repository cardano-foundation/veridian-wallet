import { IonReactMemoryRouter } from "@ionic/react-router";
import { getDefaultNormalizer, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  failedFilteredIdentifierMapFix,
  filteredIdentifierFix,
} from "../../__fixtures__/filteredIdentifierFix";
import { profileCacheFixData } from "../../__fixtures__/storeDataFix";
import { makeTestStore } from "../../utils/makeTestStore";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { ProfileStateModal } from "./ProfileStateModal";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA: "MISSING_DATA_ON_KERIA",
    agent: {
      identifiers: {
        getIdentifier: jest.fn(),
      },
    },
  },
}));

describe("ProfileStateModal - Show profile error states", () => {
  test("Show pending profile issue", async () => {
    const initialStatePendingEmpty = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {},
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[2].id,
      },
      viewTypeCache: {
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialStatePendingEmpty),
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <ProfileStateModal />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.pending)
      ).toBeVisible();
    });
  });

  test("Show creating error", async () => {
    const initialStateErrorEmpty = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {},
      profilesCache: {
        profiles: {
          [failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id].id]: {
            identity:
              failedFilteredIdentifierMapFix[filteredIdentifierFix[0].id],
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        },
        defaultProfile: filteredIdentifierFix[0].id,
        showProfileState: true,
      },
      viewTypeCache: {
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialStateErrorEmpty),
    };

    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <ProfileStateModal />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.profiledetails.loadprofileerror.nowitness)
      ).toBeVisible();
    });
  });

  test("Show missing on cloud error", async () => {
    const initialStateEmpty = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
        isOnline: true,
      },
      seedPhraseCache: {},
      profilesCache: {
        ...profileCacheFixData,
        defaultProfile: filteredIdentifierFix[1].id,
      },
      viewTypeCache: {
        identifier: {
          viewType: null,
          favouriteIndex: 0,
        },
        credential: {
          viewType: null,
          favouriteIndex: 0,
        },
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...makeTestStore(initialStateEmpty),
    };

    jest
      .spyOn(Agent.agent.identifiers, "getIdentifier")
      .mockImplementation(() =>
        Promise.reject(new Error(Agent.MISSING_DATA_ON_KERIA))
      );

    const history = createMemoryHistory();
    history.push(TabsRoutePath.CREDENTIALS);

    const { getByText } = render(
      <IonReactMemoryRouter history={history}>
        <Provider store={storeMocked}>
          <ProfileStateModal />
        </Provider>
      </IonReactMemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.profiledetails.loadprofileerror.missingoncloud,
          {
            normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
          }
        )
      ).toBeVisible();
    });
  });
});
