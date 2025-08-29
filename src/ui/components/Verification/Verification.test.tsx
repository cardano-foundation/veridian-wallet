import { BiometryType, BiometricAuthError } from "@capgo/capacitor-native-biometric";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import EngTrans from "../../../locales/en/en.json";
import { TabsRoutePath } from "../../components/navigation/TabsMenu";
import { makeTestStore } from "../../utils/makeTestStore";
import { Verification } from "./Verification";

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      credentials: {
        getCredentialDetailsById: jest.fn(),
      },
      basicStorage: {
        findById: jest.fn(),
      },
      auth: {
        verifySecret: jest.fn(),
      },
    },
  },
}));

const handleBiometricAuthMock = jest.fn(() =>
  Promise.resolve<
    | boolean
    | {
        code: BiometricAuthError;
      }
  >(true)
);

const useBiometricInfoMock = jest.fn(() => ({
  biometricInfo: {
    isAvailable: true,
    biometryType: BiometryType.FINGERPRINT,
  },
  handleBiometricAuth: () => handleBiometricAuthMock(),
  setBiometricsIsEnabled: jest.fn(),
  setupBiometrics: jest.fn(),
  checkBiometrics: jest.fn(),
}));

jest.mock("../../hooks/useBiometricsHook", () => {
  const actual = jest.requireActual("../../hooks/useBiometricsHook");
  return {
    ...actual,
    useBiometricAuth: () => useBiometricInfoMock(),
  }
});

const dispatchMock = jest.fn();

const initState = {
  stateCache: {
    routes: [TabsRoutePath.CREDENTIALS],
    authentication: {
      loggedIn: true,
      time: Date.now(),
      passcodeIsSet: true,
      passwordIsSet: false,
      firstAppLaunch: false,
    },
    isOnline: true,
  },
  biometricsCache: {
    enabled: true,
  },
};

const storeMocked = {
  ...makeTestStore(initState),
  dispatch: dispatchMock,
};

describe("Verification", () => {
  test("Use biometrics auth", async () => {
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();
    render(
      <Provider store={storeMocked}>
        <Verification
          verifyIsOpen
          setVerifyIsOpen={setVerifyOpen}
          onVerify={verify}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(handleBiometricAuthMock).toBeCalled();
      expect(verify).toBeCalled();
    });
  });

  test("Show passcode option when auth fail", async () => {
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(false));

    const { getByText } = render(
      <Provider store={storeMocked}>
        <Verification
          verifyIsOpen
          setVerifyIsOpen={setVerifyOpen}
          onVerify={verify}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EngTrans.verifypasscode.title)).toBeVisible();
    });
  });

  test("Show password when biometric auth fail", async () => {
    const initState = {
      stateCache: {
        routes: [TabsRoutePath.CREDENTIALS],
        authentication: {
          loggedIn: true,
          time: Date.now(),
          passcodeIsSet: true,
          passwordIsSet: true,
          firstAppLaunch: false,
        },
        isOnline: true,
      },
      biometricsCache: {
        enabled: true,
      },
    };

    const storeMocked = {
      ...makeTestStore(initState),
      dispatch: dispatchMock,
    };

    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    handleBiometricAuthMock.mockImplementation(() => Promise.resolve(false));

    const { getByText } = render(
      <Provider store={storeMocked}>
        <Verification
          verifyIsOpen
          setVerifyIsOpen={setVerifyOpen}
          onVerify={verify}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText(EngTrans.verifypassword.title)).toBeVisible();
    });
  });

  test("Cancel auth when user cancel", async () => {
    const setVerifyOpen = jest.fn();
    const verify = jest.fn();

    handleBiometricAuthMock.mockImplementation(() =>
      Promise.resolve({
        code: BiometricAuthError.USER_CANCEL,
      })
    );

    const { queryByText } = render(
      <Provider store={storeMocked}>
        <Verification
          verifyIsOpen
          setVerifyIsOpen={setVerifyOpen}
          onVerify={verify}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByText(EngTrans.verifypassword.title)).toBeNull();
      expect(queryByText(EngTrans.verifypasscode.title)).toBeNull();
    });
  });
});
