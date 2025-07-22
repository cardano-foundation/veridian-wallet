import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { TabsRoutePath } from "../../../../../routes/paths";
import { identifierFix } from "../../../../__fixtures__/identifierFix";
import { walletConnectionsFix } from "../../../../__fixtures__/walletConnectionsFix";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { WalletConnect } from "./WalletConnect";
import { WalletConnectStageOne } from "./WalletConnectStageOne";

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

jest.mock("../../../core/cardano/walletConnect/peerConnection", () => ({
  PeerConnection: {
    peerConnection: {
      start: jest.fn(),
      connectWithDApp: jest.fn(),
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

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  const handleCancel = jest.fn();

  test("Renders content ", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          pendingDAppMeerkat={"pending-meerkat"}
          onClose={handleCancel}
        />
      </Provider>
    );

    expect(
      getByText(EN_TRANSLATIONS.connectdapp.request.stageone.title)
    ).toBeVisible();

    expect(
      getByText(EN_TRANSLATIONS.connectdapp.request.stageone.message)
    ).toBeVisible();

    expect(getByText(EN_TRANSLATIONS.request.button.accept)).toBeVisible();

    expect(getByText(EN_TRANSLATIONS.request.button.decline)).toBeVisible();
  });

  test("Click to acccept button", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          pendingDAppMeerkat={"pending-meerkat"}
          onClose={handleCancel}
        />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.request.button.accept));
    });

    await waitFor(() => {
      expect(handleCancel).toBeCalled();
    });
  });

  test("Click to decline button", async () => {
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnectStageOne
          isOpen={true}
          pendingDAppMeerkat={"pending-meerkat"}
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
          EN_TRANSLATIONS.connectdapp.request.stageone.alert.titleconfirm
        )
      ).toBeVisible();
    });

    fireEvent.click(getByTestId("alert-decline-connect-confirm-button"));

    await waitFor(() => {
      expect(
        queryByText(
          EN_TRANSLATIONS.connectdapp.request.stageone.alert.titleconfirm
        )
      ).toBeNull();
    });

    await waitFor(() => {
      expect(handleCancel).toBeCalled();
    });
  });
});

describe("Wallet Connect Request", () => {
  const initialState = {
    stateCache: {
      routes: [TabsRoutePath.CREDENTIALS],
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
    ...makeTestStore(initialState),
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
      getByText(EN_TRANSLATIONS.connectdapp.request.stageone.title)
    ).toBeVisible();

    act(() => {
      fireEvent.click(getByTestId("primary-button-connect-wallet-stage-one"));
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
      getByText(EN_TRANSLATIONS.connectdapp.request.stageone.title)
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
