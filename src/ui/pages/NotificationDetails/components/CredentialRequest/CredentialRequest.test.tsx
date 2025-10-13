import { IonReactMemoryRouter } from "@ionic/react-router";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";

import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { connectionsForNotificationsValues } from "../../../../__fixtures__/connectionsFix";
import { credRequestFix } from "../../../../__fixtures__/credRequestFix";
import { multisignIdentifierFix } from "../../../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { revokedCredsFix } from "../../../../__fixtures__/filteredCredsFix";
import { CredentialRequest } from "./CredentialRequest";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { profileCacheFixData } from "../../../../__fixtures__/storeDataFix";

const getIpexApplyDetailsMock = jest.fn(() => Promise.resolve(credRequestFix));
const getLinkedGroupFromIpexApplyMock = jest.fn();
const offerAcdcFromApplyMock = jest.fn();
const dispatchMock = jest.fn();

jest.mock("@ionic/react", () => {
  const actual = jest.requireActual("@ionic/react");
  return {
    ...actual,
    IonAlert: (props: any) =>
      props.isOpen ? (
        <div data-testid="mock-ion-alert">
          {props.header}
          {props.subHeader}
          {props.message}
        </div>
      ) : null,
  };
});

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      ipexCommunications: {
        getIpexApplyDetails: () => getIpexApplyDetailsMock(),
        getLinkedGroupFromIpexApply: () => getLinkedGroupFromIpexApplyMock(),
        joinMultisigOffer: jest.fn(),
        getOfferedCredentialSaid: jest.fn(),
        offerAcdcFromApply: (...args: any[]) => offerAcdcFromApplyMock(...args),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      connections: {
        getConnectionById: jest.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

const initialState = {
  stateCache: {
    routes: [TabsRoutePath.NOTIFICATIONS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    isOnline: true,
  },
  profilesCache: {
    ...profileCacheFixData,
    profiles: {
      ...profileCacheFixData.profiles,
      EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB: {
        identity: {
          id: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
          displayName: (
            connectionsForNotificationsValues.find(
              (c) => c.id === "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB"
            ) || { label: "" }
          ).label,
          createdAtUTC: "2000-01-01T00:00:00.000Z",
        },
        connections: [
          connectionsForNotificationsValues.find(
            (c) => c.id === "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB"
          ) || {},
        ],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    },
    defaultProfile: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
  },
  biometricsCache: {
    enabled: false,
  },
};

describe("Credential request", () => {
  test("Render", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="multi-sign"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });
  });

  test("Alert when credential is empty", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    getIpexApplyDetailsMock.mockImplementation(() =>
      Promise.resolve({
        ...credRequestFix,
        credentials: [],
      })
    );

    const { getByText, getByTestId, queryByTestId, findByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="notification-details"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-notification-details"));
    });

    const alert = await findByTestId("mock-ion-alert");
    expect(alert).toHaveTextContent(
      EN_TRANSLATIONS.tabs.notifications.details.credential.request.alert.text
    );
  });

  test("Auto-submit when only one suitable credential exists", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    getIpexApplyDetailsMock.mockImplementation(() =>
      Promise.resolve({
        ...credRequestFix,
        credentials: [credRequestFix.credentials[0]],
      })
    );

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="notification-details"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-notification-details"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });
  });

  test("Do not auto-submit when multiple suitable credentials exist", async () => {
    const storeMocked = {
      ...makeTestStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    getIpexApplyDetailsMock.mockImplementation(() =>
      Promise.resolve(credRequestFix)
    );

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="notification-details"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-notification-details"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    expect(offerAcdcFromApplyMock).not.toHaveBeenCalled();
  });

  test("Auto-submit when only one suitable credential exists after filtering out revoked", async () => {
    const stateWithRevokedCreds = {
      ...initialState,
      profilesCache: {
        ...initialState.profilesCache,
        profiles: {
          ...initialState.profilesCache.profiles,
          EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB: {
            ...initialState.profilesCache.profiles[
              "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB"
            ],
            credentials: revokedCredsFix,
          } as any,
        },
      },
    };

    const storeMocked = {
      ...makeTestStore(stateWithRevokedCreds as any),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    getIpexApplyDetailsMock.mockImplementation(() =>
      Promise.resolve({
        ...credRequestFix,
        credentials: [
          credRequestFix.credentials[0],
          {
            connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
            acdc: {
              ...credRequestFix.credentials[1].acdc,
              d: "EBgG1lhkxiv_UQ8IiF2G4j5HQlnT5K5XZy_zRFg_EGCS",
            },
          },
        ],
      })
    );

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="notification-details"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-notification-details"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });
  });
});

describe("Credential request: Multisig", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.NOTIFICATIONS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
      },
      isOnline: true,
    },
    profilesCache: {
      ...profileCacheFixData,
      profiles: {
        ...(profileCacheFixData.profiles || {}),
        id: {
          identity: {
            ...multisignIdentifierFix[0],
            groupMemberPre: "member-1",
            id: "id",
          },
          connections: [],
          multisigConnections: [
            { id: "member-1", label: "Member 1" },
            { id: "member-2", label: "Member 2" },
            { id: "member-3", label: "Member 3" },
            { id: "member-4", label: "Member 4" },
            { id: "member-5", label: "Member 5" },
          ],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
          notifications: [],
        },
      },
      defaultProfile: "id",
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  beforeEach(() => {
    getLinkedGroupFromIpexApplyMock.mockImplementation(() =>
      Promise.resolve({
        linkedRequest: {
          accepted: true,
          current: "",
          previous: undefined,
        },
        threshold: { signingThreshold: 5, rotationThreshold: 5 },
        members: ["member-1", "member-2", "member-3", "member-4", "member-5"],
        othersJoined: [],
      })
    );
  });

  test("Render", async () => {
    getIpexApplyDetailsMock.mockImplementation(() =>
      Promise.resolve(credRequestFix)
    );

    const history = createMemoryHistory();

    const { getByText, getByTestId, queryByTestId, getAllByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <CredentialRequest
            pageId="multi-sign"
            activeStatus
            handleBack={jest.fn()}
            notificationDetails={notificationsFix[4]}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    expect(getByTestId("credential-request-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("credential-request-spinner-container")).toBe(null);

      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .information.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.groupmember
      )
    ).toBeVisible();
    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request
          .information.threshold
      )
    ).toBeVisible();
    expect(getByText("5")).toBeVisible();
    expect(getAllByText("Member 1")[0]).toBeVisible();
    expect(getAllByText("Member 2")[0]).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });
  });
});
