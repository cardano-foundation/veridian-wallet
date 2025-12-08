import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { SettingsList } from "./SettingsList";
import { store } from "../../../../store";
import { getNotificationsPreferences } from "../../../../store/reducers/notificationsPreferences/notificationsPreferences";
import { getBiometricsCache } from "../../../../store/reducers/biometricsCache";
import { OptionIndex } from "../Settings.types";

jest.mock("../../../../i18n", () => ({
  i18n: { t: jest.fn((key: string) => key) },
}));

jest.mock("../../../../store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

jest.mock("../../../../store/reducers/biometricsCache", () => ({
  biometricsCacheSlice: { reducer: jest.fn(() => ({ enabled: false })) },
  getBiometricsCache: jest.fn(),
  setEnableBiometricsCache: jest.fn(),
}));

jest.mock("../../../hooks/useBiometricsHook", () => ({
  useBiometricAuth: jest.fn(),
  BIOMETRIC_SERVER_KEY: "test-key",
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

jest.mock("../../../components/PageFooter", () => ({
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

jest.mock("../../../components/InfoCard", () => ({
  InfoCard: () => <div data-testid="info-card">Info Card</div>,
}));

jest.mock("../../../components/Alert", () => ({
  Alert: ({
    isOpen,
    dataTestId,
    headerText,
    confirmButtonText,
    actionConfirm,
  }: any) =>
    isOpen ? (
      <div data-testid={dataTestId}>
        <div>{headerText}</div>
        <button
          data-testid={`${dataTestId}-confirm`}
          onClick={actionConfirm}
        >
          {confirmButtonText}
        </button>
      </div>
    ) : null,
}));

jest.mock("../../../components/Verification", () => ({
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

describe("SettingsList", () => {
  const mockSwitchView = jest.fn();
  const mockHandleClose = jest.fn();

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
      .requireMock("../../../hooks/useBiometricsHook")
      .useBiometricAuth.mockReturnValue({
        biometricInfo: { isAvailable: false },
        setupBiometrics: jest.fn(),
        remainingLockoutSeconds: 0,
        lockoutEndTime: null,
      });
    jest
      .requireMock("../../../hooks/privacyScreenHook")
      .usePrivacyScreen.mockReturnValue({
        disablePrivacy: jest.fn(),
        enablePrivacy: jest.fn(),
      });
  });

  const renderComponent = (props = defaultProps) =>
    render(
      <Provider store={store}>
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
      screen.getByText("settings.sections.security.title")
    ).toBeInTheDocument();
    expect(
      screen.getByText("settings.sections.support.title")
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
    jest
      .requireMock("../../../hooks/useBiometricsHook")
      .useBiometricAuth.mockReturnValue({
        biometricInfo: { isAvailable: true },
        setupBiometrics: jest.fn(),
        remainingLockoutSeconds: 0,
        lockoutEndTime: null,
      });

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
});
