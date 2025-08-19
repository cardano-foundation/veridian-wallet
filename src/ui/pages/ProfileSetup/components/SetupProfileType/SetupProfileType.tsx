import { IonCard, IonCheckbox, IonContent } from "@ionic/react";
import { i18n } from "../../../../../i18n";
import "./SetupProfileType.scss";
import { ProfileType, ProfileTypeProps } from "./SetupProfileType.types";
import { combineClassNames } from "../../../../utils/style";

const SetupProfileType = ({
  profileType,
  onChangeProfile,
}: ProfileTypeProps) => {
  return (
    <IonContent className="profile-type">
      <p className="title">{i18n.t("setupprofile.profiletype.description")}</p>
      {Object.values(ProfileType).map((value) => {
        const checked = value === profileType;
        const title = i18n.t(`setupprofile.profiletype.${value}.title`);
        const text = i18n.t(`setupprofile.profiletype.${value}.text`);
        const className = combineClassNames(
          "profile-type",
          checked ? "active" : undefined
        );

        return (
          <IonCard
            key={value}
            className={className}
            onClick={(e) => {
              e.stopPropagation();
              onChangeProfile(value);
            }}
          >
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <IonCheckbox
              checked={checked}
              aria-label=""
              className="checkbox"
              data-testid={`identifier-select-${value}`}
            />
          </IonCard>
        );
      })}
    </IonContent>
  );
};

export { SetupProfileType };
