const verifySecretMock = jest.fn().mockResolvedValue(true);

import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { IdentifierType } from "../../../../../core/agent/services/identifier.types";
import { KeyStoreKeys } from "../../../../../core/storage";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { showGenericError } from "../../../../../store/reducers/stateCache";
import { connectionsForNotifications } from "../../../../__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../../../__fixtures__/credsFix";
import {
  filteredIdentifierFix,
  filteredIdentifierMapFix,
} from "../../../../__fixtures__/filteredIdentifierFix";
import { identifierFix } from "../../../../__fixtures__/identifierFix";
import { notificationsFix } from "../../../../__fixtures__/notificationsFix";
import { passcodeFiller } from "../../../../utils/passcodeFiller";
import { ReceiveCredential } from "./ReceiveCredential";

jest.useFakeTimers();

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const admitAcdcFromGrantMock = jest.fn(
  (id: string) =>
    new Promise((res) => {
      setTimeout(() => {
        res({
          id,
        });
      }, 700);
    })
);
const getLinkedGroupFromIpexGrantMock = jest.fn();
const getAcdcFromIpexGrantMock = jest.fn();
jest.mock("../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
      },
      ipexCommunications: {
        admitAcdcFromGrant: (id: string) => admitAcdcFromGrantMock(id),
        getAcdcFromIpexGrant: () => getAcdcFromIpexGrantMock(),
        getLinkedGroupFromIpexGrant: () => getLinkedGroupFromIpexGrantMock(),
      },
      identifiers: {
        getIdentifier: jest.fn(() => Promise.resolve(identifierFix[0])),
      },
      connections: {
        getOobi: jest.fn(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

jest.mock("../../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(() => ({
    biometricsIsEnabled: false,
    biometricInfo: {
      isAvailable: true,
      hasCredentials: false,
      biometryType: BiometryType.fingerprintAuthentication,
      strongBiometryIsAvailable: true,
    },
    handleBiometricAuth: jest.fn(() => Promise.resolve(true)),
    setBiometricsIsEnabled: jest.fn(),
  })),
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
  },
  credsCache: {
    creds: [],
  },
  connectionsCache: {
    connections: connectionsForNotifications,
  },
  notificationsCache: {
    notifications: notificationsFix,
  },
  identifiersCache: {
    identifiers: filteredIdentifierMapFix,
  },
  biometricsCache: {
    enabled: false,
  },
};

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

describe("Receive credential", () => {
  beforeEach(() => {
    getAcdcFromIpexGrantMock.mockImplementation(() =>
      Promise.resolve({
        ...credsFixAcdc[0],
        status: "pending",
      })
    );
  });

  test("Render and decline", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };
    const { getAllByText, getByText, getByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={jest.fn()}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.identifier.alert.textdecline
      )
    ).toBeNull();

    act(() => {
      fireEvent.click(getByTestId("decline-button-creadential-request"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.alert
            .textdecline
        )
      ).toBeVisible();
    });

    fireEvent.click(
      getByTestId("multisig-request-alert-decline-confirm-button")
    );

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });

    await waitFor(() => {
      expect(deleteNotificationMock).toBeCalled();
    });
  });

  test("Accept", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getAllByText, getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-creadential-request"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(admitAcdcFromGrantMock).toBeCalledWith(notificationsFix[0].id);
    });
  }, 10000);

  test("Open cred detail", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getAllByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("cred-detail-btn"));
    });

    await waitFor(() => {
      expect(getByTestId("receive-credential-detail-modal")).toBeVisible();
    });
  }, 10000);

  test("Open missing issuer modal", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.NOTIFICATIONS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      credsCache: {
        creds: [],
      },
      connectionsCache: {
        connections: [],
      },
      notificationsCache: {
        notifications: notificationsFix,
      },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[1]}
        />
      </Provider>
    );

    expect(getByTestId("show-missing-issuer-icon")).toBeVisible();

    fireEvent.click(getByTestId("show-missing-issuer-icon"));

    await waitFor(() => {
      expect(getByTestId("missing-issuer-alert")).toBeVisible();
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.identifier.alert
            .missingissuer.text
        )
      ).toBeVisible();
    });
  });

  test("Open identifier details", async () => {
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
      credsCache: {
        creds: [],
      },
      connectionsCache: {
        connections: connectionsForNotifications,
      },
      notificationsCache: {
        notifications: notificationsFix,
      },
      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();
    const { getAllByText, getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    expect(
      getAllByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive.title
      )[0]
    ).toBeVisible();

    await waitFor(() => {
      expect(getByText("Profess")).toBeVisible();
    });

    fireEvent.click(getByTestId("related-identifier-detail"));

    await waitFor(() => {
      expect(getByTestId("identifier-detail-modal")).toBeVisible();
    });

    await waitFor(() =>
      expect(
        getByTestId("identifier-card-template-default-index-0")
      ).toBeInTheDocument()
    );
    expect(
      queryByTestId("delete-button-identifier-detail")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(getByTestId("identifier-options-button"));
    });

    await waitFor(() => {
      expect(getByTestId("share-identifier-option")).toBeInTheDocument();
    });

    expect(queryByTestId("delete-identifier-option")).not.toBeInTheDocument();

    fireEvent.click(getByText(EN_TRANSLATIONS.tabs.identifiers.details.done));

    await waitFor(() => {
      expect(queryByTestId("identifier-detail-modal")).toBeNull();
    });
  }, 10000);

  test("Show error when cred open", async () => {
    const storeMocked = {
      ...mockStore({
        ...initialState,
        stateCache: {
          routes: [TabsRoutePath.NOTIFICATIONS],
          authentication: {
            loggedIn: true,
            time: Date.now(),
            passcodeIsSet: true,
          },
          isOnline: true,
        },
      }),
      dispatch: dispatchMock,
    };

    getAcdcFromIpexGrantMock.mockImplementation(() => {
      return Promise.reject(new Error("Get acdc failed"));
    });

    const backMock = jest.fn();
    const { unmount } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(showGenericError(true));
      expect(backMock).toBeCalled();
    });

    unmount();
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
    credsCache: {
      creds: [],
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
      },
    },
    notificationsCache: {
      notifications: notificationsFix,
    },
    identifiersCache: {
      identifiers: filteredIdentifierMapFix,
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("Multisig credential request", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: [],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();

      expect(getByText("Member 1")).toBeVisible();

      expect(getByText("Member 2")).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive
          .initiatoracceptedalert
      )
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.ok)
    ).toBeVisible();
  });

  test("Hide alert when group initiator accept cred", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText, queryByText } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();

      expect(getByText("Member 1")).toBeVisible();

      expect(getByText("Member 2")).toBeVisible();
    });

    expect(
      queryByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.receive
          .initiatoracceptedalert
      )
    ).toBeNull();
  });

  test("Multisig credential request: max threshold", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: "2",
      members: ["member-1", "member-2", "member-3"],
      othersJoined: ["member-1", "member-2"],
      linkedRequest: {
        accepted: false,
      },
    });

    const { getByText, unmount, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ReceiveCredential
          pageId="creadential-request"
          activeStatus
          handleBack={backMock}
          notificationDetails={notificationsFix[0]}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.notifications.details.buttons.addcred)
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(queryByTestId("spinner")).toBeNull();
    });

    unmount();
  });

  test("Multisig credential request: Accepted", async () => {
    const backMock = jest.fn();

    getAcdcFromIpexGrantMock.mockResolvedValue({
      ...credsFixAcdc[0],
      identifierType: IdentifierType.Group,
      identifierId: filteredIdentifierFix[2].id,
    });

    getLinkedGroupFromIpexGrantMock.mockResolvedValue({
      threshold: "2",
      members: ["member-1", "member-2"],
      othersJoined: ["member-1"],
      linkedRequest: {
        accepted: true,
        current: "currentadmitsaid",
      },
    });

    const { queryByTestId, unmount, findByText, queryByText, getByText } =
      render(
        <Provider store={storeMocked}>
          <ReceiveCredential
            pageId="creadential-request-1"
            activeStatus
            handleBack={backMock}
            notificationDetails={notificationsFix[0]}
          />
        </Provider>
      );

    expect(queryByTestId("primary-button-creadential-request")).toBe(null);
    expect(queryByTestId("decline-button-creadential-request")).toBe(null);

    const memberName = queryByText("Member 1");
    expect(memberName).toBeNull();

    await waitFor(() => {
      expect(getLinkedGroupFromIpexGrantMock).toBeCalled();
    });

    await waitFor(() => {
      expect(queryByTestId("spinner")).toBeNull();
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.receive.members
        )
      ).toBeVisible();
    });

    const memberName1 = await findByText("Member 1");
    const memberName2 = await findByText("Member 2");

    await waitFor(() => {
      expect(memberName1).toBeVisible();
      expect(memberName2).toBeVisible();
    });

    unmount();
  });
});
