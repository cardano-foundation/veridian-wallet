import { BiometryType } from "@capgo/capacitor-native-biometric";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import EN_TRANSLATIONS from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { BiometricAuthOutcome, useBiometricAuth } from "../../hooks/useBiometricsHook";
import { makeTestStore } from "../../utils/makeTestStore";
import { Verification } from "./Verification";

jest.mock("../Alert", () => ({
  Alert: ({ isOpen, headerText, dataTestId, actionConfirm, confirmButtonText }: any) => {
    return isOpen ? (
      <div data-testid={dataTestId}>
        <h1>{headerText}</h1>
        <button onClick={actionConfirm}>{confirmButtonText}</button>
      </div>
    ) : null;
  },
}));

jest.mock("../../hooks/useBiometricsHook");

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      auth: { verifySecret: jest.fn() },
      basicStorage: { findById: jest.fn() },
    },
  },
}));

const handleBiometricAuthMock = jest.fn();
const dispatchMock = jest.fn();

const initState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true, time: Date.now(), passcodeIsSet: true,
      passwordIsSet: false, firstAppLaunch: false,
    },
    isOnline: true,
  },
  biometricsCache: { enabled: true },
};

const storeMocked = { ...makeTestStore(initState), dispatch: dispatchMock };

describe("Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricInfo: { isAvailable: true, biometryType: BiometryType.FINGERPRINT },
      handleBiometricAuth: handleBiometricAuthMock,
      remainingLockoutSeconds: 30,
      lockoutEndTime: null,
    }));
  });

  test("Use biometrics auth", async () => {
    handleBiometricAuthMock.mockResolvedValue(BiometricAuthOutcome.SUCCESS);
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    render(<Provider store={storeMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(() => {
      expect(handleBiometricAuthMock).toBeCalled();
      expect(verify).toBeCalled();
      expect(setVerifyOpen).toBeCalledWith(false);
    });
  });

  test("Show passcode option when auth fail", async () => {
    handleBiometricAuthMock.mockResolvedValue(BiometricAuthOutcome.NOT_AVAILABLE);
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    const { getByText } = render(<Provider store={storeMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypasscode.title)).toBeVisible();
    });
  });

  test("Show password when biometric auth fail", async () => {
    const customInitState = { ...initState, stateCache: { ...initState.stateCache, authentication: { ...initState.stateCache.authentication, passwordIsSet: true } } };
    const customStoreMocked = { ...makeTestStore(customInitState), dispatch: dispatchMock };
    handleBiometricAuthMock.mockResolvedValue(BiometricAuthOutcome.NOT_AVAILABLE);
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    const { getByText } = render(<Provider store={customStoreMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(() => {
      expect(getByText(EN_TRANSLATIONS.verifypassword.title)).toBeVisible();
    });
  });

  test("Cancel auth when user cancel", async () => {
    handleBiometricAuthMock.mockResolvedValue(BiometricAuthOutcome.USER_CANCELLED);
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    render(<Provider store={storeMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(() => {
      expect(setVerifyOpen).toBeCalledWith(false, true);
    });
  });
  
  test("should display temporary lockout message when status is TEMPORARY_LOCKOUT", async () => {
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricInfo: { isAvailable: true, biometryType: BiometryType.FINGERPRINT },
      handleBiometricAuth: jest.fn().mockResolvedValue(BiometricAuthOutcome.TEMPORARY_LOCKOUT),
      remainingLockoutSeconds: 30,
      lockoutEndTime: Date.now() + 30000,
    }));
    
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    render(<Provider store={storeMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(async () => {
      const lockoutAlert = await screen.findByTestId("alert-max-attempts");
      expect(lockoutAlert).toBeInTheDocument();
      const expectedText = EN_TRANSLATIONS.biometry.lockoutheader.replace("{{seconds}}", "30");
      expect(lockoutAlert).toHaveTextContent(expectedText);
    });
  });

  test("should display permanent lockout message when status is PERMANENT_LOCKOUT", async () => {
    (useBiometricAuth as jest.Mock).mockImplementation(() => ({
      biometricInfo: { isAvailable: true, biometryType: BiometryType.FINGERPRINT },
      handleBiometricAuth: jest.fn().mockResolvedValue(BiometricAuthOutcome.PERMANENT_LOCKOUT),
      remainingLockoutSeconds: 0,
      lockoutEndTime: null,
    }));
    
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    render(<Provider store={storeMocked}> <Verification verifyIsOpen setVerifyIsOpen={setVerifyOpen} onVerify={verify} /> </Provider>);

    await waitFor(async () => {
      const lockoutAlert = await screen.findByTestId("alert-permanent-lockout");
      expect(lockoutAlert).toBeInTheDocument();
      expect(lockoutAlert).toHaveTextContent(EN_TRANSLATIONS.biometry.permanentlockoutheader);
    });
  });
});