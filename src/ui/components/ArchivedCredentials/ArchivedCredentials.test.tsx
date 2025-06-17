import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import {
  filteredCredsFix,
  revokedCredsFix,
} from "../../__fixtures__/filteredCredsFix";
import { notificationsFix } from "../../__fixtures__/notificationsFix";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { ArchivedCredentialsContainer } from "./ArchivedCredentials";
import { credsFixAcdc } from "../../__fixtures__/credsFix";
import { filteredIdentifierMapFix } from "../../__fixtures__/filteredIdentifierFix";

const deleteCredentialsMock = jest.fn((id: string) => Promise.resolve(true));
const deleteNotificationMock = jest.fn(() => Promise.resolve(true));
const markCredentialPendingDeletionMock = jest.fn((id: string) =>
  Promise.resolve(true)
);

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        restoreCredential: jest.fn((id: string) => Promise.resolve(id)),
        deleteCredential: (id: string) => deleteCredentialsMock(id),
        getCredentials: jest.fn().mockResolvedValue([]),
        archiveCredential: jest.fn(),
        markCredentialPendingDeletion: (id: string) =>
          markCredentialPendingDeletionMock(id),
        getCredentialDetailsById: jest.fn(() =>
          Promise.resolve(credsFixAcdc[0])
        ),
      },
      keriaNotifications: {
        deleteNotificationRecordById: () => deleteNotificationMock(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
      connections: {
        getConnectionShortDetailById: jest.fn(() => Promise.resolve([])),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const initialStateEmpty = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
  credsCache: {
    creds: [],
  },
  notificationsCache: {
    notifications: [],
  },
  biometricsCache: {
    enabled: false,
  },
  connectionsCache: {
    connections: {},
    multisigConnections: {},
  },
  identifiersCache: {
    identifiers: filteredIdentifierMapFix,
  },
};

let mockedStore: Store<unknown, AnyAction>;
describe("Archived and revoked credentials", () => {
  const mockStore = configureStore();
  const dispatchMock = jest.fn();

  beforeEach(() => {
    mockedStore = {
      ...mockStore(initialStateEmpty),
      dispatch: dispatchMock,
    };
  });

  test("Render archived credentials", async () => {
    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <ArchivedCredentialsContainer
          revokedCreds={[]}
          archivedCredentialsIsOpen={true}
          archivedCreds={filteredCredsFix}
          setArchivedCredentialsIsOpen={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("action-button")).toBeVisible();
    });

    filteredCredsFix.forEach((cred) => {
      expect(getByTestId(`credential-name-${cred.id}`).innerHTML).toBe(
        cred.credentialType
      );
    });

    expect(getByTestId("action-button").children.item(0)?.innerHTML).toBe(
      "Select"
    );
  });

  test("Show cred detail", async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={mockedStore}>
        <ArchivedCredentialsContainer
          revokedCreds={[]}
          archivedCredentialsIsOpen={true}
          archivedCreds={filteredCredsFix}
          setArchivedCredentialsIsOpen={jest.fn()}
        />
      </Provider>
    );

    expect(queryByTestId("archived-credential-detail-modal")).toBe(null);

    const cardItem = getByTestId(
      `crendential-card-item-${filteredCredsFix[0].id}`
    );

    act(() => {
      fireEvent.click(cardItem);
    });

    await waitFor(() => {
      expect(getByTestId("archived-credential-detail-modal")).toBeVisible();
    });
  });

  describe("Archived credentials", () => {
    test("Restore multiple archived credentials", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={mockedStore}>
          <ArchivedCredentialsContainer
            revokedCreds={[]}
            archivedCredentialsIsOpen={true}
            archivedCreds={filteredCredsFix}
            setArchivedCredentialsIsOpen={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("action-button")).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByText("Select"));
      });

      await waitFor(() => {
        expect(getByTestId("action-button").children.item(0)?.innerHTML).toBe(
          "Cancel"
        );
      });

      await waitFor(() => {
        expect(getByText("0 Credentials Selected")).toBeVisible();
      });

      const cardItem = getByTestId(
        `crendential-card-item-${filteredCredsFix[0].id}`
      );
      fireEvent.click(cardItem);

      await waitFor(() => {
        expect(getByTestId("selected-amount-credentials").innerHTML).toBe(
          "1 Credential Selected"
        );
      });

      fireEvent.click(getByTestId("restore-credentials"));

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.tabs.credentials.details.alert.restore.confirm
          )
        ).toBeVisible();
      });

      fireEvent.click(
        getByText(
          EN_TRANSLATIONS.tabs.credentials.details.alert.restore.confirm
        )
      );

      await waitFor(() => {
        expect(dispatchMock).toBeCalledTimes(3);
      });
    });

    test("Delete multiple archived credential", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={mockedStore}>
          <ArchivedCredentialsContainer
            revokedCreds={[]}
            archivedCredentialsIsOpen={true}
            archivedCreds={filteredCredsFix}
            setArchivedCredentialsIsOpen={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("action-button")).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByText("Select"));
      });

      await waitFor(() => {
        expect(getByTestId("action-button").children.item(0)?.innerHTML).toBe(
          "Cancel"
        );

        expect(getByTestId("delete-credentials")).toBeVisible();
      });

      await waitFor(() => {
        expect(getByText("0 Credentials Selected")).toBeVisible();
      });

      const cardItem = getByTestId(
        `crendential-card-item-${filteredCredsFix[0].id}`
      );

      act(() => {
        fireEvent.click(cardItem);
        fireEvent.click(getByTestId("delete-credentials"));
      });

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.tabs.credentials.details.alert.delete.confirm
          )
        ).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByTestId("alert-delete-confirm-button"));
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
      });

      await passcodeFiller(getByText, getByTestId, "193212");

      await waitFor(() => {
        expect(markCredentialPendingDeletionMock).toBeCalled();
      });
    });
  });

  describe("Revoked credentials", () => {
    const state = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
        },
      },
      seedPhraseCache: {},
      credsCache: {
        creds: revokedCredsFix,
      },
      notificationsCache: {
        notifications: [
          {
            ...notificationsFix[0],
            a: {
              ...notificationsFix[0].a,
              credentialId: revokedCredsFix[0].id,
            },
          },
        ],
      },
      biometricsCache: {
        enabled: false,
      },
      connectionsCache: {
        connections: {},
        multisigConnections: {},
      },

      identifiersCache: {
        identifiers: filteredIdentifierMapFix,
      },
    };

    const mockedStore = {
      ...mockStore(state),
      dispatch: dispatchMock,
    };

    test("Delete multiple revoked credential", async () => {
      const { getByText, getByTestId, getAllByTestId } = render(
        <Provider store={mockedStore}>
          <ArchivedCredentialsContainer
            revokedCreds={revokedCredsFix}
            archivedCredentialsIsOpen={true}
            archivedCreds={filteredCredsFix}
            setArchivedCredentialsIsOpen={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("action-button")).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByText("Select"));
      });

      await waitFor(() => {
        expect(getByTestId("action-button").children.item(0)?.innerHTML).toBe(
          "Cancel"
        );

        expect(getByTestId("delete-credentials")).toBeVisible();
      });

      await waitFor(() => {
        expect(getByText("0 Credentials Selected")).toBeVisible();
      });

      const cardItem = getByTestId(
        `crendential-card-item-${revokedCredsFix[0].id}`
      );

      act(() => {
        fireEvent.click(cardItem);
        fireEvent.click(getByTestId("delete-credentials"));
      });

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.tabs.credentials.details.alert.delete.confirm
          )
        ).toBeVisible();
      });

      act(() => {
        fireEvent.click(getAllByTestId("alert-delete-confirm-button")[0]);
      });

      await waitFor(() => {
        expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
      });

      await passcodeFiller(getByText, getByTestId, "193212");

      await waitFor(() => {
        expect(markCredentialPendingDeletionMock).toBeCalled();
        expect(deleteNotificationMock).toBeCalled();
      });
    });

    test("Restore revoked credentials", async () => {
      const { getByText, getByTestId } = render(
        <Provider store={mockedStore}>
          <ArchivedCredentialsContainer
            revokedCreds={revokedCredsFix}
            archivedCredentialsIsOpen={true}
            archivedCreds={filteredCredsFix}
            setArchivedCredentialsIsOpen={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId("action-button")).toBeVisible();
      });

      act(() => {
        fireEvent.click(getByText("Select"));
      });

      await waitFor(() => {
        expect(getByTestId("action-button").children.item(0)?.innerHTML).toBe(
          "Cancel"
        );
      });

      await waitFor(() => {
        expect(getByText("0 Credentials Selected")).toBeVisible();
      });

      const cardItem = getByTestId(
        `crendential-card-item-${revokedCredsFix[0].id}`
      );
      fireEvent.click(cardItem);

      await waitFor(() => {
        expect(getByTestId("selected-amount-credentials").innerHTML).toBe(
          "1 Credential Selected"
        );
      });

      act(() => {
        fireEvent.click(getByTestId("restore-credentials"));
      });

      await waitFor(() => {
        expect(
          getByText(
            EN_TRANSLATIONS.tabs.credentials.archived.alert.restorerevoked.title
          )
        ).toBeVisible();
      });
    });
  });
});
