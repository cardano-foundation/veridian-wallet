import { IonContent } from "@ionic/react";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import { nameChecker } from "../../../../utils/nameChecker";
import "./SetupProfile.scss";
import { SetupProfileProps } from "./SetupProfile.types";

const SetupProfile = ({ userName, onChangeUserName }: SetupProfileProps) => {
  const [inputChange, setInputChange] = useState(false);
  const errorMessage = inputChange ? nameChecker.getError(userName) : undefined;

  return (
    <IonContent className="setup-profile">
      <p className="title">{i18n.t("setupprofile.profilesetup.description")}</p>
      <CustomInput
        title={`${i18n.t("setupprofile.profilesetup.form.input")}`}
        placeholder={`${i18n.t("setupprofile.profilesetup.form.placeholder")}`}
        value={userName}
        onChangeInput={(value) => {
          onChangeUserName(value);
          setInputChange(true);
        }}
        dataTestId="profile-user-name"
        error={!!errorMessage}
      />
      <ErrorMessage message={errorMessage} />
    </IonContent>
  );
};

export { SetupProfile };
