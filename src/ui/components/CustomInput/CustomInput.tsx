import { useState } from "react";
import { IonButton, IonIcon, IonInput, IonItem, IonLabel } from "@ionic/react";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { CustomInputProps } from "./CustomInput.types";
import "./CustomInput.scss";
import { i18n } from "../../../i18n";
import { combineClassNames } from "../../utils/style";
import { useHideKeyboard } from "../../hooks/useHideKeyboard";

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
  className,
  labelAction,
  endAction,
  type = "text",
}: CustomInputProps) => {
  const [hidden, setHidden] = useState(hiddenInput);
  const { hideKeyboard } = useHideKeyboard();

  const handleFocus = (focus: boolean) => {
    if (onChangeFocus) {
      onChangeFocus(focus);
    }
  };

  const inputClassname = combineClassNames("custom-input", className, {
    error: !!error,
    "has-action": !!labelAction,
  });

  return (
    <IonItem className={inputClassname}>
      {!labelAction ? (
        <IonLabel
          position="stacked"
          data-testid={`${title
            ?.toLowerCase()
            .replace(/\s/g, "-")}-input-title`}
        >
          {title}
          {optional && (
            <span className="custom-input-optional">
              {i18n.t("custominput.optional")}
            </span>
          )}
        </IonLabel>
      ) : (
        <div className="input-label">
          <IonLabel
            position="stacked"
            data-testid={`${title
              ?.toLowerCase()
              .replace(/\s/g, "-")}-input-title`}
          >
            {title}
            {optional && (
              <span className="custom-input-optional">
                {i18n.t("custominput.optional")}
              </span>
            )}
          </IonLabel>
          {labelAction}
        </div>
      )}
      <div className="input-line">
        <IonInput
          id={dataTestId}
          data-testid={dataTestId}
          label={title}
          aria-label={`input-${title}`}
          labelPlacement="stacked"
          type={hidden ? "password" : type}
          autofocus={autofocus}
          placeholder={placeholder}
          onIonInput={(e) => onChangeInput(e.target.value as string)}
          onIonFocus={() => handleFocus(true)}
          onIonBlur={() => handleFocus(false)}
          onKeyDown={hideKeyboard}
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
        {endAction}
      </div>
    </IonItem>
  );
};

export { CustomInput };
