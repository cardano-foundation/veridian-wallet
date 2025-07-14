import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import {
  ionFireEvent as fireEvent,
  waitForIonicReact,
} from "@ionic/react-test-utils";
import { getDefaultNormalizer, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { Agent } from "../../../core/agent/agent";
import {
  ConnectionHistoryItem,
  ConnectionNoteDetails,
  ConnectionStatus,
} from "../../../core/agent/agent.types";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { filteredIdentifierFix } from "../../__fixtures__/filteredIdentifierFix";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../utils/formatters";
import { passcodeFiller } from "../../utils/passcodeFiller";
import { ConnectionDetails } from "./ConnectionDetails";
import { ConnectionHistoryType } from "../../../core/agent/services/connectionService.types";
import { makeTestStore } from "../../utils/makeTestStore";

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen, ...props }: any) =>
    isOpen ? <div data-testid={props["data-testid"]}>{children}</div> : null,
}));

jest.mock("../../hooks/useBiometricsHook", () => ({
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

const deleteStaleLocalConnectionByIdMock = jest.fn();
const deleteConnection = jest.fn();
const markConnectionPendingDeleteMock = jest.fn();

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA:
      "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.",
    agent: {
      connections: {
        getConnectionById: jest.fn(),
        getConnectionHistoryById: jest.fn(),
        deleteStaleLocalConnectionById: () =>
          deleteStaleLocalConnectionByIdMock(),
        deleteConnectionById: () => deleteConnection(),
        markConnectionPendingDelete: () => markConnectionPendingDeleteMock(),
      },
      credentials: {
        getCredentialDetailsById: jest.fn(),
        getCredentials: jest.fn(() => Promise.resolve([])),
      },
      basicStorage: {
        deleteById: jest.fn(() => Promise.resolve()),
      },
      auth: {
        verifySecret: jest.fn().mockResolvedValue(true),
      },
    },
  },
}));

const dispatchMock = jest.fn();
const initialStateFull = {
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
  credsCache: {
    creds: filteredCredsFix,
  },
  credsArchivedCache: {
    creds: filteredCredsFix,
  },
  connectionsCache: {
    connections: connectionsFix,
  },
  biometricsCache: {
    enabled: false,
  },
  identifiersCache: {
    identifiers: filteredIdentifierFix,
  },
};

describe("ConnectionDetails Page", () => {
  afterEach(() => {
    document.getElementsByTagName("html")[0].innerHTML = "";
  });

  beforeEach(() => {
    jest.spyOn(Agent.agent.connections, "getConnectionById").mockImplementation(
      (): Promise<MockConnectionDetails> =>
        Promise.resolve({
          id: "ebfeb1ebc6f1c276ef71212ec20",
          label: "Cambridge University",
          createdAtUTC: "2017-08-14T19:23:24Z",
          logo: ".png",
          status: ConnectionStatus.CONFIRMED,
          notes: [
            {
              id: "ebfeb1ebc6f1c276ef71212ec20",
              title: "Title",
              message: "Message",
            },
          ],
          historyItems: [
            {
              id: "1",
              type: 3,
              timestamp: "2024-08-07T15:33:18.204Z",
              credentialType: "Qualified vLEI Issuer Credential",
            },
          ],
          serviceEndpoints: [],
        })
    );
  });

  test("Open and Close ConnectionOptions", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.label)
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    await waitFor(() =>
      expect(getByTestId("delete-button-connection-details")).toBeVisible()
    );
  });

  test("Delete button in the footer triggers a confirmation alert", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, getByText, findByTestId, queryByText } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    const alertDeleteConnection = await findByTestId(
      "alert-confirm-delete-connection-container"
    );
    expect(alertDeleteConnection).toHaveClass("alert-invisible");

    const deleteButton = await findByTestId("delete-button-connection-details");
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.connections.details.options.alert
            .deleteconnection.title
        )
      ).toBeVisible()
    );

    act(() => {
      fireEvent.click(
        getByTestId("alert-confirm-delete-connection-confirm-button")
      );
    });

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(markConnectionPendingDeleteMock).toBeCalled();
    });
  });

  test("Show loading spin when load data", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, unmount } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    expect(getByTestId("connection-detail-spinner-container")).toBeVisible();
    unmount();
  });

  test("Hide loading spin after load data", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    expect(getByTestId("connection-detail-spinner-container")).toBeVisible();

    await waitFor(() => {
      expect(queryByTestId("connection-detail-spinner-container")).toBe(null);
    });
  });

  test("Open Manage Connection notes modal", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId("connection-detail-spinner-container")).toBe(null);
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    await waitFor(() =>
      expect(getByTestId("connection-options-manage-button")).toBeVisible()
    );

    act(() => {
      fireEvent.click(getByTestId("connection-options-manage-button"));
    });

    await waitForIonicReact();

    await waitFor(() =>
      expect(getByTestId("edit-connections-modal")).toBeVisible()
    );
  });

  test("We can switch between tabs", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { queryByTestId, getByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[1]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("connection-details-segment")).toBeVisible();
    });

    await waitFor(() =>
      expect(getByTestId("connection-details-tab")).toBeVisible()
    );

    const segment = getByTestId("connection-details-segment");
    act(() => {
      fireEvent.ionChange(segment, "notes");
    });

    await waitFor(() =>
      expect(queryByTestId("connection-details-tab")).toBeNull()
    );

    await waitFor(() =>
      expect(getByTestId("connection-notes-tab")).toBeVisible()
    );

    act(() => {
      fireEvent.ionChange(segment, "details");
    });

    await waitFor(() =>
      expect(queryByTestId("connection-notes-tab")).toBeNull()
    );

    await waitFor(() =>
      expect(getByTestId("connection-details-tab")).toBeVisible()
    );
  });

  test("Can restrict view to not be able to delete connection", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
          restrictedOptions={true}
        />
      </Provider>
    );

    // Wait until normal page is loaded
    await waitFor(() =>
      expect(getByTestId("action-button")).toBeInTheDocument()
    );

    expect(
      queryByTestId("delete-button-connection-details")
    ).not.toBeInTheDocument();

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

interface MockConnectionDetails {
  id: string;
  label: string;
  createdAtUTC: string;
  logo: string;
  status: ConnectionStatus;
  notes: ConnectionNoteDetails[];
  historyItems: ConnectionHistoryItem[];
  serviceEndpoints: string[];
}

describe("Checking the Connection Details Page when no notes are available", () => {
  beforeEach(() => {
    jest.spyOn(Agent.agent.connections, "getConnectionById").mockImplementation(
      (): Promise<MockConnectionDetails> =>
        Promise.resolve({
          id: "ebfeb1ebc6f1c276ef71212ec20",
          label: "Cambridge University",
          createdAtUTC: "2017-08-14T19:23:24Z",
          logo: ".png",
          status: "pending" as ConnectionStatus,
          notes: [],
          historyItems: [],
          serviceEndpoints: [],
        })
    );
  });

  test("We can see the connection notes placeholder", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("connection-details-segment")).toBeVisible();
    });

    await waitFor(() =>
      expect(getByTestId("connection-details-tab")).toBeVisible()
    );

    const segment = getByTestId("connection-details-segment");
    act(() => {
      fireEvent.ionChange(segment, "notes");
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.nocurrentnotesext)
      ).toBeVisible();
    });
  });
});

describe("Checking the Connection Details Page when notes are available", () => {
  beforeEach(() => {
    jest.spyOn(Agent.agent.connections, "getConnectionById").mockImplementation(
      (): Promise<MockConnectionDetails> =>
        Promise.resolve({
          id: "ebfeb1ebc6f1c276ef71212ec20",
          label: "Cambridge University",
          createdAtUTC: "2017-08-14T19:23:24Z",
          logo: ".png",
          status: "pending" as ConnectionStatus,
          notes: [
            {
              id: "ebfeb1ebc6f1c276ef71212ec20",
              title: "Title",
              message: "Message",
            },
          ],
          historyItems: [
            {
              id: "1",
              type: 1,
              timestamp: "2017-01-14T19:23:24Z",
              credentialType: "Qualified vLEI Issuer Credential",
            },
          ],
          serviceEndpoints: [],
        })
    );
  });

  test("We can see the connection notes being displayed", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("connection-details-segment")).toBeVisible();
    });

    await waitFor(() =>
      expect(getByTestId("connection-details-tab")).toBeVisible()
    );

    const segment = getByTestId("connection-details-segment");
    act(() => {
      fireEvent.ionChange(segment, "notes");
    });

    await waitFor(() => expect(getByText("Title")).toBeVisible());

    await waitFor(() => expect(getByText("Message")).toBeVisible());
  });

  test("Get all connection history items", async () => {
    const historyEvents = [
      {
        id: "3",
        type: 3,
        timestamp: "2024-08-07T15:33:18.204Z",
        credentialType: "Qualified vLEI Issuer Credential",
      },
      {
        id: "2",
        type: 2,
        timestamp: "2024-08-07T15:32:26.006Z",
        credentialType: "Qualified vLEI Issuer Credential",
      },
      {
        id: "1",
        type: 1,
        timestamp: "2024-08-07T15:32:13.597Z",
        credentialType: "Qualified vLEI Issuer Credential",
      },
      {
        id: "0",
        type: 0,
        timestamp: "2024-08-07T15:31:17.382Z",
        credentialType: "Qualified vLEI Issuer Credential",
      },
    ];

    const connectionDetails = {
      ...connectionsFix[6],
      serviceEndpoints: [
        "http://keria:3902/oobi/EBvcao4Ub-Q7Wwkm0zJzwigvPTrthP4uH5mQ4efRv9aU/agent/EBJBjEDV_ysVyJHg7fDdqB332gCVhpgb6a3a00BtmWdg?name=The%20Pentagon",
      ],
      notes: [],
      historyItems: historyEvents,
    };

    jest
      .spyOn(Agent.agent.connections, "getConnectionById")
      .mockResolvedValue(connectionDetails);

    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByText, getAllByText } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionDetails}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getAllByText(connectionDetails.label)[0]).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByText(
          `${EN_TRANSLATIONS.tabs.connections.details.connectedwith.replace(
            "{{ issuer }}",
            connectionDetails.label
          )}`
        )
      ).toBeVisible();
      expect(
        getByText(
          `${formatShortDate(
            connectionDetails.createdAtUTC
          )} - ${formatTimeToSec(
            connectionDetails.createdAtUTC
          )} (${getUTCOffset(connectionDetails.createdAtUTC)})`
        )
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByText(
          `${EN_TRANSLATIONS.tabs.connections.details.issuance.replace(
            "{{ credential }}",
            historyEvents[0].credentialType
              ?.replace(/([A-Z][a-z])/g, " $1")
              .replace(/^ /, "")
              .replace(/(\d)/g, "$1")
              .replace(/ {2,}/g, " ")
          )}`
        )
      ).toBeVisible();
      expect(
        getByText(
          `${formatShortDate(historyEvents[0].timestamp)} - ${formatTimeToSec(
            historyEvents[0].timestamp
          )} (${getUTCOffset(historyEvents[0].timestamp)})`
        )
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByText(
          `${EN_TRANSLATIONS.tabs.connections.details.requestpresent.replace(
            "{{ issuer }}",
            connectionDetails.label
          )}`
        )
      ).toBeVisible();

      expect(
        getByText(
          `${formatShortDate(historyEvents[1].timestamp)} - ${formatTimeToSec(
            historyEvents[1].timestamp
          )} (${getUTCOffset(historyEvents[1].timestamp)})`
        )
      ).toBeVisible();
    });

    await waitFor(() => {
      expect(
        getByText(
          `${EN_TRANSLATIONS.tabs.connections.details.presented.replace(
            "{{ credentialType }}",
            historyEvents[3].credentialType
          )}`
        )
      ).toBeVisible();
      expect(
        getByText(
          `${formatShortDate(historyEvents[3].timestamp)} - ${formatTimeToSec(
            historyEvents[3].timestamp
          )} (${getUTCOffset(historyEvents[3].timestamp)})`
        )
      ).toBeVisible();
    });
    await waitFor(() => {
      expect(
        getByText(
          `${EN_TRANSLATIONS.tabs.connections.details.update.replace(
            "{{ credential }}",
            historyEvents[1].credentialType
              ?.replace(/([A-Z][a-z])/g, " $1")
              .replace(/^ /, "")
              .replace(/(\d)/g, "$1")
              .replace(/ {2,}/g, " ")
          )}`
        )
      ).toBeVisible();
      expect(
        getByText(
          `${formatShortDate(historyEvents[3].timestamp)} - ${formatTimeToSec(
            historyEvents[3].timestamp
          )} (${getUTCOffset(historyEvents[3].timestamp)})`
        )
      ).toBeVisible();
    });
  });
});

describe("Checking the Connection Details Page when connection is missing from the cloud", () => {
  beforeEach(() => {
    jest
      .spyOn(Agent.agent.connections, "getConnectionById")
      .mockImplementation(() => {
        throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: id`);
      });
  });

  test("Connection exists in the database but not on Signify", async () => {
    const storeMocked = {
      ...makeTestStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const handleCloseConnectionModal = jest.fn();
    const { getByText, getByTestId, getAllByText, getAllByTestId } = render(
      <Provider store={storeMocked}>
        <ConnectionDetails
          connectionShortDetails={connectionsFix[0]}
          handleCloseConnectionModal={handleCloseConnectionModal}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId("connection-details-cloud-error-page")).toBeVisible();
      expect(
        getByText(EN_TRANSLATIONS.tabs.connections.details.clouderror, {
          normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
        })
      ).toBeVisible();
    });

    act(() => {
      fireEvent.click(getByTestId("delete-button-connection-details"));
    });

    await waitFor(() =>
      expect(
        getAllByText(
          EN_TRANSLATIONS.tabs.connections.details.options.alert
            .deleteconnection.title
        )[0]
      ).toBeVisible()
    );

    fireEvent.click(
      getAllByTestId("alert-confirm-delete-connection-confirm-button")[0]
    );

    await waitFor(() => {
      expect(getByTestId("verify-passcode")).toBeVisible();
    });

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });

    await passcodeFiller(getByText, getByTestId, "193212");

    await waitFor(() => {
      expect(deleteStaleLocalConnectionByIdMock).toBeCalled();
    });
  });
});
