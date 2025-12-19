import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { Agent } from "../../../../core/agent/agent";
import EN_TRANSLATIONS from "../../../../locales/en/en.json";
import { store } from "../../../../store";
import {
  getBiometricsCache,
  setEnableBiometricsCache,
} from "../../../../store/reducers/biometricsCache";
import { getNotificationsPreferences } from "../../../../store/reducers/notificationsPreferences/notificationsPreferences";
import { BiometricAuthOutcome } from "../../../hooks/useBiometricsHook";
import { OptionIndex } from "../Settings.types";
import { SettingsList } from "./SettingsList";

const checkBiometricsMock = jest.fn();
const setupBiometricsMock = jest.fn();
const getPlatformsMock = jest.fn();
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    getPlatform: () => getPlatformsMock(),
    isNativePlatform: () => true,
  },
}));

const nativeSettingOpenMock = jest.fn();
jest.mock("capacitor-native-settings", () => ({
  ...jest.requireActual("capacitor-native-settings"),
  NativeSettings: {
    open: () => nativeSettingOpenMock(),
  },
}));

jest.mock("../../../hooks/privacyScreenHook", () => ({
  usePrivacyScreen: jest.fn(),
}));

jest.mock("../../../../core/agent/agent", () => ({
  Agent: {
    agent: {
      basicStorage: { createOrUpdateBasicRecord: jest.fn() },
      deleteAccount: jest.fn(),
    },
  },
}));

jest.mock("../../../utils/error", () => ({ showError: jest.fn() }));
jest.mock("../../../utils/openBrowserLink", () => ({
  openBrowserLink: jest.fn(),
}));

jest.mock("../../PageFooter", () => ({
  PageFooter: ({ deleteButtonAction }: any) => (
    <div data-testid="page-footer">
      <button
        data-testid="delete-button"
        onClick={deleteButtonAction}
      >
        Delete Account
      </button>
    </div>
  ),
}));

jest.mock("../../InfoCard", () => ({
  InfoCard: () => <div data-testid="info-card">Info Card</div>,
}));

jest.mock("../../Alert", () => ({
  Alert: ({
    isOpen,
    headerText,
    subheaderText,
    confirmButtonText,
    actionConfirm,
    dataTestId,
  }: any) => {
    return isOpen ? (
      <div data-testid={dataTestId}>
        <h1>{headerText}</h1>
        <p>{subheaderText}</p>
        <button onClick={actionConfirm}>{confirmButtonText}</button>
      </div>
    ) : null;
  },
}));

jest.mock("../../Verification", () => ({
  Verification: ({ verifyIsOpen }: any) =>
    verifyIsOpen ? (
      <div data-testid="verification-modal">Verification</div>
    ) : null,
}));

jest.mock("./ChangePin", () => ({
  ChangePin: ({ isOpen }: any) =>
    isOpen ? <div data-testid="change-pin-modal">Change Pin</div> : null,
}));

jest.mock("../../../../../package.json", () => ({ version: "1.0.0" }));

jest.mock("../../../hooks/useBiometricsHook", () => ({
  ...jest.requireActual("../../../hooks/useBiometricsHook"),
  useBiometricAuth: () => ({
    biometricInfo: { isAvailable: false },
    setupBiometrics: setupBiometricsMock,
    checkBiometrics: checkBiometricsMock,
    remainingLockoutSeconds: 0,
    lockoutEndTime: null,
  }),
}));

describe("SettingsList", () => {
  const mockSwitchView = jest.fn();
  const mockHandleClose = jest.fn();
  const dispatchMock = jest.fn();

  const defaultProps = {
    switchView: mockSwitchView,
    handleClose: mockHandleClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const useSelectorMock = jest.requireMock("react-redux").useSelector;
    useSelectorMock.mockImplementation((selector: unknown) => {
      if (selector === getBiometricsCache) {
        return { enabled: false };
      }
      if (selector === getNotificationsPreferences) {
        return { enabled: false, configured: false };
      }
      return undefined;
    });
    jest
      .requireMock("../../../hooks/privacyScreenHook")
      .usePrivacyScreen.mockReturnValue({
        disablePrivacy: jest.fn(),
        enablePrivacy: jest.fn(),
      });
    getPlatformsMock.mockImplementation(() => "android");
    checkBiometricsMock.mockImplementation(() => ({
      isAvailable: true,
    }));
  });

  const renderComponent = (props = defaultProps) =>
    render(
      <Provider store={{ ...store, dispatch: dispatchMock }}>
        <MemoryRouter>
          <SettingsList {...props} />
        </MemoryRouter>
      </Provider>
    );

  test("renders complete component structure", () => {
    renderComponent();

    expect(screen.getByTestId("info-card")).toBeInTheDocument();
    expect(screen.getByTestId("settings-security-items")).toBeInTheDocument();
    expect(screen.getByTestId("settings-support-items")).toBeInTheDocument();
    expect(screen.getByTestId("page-footer")).toBeInTheDocument();
    expect(
      screen.getByText(EN_TRANSLATIONS.settings.sections.security.title)
    ).toBeInTheDocument();
    expect(
      screen.getByText(EN_TRANSLATIONS.settings.sections.support.title)
    ).toBeInTheDocument();
  });

  test("renders navigation items with correct structure", () => {
    renderComponent();

    expect(
      screen.getByTestId("settings-security-list-item-1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-security-list-item-2")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-security-list-item-3")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        `settings-support-list-item-${OptionIndex.Documentation}`
      )
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("settings-preferences-items")
    ).toBeInTheDocument();
  });

  test("handles biometric settings", () => {
    renderComponent();

    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    expect(biometricToggle).toBeInTheDocument();
  });

  test("opens modals for security actions", () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("settings-security-list-item-1"));
    fireEvent.click(screen.getByTestId("delete-button"));
    expect(screen.getByTestId("delete-account-alert")).toBeInTheDocument();
  });

  test("displays version information", () => {
    renderComponent();

    expect(screen.getByText("1.0.0")).toBeInTheDocument();
  });

  test("handles biometric settings", () => {
    renderComponent();

    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    expect(biometricToggle).toBeInTheDocument();
  });

  test("Show enable biometric alert on android", async () => {
    checkBiometricsMock.mockImplementation(() => ({
      isAvailable: false,
    }));
    const { getByTestId, queryByTestId, getByText } = renderComponent();
    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    fireEvent.click(biometricToggle);
    await waitFor(() => {
      expect(getByTestId("android-biometric-enable-alert")).toBeVisible();
    });

    fireEvent.click(
      getByText(EN_TRANSLATIONS.settings.sections.security.biometricsalert.ok)
    );
    await waitFor(() => {
      expect(nativeSettingOpenMock).toBeCalled();
    });
  });

  test("Show enable biometric alert on ios", async () => {
    checkBiometricsMock.mockImplementation(() => ({
      isAvailable: false,
    }));
    getPlatformsMock.mockImplementation(() => "ios");
    const { getByTestId, queryByTestId, getByText } = renderComponent();
    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    fireEvent.click(biometricToggle);

    await waitFor(() => {
      expect(getByTestId("ios-biometric-enable-alert")).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.biometry.setting));

    await waitFor(() => {
      expect(nativeSettingOpenMock).toBeCalled();
    });
  });

  test("Click on setup with GENERIC_ERROR outcome", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.GENERIC_ERROR);
    const { getByText } = renderComponent();
    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    fireEvent.click(biometricToggle);

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.biometry.allow));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.biometry.biometricsetupretry)
      ).toBeVisible();
    });
  });

  test("Click on setup with PERMANENT_LOCKOUT outcome", async () => {
    setupBiometricsMock.mockResolvedValue(
      BiometricAuthOutcome.PERMANENT_LOCKOUT
    );
    const { getByText } = renderComponent();
    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    fireEvent.click(biometricToggle);

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.biometry.allow));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.biometry.biometricunavailable)
      ).toBeVisible();
    });
  });

  test("Click on setup with SUCCESS outcome", async () => {
    setupBiometricsMock.mockResolvedValue(BiometricAuthOutcome.SUCCESS);
    const { getByText } = renderComponent();
    const biometricToggle = screen.getByTestId("settings-security-list-item-0");
    fireEvent.click(biometricToggle);

    await waitFor(() => {
      expect(
        getByText(EN_TRANSLATIONS.biometry.setupbiometryheader)
      ).toBeVisible();
    });

    fireEvent.click(getByText(EN_TRANSLATIONS.biometry.allow));

    await waitFor(() => {
      expect(setupBiometricsMock).toBeCalled();
    });

    await waitFor(() => {
      expect(dispatchMock).toBeCalledWith(setEnableBiometricsCache(true));
    });
  });
});
