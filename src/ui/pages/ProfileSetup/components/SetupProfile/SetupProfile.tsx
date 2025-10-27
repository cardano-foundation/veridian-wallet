import { IonContent } from "@ionic/react";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import "./SetupProfile.scss";
import { SetupProfileProps } from "./SetupProfile.types";

const SetupProfile = ({
  userName,
  onChangeUserName,
  isGroupProfile,
  errorMessage,
  isLoading,
}: SetupProfileProps) => {
  const [inputChange, setInputChange] = useState(false);
  const displayError = inputChange && !isLoading ? errorMessage : undefined;

  return (
    <IonContent className="setup-profile">
      <p className="subtitle">
        {isGroupProfile
          ? i18n.t("setupprofile.profilesetup.description.group")
          : i18n.t("setupprofile.profilesetup.description.individual")}
      </p>
      <CustomInput
        title={`${i18n.t("setupprofile.profilesetup.form.input")}`}
        placeholder={`${i18n.t("setupprofile.profilesetup.form.placeholder")}`}
        value={userName}
        onChangeInput={(value) => {
          onChangeUserName(value);
          setInputChange(true);
        }}
        dataTestId="profile-user-name"
        error={!!displayError}
      />
      <ErrorMessage message={displayError} />
    </IonContent>
  );
};

export { SetupProfile };
