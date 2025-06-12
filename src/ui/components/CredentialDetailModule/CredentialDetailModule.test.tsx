const getConnectionShortDetailByIdMock = jest.fn().mockResolvedValue([]);
const getConnectionByIdMock = jest.fn();

import { waitForIonicReact } from "@ionic/react-test-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { Agent } from "../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import {
  addFavouritesCredsCache,
  removeFavouritesCredsCache,
} from "../../../store/reducers/credsCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import {
  connectionsFix,
  connectionsMapFix,
} from "../../__fixtures__/connectionsFix";
import { credsFixAcdc, revokedCredFixs } from "../../__fixtures__/credsFix";
import { notificationsFix } from "../../__fixtures__/notificationsFix";
import { ToastMsgType } from "../../globals/types";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { CredentialDetailModule } from "./CredentialDetailModule";
import { initiatorConnectionShortDetails } from "../../../core/__fixtures__/agent/multiSigFixtures";

const path = TabsRoutePath.CREDENTIALS + "/" + credsFixAcdc[0].id;

const archiveCredential = jest.fn();
const deleteCredential = jest.fn();
const deleteNotificationRecordById = jest.fn();
const markCredentialPendingDeletion = jest.fn();
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
        restoreCredential: jest.fn(() => Promise.resolve(true)),
        getCredentialShortDetailsById: jest.fn(() => Promise.resolve([])),
        getCredentials: jest.fn(() => Promise.resolve(true)),
        archiveCredential: () => archiveCredential(),
        deleteCredential: () => deleteCredential(),
        markCredentialPendingDeletion: () => markCredentialPendingDeletion(),
      },
      connections: {
        getConnectionShortDetailById: getConnectionShortDetailByIdMock,
        getConnectionById: getConnectionByIdMock,
      },
      basicStorage: {
        findById: jest.fn(),
        save: jest.fn(),
        createOrUpdateBasicRecord: jest.fn().mockResolvedValue(undefined),
      },
      keriaNotifications: {
        deleteNotificationRecordById: () => deleteNotificationRecordById(),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
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

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

const mockStore = configureStore();
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
  credsCache: { creds: credsFixAcdc, favourites: [] },
  credsArchivedCache: { creds: credsFixAcdc },
  biometricsCache: {
    enabled: false,
  },
  notificationsCache: {
    notificationDetailCache: null,
  },
  identifiersCache: {
    identifiers: {},
  },
  connectionsCache: {
    connections: connectionsMapFix,
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
  credsCache: { creds: [] },
  credsArchivedCache: { creds: [] },
  biometricsCache: {
    enabled: false,
  },
  notificationsCache: {
    notificationDetailCache: null,
  },
  identifiersCache: {
    identifiers: {},
  },
  connectionsCache: {
    connections: connectionsMapFix,
  },
};

describe("Cred Detail Module - current not archived credential", () => {
  let storeMocked: Store<unknown, AnyAction>;
  beforeEach(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockImplementation(() => Promise.resolve(credsFixAcdc[0]));
  });
  beforeEach(() => {
    const mockStore = configureStore();
    const dispatchMock = jest.fn();
    storeMocked = {
      ...mockStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };
  });

  test("It renders Credential Details content", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );
    await waitFor(() => {
      expect(getByTestId("card-details-content")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(getByTestId("credential-card-details-footer")).toBeInTheDocument();
    });
  });

  test("It renders cloud error", async () => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockImplementation(() => Promise.reject(new Error("Not found")));

    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByTestId("credential-card-details-cloud-error-page")
      ).toBeVisible();
    });
  });

  test("It opens the options modal", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("cred-detail-spinner-container")).toBe(null);
    });

    expect(queryByTestId("creds-options-modal")).toBe(null);

    const optionsButton = await getByTestId("options-button");

    act(() => {
      fireEvent.click(optionsButton);
    });

    await waitFor(() => {
      expect(queryByTestId("creds-options-modal")).toBeVisible();
    });
  });

  test("It shows the warning when I click on the big archive button", async () => {
    const {
      findByTestId,
      queryAllByTestId,
      getByTestId,
      getAllByTestId,
      findByText,
    } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );
    const archiveButton = await findByTestId(
      "archive-button-credential-card-details"
    );
    act(() => {
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(queryAllByTestId("alert-delete-archive")[0]).toBeInTheDocument();
    });

    const alertTile = await findByText(
      EN_TRANSLATIONS.tabs.credentials.details.alert.archive.title
    );

    await waitFor(() => {
      expect(alertTile).toBeVisible();
    });

    fireEvent.click(getAllByTestId("alert-delete-archive-confirm-button")[0]);

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });
  });

  test("It changes to favourite icon on click disabled favourite button", async () => {
    const storeMocked = {
      ...mockStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };

    const mockNow = 1466424490000;
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(mockNow);

    const { queryByTestId, findByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("cred-detail-spinner-container")).toBe(null);
    });

    const heartButton = await findByTestId("heart-button");

    act(() => {
      fireEvent.click(heartButton);
    });

    await waitForIonicReact();

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        addFavouritesCredsCache({
          id: credsFixAcdc[0].id,
          time: mockNow,
        })
      );
    });

    dateSpy.mockRestore();
  });

  test("Remove favourite credential", async () => {
    const mockNow = 1466424490000;

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
      credsCache: {
        creds: credsFixAcdc,
        favourites: [
          {
            id: credsFixAcdc[0].id,
            time: mockNow,
          },
        ],
      },
      notificationsCache: {
        notificationDetailCache: null,
      },
      identifiersCache: {
        identifiers: {},
      },
      connectionsCache: {
        connections: connectionsMapFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };

    const { findByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("cred-detail-spinner-container")).toBe(null);
    });

    const heartButton = await findByTestId("heart-button");

    act(() => {
      fireEvent.click(heartButton);
    });

    await waitForIonicReact();

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        removeFavouritesCredsCache(credsFixAcdc[0].id)
      );
    });
  });

  test("Maximum favourite credential", async () => {
    const mockNow = 1466424490000;

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
      credsCache: {
        creds: credsFixAcdc,
        favourites: new Array(5).map((_, index) => ({
          id: index,
          time: mockNow,
        })),
      },
      identifiersCache: {
        identifiers: {},
      },
      notificationsCache: {
        notificationDetailCache: null,
      },
      connectionsCache: {
        connections: connectionsMapFix,
      },
      biometricsCache: {
        enabled: false,
      },
    };

    const storeMocked = {
      ...mockStore(initialStateNoPasswordCurrent),
      dispatch: dispatchMock,
    };

    const { findByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("cred-detail-spinner-container")).toBe(null);
    });

    const heartButton = await findByTestId("heart-button");

    act(() => {
      fireEvent.click(heartButton);
    });

    await waitForIonicReact();

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.MAX_FAVOURITES_REACHED)
      );
    });
  });

  test("archive credential", async () => {
    const { getByText, getByTestId, findByText, unmount } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );
    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.button.archive)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.button.archive)
    );

    const alertTitle = await findByText(
      EN_TRANSLATIONS.tabs.credentials.details.alert.archive.title
    );
    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.alert.archive.confirm)
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(archiveCredential).toBeCalled();
    });

    unmount();
  });

  test("Can view connection details, and cannot delete the connection from this view", async () => {
    getConnectionShortDetailByIdMock.mockResolvedValue(
      initiatorConnectionShortDetails
    );
    getConnectionByIdMock.mockResolvedValueOnce(connectionsFix[2]);

    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("credential-details-issuer")).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("credential-details-issuer"));
    });

    await waitFor(() => {
      expect(queryByTestId("action-button")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        queryByTestId("delete-button-connection-details")
      ).not.toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    await waitFor(() => {
      expect(
        getByTestId("connection-options-manage-button")
      ).toBeInTheDocument();
    });

    expect(
      queryByTestId("delete-button-connection-options")
    ).not.toBeInTheDocument();
  });
});

describe("Cred Detail Module - archived", () => {
  let storeMocked: Store<unknown, AnyAction>;
  const credDispatchMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(credsFixAcdc[0]);
  });
  beforeEach(() => {
    const mockStore = configureStore();
    storeMocked = {
      ...mockStore(initialStateNoPasswordArchived),
      dispatch: credDispatchMock,
    };
  });

  test("It shows the restore alert", async () => {
    const { queryByText, getByText, queryAllByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.credentials.details.restore)
      ).toBeVisible();
    });

    const restoreButton = getByText(
      EN_TRANSLATIONS.tabs.credentials.details.restore
    );

    act(() => {
      fireEvent.click(restoreButton);
    });

    await waitFor(() => {
      expect(queryAllByTestId("alert-restore")[0]).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.credentials.details.alert.restore.title
        )
      ).toBeVisible();
    });
  });

  test("Restore func", async () => {
    const { queryByText, getByText, queryAllByTestId, getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        queryByText(EN_TRANSLATIONS.tabs.credentials.details.restore)
      ).toBeVisible();
    });

    const restoreButton = getByText(
      EN_TRANSLATIONS.tabs.credentials.details.restore
    );

    act(() => {
      fireEvent.click(restoreButton);
    });

    await waitFor(() => {
      expect(queryAllByTestId("alert-restore")[0]).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.credentials.details.alert.restore.title
        )
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("alert-restore-confirm-button"));
    });

    await waitFor(() => {
      expect(credDispatchMock).toBeCalledWith(
        setToastMsg(ToastMsgType.CREDENTIAL_RESTORED)
      );
    });
  });

  test("Delete cred", async () => {
    const { queryByText, getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.button.delete)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.button.delete)
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.alert.delete.title)
      ).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.alert.delete.confirm)
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markCredentialPendingDeletion).toBeCalled();
    });
  });
});

describe("Cred Detail Module - light mode", () => {
  let storeMocked: Store<unknown, AnyAction>;
  const credDispatchMock = jest.fn();

  const state = {
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
    credsCache: { creds: credsFixAcdc },
    credsArchivedCache: { creds: [] },
    biometricsCache: {
      enabled: false,
    },
    identifiersCache: {
      identifiers: {},
    },
    notificationsCache: {
      notificationDetailCache: {
        notificationId: "test-id",
        viewCred: "test-cred",
        step: 0,
      },
    },
    connectionsCache: {
      connections: connectionsMapFix,
    },
  };

  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(credsFixAcdc[0]);
  });
  beforeEach(() => {
    const mockStore = configureStore();
    storeMocked = {
      ...mockStore(state),
      dispatch: credDispatchMock,
    };
  });

  test("It show notification cred mode", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
          isLightMode
          selected={false}
          setSelected={jest.fn}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("notification-selected")).toBeVisible();
    });
  });
});

describe("Cred detail - revoked", () => {
  let storeMocked: Store<unknown, AnyAction>;
  const credDispatchMock = jest.fn();

  const state = {
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
    identifiersCache: {
      identifiers: {},
    },
    credsCache: { creds: credsFixAcdc },
    credsArchivedCache: { creds: [] },
    biometricsCache: {
      enabled: false,
    },
    notificationsCache: {
      notificationDetailCache: {
        notificationId: "test-id",
        viewCred: "test-cred",
        step: 0,
      },
      notifications: [
        {
          ...notificationsFix[0],
          a: {
            ...notificationsFix[0].a,
            credentialId: credsFixAcdc[0].id,
          },
        },
      ],
    },
    connectionsCache: {
      connections: connectionsMapFix,
    },
  };

  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(revokedCredFixs[0]);
  });

  beforeEach(() => {
    const mockStore = configureStore();
    storeMocked = {
      ...mockStore(state),
      dispatch: credDispatchMock,
    };
  });

  test("It show notification revoke mode", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.status.revoked)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.delete)
      ).toBeVisible();
    });
  });

  test("Delete revoke credential", async () => {
    const { getByText, getByTestId, findByText } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.status.revoked)
      ).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.credentials.details.delete)
      ).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.tabs.credentials.details.delete));

    const alertTitle = await findByText(
      EN_TRANSLATIONS.tabs.credentials.details.alert.delete.title
    );
    await waitFor(() => {
      expect(alertTitle).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.tabs.credentials.details.alert.delete.confirm)
    );

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(archiveCredential).toBeCalled();
      expect(markCredentialPendingDeletion).toBeCalled();
      expect(deleteNotificationRecordById).toBeCalled();
    });
  });
});

describe("Cred detail - view only", () => {
  let storeMocked: Store<unknown, AnyAction>;
  const credDispatchMock = jest.fn();

  const state = {
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
    credsCache: { creds: credsFixAcdc },
    credsArchivedCache: { creds: [] },
    biometricsCache: {
      enabled: false,
    },
    identifiersCache: {
      identifiers: {},
    },
    notificationsCache: {
      notificationDetailCache: {
        notificationId: "test-id",
        viewCred: "test-cred",
        step: 0,
      },
    },
    connectionsCache: {
      connections: connectionsMapFix,
    },
  };

  beforeAll(() => {
    jest
      .spyOn(Agent.agent.credentials, "getCredentialDetailsById")
      .mockResolvedValue(revokedCredFixs[0]);
  });

  beforeEach(() => {
    const mockStore = configureStore();
    storeMocked = {
      ...mockStore(state),
      dispatch: credDispatchMock,
    };
  });

  test("It show notification revoke mode", async () => {
    const { queryByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <CredentialDetailModule
          pageId="credential-card-details"
          id={credsFixAcdc[0].id}
          onClose={jest.fn()}
          credDetail={credsFixAcdc[0]}
          viewOnly
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("action-button")).toBe(null);

      expect(queryByText(EN_TRANSLATIONS.tabs.credentials.details.delete)).toBe(
        null
      );
    });
  });
});
