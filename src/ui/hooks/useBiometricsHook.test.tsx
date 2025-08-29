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

const isNativePlatformMock = jest.fn(() => true);
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => isNativePlatformMock(),
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

  test("should return a BiometryError when getCredentials fails", async () => {
    const errorMessage = "Could not get credentials";
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockResolvedValue(undefined);
    (NativeBiometric.getCredentials as jest.Mock).mockRejectedValue({
      message: errorMessage,
      code: BiometricAuthError.UNKNOWN_ERROR,
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

describe("useBiometricAuth Hook: setupBiometrics", () => {
  const SetupTestComponent = () => {
    const { setupBiometrics } = useBiometricAuth();
    return <button data-testid="setup-biometric-btn" onClick={setupBiometrics}>Setup</button>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should set credentials if they are not set", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.getCredentials as jest.Mock).mockRejectedValue(new Error("No credentials"));
    (NativeBiometric.setCredentials as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(
      <Provider store={store}>
        <SetupTestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("setup-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.getCredentials).toHaveBeenCalled();
      expect(NativeBiometric.setCredentials).toHaveBeenCalled();
    });
  });

  test("should not set credentials if they are already set", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.getCredentials as jest.Mock).mockResolvedValue({
      username: "test",
      password: "test",
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <SetupTestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("setup-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.getCredentials).toHaveBeenCalled();
      expect(NativeBiometric.setCredentials).not.toHaveBeenCalled();
    });
  });

  test("should not do anything if biometry is not available", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: false,
      biometryType: BiometryType.NONE,
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <SetupTestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("setup-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.getCredentials).not.toHaveBeenCalled();
      expect(NativeBiometric.setCredentials).not.toHaveBeenCalled();
    });
  });

  test("should show error if biometry is weak", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.NONE,
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <SetupTestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("setup-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.getCredentials).not.toHaveBeenCalled();
      expect(NativeBiometric.setCredentials).not.toHaveBeenCalled();
    });
  });

  test("should show error if setCredentials fails", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.getCredentials as jest.Mock).mockRejectedValue(new Error("No credentials"));
    (NativeBiometric.setCredentials as jest.Mock).mockRejectedValue(new Error("Set credentials failed"));

    const { getByTestId } = render(
      <Provider store={store}>
        <SetupTestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("setup-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.getCredentials).toHaveBeenCalled();
      expect(NativeBiometric.setCredentials).toHaveBeenCalled();
    });
  });
});

describe("useBiometricAuth Hook: checkBiometrics", () => {
  const CheckBiometricsComponent = () => {
    const { checkBiometrics } = useBiometricAuth();
    return <button data-testid="check-biometric-btn" onClick={checkBiometrics}>Check</button>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should not call isAvailable when not on native platform", async () => {
    isNativePlatformMock.mockReturnValue(false);

    const { getByTestId } = render(
      <Provider store={store}>
        <CheckBiometricsComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("check-biometric-btn"));
    });

    await waitFor(() => {
      expect(NativeBiometric.isAvailable).not.toHaveBeenCalled();
    });
  });

  test("should return not available when isAvailable throws an error", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockRejectedValue(new Error("Some error"));

    const { getByTestId, findByText } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    act(() => {
      fireEvent.click(getByTestId("handle-biometric-btn"));
    });

    expect(await findByText("biometry.errors.notAvailable")).toBeInTheDocument();
  });
});