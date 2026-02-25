import { IonContent } from "@ionic/react";
import { FinishSetupProps } from "./Welcome.types";
import { i18n } from "../../../../../i18n";
import "./Welcome.scss";

const Welcome = ({ userName }: FinishSetupProps) => {
  return (
    <IonContent className="finish-setup">
      <div className="container">
        <span className="welcome-icon">🎉</span>
        <h3>
          {i18n.t("setupprofile.finishsetup.greeting", { name: userName })}
        </h3>
        <p>{i18n.t("setupprofile.finishsetup.text")}</p>
      </div>
    </IonContent>
  );
};

export { Welcome };
