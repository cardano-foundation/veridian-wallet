import { IonIcon } from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { ImgHTMLAttributes } from "react";
import { combineClassNames } from "../../utils/style";
import "./FallbackIcon.scss";

const FallbackIcon = ({
  src,
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) => {
  const testId = (props as Record<string, string>)["data-testid"];

  const fallbackClass = combineClassNames(className, "fallback-logo");

  if (src) {
    return (
      <img
        src={src}
        className={fallbackClass}
        {...props}
      />
    );
  }

  const classNames = combineClassNames(fallbackClass, "fallback-default-logo");

  return (
    <div
      slot={props.slot}
      className={classNames}
      data-testid={testId}
    >
      <IonIcon
        icon={personCircleOutline}
        color="light"
      />
    </div>
  );
};

export { FallbackIcon };
