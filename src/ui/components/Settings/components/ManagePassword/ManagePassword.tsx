import {
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonToggle,
} from "@ionic/react";
import { useSelector } from "react-redux";
import { useRef, useState } from "react";
import { chevronForward } from "ionicons/icons";
import { useAppDispatch } from "../../../../../store/hooks";
import {
  getStateCache,
  setAuthentication,
  setToastMsg,
} from "../../../../../store/reducers/stateCache";
import { KeyStoreKeys, SecureStorage } from "../../../../../core/storage";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { i18n } from "../../../../../i18n";
import { Alert } from "../../../Alert";
import { VerifyPassword } from "../../../VerifyPassword";
import { VerifyPasscode } from "../../../VerifyPasscode";
import { CreatePassword } from "../../../../pages/CreatePassword";

const ManagePassword = () => {
  const dispatch = useAppDispatch();
  const stateCache = useSelector(getStateCache);
  const authentication = stateCache.authentication;
  const userAction = useRef("");
  const [passwordIsSet, setPasswordIsSet] = useState(
    stateCache?.authentication.passwordIsSet
  );
  const [alertEnableIsOpen, setAlertEnableIsOpen] = useState(false);
  const [alertDisableIsOpen, setAlertDisableIsOpen] = useState(false);
  const [verifyPasswordIsOpen, setVerifyPasswordIsOpen] = useState(false);
  const [verifyPasscodeIsOpen, setVerifyPasscodeIsOpen] = useState(false);
  const [createPasswordModalIsOpen, setCreatePasswordModalIsOpen] =
    useState(false);

  const handleToggle = () => {
    if (passwordIsSet) {
      userAction.current = "disable";
      setAlertDisableIsOpen(true);
    } else {
      userAction.current = "enable";
      setAlertEnableIsOpen(true);
    }
  };

  const handleClear = () => {
    setAlertEnableIsOpen(false);
    setAlertDisableIsOpen(false);
    userAction.current = "";
    setCreatePasswordModalIsOpen(false);
  };

  const onVerify = async () => {
    if (passwordIsSet && userAction.current === "disable") {
      try {
        await SecureStorage.delete(KeyStoreKeys.APP_OP_PASSWORD);
        setPasswordIsSet(false);
        userAction.current = "";
        dispatch(
          setAuthentication({
            ...authentication,
            passwordIsSet: false,
          })
        );
        dispatch(setToastMsg(ToastMsgType.PASSWORD_DISABLED));
      } catch (e) {
        showError("Unable to delete password", e, dispatch);
      }
    } else {
      setCreatePasswordModalIsOpen(true);
    }
  };

  const handleChange = () => {
    userAction.current = "change";
    setVerifyPasswordIsOpen(true);
  };

  return (
    <>
      <div className="settings-section-title-placeholder" />
      <IonCard>
        <IonList
          lines="none"
          data-testid="settings-security-items"
        >
          <IonItem
            onClick={() => handleToggle()}
            className="settings-item"
            data-testid={"settings-item-toggle-password"}
          >
            <IonLabel>
              {i18n.t("settings.sections.security.managepassword.page.enable")}
            </IonLabel>
            <IonToggle
              aria-label={`${i18n.t(
                "settings.sections.security.managepassword.page.enable"
              )}`}
              className="toggle-button"
              checked={passwordIsSet}
            />
          </IonItem>
        </IonList>
      </IonCard>
      {passwordIsSet && (
        <IonCard>
          <IonList
            lines="none"
            data-testid="settings-security-items"
          >
            <IonItem
              onClick={() => handleChange()}
              className="settings-item"
              data-testid={"settings-item-change-password"}
            >
              <IonLabel>{`${i18n.t(
                "settings.sections.security.managepassword.page.change"
              )}`}</IonLabel>

              <IonIcon
                aria-hidden="true"
                icon={chevronForward}
                slot="end"
              />
            </IonItem>
          </IonList>
        </IonCard>
      )}
      <Alert
        isOpen={alertEnableIsOpen}
        setIsOpen={setAlertEnableIsOpen}
        dataTestId="alert-cancel-enable-password"
        headerText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.enablemessage"
        )}`}
        confirmButtonText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.cancel"
        )}`}
        actionConfirm={() => setVerifyPasscodeIsOpen(true)}
        actionCancel={handleClear}
        actionDismiss={handleClear}
      />
      <Alert
        isOpen={alertDisableIsOpen}
        setIsOpen={setAlertDisableIsOpen}
        dataTestId="alert-cancel"
        headerText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.disablemessage"
        )}`}
        confirmButtonText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "settings.sections.security.managepassword.page.alert.cancel"
        )}`}
        actionConfirm={() => setVerifyPasswordIsOpen(true)}
        actionCancel={handleClear}
        actionDismiss={handleClear}
      />
      <VerifyPassword
        isOpen={verifyPasswordIsOpen}
        setIsOpen={setVerifyPasswordIsOpen}
        onVerify={onVerify}
      />
      <VerifyPasscode
        isOpen={verifyPasscodeIsOpen}
        setIsOpen={setVerifyPasscodeIsOpen}
        onVerify={onVerify}
      />
      <IonModal
        isOpen={createPasswordModalIsOpen}
        className="create-password-modal"
        data-testid="create-password-modal"
        onDidDismiss={handleClear}
      >
        <CreatePassword
          handleClear={handleClear}
          setPasswordIsSet={setPasswordIsSet}
          userAction={userAction}
        />
      </IonModal>
    </>
  );
};

export { ManagePassword };
