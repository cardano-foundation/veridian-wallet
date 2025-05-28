import { IonIcon } from "@ionic/react";
import { lockClosedOutline } from "ionicons/icons";
import { i18n } from "../../../../i18n";
import { PageFooter } from "../../../components/PageFooter";
import "./SetupPassword.scss";
import { SetupPasswordProps } from "./SetupPassword.types";

export const SetupPassword = ({
  onSetupPasswordClick,
  onSkipClick,
}: SetupPasswordProps) => {
  return (
    <div className="setup-password">
      <div className="page-info">
        <IonIcon icon={lockClosedOutline} />
        <h1>{i18n.t("createpassword.setuppassword.title")}</h1>
        <p>{i18n.t("createpassword.setuppassword.description")}</p>
      </div>
      <PageFooter
        primaryButtonText={`${i18n.t(
          "createpassword.setuppassword.button.enable"
        )}`}
        primaryButtonAction={onSetupPasswordClick}
        tertiaryButtonText={`${i18n.t(
          "createpassword.setuppassword.button.skip"
        )}`}
        tertiaryButtonAction={onSkipClick}
      />
    </div>
  );
};
