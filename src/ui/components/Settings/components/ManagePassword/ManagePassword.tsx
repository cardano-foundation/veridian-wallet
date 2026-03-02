import { IonModal, IonToggle } from "@ionic/react";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { KeyStoreKeys, SecureStorage } from "../../../../../core/storage";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import {
  getStateCache,
  setAuthentication,
  setToastMsg,
} from "../../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../../globals/types";
import { CreatePassword } from "../../../../pages/CreatePassword";
import { showError } from "../../../../utils/error";
import { Alert } from "../../../Alert";
import { ListCard } from "../../../ListCard/ListCard";
import { ListItem } from "../../../ListCard/ListItem/ListItem";
import { Verification } from "../../../Verification";
import { VerifyPassword } from "../../../VerifyPassword";

const ManagePassword = () => {
  const dispatch = useAppDispatch();
  const stateCache = useSelector(getStateCache);
  const authentication = stateCache.authentication;
  const userAction = useRef("");
  const passwordIsSet = authentication.passwordIsSet;

  const [confirmPassword, setConfirmPassword] = useState(false);
  const [alertEnableIsOpen, setAlertEnableIsOpen] = useState(false);
  const [alertDisableIsOpen, setAlertDisableIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
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
        userAction.current = "";
        dispatch(
          setAuthentication({
            ...authentication,
            passwordIsSet: false,
          })
        );
        dispatch(setToastMsg(ToastMsgType.PASSWORD_SETTING_UPDATE));
      } catch (e) {
        showError(
          "Unable to delete password",
          e,
          dispatch,
          ToastMsgType.PASSWORD_SETTING_UPDATE_FAIL
        );
      }
    } else {
      openChangePassword();
    }
  };

  const handleChange = () => {
    userAction.current = "change";
    setConfirmPassword(true);
  };

  const openChangePassword = () => {
    setCreatePasswordModalIsOpen(true);
  };

  return (
    <>
      <div className="settings-section-title-placeholder" />
      <ListCard
        items={[{ id: "toggle-password" }]}
        renderItem={(item) => (
          <ListItem
            key={item.id}
            onClick={handleToggle}
            testId="settings-item-toggle-password"
            className="list-item"
            label={`${i18n.t(
              "settings.sections.security.managepassword.page.enable"
            )}`}
            actionIcon={
              <IonToggle
                aria-label={`${i18n.t(
                  "settings.sections.security.managepassword.page.enable"
                )}`}
                className="toggle-button"
                checked={passwordIsSet}
                onIonChange={handleToggle}
              />
            }
          />
        )}
        testId="settings-security-items"
      />
      {passwordIsSet && (
        <ListCard
          items={[{ id: "change-password" }]}
          renderItem={(item) => (
            <ListItem
              key={item.id}
              onClick={handleChange}
              testId="settings-item-change-password"
              className="list-item"
              label={`${i18n.t(
                "settings.sections.security.managepassword.page.change"
              )}`}
            />
          )}
          testId="settings-security-items"
        />
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
        actionConfirm={() => setVerifyIsOpen(true)}
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
        actionConfirm={() => setVerifyIsOpen(true)}
        actionCancel={handleClear}
        actionDismiss={handleClear}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
      <VerifyPassword
        isOpen={confirmPassword}
        setIsOpen={setConfirmPassword}
        onVerify={openChangePassword}
      />
      <IonModal
        isOpen={createPasswordModalIsOpen}
        className="create-password-modal"
        data-testid="create-password-modal"
        onDidDismiss={handleClear}
      >
        <CreatePassword
          handleClear={handleClear}
          userAction={userAction}
          isSetting
        />
      </IonModal>
    </>
  );
};

export { ManagePassword };
