const verifySecretMock = jest.fn().mockResolvedValue(true);

import { IonReactMemoryRouter } from "@ionic/react-router";
import { ionFireEvent, mockIonicReact } from "@ionic/react-test-utils";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { KeriaNotification } from "../../../../../../core/agent/services/keriaNotificationService.types";
import { CredentialStatus } from "../../../../../../core/agent/services/credentialService.types";
import { KeyStoreKeys, SecureStorage } from "../../../../../../core/storage";
import EN_TRANSLATIONS from "../../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../../routes/paths";
import { connectionsForNotifications } from "../../../../../__fixtures__/connectionsFix";
import { credRequestFix } from "../../../../../__fixtures__/credRequestFix";
import { credsFixAcdc } from "../../../../../__fixtures__/credsFix";
import { filteredIdentifierMapFix } from "../../../../../__fixtures__/filteredIdentifierFix";
import { notificationsFix } from "../../../../../__fixtures__/notificationsFix";
import {
  formatShortDate,
  formatTimeToSec,
} from "../../../../../utils/formatters";
import { passcodeFiller } from "../../../../../utils/passcodeFiller";
import { ACDC } from "../CredentialRequest.types";
import { ChooseCredential } from "./ChooseCredential";

mockIonicReact();

const deleteNotificationMock = jest.fn((id: string) => Promise.resolve(id));
const offerAcdcFromApplyMock = jest.fn(
  (detail: KeriaNotification, acdc: ACDC) =>
    new Promise((res) => {
      setTimeout(() => {
        res({
          detail,
          acdc,
        });
      }, 700);
    })
);

jest.mock("../../../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      keriaNotifications: {
        deleteNotificationRecordById: (id: string) =>
          deleteNotificationMock(id),
      },
      ipexCommunications: {
        offerAcdcFromApply: (detail: KeriaNotification, acdc: ACDC) =>
          offerAcdcFromApplyMock(detail, acdc),
      },
      credentials: {
        getCredentialDetailsById: jest.fn(() =>
          Promise.resolve(credsFixAcdc[0])
        ),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(),
      },
      auth: {
        verifySecret: verifySecretMock,
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  isPlatform: () => true,
  IonModal: ({ children, isOpen, ...props }: any) => {
    return isOpen ? (
      <div data-testid={props["data-testid"]}>{children}</div>
    ) : null;
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

describe("Credential request - choose request", () => {
  test("Render full active credentials & empty revoked tab", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    const { getByText, getByTestId, getAllByText } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <ChooseCredential
            pageId="multi-sign"
            activeStatus
            onBack={jest.fn()}
            onClose={jest.fn()}
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            reloadData={jest.fn}
            linkedGroup={null}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    expect(
      getByTestId("card-item-" + credRequestFix.credentials[0].acdc.d)
    ).toBeVisible();
    expect(
      getByTestId("card-item-" + credRequestFix.credentials[1].acdc.d)
    ).toBeVisible();

    expect(
      getAllByText(Object.values(connectionsForNotifications)[0].label).length
    ).toBe(2);

    expect(
      getByText(
        `${formatShortDate(
          credRequestFix.credentials[0].acdc.a.dt
        )} - ${formatTimeToSec(credRequestFix.credentials[0].acdc.a.dt)}`
      )
    ).toBeVisible();

    expect(
      getByText(
        `${formatShortDate(
          credRequestFix.credentials[1].acdc.a.dt
        )} - ${formatTimeToSec(credRequestFix.credentials[1].acdc.a.dt)}`
      )
    ).toBeVisible();

    const segment = getByTestId("choose-credential-segment");

    act(() => {
      ionFireEvent.ionChange(segment, "revoked");
    });

    await waitFor(() =>
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request.choosecredential.norevoked.replace(
            "{{requestCred}}",
            credRequestFix.schema.name
          )
        )
      ).toBeVisible()
    );
  });

  test("Show detail", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const history = createMemoryHistory();

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <ChooseCredential
            pageId="multi-sign"
            activeStatus
            onBack={jest.fn()}
            onClose={jest.fn()}
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            reloadData={jest.fn}
            linkedGroup={null}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`cred-detail-${credRequestFix.credentials[0].acdc.d}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("request-cred-detail-modal")).toBeVisible();
    });
  });

  test("Update cred after close cred detail page - check and uncheck cred", async () => {
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
      notificationsCache: {
        notifications: notificationsFix,
      },
      credsCache: {
        creds: [
          { ...credsFixAcdc[0], id: credRequestFix.credentials[0].acdc.d },
        ],
      },
      identifiersCache: {
        identifiers: {},
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const path = `${TabsRoutePath.NOTIFICATIONS}/${notificationsFix[4].id}`;
    const history = createMemoryHistory();
    history.push(path);

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          initialEntries={[path]}
          history={history}
        >
          <ChooseCredential
            pageId="multi-sign"
            activeStatus
            onBack={jest.fn()}
            onClose={jest.fn()}
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            reloadData={jest.fn}
            linkedGroup={null}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`cred-detail-${credRequestFix.credentials[0].acdc.d}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("notification-selected")).toBeVisible();
    });

    act(() => {
      fireEvent(
        getByTestId("notification-selected"),
        new CustomEvent("ionChange", {
          detail: {
            checked: true,
          },
        })
      );
    });

    await waitFor(() => {
      expect(getByTestId("notification-selected").getAttribute("checked")).toBe(
        "true"
      );
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.tabs.credentials.details.done));
    });

    await waitFor(() => {
      expect(
        getByTestId(
          `cred-select-${credRequestFix.credentials[0].acdc.d}`
        ).getAttribute("checked")
      ).toBe("true");
    });

    act(() => {
      fireEvent.click(
        getByTestId(`cred-detail-${credRequestFix.credentials[0].acdc.d}`)
      );
    });

    await waitFor(() => {
      expect(getByTestId("notification-selected")).toBeVisible();
    });

    act(() => {
      fireEvent(
        getByTestId("notification-selected"),
        new CustomEvent("ionChange", {
          detail: {
            checked: false,
          },
        })
      );
    });

    await waitFor(() => {
      expect(getByTestId("notification-selected").getAttribute("checked")).toBe(
        "false"
      );
    });

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.tabs.credentials.details.done));
    });

    await waitFor(() => {
      expect(
        getByTestId(
          `cred-select-${credRequestFix.credentials[0].acdc.d}`
        ).getAttribute("checked")
      ).toBe("false");
    });
  });

  test("Submit", async () => {
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
        notificationDetailCache: null,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    jest.spyOn(SecureStorage, "get").mockResolvedValue("193212");

    const path = `${TabsRoutePath.NOTIFICATIONS}/${notificationsFix[4].id}`;
    const history = createMemoryHistory();
    history.push(path);

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter
          initialEntries={[path]}
          history={history}
        >
          <ChooseCredential
            pageId="multi-sign"
            activeStatus
            onBack={jest.fn()}
            onClose={jest.fn()}
            notificationDetails={notificationsFix[4]}
            credentialRequest={credRequestFix}
            reloadData={jest.fn}
            linkedGroup={null}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(
        getByTestId(`cred-select-${credRequestFix.credentials[0].acdc.d}`)
      );
    });

    await waitFor(() => {
      expect(
        getByTestId(
          `cred-select-${credRequestFix.credentials[0].acdc.d}`
        ).classList.contains("checkbox-checked")
      ).toBe(true);
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button-multi-sign"));
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByTestId("passcode-button-1")).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(verifySecretMock).toHaveBeenCalledWith(
        KeyStoreKeys.APP_PASSCODE,
        "193212"
      );
    });

    await waitFor(() => {
      expect(getByTestId("credential-request-spinner-container")).toBeVisible();
    });

    expect(offerAcdcFromApplyMock).toBeCalledWith(
      notificationsFix[4].id,
      credRequestFix.credentials[0].acdc
    );
  });
});

describe("Credential request - choose request", () => {
  const credsCacheMock = credsFixAcdc.map((item) => ({
    ...item,
    status: CredentialStatus.REVOKED,
  }));

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
      creds: credsCacheMock,
    },
    connectionsCache: {
      connections: connectionsForNotifications,
    },
    notificationsCache: {
      notifications: notificationsFix,
    },
    biometricsCache: {
      enabled: false,
    },
  };

  test("Render empty active credentials & full revoked tab", async () => {
    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const credMock = {
      ...credRequestFix,
      credentials: [
        {
          ...credRequestFix.credentials[0],
          status: CredentialStatus.REVOKED,
        },
      ],
    };

    const history = createMemoryHistory();

    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <IonReactMemoryRouter history={history}>
          <ChooseCredential
            pageId="multi-sign"
            activeStatus
            onBack={jest.fn()}
            onClose={jest.fn()}
            notificationDetails={notificationsFix[4]}
            credentialRequest={credMock}
            reloadData={jest.fn}
            linkedGroup={null}
          />
        </IonReactMemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.notifications.details.credential.request
            .choosecredential.title
        )
      ).toBeVisible();
    });

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.notifications.details.credential.request.choosecredential.noactive.replace(
          "{{requestCred}}",
          credRequestFix.schema.name
        )
      )
    ).toBeVisible();

    const segment = getByTestId("choose-credential-segment");

    act(() => {
      ionFireEvent.ionChange(segment, "revoked");
    });

    await waitFor(() =>
      expect(
        getByTestId("card-item-" + credRequestFix.credentials[0].acdc.d)
      ).toBeVisible()
    );
  });
});
