import {
  render, 
  waitFor,
  fireEvent
} from "@testing-library/react";
import { BiometricAuthError, BiometryType, NativeBiometric } from "@capgo/capacitor-native-biometric";
import { act, useState } from "react";
import { Provider } from "react-redux";
import { store } from "../../store";
import { useBiometricAuth, BiometryError } from "./useBiometricsHook";
import { makeTestStore } from "../utils/makeTestStore";

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: jest.fn(() => true),
  },
  registerPlugin: jest.fn(() => ({
    addListener: jest.fn(),
  })),
  WebPlugin: class {},
}));

jest.mock("@capacitor/app", () => ({
  App: {
    addListener: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  },
}));

jest.mock("@ionic/react", () => ({
  ...jest.requireActual("@ionic/react"),
  getPlatforms: jest.fn(() => ["android"]),
}));

jest.mock("@capgo/capacitor-native-biometric", () => ({
  ...jest.requireActual("@capgo/capacitor-native-biometric"),
  NativeBiometric: {
    isAvailable: jest.fn(),
    verifyIdentity: jest.fn(),
    getCredentials: jest.fn(),
    setCredentials: jest.fn(),
  },
}));

jest.mock("../../i18n", () => ({
  i18n: {
    t: (key: string) => key, // Just return the key
  },
}));

const TestComponent = () => {
  const { handleBiometricAuth } = useBiometricAuth();
  const [error, setError] = useState("");

  const callHandleBiometricAuth = async () => {
    const result = await handleBiometricAuth();
    if (result instanceof BiometryError) {
      setError(result.message);
    }
  };

  return (
    <div>
      <button
        data-testid="handle-biometric-btn"
        onClick={callHandleBiometricAuth}
      >
        Button
      </button>
      {error && <p data-testid="error-message">{error}</p>}
    </div>
  );
};

describe("useBiometricAuth Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return true when biometrics are available and verification is successful", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockResolvedValue(undefined);
    (NativeBiometric.getCredentials as jest.Mock).mockResolvedValue({
      username: "test",
      password: "test",
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.isAvailable).toHaveBeenCalled();
      expect(NativeBiometric.verifyIdentity).toHaveBeenCalled();
      expect(NativeBiometric.getCredentials).toHaveBeenCalled();
      expect(queryByTestId("error-message")).toBeNull();
    });
  });

  test("should return a BiometryError when biometrics are not available", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: false,
      biometryType: BiometryType.NONE,
    });

    const { getByTestId, findByText } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });

    expect(await findByText("biometry.errors.notAvailable")).toBeInTheDocument();
    expect(NativeBiometric.verifyIdentity).not.toHaveBeenCalled();
  });

  test("should return a BiometryError for weak biometry", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.NONE, // Weak biometry type
    });

    const { getByTestId, findByText } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });

    expect(await findByText("biometry.errors.strongBiometricsRequired")).toBeInTheDocument();
    expect(NativeBiometric.verifyIdentity).not.toHaveBeenCalled();
  });

  test("should return a BiometryError when verifyIdentity fails", async () => {
    const errorMessage = "Authentication failed";
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockRejectedValue({
      message: errorMessage,
      code: BiometricAuthError.AUTHENTICATION_FAILED,
    });

    const { getByTestId, findByText } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });

    expect(await findByText(errorMessage)).toBeInTheDocument();
  });

  test("should call verifyIdentity with correct fallback title when password is set", async () => {
    const initState = {
      stateCache: {
        authentication: {
          passwordIsSet: true,
        },
      },
    };
    const storeMocked = makeTestStore(initState);

    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockResolvedValue(undefined);
    (NativeBiometric.getCredentials as jest.Mock).mockResolvedValue({
      username: "test",
      password: "test",
    });
  
    const { getByTestId } = render(
      <Provider store={storeMocked}>
        <TestComponent />
      </Provider>
    );
  
    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });
  
    await waitFor(() => {
      expect(NativeBiometric.verifyIdentity).toHaveBeenCalledWith({
        reason: "biometry.reason",
        title: "biometry.title",
        subtitle: "biometry.subtitle",
        negativeButtonText: "biometry.canceltitle",
        fallbackTitle: "biometry.iosfallbackpasswordtitle",
      });
    });
  });
});