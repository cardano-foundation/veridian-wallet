import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../../routes/paths";
import { IncomingRequestType } from "../../../store/reducers/stateCache/stateCache.types";
import { identifierFix } from "../../__fixtures__/identifierFix";
import { signTransactionFix } from "../../__fixtures__/signTransactionFix";
import { SidePage } from "./SidePage";

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

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  IonModal: ({ children, ...props }: any) => (
    <div data-testid={props["data-testid"]}>{children}</div>
  ),
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

describe("Side Page: wallet connect", () => {
  const initialStateFull = {
    stateCache: {
      routes: [TabsRoutePath.CREDENTIALS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
      },
      queueIncomingRequest: {
        isProcessing: false,
        queues: [],
        isPaused: false,
      },
      isOnline: true,
    },
    identifiersCache: {
      identifiers: [...identifierFix],
    },
    walletConnectionsCache: {
      pendingConnection: "pending-meerkat",
      walletConnections: [],
    },
    biometricsCache: {
      enabled: false,
    },
  };

  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const mockedStore = {
    ...mockStore(initialStateFull),
    dispatch: dispatchMock,
  };

  test("Render wallet connect", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={mockedStore}>
        <SidePage />
      </Provider>
    );

    await waitFor(() => {
      expect(
        getByText(
          EN_TRANSLATIONS.tabs.menu.tab.items.connectwallet.request.stageone
            .title
        )
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(getByTestId("decline-button-connect-wallet-stage-one"));
    });

    await waitFor(() => {
      expect(getByTestId("alert-decline-connect-confirm-button")).toBeVisible();
    });
  });
});

describe("Side Page: incoming request", () => {
  const initialStateFull = {
    stateCache: {
      routes: [TabsRoutePath.CREDENTIALS],
      authentication: {
        loggedIn: true,
        time: Date.now(),
        passcodeIsSet: true,
      },
      queueIncomingRequest: {
        isProcessing: true,
        queues: [
          {
            id: "abc123456",
            label: "Cardano",
            type: IncomingRequestType.PEER_CONNECT_SIGN,
            signTransaction: signTransactionFix,
            peerConnection: { id: "id", name: "DApp", iconB64: "mock-icon" },
          },
        ],
        isPaused: false,
      },
    },
    identifiersCache: {
      identifiers: [...identifierFix],
    },
    walletConnectionsCache: {},
    biometricsCache: {
      enabled: false,
    },
  };

  const mockStore = configureStore();
  const dispatchMock = jest.fn();
  const mockedStore = {
    ...mockStore(initialStateFull),
    dispatch: dispatchMock,
  };

  test("Render incomming request", async () => {
    const { getByText } = render(
      <Provider store={mockedStore}>
        <SidePage />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText("DApp")).toBeVisible();
    });
  });
});
