import { IonContent } from "@ionic/react";
import { FinishSetupProps } from "./FinishSetup.types";
import { i18n } from "../../../../../i18n";
import Welcome from "../../../../assets/images/welcome.png";
import "./FinishSetup.scss";

const FinishSetup = ({ userName }: FinishSetupProps) => {
  return (
    <IonContent className="finish-setup">
      <div className="container">
        <img
          src={Welcome}
          alt="welcome"
        />
        <h3>
          {i18n.t("setupprofile.finishsetup.greeting", { name: userName })}
        </h3>
        <p>{i18n.t("setupprofile.finishsetup.text")}</p>
      </div>
    </IonContent>
  );
};

export { FinishSetup };
