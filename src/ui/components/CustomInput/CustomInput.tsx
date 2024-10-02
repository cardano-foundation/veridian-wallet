import { useState } from "react";
import { IonButton, IonIcon, IonInput, IonItem, IonLabel } from "@ionic/react";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { CustomInputProps } from "./CustomInput.types";
import "./CustomInput.scss";
import { i18n } from "../../../i18n";

const CustomInput = ({
  dataTestId,
  title,
  placeholder,
  hiddenInput,
  autofocus,
  onChangeInput,
  onChangeFocus,
  optional,
  value,
  error,
  action,
  actionIcon,
}: CustomInputProps) => {
  const [hidden, setHidden] = useState(hiddenInput);

  const handleFocus = (focus: boolean) => {
    if (onChangeFocus) {
      onChangeFocus(focus);
    }
  };
  return (
    <IonItem className={`custom-input ${error ? "error" : ""}`}>
      <IonLabel
        position="stacked"
        data-testid={`${title?.toLowerCase().replace(/\s/g, "-")}-input-title`}
      >
        {title}
        {optional && (
          <span className="custom-input-optional">
            {i18n.t("custominput.optional")}
          </span>
        )}
      </IonLabel>
      <div className="input-line">
        <IonInput
          id={dataTestId}
          data-testid={dataTestId}
          label={title}
          aria-label={`input-${title}`}
          labelPlacement="stacked"
          type={hidden ? "password" : "text"}
          autofocus={autofocus}
          placeholder={placeholder}
          onIonInput={(e) => onChangeInput(e.target.value as string)}
          onIonFocus={() => handleFocus(true)}
          onIonBlur={() => handleFocus(false)}
          value={value}
        />
        {hiddenInput && (
          <IonButton
            shape="round"
            onClick={() => {
              setHidden(!hidden);
            }}
            data-testid={`${dataTestId}-hide-btn`}
          >
            <IonIcon
              slot="icon-only"
              icon={hidden ? eyeOutline : eyeOffOutline}
              color="primary"
            />
          </IonButton>
        )}
        {action && actionIcon && (
          <IonButton
            shape="round"
            data-testid={`${dataTestId}-action`}
            onClick={(e) => {
              action(e);
            }}
          >
            <IonIcon
              slot="icon-only"
              icon={actionIcon}
              color="primary"
            />
          </IonButton>
        )}
      </div>
    </IonItem>
  );
};

export { CustomInput };
