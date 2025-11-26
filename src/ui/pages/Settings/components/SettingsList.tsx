import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { IonToggle } from "@ionic/react";
import {
  AndroidSettings,
  IOSSettings,
  NativeSettings,
} from "capacitor-native-settings";
import { Capacitor } from "@capacitor/core";
import {
  checkboxOutline,
  fingerPrintOutline,
  helpCircleOutline,
  informationCircleOutline,
  keyOutline,
  layersOutline,
  libraryOutline,
  lockClosedOutline,
  notificationsOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { ListItem } from "../../../components/ListCard/ListItem/ListItem";
import { ListCard } from "../../../components/ListCard/ListCard";
import pJson from "../../../../../package.json";
import "./SettingsList.scss";
import { useAppDispatch } from "../../../../store/hooks";
import {
  getBiometricsCache,
  setEnableBiometricsCache,
} from "../../../../store/reducers/biometricsCache";
import {
  getNotificationsPreferences,
  setNotificationsConfigured,
  setNotificationsEnabled,
} from "../../../../store/reducers/notificationsPreferences/notificationsPreferences";
import {
  BiometricAuthOutcome,
  useBiometricAuth,
  BIOMETRIC_SERVER_KEY,
} from "../../../hooks/useBiometricsHook";
import { usePrivacyScreen } from "../../../hooks/privacyScreenHook";
import {
  OptionIndex,
  OptionProps,
  SettingsListProps,
  SettingScreen,
} from "../Settings.types";
import { i18n } from "../../../../i18n";
import { DOCUMENTATION_LINK, SUPPORT_EMAIL } from "../../../globals/constants";
import { Agent } from "../../../../core/agent/agent";
import { BasicRecord } from "../../../../core/agent/records";
import { MiscRecordId } from "../../../../core/agent/agent.types";
import { showError } from "../../../utils/error";
import { notificationService } from "../../../../native/pushNotifications/notificationService";
import { openBrowserLink } from "../../../utils/openBrowserLink";
import {
  setToastMsg,
  showGenericError,
  showGlobalLoading,
} from "../../../../store/reducers/stateCache";
import { CLEAR_STORE_ACTIONS } from "../../../../store/utils";
import { ToastMsgType } from "../../../globals/types";
import { RoutePath } from "../../../../routes";
import { PageFooter } from "../../../components/PageFooter";
import { ChangePin } from "./ChangePin";
import { Alert } from "../../../components/Alert";
import { Verification } from "../../../components/Verification";
import { InfoCard } from "../../../components/InfoCard";

const SettingsList = ({ switchView, handleClose }: SettingsListProps) => {
  const dispatch = useAppDispatch();
  const biometricsCache = useSelector(getBiometricsCache);
  const notificationsPreferences = useSelector(getNotificationsPreferences);
  const [option, setOption] = useState<number | null>(null);
  const {
    biometricInfo,
    setupBiometrics,
    remainingLockoutSeconds,
    lockoutEndTime,
  } = useBiometricAuth();

  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [changePinIsOpen, setChangePinIsOpen] = useState(false);
  const { disablePrivacy, enablePrivacy } = usePrivacyScreen();
  const [openBiometricAlert, setOpenBiometricAlert] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [showMaxAttemptsAlert, setShowMaxAttemptsAlert] = useState(false);
  const [showPermanentLockoutAlert, setShowPermanentLockoutAlert] =
    useState(false);
  const [showNotificationsSettingsAlert, setShowNotificationsSettingsAlert] =
    useState(false);
  const [showNotificationsErrorAlert, setShowNotificationsErrorAlert] =
    useState(false);
  const [
    showNotificationsSetupFailedAlert,
    setShowNotificationsSetupFailedAlert,
  ] = useState(false);
  const [isProcessingNotificationsToggle, setIsProcessingNotificationsToggle] =
    useState(false);
  const [isAwaitingNotificationSettings, setIsAwaitingNotificationSettings] =
    useState(false);
  const history = useHistory();

  const platform = Capacitor.getPlatform();
  const isAndroidPlatform = platform === "android";

  useEffect(() => {
    if (!lockoutEndTime && showMaxAttemptsAlert) {
      setShowMaxAttemptsAlert(false);
    }
  }, [lockoutEndTime, showMaxAttemptsAlert]);

  useEffect(() => {
    const checkPermissionsOnResume = async () => {
      if (!isAwaitingNotificationSettings) return;

      try {
        const granted = await notificationService.arePermissionsGranted();
        if (granted) {
          await persistNotificationsPreferences(true, true);
        } else {
          setShowNotificationsSetupFailedAlert(true);
        }
      } catch (error) {
        setShowNotificationsSetupFailedAlert(true);
      } finally {
        setIsAwaitingNotificationSettings(false);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPermissionsOnResume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAwaitingNotificationSettings]);

  const openNotificationSettings = async () => {
    try {
      setIsAwaitingNotificationSettings(true);
      await NativeSettings.open({
        optionAndroid: AndroidSettings.AppNotification,
        optionIOS: IOSSettings.AppNotification,
      });
    } catch (error) {
      setIsAwaitingNotificationSettings(false);
      showError("Unable to open notification settings", error, dispatch);
    }
  };

  const persistNotificationsPreferences = async (
    enabled: boolean,
    configuredOverride?: boolean
  ) => {
    const configured =
      configuredOverride !== undefined
        ? configuredOverride
        : notificationsPreferences.configured;

    dispatch(setNotificationsEnabled(enabled));
    dispatch(setNotificationsConfigured(configured));

    try {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_NOTIFICATIONS,
          content: { enabled, configured },
        })
      );
    } catch (error) {
      showError("Failed to update notification settings", error, dispatch);
    }
  };

  const attemptEnableNotifications = async () => {
    if (isProcessingNotificationsToggle) {
      return;
    }

    setIsProcessingNotificationsToggle(true);

    try {
      const permissionsGranted =
        await notificationService.arePermissionsGranted();
      if (permissionsGranted) {
        await persistNotificationsPreferences(true, true);
        return;
      }

      const granted = await notificationService.requestPermissions();
      if (granted) {
        await persistNotificationsPreferences(true, true);
        return;
      }

      if (!notificationsPreferences.configured) {
        setShowNotificationsSettingsAlert(true);
      } else {
        await openNotificationSettings();
      }
    } catch (error) {
      if (isAndroidPlatform) {
        setShowNotificationsErrorAlert(true);
        return;
      }

      showError(
        i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.enablepermissions"
        ),
        error,
        dispatch
      );
    } finally {
      setIsProcessingNotificationsToggle(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (notificationsPreferences.enabled) {
      await persistNotificationsPreferences(false);
      return;
    }

    await attemptEnableNotifications();
  };

  const securityItems: OptionProps[] = [
    {
      index: OptionIndex.ChangePin,
      icon: lockClosedOutline,
      label: i18n.t("settings.sections.security.changepin.title"),
    },
    {
      index: OptionIndex.ManagePassword,
      icon: informationCircleOutline,
      label: i18n.t("settings.sections.security.managepassword.title"),
    },
    {
      index: OptionIndex.RecoverySeedPhrase,
      icon: keyOutline,
      label: i18n.t("settings.sections.security.seedphrase.title"),
    },
  ];

  if (biometricsCache.enabled !== undefined && biometricInfo?.isAvailable) {
    securityItems.unshift({
      index: OptionIndex.BiometricUpdate,
      icon: fingerPrintOutline,
      label: i18n.t("settings.sections.security.biometry"),
      actionIcon: (
        <IonToggle
          aria-label="Biometric Toggle"
          className="toggle-button"
          checked={biometricsCache.enabled}
        />
      ),
    });
  }

  const preferencesItems: OptionProps[] = [
    {
      index: OptionIndex.Notifications,
      icon: notificationsOutline,
      label: i18n.t("settings.sections.preferences.notifications.title"),
      actionIcon: (
        <IonToggle
          aria-label="Notifications Toggle"
          className="toggle-button"
          checked={notificationsPreferences.enabled}
          disabled={isProcessingNotificationsToggle}
          onIonChange={() => handleNotificationToggle()}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    },
  ];

  const supportItems: OptionProps[] = [
    {
      index: OptionIndex.Documentation,
      icon: libraryOutline,
      label: i18n.t("settings.sections.support.learnmore"),
    },
    {
      index: OptionIndex.Term,
      icon: checkboxOutline,
      label: i18n.t("settings.sections.support.terms.title"),
    },
    {
      index: OptionIndex.Contact,
      icon: helpCircleOutline,
      label: i18n.t("settings.sections.support.contact"),
      href: SUPPORT_EMAIL,
    },
    {
      index: OptionIndex.Version,
      icon: layersOutline,
      label: i18n.t("settings.sections.support.version"),
      note: pJson.version,
    },
  ];

  const handleToggleBiometricAuth = async () => {
    const newBiometricsEnabledState = !biometricsCache.enabled;

    try {
      if (!newBiometricsEnabledState) {
        await NativeBiometric.deleteCredentials({
          server: BIOMETRIC_SERVER_KEY,
        });
      }

      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.APP_BIOMETRY,
          content: { enabled: newBiometricsEnabledState },
        })
      );
      dispatch(setEnableBiometricsCache(newBiometricsEnabledState));
    } catch (e) {
      showError(i18n.t("biometry.errors.toggleFailed"), e, dispatch);
    }
  };

  const handleBiometricUpdate = async () => {
    if (biometricsCache.enabled) {
      handleToggleBiometricAuth();
      return;
    }
    biometricAuth();
  };

  const biometricAuth = async () => {
    try {
      await disablePrivacy();

      const setupResult = await setupBiometrics();
      await enablePrivacy();

      switch (setupResult) {
        case BiometricAuthOutcome.SUCCESS:
          handleToggleBiometricAuth();
          break;
        case BiometricAuthOutcome.USER_CANCELLED:
          // Do nothing, user cancelled
          break;
        case BiometricAuthOutcome.TEMPORARY_LOCKOUT:
          setShowMaxAttemptsAlert(true);
          break;
        case BiometricAuthOutcome.PERMANENT_LOCKOUT:
          setShowPermanentLockoutAlert(true);
          break;
        case BiometricAuthOutcome.NOT_AVAILABLE:
        case BiometricAuthOutcome.GENERIC_ERROR:
        default:
          dispatch(showGenericError(true));
          break;
      }
    } catch (e) {
      // This catch block is for unexpected errors during the process.
      showError(i18n.t("biometry.errors.toggleFailed"), e, dispatch);
    }
  };

  const openSetting = () => {
    NativeSettings.open({
      optionAndroid: AndroidSettings.Security,
      optionIOS: IOSSettings.TouchIdPasscode,
    });
  };

  const openVerify = () => {
    setVerifyIsOpen(true);
  };

  const handleOptionClick = async (item: OptionProps) => {
    setOption(item.index);
    switch (item.index) {
      case OptionIndex.BiometricUpdate: {
        handleBiometricUpdate();
        break;
      }
      case OptionIndex.Notifications: {
        handleNotificationToggle();
        break;
      }
      case OptionIndex.ChangePin: {
        openVerify();
        break;
      }
      case OptionIndex.ManagePassword: {
        switchView && switchView(SettingScreen.ManagePassword);
        break;
      }
      case OptionIndex.Contact: {
        break;
      }
      case OptionIndex.Documentation: {
        openBrowserLink(DOCUMENTATION_LINK);
        break;
      }
      case OptionIndex.Term: {
        switchView && switchView(SettingScreen.TermsAndPrivacy);
        break;
      }
      case OptionIndex.RecoverySeedPhrase: {
        switchView && switchView(SettingScreen.RecoverySeedPhrase);
        break;
      }
      default:
        return;
    }
  };

  const deleteWallet = async () => {
    try {
      dispatch(showGlobalLoading(true));
      await Agent.agent.deleteWallet();
      CLEAR_STORE_ACTIONS.forEach((action) => dispatch(action()));
      dispatch(setToastMsg(ToastMsgType.DELETE_ACCOUNT_SUCCESS));
      history.push(RoutePath.ONBOARDING);
      handleClose?.();
    } catch (e) {
      showError(
        "Failed to wipe wallet: ",
        e,
        dispatch,
        ToastMsgType.DELETE_ACCOUNT_ERROR
      );
    } finally {
      dispatch(showGlobalLoading(false));
    }
  };

  const onVerify = () => {
    switch (option) {
      case OptionIndex.BiometricUpdate: {
        biometricAuth();
        break;
      }
      case OptionIndex.ChangePin: {
        switchView && switchView(SettingScreen.ChangePin);
        break;
      }
      case OptionIndex.DeleteWallet:
        deleteWallet();
        break;
      default:
        return;
    }
    setOption(null);
  };

  const closeAlert = () => {
    setOpenBiometricAlert(false);
  };

  const openDeleteWalletAlert = () => {
    setOption(OptionIndex.DeleteWallet);
    setOpenDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setOpenDeleteAlert(false);
  };
  return (
    <>
      <InfoCard
        content={i18n.t("settings.info")}
        icon={informationCircleOutline}
      />
      <div className="settings-section-title">
        {i18n.t("settings.sections.security.title")}
      </div>
      <ListCard
        items={securityItems}
        renderItem={(item) => (
          <ListItem
            key={item.index}
            index={item.index}
            icon={item.icon}
            label={item.label}
            actionIcon={item.actionIcon}
            showStartIcon
            note={item.note}
            href={item.href}
            onClick={() => handleOptionClick(item)}
            testId={`settings-security-list-item-${item.index}`}
            className="list-item"
          />
        )}
        testId="settings-security-items"
      />
      <div className="settings-section-title">
        {i18n.t("settings.sections.preferences.title")}
      </div>
      <ListCard
        items={preferencesItems}
        renderItem={(item) => (
          <ListItem
            showStartIcon
            key={item.index}
            index={item.index}
            icon={item.icon}
            label={item.label}
            actionIcon={item.actionIcon}
            note={item.note}
            href={item.href}
            onClick={() => handleOptionClick(item)}
            testId={`settings-preferences-list-item-${item.index}`}
            className="list-item"
          />
        )}
        testId="settings-preferences-items"
      />
      <div className="settings-section-title">
        {i18n.t("settings.sections.support.title")}
      </div>
      <ListCard
        items={supportItems}
        renderItem={(item) => (
          <ListItem
            showStartIcon
            key={item.index}
            index={item.index}
            icon={item.icon}
            label={item.label}
            actionIcon={item.actionIcon}
            note={item.note}
            href={item.href}
            onClick={() => handleOptionClick(item)}
            testId={`settings-support-list-item-${item.index}`}
            className="list-item"
          />
        )}
        testId="settings-support-items"
      />
      <PageFooter
        deleteButtonAction={openDeleteWalletAlert}
        deleteButtonText={`${i18n.t("settings.sections.deletewallet.button")}`}
      />
      <Alert
        isOpen={openBiometricAlert}
        setIsOpen={setOpenBiometricAlert}
        dataTestId="biometric-enable-alert"
        headerText={i18n.t(
          "settings.sections.security.biometricsalert.message"
        )}
        confirmButtonText={`${i18n.t(
          "settings.sections.security.biometricsalert.ok"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.security.biometricsalert.cancel"
        )}`}
        actionConfirm={openSetting}
        actionCancel={closeAlert}
        actionDismiss={closeAlert}
      />
      <Alert
        isOpen={openDeleteAlert}
        setIsOpen={setOpenDeleteAlert}
        dataTestId="delete-account-alert"
        headerText={i18n.t("settings.sections.deletewallet.alert.title")}
        confirmButtonText={`${i18n.t(
          "settings.sections.deletewallet.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.deletewallet.alert.cancel"
        )}`}
        actionConfirm={openVerify}
        actionCancel={closeDeleteAlert}
        actionDismiss={closeDeleteAlert}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
      <Alert
        isOpen={showMaxAttemptsAlert}
        setIsOpen={setShowMaxAttemptsAlert}
        dataTestId="alert-max-attempts"
        headerText={`${i18n.t("biometry.lockoutheader", {
          seconds: remainingLockoutSeconds,
        })}`}
        confirmButtonText={`${i18n.t("biometry.lockoutconfirm")}`}
        actionConfirm={() => setShowMaxAttemptsAlert(false)}
        backdropDismiss={false}
      />
      <Alert
        isOpen={showPermanentLockoutAlert}
        setIsOpen={setShowPermanentLockoutAlert}
        dataTestId="alert-permanent-lockout"
        headerText={`${i18n.t("biometry.permanentlockoutheader")}`}
        confirmButtonText={`${i18n.t("biometry.lockoutconfirm")}`}
        actionConfirm={() => setShowPermanentLockoutAlert(false)}
        backdropDismiss={false}
      />
      <Alert
        isOpen={showNotificationsSettingsAlert}
        setIsOpen={setShowNotificationsSettingsAlert}
        dataTestId="notifications-settings-alert"
        headerText={i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.enablepermissions"
        )}
        confirmButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.cancel"
        )}`}
        actionConfirm={openNotificationSettings}
      />
      <Alert
        isOpen={showNotificationsErrorAlert}
        setIsOpen={setShowNotificationsErrorAlert}
        dataTestId="notifications-try-again-alert"
        headerText={i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.enablepermissions"
        )}
        confirmButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.tryagain"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.cancel"
        )}`}
        actionConfirm={attemptEnableNotifications}
      />
      <Alert
        isOpen={showNotificationsSetupFailedAlert}
        setIsOpen={setShowNotificationsSetupFailedAlert}
        dataTestId="notifications-setup-failed-alert"
        headerText={i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.setupfailed"
        )}
        confirmButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.tryagain"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.preferences.notifications.notificationsalert.cancel"
        )}`}
        actionConfirm={openNotificationSettings}
      />
    </>
  );
};

export { SettingsList };
