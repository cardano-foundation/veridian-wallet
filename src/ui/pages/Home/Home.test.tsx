import React from "react";
import { IonReactMemoryRouter } from "@ionic/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { makeTestStore } from "../../utils/makeTestStore";
import { Home } from "./Home";
import { Agent } from "../../../core/agent/agent";
import { showError } from "../../utils/error";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      connections: {
        getOobi: jest.fn(),
      },
      identifiers: {
        getIdentifier: jest.fn(),
      },
    },
  },
}));

const onlineStatusEffects: Array<() => unknown> = [];

jest.mock("../../hooks", () => {
  const actualHooks = jest.requireActual("../../hooks");
  return {
    ...actualHooks,
    useOnlineStatusEffect: (callback: () => unknown) => {
      onlineStatusEffects.push(callback);
    },
  };
});

jest.mock(
  "../../components/ProfileDetailsModal/components/RotateKeyModal",
  () => {
    type MockRotateKeyModalProps = {
      isOpen: boolean;
      onClose: () => void;
    };

    const MockRotateKeyModal = ({
      isOpen,
      onClose,
    }: MockRotateKeyModalProps) => {
      if (!isOpen) {
        return null;
      }

      return (
        <>
          <div data-testid="rotate-keys" />
          <button
            data-testid="rotate-keys-close-button"
            onClick={onClose}
          >
            Close
          </button>
        </>
      );
    };

    return { RotateKeyModal: MockRotateKeyModal };
  }
);

jest.mock("../../utils/error", () => ({
  showError: jest.fn(),
}));

const runOnlineStatusEffects = async () => {
  while (onlineStatusEffects.length) {
    const effect = onlineStatusEffects.shift()!;
    await act(() => effect());
  }
};

const clearOnlineStatusEffects = () => {
  onlineStatusEffects.length = 0;
};

const showErrorMock = showError as jest.MockedFunction<typeof showError>;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  clearOnlineStatusEffects();
});

const createTestState = (groupMemberPre = false) => ({
  stateCache: {
    routes: [TabsRoutePath.HOME],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
    },
    toastMsgs: [],
  },
  profilesCache: {
    profiles: {
      "test-profile": {
        identity: {
          id: "test-profile",
          displayName: "Alice",
          createdAtUTC: "2000-01-01T00:00:00.000Z",
          groupMemberPre,
        },
        connections: [],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    },
    defaultProfile: "test-profile",
  },
  biometricsCache: { enabled: false },
});

const renderHome = async (initialState: any) => {
  clearOnlineStatusEffects();
  const store = makeTestStore(initialState);
  const history = createMemoryHistory();
  history.push(TabsRoutePath.HOME);

  const result = render(
    <Provider store={store}>
      <IonReactMemoryRouter
        history={history}
        initialEntries={[TabsRoutePath.HOME]}
      >
        <Home />
      </IonReactMemoryRouter>
    </Provider>
  );

  await runOnlineStatusEffects();
  return result;
};

describe("Home page", () => {
  beforeEach(() => {
    (Agent.agent.connections.getOobi as jest.Mock).mockResolvedValue(
      "http://example.com/oobi"
    );
    (Agent.agent.identifiers.getIdentifier as jest.Mock).mockResolvedValue({
      id: "test-profile",
      displayName: "Alice",
      createdAtUTC: "2000-01-01T00:00:00.000Z",
      k: ["test-signing-key"],
      s: "0",
      dt: "2000-01-01T00:00:00.000Z",
      kt: "1",
      nt: "1",
      n: ["test-next-key"],
      bt: "0",
      b: [],
    });
  });

  test("renders Home tab elements correctly", async () => {
    const { getByTestId, getByText, container } = await renderHome(
      createTestState()
    );
    const title = EN_TRANSLATIONS.tabs.home.tab.title
      .replace("{{name}}", "Alice")
      .toLowerCase();
    const badgeText = EN_TRANSLATIONS.tabs.home.tab.tiles.scan.badge as string;
    const splitSection = container.querySelector(".home-tab-split-section");

    expect(getByTestId("home-tab")).toBeInTheDocument();
    expect(getByTestId(`tab-title-${title}`)).toBeInTheDocument();
    expect(getByText(badgeText)).toBeInTheDocument();
    expect(splitSection).toBeInTheDocument();
  });

  test("opens ScanToLogin when scan tile clicked", async () => {
    const { getByTestId, findByTestId } = await renderHome(createTestState());
    const scanTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.scan.title as string;
    const tile = getByTestId(`tile-${scanTitle}`);
    fireEvent.click(tile);

    expect(await findByTestId("scan-to-login")).toBeInTheDocument();
  });

  test("opens Profiles modal when avatar clicked", async () => {
    const { getByTestId, findByTestId } = await renderHome(createTestState());

    await waitFor(() => {
      expect(getByTestId("avatar-button")).toBeVisible();
    });

    fireEvent.click(getByTestId("avatar-button"));

    expect(await findByTestId("profiles")).toBeInTheDocument();
  });

  test("opens ConnectdApp when Cardano tile clicked", async () => {
    const { getByTestId, findByTestId } = await renderHome(createTestState());
    const dappsTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.dapps
      .title as string;
    const tile = getByTestId(`tile-${dappsTitle}`);

    fireEvent.click(tile);

    expect(await findByTestId("connect-dapp-page")).toBeInTheDocument();
  });

  test("opens ShareProfile when connections tile clicked", async () => {
    const { getByTestId, findByTestId } = await renderHome(createTestState());
    const connectionsTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.connections
      .title as string;
    const tile = getByTestId(`tile-${connectionsTitle}`);

    fireEvent.click(tile);

    expect(await findByTestId("share-profile")).toBeInTheDocument();
  });

  test("opens RotateKeyModal when rotate tile clicked for individual profile", async () => {
    const { getByTestId, findAllByTestId } = await renderHome(
      createTestState()
    );
    const rotateTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.rotate
      .title as string;
    const tile = getByTestId(`tile-${rotateTitle}`);

    fireEvent.click(tile);

    const modals = await findAllByTestId("rotate-keys");
    expect(modals.length).toBeGreaterThan(0);
  });

  test("renders correct layout for group profile", async () => {
    const { container, getByTestId, queryByTestId } = await renderHome(
      createTestState(true)
    );
    const splitSection = container.querySelector(".home-tab-split-section");
    const connectionsTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.connections
      .title as string;
    const rotateTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.rotate
      .title as string;

    expect(splitSection).not.toBeInTheDocument();
    expect(getByTestId(`tile-${connectionsTitle}`)).toBeInTheDocument();
    expect(queryByTestId(`tile-${rotateTitle}`)).not.toBeInTheDocument();
  });

  test("logs error when fetchOobi fails", async () => {
    const expectedError = new Error("fetch oobi failure");
    (Agent.agent.connections.getOobi as jest.Mock).mockRejectedValue(
      expectedError
    );

    await renderHome(createTestState());

    expect(showErrorMock).toHaveBeenCalledWith(
      "Unable to fetch connection oobi",
      expectedError,
      expect.any(Function)
    );
  });

  test("logs error when fetching identifier details fails", async () => {
    const expectedError = new Error("identifier failure");
    (Agent.agent.identifiers.getIdentifier as jest.Mock).mockRejectedValue(
      expectedError
    );

    await renderHome(createTestState());

    expect(showErrorMock).toHaveBeenCalledWith(
      "Unable to get identifier details",
      expectedError
    );
  });

  test("RotateKeyModal onClose closes the modal", async () => {
    const rotateTitle = EN_TRANSLATIONS.tabs.home.tab.tiles.rotate
      .title as string;
    const { getByTestId, findByTestId, queryAllByTestId } = await renderHome(
      createTestState()
    );

    fireEvent.click(getByTestId(`tile-${rotateTitle}`));

    const closeButton = await findByTestId("rotate-keys-close-button");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(queryAllByTestId("rotate-keys")).toHaveLength(0);
    });
  });
});
