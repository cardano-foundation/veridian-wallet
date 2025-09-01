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
    getPlatform: jest.fn(() => 'ios'),
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

import { BiometricAuthOutcome } from "./useBiometricsHook";

const TestComponent = () => {
  const { handleBiometricAuth } = useBiometricAuth();
  const [outcome, setOutcome] = useState<BiometricAuthOutcome | null>(null);

  const callHandleBiometricAuth = async () => {
    const result = await handleBiometricAuth();
    setOutcome(result);
  };

  const getOutcomeMessage = (outcome: BiometricAuthOutcome | null) => {
    switch (outcome) {
      case BiometricAuthOutcome.SUCCESS:
        return "Success";
      case BiometricAuthOutcome.USER_CANCELLED:
        return "User Cancelled";
      case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
        return "Temporary Lockout";
      case BiometricAuthOutcome.PERMANENT_LOCKOUT:
        return "Permanent Lockout";
      case BiometricAuthOutcome.GENERIC_ERROR:
        return "Generic Error";
      case BiometricAuthOutcome.WEAK_BIOMETRY:
        return "Weak Biometry";
      case BiometricAuthOutcome.NOT_AVAILABLE:
        return "Not Available";
      default:
        return "";
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
      {outcome !== null && outcome !== BiometricAuthOutcome.SUCCESS && (
        <p data-testid="error-message">{getOutcomeMessage(outcome)}</p>
      )}
      {outcome === BiometricAuthOutcome.SUCCESS && (
        <p data-testid="success-message">Success</p>
      )}
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

  test("should return BiometricAuthOutcome.NOT_AVAILABLE when biometrics are not available", async () => {
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

    expect(await findByText("Not Available")).toBeInTheDocument();
    expect(NativeBiometric.verifyIdentity).not.toHaveBeenCalled();
  });

  test("should return BiometricAuthOutcome.WEAK_BIOMETRY for weak biometry", async () => {
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

    expect(await findByText("Weak Biometry")).toBeInTheDocument();
    expect(NativeBiometric.verifyIdentity).not.toHaveBeenCalled();
  });

  test("should return BiometricAuthOutcome.GENERIC_ERROR when verifyIdentity fails", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockRejectedValue({
      message: "Authentication failed",
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

    expect(await findByText("Generic Error")).toBeInTheDocument();
  });

  test("should return BiometricAuthOutcome.GENERIC_ERROR when getCredentials fails", async () => {
    (NativeBiometric.isAvailable as jest.Mock).mockResolvedValue({
      isAvailable: true,
      biometryType: BiometryType.FACE_ID,
    });
    (NativeBiometric.verifyIdentity as jest.Mock).mockResolvedValue(undefined);
    (NativeBiometric.getCredentials as jest.Mock).mockRejectedValue({
      message: "Could not get credentials",
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

    expect(await findByText("Generic Error")).toBeInTheDocument();
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

    expect(await findByText("Not Available")).toBeInTheDocument();
  });
});