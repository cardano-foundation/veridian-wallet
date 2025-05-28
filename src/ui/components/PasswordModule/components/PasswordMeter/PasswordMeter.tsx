import { Trans } from "react-i18next";
import { i18n } from "../../../../../i18n";
import { passwordStrengthChecker } from "../../../../utils/passwordStrengthChecker";
import { combineClassNames } from "../../../../utils/style";
import "./PasswordMeter.scss";
import { PasswordMeterProps, StrongLevel } from "./PasswordMeter.types";

const PasswordMeter = ({ password }: PasswordMeterProps) => {
  const strongLevel = passwordStrengthChecker.getPasswordStrength(password);

  const label = (() => {
    switch (strongLevel) {
      case StrongLevel.Strong:
        return i18n.t("createpassword.meter.strengthlevel.strong");
      case StrongLevel.Medium:
        return i18n.t("createpassword.meter.strengthlevel.medium");
      default:
        return i18n.t("createpassword.meter.strengthlevel.weak");
    }
  })();

  const classes = combineClassNames(
    "level-container",
    label.toLocaleLowerCase()
  );
  const acceptCriteriaClass = combineClassNames("accept-criteria", {
    "match-length": passwordStrengthChecker.isLengthValid(password),
    lowercase: passwordStrengthChecker.isLowercaseValid(password),
    uppercase: passwordStrengthChecker.isUppercaseValid(password),
    "has-number": passwordStrengthChecker.isNumberValid(password),
    "has-symbol": passwordStrengthChecker.isSymbolValid(password),
  });

  return (
    <div className="password-criteria">
      {password.length > 0 && (
        <div className="password-strength-meter">
          <div className={classes}>
            <div className="level" />
            <div className="level" />
            <div className="level" />
          </div>
          <p>{label}</p>
        </div>
      )}
      <p
        className={acceptCriteriaClass}
        data-testid="password-accept-criteria"
      >
        <Trans i18nKey="createpassword.meter.acceptcriteria.text" />
      </p>
    </div>
  );
};

export { PasswordMeter };
