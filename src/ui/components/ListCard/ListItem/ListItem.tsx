import { IonIcon, IonItem, IonLabel, IonNote, IonButton } from "@ionic/react";
import { chevronForward, chevronForwardOutline } from "ionicons/icons";
import { combineClassNames } from "../../../utils/style";
import { CardDetailsItem } from "../../CardDetails/CardDetailsItem";
import { CardDetailsBlock } from "../../CardDetails/CardDetailsBlock/CardDetailsBlock";
import { FlatBorderType } from "../../CardDetails/CardDetailsBlock/CardDetailsBlock.types";
import { ListItemProps } from "./ListItem.types";
import "./ListItem.scss";

const ListItem = ({
  icon,
  onClick,
  testId,
  className,
  children,
  index,
  label,
  actionIcon,
  note,
  href,
  title,
  flatBorder,
  copyContent,
  endSlotIcon,
  showStartIcon = false,
}: ListItemProps) => {
  if (title !== undefined) {
    const classes = combineClassNames("card-block", className, {
      "flat-border-bot": flatBorder === FlatBorderType.BOT,
      "flat-border-top": flatBorder === FlatBorderType.TOP,
      "has-content": !!children,
    });

    const buttonTestId = testId ? `${testId}-nav-button` : undefined;
    const containerTestId = testId ? `${testId}-card-block` : undefined;

    return (
      <CardDetailsBlock
        onClick={!copyContent ? onClick : undefined}
        className={classes}
        dataTestId={containerTestId}
      >
        <CardDetailsItem
          testId={testId}
          className="card-header"
          copyContent={copyContent}
          info={title}
          copyButton={!!copyContent}
          icon={icon}
          endSlot={
            !copyContent &&
            onClick && (
              <IonButton
                slot="end"
                shape="round"
                className="action-button"
                data-testid={buttonTestId}
              >
                <IonIcon icon={endSlotIcon ?? chevronForwardOutline} />
              </IonButton>
            )
          }
        />
        {children}
      </CardDetailsBlock>
    );
  }

  const content = (
    <IonItem
      onClick={onClick}
      className={combineClassNames("list-item", className)}
      data-testid={
        testId || (index !== undefined ? `list-item-${index}` : undefined)
      }
    >
      {showStartIcon && icon && (
        <IonIcon
          aria-hidden="true"
          icon={icon}
          slot="start"
        />
      )}
      {label && <IonLabel>{label}</IonLabel>}
      {actionIcon ? (
        actionIcon
      ) : note ? (
        <IonNote slot="end">{note}</IonNote>
      ) : (
        <IonIcon
          aria-hidden="true"
          icon={chevronForward}
          slot="end"
        />
      )}
    </IonItem>
  );

  if (href) {
    return (
      <a
        href={href}
        className="unstyled-link"
      >
        {content}
      </a>
    );
  }

  return content;
};

export { ListItem };
