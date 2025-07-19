import { IonButton, IonContent, IonIcon } from "@ionic/react";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import { nameChecker } from "../../../../utils/nameChecker";
import "./SetupGroup.scss";
import { SetupGroupProps } from "./SetupGroup.types";
import { peopleCircleOutline } from "ionicons/icons";

const SetupGroup = ({
  groupName,
  onChangeGroupName,
  onClickJoinGroupButton,
}: SetupGroupProps) => {
  const [inputChange, setInputChange] = useState(false);
  const errorMessage = inputChange
    ? nameChecker.getError(groupName)
    : undefined;

  return (
    <IonContent className="setup-group">
      <p className="title">{i18n.t("setupprofile.groupsetup.description")}</p>
      <CustomInput
        title={`${i18n.t("setupprofile.groupsetup.form.input")}`}
        placeholder={`${i18n.t("setupprofile.groupsetup.form.placeholder")}`}
        value={groupName}
        onChangeInput={(value) => {
          // TODO: Check if the name is valid
          onChangeGroupName(value);
          setInputChange(true);
        }}
        dataTestId="profile-group-name"
        error={!!errorMessage}
      />
      <ErrorMessage message={errorMessage} />
      <div className="line-text">
        {i18n.t("setupprofile.groupsetup.form.or")}
      </div>
      <IonButton
        fill="outline"
        expand="block"
        className="open-scan secondary-button"
        onClick={onClickJoinGroupButton}
      >
        <IonIcon
          slot="start"
          icon={peopleCircleOutline}
        />
        {i18n.t("setupprofile.groupsetup.form.joingroup")}
      </IonButton>
    </IonContent>
  );
};

export { SetupGroup };
