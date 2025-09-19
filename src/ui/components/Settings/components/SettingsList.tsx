import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { IonToggle } from "@ionic/react";
import {
  AndroidSettings,
  IOSSettings,
  NativeSettings,
} from "capacitor-native-settings";
import {
  checkboxOutline,
  fingerPrintOutline,
  helpCircleOutline,
  informationCircleOutline,
  keyOutline,
  layersOutline,
  libraryOutline,
  lockClosedOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { ListItem } from "../../ListCard/ListItem/ListItem";
import { ListCard } from "../../ListCard/ListCard";
import pJson from "../../../../../package.json";
import "./SettingsList.scss";
import { useAppDispatch } from "../../../../store/hooks";
import {
  getBiometricsCache,
  setEnableBiometricsCache,
} from "../../../../store/reducers/biometricsCache";
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
import { openBrowserLink } from "../../../utils/openBrowserLink";
import {
  setToastMsg,
  showGenericError,
  showGlobalLoading,
} from "../../../../store/reducers/stateCache";
import { CLEAR_STORE_ACTIONS } from "../../../../store/utils";
import { ToastMsgType } from "../../../globals/types";
import { RoutePath } from "../../../../routes";
import { PageFooter } from "../../PageFooter";
import { ChangePin } from "./ChangePin";
import { Alert } from "../../Alert";
import { Verification } from "../../Verification";
import { InfoCard } from "../../InfoCard";

const SettingsList = ({ switchView, handleClose }: SettingsListProps) => {
  const dispatch = useAppDispatch();
  const biometricsCache = useSelector(getBiometricsCache);
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
  const history = useHistory();

  useEffect(() => {
    if (!lockoutEndTime && showMaxAttemptsAlert) {
      setShowMaxAttemptsAlert(false);
    }
  }, [lockoutEndTime, showMaxAttemptsAlert]);

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

  const deleteAccount = async () => {
    try {
      dispatch(showGlobalLoading(true));
      await Agent.agent.deleteAccount();
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
      case 0: {
        biometricAuth();
        break;
      }
      case 1: {
        setChangePinIsOpen(true);
        break;
      }
      case OptionIndex.DeleteAccount:
        deleteAccount();
        break;
      default:
        return;
    }
    setOption(null);
  };

  const closeAlert = () => {
    setOpenBiometricAlert(false);
  };

  const openDeleteAccountAlert = () => {
    setOption(OptionIndex.DeleteAccount);
    setOpenDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setOpenDeleteAlert(false);
  };

  return (
    <>
      <InfoCard
        content={i18n.t("settings.sections.text")}
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
        {i18n.t("settings.sections.support.title")}
      </div>
      <ListCard
        items={supportItems}
        renderItem={(item) => (
          <ListItem
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
        deleteButtonAction={openDeleteAccountAlert}
        deleteButtonText={`${i18n.t("settings.sections.deleteaccount.button")}`}
      />
      <ChangePin
        isOpen={changePinIsOpen}
        setIsOpen={setChangePinIsOpen}
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
        headerText={i18n.t("settings.sections.deleteaccount.alert.title")}
        confirmButtonText={`${i18n.t(
          "settings.sections.deleteaccount.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.deleteaccount.alert.cancel"
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
    </>
  );
};

export { SettingsList };
