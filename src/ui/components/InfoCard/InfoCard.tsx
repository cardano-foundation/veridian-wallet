import { IonCard, IonIcon } from "@ionic/react";
import { informationCircleOutline, warningOutline } from "ionicons/icons";
import { InfoCardProps } from "./InfoCard.types";
import { combineClassNames } from "../../utils/style";
import "./InfoCard.scss";

const InfoCard = ({
  content,
  className,
  icon,
  danger,
  warning,
  children,
}: InfoCardProps) => {
  const classes = combineClassNames("info-card", className, {
    danger: !!danger,
    warning: !!warning,
  });

  return (
    <IonCard className={classes}>
      {content && <p>{content}</p>}
      {children}
      <div className="alert-icon">
        <IonIcon
          icon={warning ? warningOutline : icon ?? informationCircleOutline}
          slot="icon-only"
        />
      </div>
    </IonCard>
  );
};

export { InfoCard };
