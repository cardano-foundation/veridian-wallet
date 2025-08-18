import { IonButton, IonContent, IonIcon } from "@ionic/react";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import { nameChecker } from "../../../../utils/nameChecker";
import "./GroupSetup.scss";
import { SetupGroupProps } from "./GroupSetup.types";
import { peopleCircleOutline } from "ionicons/icons";
import { SetupProfileStep } from "../../ProfileSetup.types";
import { MemberAvatar } from "../../../../components/Avatar";

const GroupSetup = ({
  groupName,
  onChangeGroupName,
  onClickEvent,
  setupProfileStep,
}: SetupGroupProps) => {
  const [inputChange, setInputChange] = useState(false);
  const errorMessage = inputChange
    ? nameChecker.getError(groupName)
    : undefined;

  return (
    <IonContent className="group-setup">
      {setupProfileStep === SetupProfileStep.GroupSetupStart ? (
        <>
          <p className="title">
            {i18n.t("setupprofile.groupsetupstart.description")}
          </p>
          <CustomInput
            title={`${i18n.t("setupprofile.groupsetupstart.form.input")}`}
            placeholder={`${i18n.t(
              "setupprofile.groupsetupstart.form.placeholder"
            )}`}
            value={groupName}
            onChangeInput={(value) => {
              onChangeGroupName(value);
              setInputChange(true);
            }}
            dataTestId="profile-group-name"
            error={!!errorMessage}
          />
          <ErrorMessage message={errorMessage} />
          <div className="line-text">
            {i18n.t("setupprofile.groupsetupstart.form.or")}
          </div>
          <IonButton
            fill="outline"
            expand="block"
            className="open-scan secondary-button"
            onClick={onClickEvent}
          >
            <IonIcon
              slot="start"
              icon={peopleCircleOutline}
            />
            {i18n.t("setupprofile.groupsetupstart.form.joingroup")}
          </IonButton>
        </>
      ) : (
        // TODO: Update UI for joiner
        <>
          <MemberAvatar
            firstLetter={groupName.charAt(0)}
            rank={0}
          />
          {groupName}
          {i18n.t("setupprofile.groupsetupconfirm.description")}
        </>
      )}
    </IonContent>
  );
};

export { GroupSetup };
