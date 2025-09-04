import { IonButton, IonContent, IonIcon } from "@ionic/react";
import { peopleCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { MemberAvatar } from "../../../../components/Avatar";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import { nameChecker } from "../../../../utils/nameChecker";
import { SetupProfileStep } from "../../ProfileSetup.types";
import "./GroupSetup.scss";
import { SetupGroupProps } from "./GroupSetup.types";

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
          <p className="subtitle">
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
        <div className="join-group-details">
          <MemberAvatar
            firstLetter={groupName.charAt(0)}
            rank={0}
          />
          <p>{i18n.t("setupprofile.groupsetupconfirm.description")}</p>
          <h2>{groupName}</h2>
        </div>
      )}
    </IonContent>
  );
};

export { GroupSetup };
