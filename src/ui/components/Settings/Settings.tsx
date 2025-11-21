import { useState } from "react";
import { i18n } from "../../../i18n";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import { SideSlider } from "../SideSlider";
import { ManagePassword } from "./components/ManagePassword";
import { SettingsList } from "./components/SettingsList";
import { TermsAndPrivacy } from "./components/TermsAndPrivacy";
import { SettingScreen, SettingsProps } from "./Settings.types";
import { RecoverySeedPhrase } from "./components/RecoverySeedPhrase";
import "./Settings.scss";

export const Settings = ({ show, setShow }: SettingsProps) => {
  const [screen, setScreen] = useState(SettingScreen.Settings);

  const handleClose = () => {
    if (screen === SettingScreen.Settings) {
      setShow(false);
      return;
    }

    setScreen(SettingScreen.Settings);
  };

  const title = (() => {
    switch (screen) {
      case SettingScreen.ManagePassword:
        return i18n.t("settings.sections.security.managepassword.page.title");
      case SettingScreen.TermsAndPrivacy:
        return i18n.t("settings.sections.support.terms.submenu.title");
      case SettingScreen.RecoverySeedPhrase:
        return i18n.t("settings.sections.security.seedphrase.page.title");
      default:
        return i18n.t("settings.header");
    }
  })();

  const getCurrentScreen = () => {
    switch (screen) {
      case SettingScreen.ManagePassword:
        return <ManagePassword />;
      case SettingScreen.TermsAndPrivacy:
        return <TermsAndPrivacy />;
      case SettingScreen.RecoverySeedPhrase:
        return <RecoverySeedPhrase onClose={handleClose} />;
      default:
        return (
          <SettingsList
            switchView={setScreen}
            handleClose={handleClose}
          />
        );
    }
  };

  return (
    <SideSlider
      renderAsModal={true}
      isOpen={show}
      className="settings-modal"
    >
      <ScrollablePageLayout
        pageId="settings"
        activeStatus={show}
        header={
          <PageHeader
            backButton={true}
            onBack={handleClose}
            title={title}
          />
        }
      >
        <div
          className={`${title?.toLowerCase().replace(" ", "-")}-content${
            screen === SettingScreen.Settings ? "" : " nested-content"
          }`}
          data-testid={`${title?.toLowerCase().replace(" ", "-")}-content`}
        >
          {getCurrentScreen()}
        </div>
      </ScrollablePageLayout>
    </SideSlider>
  );
};
