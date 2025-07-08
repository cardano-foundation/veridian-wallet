import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { walletConnectionsFix } from "../../__fixtures__/walletConnectionsFix";
import { WalletConnect } from "./WalletConnect";
import { WalletConnectStageOne } from "./WalletConnectStageOne";
import { WalletConnectStageTwo } from "./WalletConnectStageTwo";
import { CreationStatus } from "../../../core/agent/agent.types";

jest.mock("../../../core/configuration", () => ({
  ...jest.requireActual("../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

const identifierCache = [
  {
    displayName: "mutil sign",
    id: "testid_00",
    createdAtUTC: "2024-07-02T02:59:06.013Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
    groupMemberPre: "EHNPqg5RyNVWfpwUYDK135xuUMFGK1GXZoDVqGc0DPsy",
  },
  {
    displayName: "mutil sign 1",
    id: "testid_0",
    createdAtUTC: "2024-07-02T02:59:06.013Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
    groupMetadata: {
      groupId: "test",
      groupInitiator: true,
      groupCreated: true,
    },
  },
  {
    displayName: "mutil sign 2",
    id: "testid_1",
    createdAtUTC: "2024-07-02T02:59:06.013Z",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
  },
];

jest.mock("../../../core/cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      start: jest.fn(),
      connectWithDApp: jest.fn(),
    },
  },
}));
jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      peerConnectionMetadataStorage: {
        getPeerConnectionMetadata: jest.fn(),
        getAllPeerConnectionMetadata: jest.fn(),
      },
    },
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, isOpen }: any) => (
    <div style={{ display: isOpen ? "block" : "none" }}>{children}</div>
  ),
}));

describe("Wallet Connect Stage One", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.MENU],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
    walletConnectionsCache: {
      walletConnections: [],
      pendingConnection: walletConnectionsFix[0],
    },
    identifiersCache: {
      identifiers: identifierFix,
    },
  };

  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  const handleAccept = jest.fn();
  const handleCancel = jest.fn();

  test("Renders content ", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          onAccept={handleAccept}
          onClose={handleCancel}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone.title
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone
          .message
      )
    ).toBeVisible();

    expect(getByText(EN_TRANSLATIONS.request.button.accept)).toBeVisible();

    expect(getByText(EN_TRANSLATIONS.request.button.decline)).toBeVisible();
  });

  test("Click to acccept button", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          onAccept={handleAccept}
          onClose={handleCancel}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.request.button.accept));
    });

    await waitFor(() => {
      expect(handleAccept).toBeCalled();
    });
  });

  test("Click to decline button", async () => {
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          onAccept={handleAccept}
          onClose={handleCancel}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.request.button.decline));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone
            .alert.titleconfirm
        )
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-decline-connect-confirm-button"));

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone
            .alert.titleconfirm
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(handleCancel).toBeCalled();
    });
  });

  test("Renders show missing identifier alert", async () => {
    const initialState = {
      stateCache: {
        routes: [TabsRoutePath.IDENTIFIERS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: false,
        },
      },
      walletConnectionsCache: {
        walletConnections: [],
        pendingConnection: walletConnectionsFix[0],
      },
      identifiersCache: {
        identifiers: {},
      },
    };

    const storeMocked = {
      ...mockStore(initialState),
      dispatch: dispatchMock,
    };

    const { getByTestId, getByText, findByText, queryByText } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          onAccept={handleAccept}
          onClose={handleCancel}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone.title
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connect-wallet-stage-one"));
    });

    const missingIdenTitle = await findByText(
      EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.connectionhistory
        .missingidentifieralert.message
    );

    await waitFor(() => {
      expect(missingIdenTitle).toBeVisible();
    });

    fireEvent.click(getByTestId("missing-identifier-alert-confirm-button"));

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.connectionhistory
            .missingidentifieralert.message
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.createidentifier.add.title)
      ).toBeVisible();
    });
  });
});

describe("Wallet Connect Stage Two", () => {
  const mockStore = configureStore();

  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.IDENTIFIERS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
    walletConnectionsCache: {
      walletConnections: [],
    },
    identifiersCache: {
      identifiers: identifierCache,
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  const handleCancel = jest.fn();
  const handleChangeStage = jest.fn();

  test("Renders content ", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageTwo
          isOpen={true}
          pendingDAppMeerkat={"pending-meerkat"}
          onClose={handleCancel}
          onBackClick={handleChangeStage}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stagetwo.title
      )
    ).toBeVisible();

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stagetwo
          .message
      )
    ).toBeVisible();

    expect(getByTestId(`card-item-${identifierCache[2].id}`)).toBeVisible();

    expect(getByTestId("primary-button")).toBeVisible();

    expect(getByTestId("primary-button")).toBeDisabled();
  });

  test("Click to confirm button", async () => {
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageTwo
          isOpen={true}
          pendingDAppMeerkat={"pending-meerkat"}
          onClose={handleCancel}
          onBackClick={handleChangeStage}
        />
      </Provider>
    );

    expect(
      getByTestId("identifier-select-" + identifierCache[2].id)
    ).toBeVisible();

    act(() => {
      fireEvent.click(
        getByTestId("identifier-select-" + identifierCache[2].id)
      );
    });

    await waitFor(() => {
      expect(getByTestId("primary-button").getAttribute("disabled")).toBe(
        "false"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalled();
    });
  });
});

describe("Wallet Connect Request", () => {
  const mockStore = configureStore();

  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.IDENTIFIERS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
        passwordIsSet: false,
      },
    },
    walletConnectionsCache: {
      walletConnections: [],
      pendingConnection: walletConnectionsFix[0],
    },
    identifiersCache: {
      identifiers: [...identifierFix],
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...mockStore(initialState),
    dispatch: dispatchMock,
  };

  test("Renders content ", async () => {
    const { getByTestId, getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnect
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone.title
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connect-wallet-stage-one"));
    });

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stagetwo
            .title
        )
      ).toBeVisible();
    });

    expect(
      getByTestId("identifier-select-" + identifierFix[0].id)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("identifier-select-" + identifierFix[0].id));
    });

    await waitFor(() => {
      expect(getByTestId("primary-button").getAttribute("disabled")).toBe(
        "false"
      );
    });

    act(() => {
      fireEvent.click(getByTestId("primary-button"));
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalled();
    });
  });

  test("Renders close in stage one ", async () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnect
          open={true}
          setOpenPage={jest.fn()}
        />
      </Provider>
    );

    expect(
      getByText(
        EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone.title
      )
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("decline-button-connect-wallet-stage-one"));
    });

    await waitFor(() => {
      expect(
        getByTestId("decline-button-connect-wallet-stage-one")
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-connect-wallet-stage-one"));
    });

    await waitFor(() => {
      expect(queryByTestId("connect-wallet-stage-one")).toBe(null);
      expect(queryByTestId("connect-wallet-stage-two")).toBe(null);
    });
  });
});
