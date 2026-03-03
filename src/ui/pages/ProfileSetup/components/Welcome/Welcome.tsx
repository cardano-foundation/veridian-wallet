import { IonContent } from "@ionic/react";
import { FinishSetupProps } from "./Welcome.types";
import { i18n } from "../../../../../i18n";
import WelcomeImg from "../../../../assets/images/welcome.svg";
import "./Welcome.scss";

const Welcome = ({ userName }: FinishSetupProps) => {
  return (
    <IonContent className="finish-setup">
      <div className="container">
        <img
          className="welcome-icon"
          src={WelcomeImg}
          alt="Welcome"
        />
        <h3>
          {i18n.t("setupprofile.finishsetup.greeting", { name: userName })}
        </h3>
        <p>{i18n.t("setupprofile.finishsetup.text")}</p>
      </div>
    </IonContent>
  );
};

export { Welcome };
