import { act, render, waitFor } from "@testing-library/react";
import {
  ionFireEvent as fireEvent,
  waitForIonicReact,
} from "@ionic/react-test-utils";
import { MemoryRouter, Route } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ConnectionStatus } from "../../../core/agent/agent.types";
import { RoutePath } from "../../../routes";
import { TabsRoutePath } from "../../../routes/paths";
import { filteredCredsFix } from "../../__fixtures__/filteredCredsFix";
import { connectionsFix } from "../../__fixtures__/connectionsFix";
import { Creds } from "../Creds";
import { ConnectionDetails } from "./ConnectionDetails";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { AriesAgent } from "../../../core/agent/agent";

jest.mock("../../../core/agent/agent", () => ({
  AriesAgent: {
    agent: {
      connections: {
        getConnectionById: jest.fn(),
        getConnectionHistoryById: jest.fn(),
      },
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      genericRecords: {
        findById: jest.fn(),
      },
    },
  },
}));

jest.mock("@aparajita/capacitor-secure-storage", () => ({
  SecureStorage: {
    get: jest.fn(),
  },
}));

const mockStore = configureStore();
const dispatchMock = jest.fn();
const initialStateFull = {
  stateCache: {
    routes: [TabsRoutePath.CREDS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
  },
  seedPhraseCache: {},
  credsCache: {
    creds: filteredCredsFix,
  },
  connectionsCache: {
    connections: connectionsFix,
  },
};

describe("ConnectionDetails Page", () => {
  beforeEach(() => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockImplementation(
        (): Promise<MockConnectionDetails> =>
          Promise.resolve({
            id: "ebfeb1ebc6f1c276ef71212ec20",
            label: "Cambridge University",
            connectionDate: "2017-08-14T19:23:24Z",
            logo: ".png",
            status: "pending" as ConnectionStatus,
            notes: [
              {
                id: "ebfeb1ebc6f1c276ef71212ec20",
                title: "Title",
                message: "Message",
              },
            ],
          })
      );
  });

  test("Open and close ConnectionDetails", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[0].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

    await waitFor(() =>
      expect(queryByTestId("connection-details-page")).toBeVisible()
    );

    act(() => {
      fireEvent.click(getByTestId("close-button"));
    });

    await waitFor(() => {
      expect(getByText(connectionsFix[1].label)).toBeVisible();
    });
  });

  test("Open and Close ConnectionOptions", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
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
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText, findByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

    const alertDeleteConnection = await findByTestId(
      "alert-confirm-delete-connection"
    );
    expect(alertDeleteConnection).toHaveClass("alert-invisible");
    const deleteButton = await findByTestId("delete-button-connection-details");
    act(() => {
      fireEvent.click(deleteButton);
    });
    await waitFor(() =>
      expect(alertDeleteConnection).toHaveClass("alert-visible")
    );
  });

  test.skip("Delete button in the ConnectionOptions modal triggers a confirmation alert", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText, findByTestId } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

    act(() => {
      fireEvent.click(getByTestId("action-button"));
    });

    const alertDeleteConnection = await findByTestId(
      "alert-confirm-delete-connection"
    );
    expect(alertDeleteConnection).toHaveClass("alert-invisible");
    const deleteButton = await findByTestId("delete-button-connection-options");
    act(() => {
      fireEvent.click(deleteButton);
    });
    await waitFor(() =>
      expect(alertDeleteConnection).toHaveClass("alert-visible")
    );
  });

  test.skip("Open Manage Connection notes modal", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
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
      expect(getByTestId("edit-connections-modal")).toHaveAttribute(
        "is-open",
        "true"
      )
    );
  });

  test("We can switch between tabs", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[0].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

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
});

interface MockConnectionDetails {
  id: string;
  label: string;
  connectionDate: string;
  logo: string;
  status: ConnectionStatus;
  notes: any[];
}

describe("Checking the Connection Details Page when no notes are available", () => {
  beforeEach(() => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockImplementation(
        (): Promise<MockConnectionDetails> =>
          Promise.resolve({
            id: "ebfeb1ebc6f1c276ef71212ec20",
            label: "Cambridge University",
            connectionDate: "2017-08-14T19:23:24Z",
            logo: ".png",
            status: "pending" as ConnectionStatus,
            notes: [],
          })
      );
  });

  test("We can see the connection notes placeholder", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[0].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

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
        getByText(EN_TRANSLATIONS.connections.details.nocurrentnotesext)
      ).toBeVisible();
    });
  });
});

describe("Checking the Connection Details Page when notes are available", () => {
  beforeEach(() => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockImplementation(
        (): Promise<MockConnectionDetails> =>
          Promise.resolve({
            id: "ebfeb1ebc6f1c276ef71212ec20",
            label: "Cambridge University",
            connectionDate: "2017-08-14T19:23:24Z",
            logo: ".png",
            status: "pending" as ConnectionStatus,
            notes: [
              {
                id: "ebfeb1ebc6f1c276ef71212ec20",
                title: "Title",
                message: "Message",
              },
            ],
          })
      );
  });

  test("We can see the connection notes being displayed", async () => {
    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[0].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

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
});

describe("Checking the Connection Details Page when different Credentials are issued", () => {
  test("We can see the connection details for UniversityDegreeCredential", async () => {
    const historyEvent = {
      type: 0,
      timestamp: "2024-02-13T10:16:08.756Z",
      credentialType: "UniversityDegreeCredential",
    };
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockResolvedValue(connectionsFix[0]);

    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionHistoryById")
      .mockResolvedValue([historyEvent]);

    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };

    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[0].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[0].label));
    });

    await waitFor(() =>
      expect(getByText("Connected with \"Cambridge University\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("14/01/2017 - 19:23:24")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("Received \"University Degree Credential\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("13/02/2024 - 10:16:08")).toBeVisible()
    );

    await waitFor(() =>
      expect(
        document.getElementsByClassName("card-body-w3c-generic").length
      ).toBe(1)
    );
  });

  test("We can see the connection details for AccessPassCredential", async () => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockResolvedValue(connectionsFix[2]);

    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionHistoryById")
      .mockResolvedValue([
        {
          type: 0,
          timestamp: "2024-02-15T10:16:08.756Z",
          credentialType: "AccessPassCredential",
        },
      ]);

    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[2].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[2].label));
    });

    await waitFor(() =>
      expect(getByText("Connected with \"Cardano Foundation\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("13/01/2017 - 10:15:11")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("Received \"Access Pass Credential\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("15/02/2024 - 10:16:08")).toBeVisible()
    );

    await waitFor(() =>
      expect(
        document.getElementsByClassName("access-pass-credential").length
      ).toBe(1)
    );
  });

  test("We can see the connection details for PermanentResidentCard", async () => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockResolvedValue(connectionsFix[1]);

    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionHistoryById")
      .mockResolvedValue([
        {
          type: 0,
          timestamp: "2024-02-13T10:16:26.919Z",
          credentialType: "PermanentResidentCard",
        },
      ]);

    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[1].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[1].label));
    });

    await waitFor(() =>
      expect(getByText("Connected with \"Passport Office\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("16/01/2017 - 08:21:54")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("Received \"Permanent Resident Card\"")).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("13/02/2024 - 10:16:26")).toBeVisible()
    );

    await waitFor(() =>
      expect(
        document.getElementsByClassName("permanent-resident-card").length
      ).toBe(1)
    );
  });

  test("We can see the connection details for Qualified vLEI Issuer", async () => {
    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionById")
      .mockResolvedValue(connectionsFix[3]);

    jest
      .spyOn(AriesAgent.agent.connections, "getConnectionHistoryById")
      .mockResolvedValue([
        {
          type: 0,
          timestamp: "2024-02-13T11:39:22.919Z",
          credentialType: "Qualified vLEI Issuer Credential",
        },
      ]);

    const storeMocked = {
      ...mockStore(initialStateFull),
      dispatch: dispatchMock,
    };
    const { getByTestId, queryByTestId, getByText } = render(
      <MemoryRouter initialEntries={[TabsRoutePath.CREDS]}>
        <Provider store={storeMocked}>
          <Route
            path={TabsRoutePath.CREDS}
            component={Creds}
          />

          <Route
            path={RoutePath.CONNECTION_DETAILS}
            component={ConnectionDetails}
          />
        </Provider>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(getByTestId("connections-button"));
    });

    await waitFor(() => {
      expect(queryByTestId("connection-item-0")).toBeNull();
    });

    expect(getByText(connectionsFix[3].label)).toBeVisible();

    act(() => {
      fireEvent.click(getByText(connectionsFix[3].label));
    });

    await waitFor(() =>
      expect(
        getByText("Connected with \"45fc3e98-af6b-4797-bdf3-e2124a8089ee\"")
      ).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("13/02/2024 - 11:39:20")).toBeVisible()
    );

    await waitFor(() =>
      expect(
        getByText("Received \"Qualified vLEI Issuer Credential\"")
      ).toBeVisible()
    );

    await waitFor(() =>
      expect(getByText("13/02/2024 - 11:39:22")).toBeVisible()
    );

    await waitFor(() =>
      expect(document.getElementsByClassName("card-body-acdc").length).toBe(1)
    );
  });
});
