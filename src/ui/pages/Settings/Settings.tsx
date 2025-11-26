import { useState } from "react";
import { i18n } from "../../../i18n";
import { ManagePassword } from "./components/ManagePassword";
import { SettingsList } from "./components/SettingsList";
import { TermsAndPrivacy } from "./components/TermsAndPrivacy";
import { SettingScreen, SettingsProps } from "./Settings.types";
import { RecoverySeedPhrase } from "./components/RecoverySeedPhrase";
import { SettingsTemplate } from "../../components/SettingsTemplate/SettingsTemplate";
import { Verification } from "../../components/Verification";
import { ChangePin } from "./components/ChangePin";

export const Settings = ({ show, setShow }: SettingsProps) => {
  const [screen, setScreen] = useState<SettingScreen | undefined>(undefined);
  const [showChildren, setShowChildren] = useState(false);
  const [changePinStep, setChangePinStep] = useState<number>(0);

  const handleClose = () => {
    setShow(false);
  };

  const handleMenuOptionClick = (selectedScreen: SettingScreen) => {
    setScreen(selectedScreen);
    setShowChildren(true);
  };

  const title = (() => {
    switch (screen) {
      case SettingScreen.ChangePin:
        return changePinStep === 0
          ? i18n.t("settings.sections.security.changepin.createpasscode")
          : i18n.t("settings.sections.security.changepin.reenterpasscode");
      case SettingScreen.ManagePassword:
        return i18n.t("settings.sections.security.managepassword.page.title");
      case SettingScreen.TermsAndPrivacy:
        return i18n.t("settings.sections.support.terms.submenu.title");
      case SettingScreen.RecoverySeedPhrase:
        return i18n.t("settings.sections.security.seedphrase.page.title");
      default:
        return "";
    }
  })();

  const getCurrentScreen = () => {
    switch (screen) {
      case SettingScreen.ChangePin:
        return (
          <ChangePin
            changePinStep={changePinStep}
            setChangePinStep={setChangePinStep}
            handleClose={handleClose}
          />
        );
      case SettingScreen.ManagePassword:
        return <ManagePassword />;
      case SettingScreen.TermsAndPrivacy:
        return <TermsAndPrivacy />;
      case SettingScreen.RecoverySeedPhrase:
        return <RecoverySeedPhrase onClose={handleClose} />;
      default:
        return undefined;
    }
  };

  return (
    <>
      <SettingsTemplate
        show={show}
        setShow={setShow}
        title={i18n.t("settings.header")}
      >
        <SettingsList
          switchView={handleMenuOptionClick}
          handleClose={handleClose}
        />
      </SettingsTemplate>
      <SettingsTemplate
        show={showChildren}
        setShow={setShowChildren}
        title={title}
      >
        {getCurrentScreen()}
      </SettingsTemplate>
    </>
  );
};
