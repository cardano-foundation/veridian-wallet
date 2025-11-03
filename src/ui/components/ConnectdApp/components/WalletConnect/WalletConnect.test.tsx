import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import { PeerConnection } from "../../../../../core/cardano/walletConnect/peerConnection";
import EN_TRANSLATIONS from "../../../../../locales/en/en.json";
import { RootState } from "../../../../../store";
import { profileCacheFixData } from "../../../../__fixtures__/storeDataFix";
import { walletConnectionsFix } from "../../../../__fixtures__/walletConnectionsFix";
import { makeTestStore } from "../../../../utils/makeTestStore";
import { WalletConnect } from "./WalletConnect";

jest.mock("../../../../../core/configuration", () => ({
  ...jest.requireActual("../../../../../core/configuration"),
  ConfigurationService: {
    env: {
      features: {
        cut: [],
      },
    },
  },
}));

jest.mock("../../../../../core/cardano/walletConnect/peerConnection", () => ({
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

describe("Wallet Connect Request", () => {
  const initialState: Partial<RootState> = {
    profilesCache: {
      ...profileCacheFixData,
      connectedDApp: null,
      pendingDAppConnection: walletConnectionsFix[4],
    },
  };

  const dispatchMock = jest.fn();
  const storeMocked = {
    ...makeTestStore(initialState),
    dispatch: dispatchMock,
  };

  test("Renders content ", async () => {
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnect close={jest.fn()} />
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
    const close = jest.fn();
    const { getByText } = render(
      <Provider store={storeMocked}>
        <WalletConnect close={close} />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByText(EN_TRANSLATIONS.request.button.accept));
    });

    await waitFor(() => {
      expect(PeerConnection.peerConnection.start).toBeCalled();
      expect(PeerConnection.peerConnection.connectWithDApp).toBeCalled();
    });

    await waitFor(() => {
      expect(close).toBeCalled();
    });
  });

  test("Click to decline button", async () => {
    const close = jest.fn();
    const { getByText, queryByText, getByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnect close={close} />
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
      expect(close).toBeCalled();
    });
  });

  test("Close modal", async () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={storeMocked}>
        <WalletConnect close={jest.fn()} />
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
