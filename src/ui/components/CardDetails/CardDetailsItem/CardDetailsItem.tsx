import { IonButton, IonIcon, IonItem, IonText } from "@ionic/react";
import { copyOutline } from "ionicons/icons";
import { ToastMsgType } from "../../../globals/types";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { useAppDispatch } from "../../../../store/hooks";
import { CardDetailsItemProps } from "./CardDetailsItem.types";
import { writeToClipboard } from "../../../utils/clipboard";
import "./CardDetailsItem.scss";
import { combineClassNames } from "../../../utils/style";
import { getUTCOffset } from "../../../utils/formatters";

const CardDetailsItem = ({
  info,
  copyButton,
  icon,
  customIcon,
  keyValue,
  copyContent,
  testId,
  className,
  fullText = false,
  mask = true,
  endSlot,
  startSlot,
}: CardDetailsItemProps) => {
  const dispatch = useAppDispatch();

  const ionItemClass = combineClassNames(
    "card-details-info-block-line",
    className
  );
  const textClass = combineClassNames("card-details-info-block-data", {
    "card-details-info-block-subtext": !!keyValue,
    mask: mask,
  });

  const contentClass = combineClassNames("card-details-info-content", {
    "no-hide-overflow": !!fullText && !copyButton,
  });

  const copy = () => {
    writeToClipboard(String(copyContent ?? info ?? ""));
    dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
  };

  const formatScreenTime = (value: unknown) => {
    if (typeof value !== "string") return "";

    const parts = value.split(" - ");
    if (parts.length !== 2) return "";

    const timeAndOffset = parts[1];
    const timeOffsetParts = timeAndOffset.split(" (UTC ");
    if (timeOffsetParts.length !== 2) return "";

    const timePart = timeOffsetParts[0];
    const offsetPart = timeOffsetParts[1].replace(")", "");

    return `${timePart.slice(0, 5)} (UTC${offsetPart})`;
  };

  return (
    <IonItem
      lines="none"
      className={ionItemClass}
      data-testid={testId}
    >
      {icon && (
        <IonIcon
          className="card-details-info-block-line-start-icon"
          icon={icon}
          slot="start"
        />
      )}
      {customIcon && (
        <img
          className="card-details-info-block-line-start-icon"
          slot="start"
          src={customIcon}
          alt="keri"
        />
      )}
      {startSlot && (
        <div
          slot="start"
          className="card-details-info-block-line-start-icon"
        >
          {startSlot}
        </div>
      )}
      <div className={contentClass}>
        <IonText className={textClass}>
          {keyValue && (
            <IonText
              data-testid={testId && `${testId}-key-value`}
              className="card-details-info-block-key"
            >
              {keyValue}
            </IonText>
          )}
          <span data-testid={testId && `${testId}-text-value`}>
            {typeof info === "string" && keyValue?.includes("screen Time")
              ? formatScreenTime(info)
              : info}
          </span>
        </IonText>
        {copyButton && (
          <IonButton
            slot="end"
            shape="round"
            className="action-button"
            data-testid={testId && `${testId}-copy-button`}
            onClick={copy}
          >
            <IonIcon icon={copyOutline} />
          </IonButton>
        )}
        {endSlot}
      </div>
    </IonItem>
  );
};

export { CardDetailsItem };
