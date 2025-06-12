import { IonReactMemoryRouter } from "@ionic/react-router";
import { mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { connectionsForNotifications } from "../../../../__fixtures__/connectionsFix";
import { credRequestFix } from "../../../../__fixtures__/credRequestFix";
import { credsFixAcdc } from "../../../../__fixtures__/credsFix";
import {
  filteredIdentifierFix,
  multisignIdentifierFix,
} from "../../../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { CredentialRequest } from "./CredentialRequest";

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

mockIonicReact();

const getIpexApplyDetailsMock = jest.fn(() => Promise.resolve(credRequestFix));
const getLinkedGroupFromIpexApplyMock = jest.fn();

jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      ipexCommunications: {
        getIpexApplyDetails: () => getIpexApplyDetailsMock(),
        getLinkedGroupFromIpexApply: () => getLinkedGroupFromIpexApplyMock(),
        joinMultisigOffer: jest.fn(),
        getOfferedCredentialSaid: jest.fn(),
      },
    },
  },
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();

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
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  credsCache: { creds: credsFixAcdc, favourites: [] },
  credsArchivedCache: { creds: [] },
  notificationsCache: {
    notifications: notificationsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
  biometricsCache: {
    enabled: false,
  },
};

describe("Credential request", () => {
  test("Render", async () => {
    const storeMocked = {
      ...mockStore(initialState),
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
      ...mockStore(initialState),
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
    credsCache: { creds: credsFixAcdc, favourites: [] },
    credsArchivedCache: { creds: [] },
    notificationsCache: {
      notifications: notificationsFix,
    },
    identifiersCache: {
      identifiers: {
        id: {
          ...multisignIdentifierFix[0],
          groupMemberPre: "member-1",
          id: "id",
        },
      },
      favourites: [],
    },
    connectionsCache: {
      connections: connectionsForNotifications,
      multisigConnections: {
        "member-1": {
          label: "Member 1",
        },
        "member-2": {
          label: "Member 2",
        },
        "member-3": {
          label: "Member 3",
        },
        "member-4": {
          label: "Member 4",
        },
        "member-5": {
          label: "Member 5",
        },
      },
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const storeMocked = {
    ...mockStore(initialState),
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
        threshold: "5",
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
