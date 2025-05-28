import { IonAccordion, IonAccordionGroup, IonItem } from "@ionic/react";
import { chevronForwardOutline } from "ionicons/icons";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { combineClassNames } from "../../../utils/style";
import { CardDetailsItem } from "../CardDetailsItem";
import { CardDetailsAttributeProps } from "./CardDetailsExpandAttributes.types";
import { reservedKeysFilter } from "./CardDetailsExpandAttributes.utils";

const dateRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}([+-]\d{2}:\d{2}|Z)$/;

const CardDetailsAttribute = ({
  attributeKey,
  attributeValue,
  customAttributeKey,
  itemProps,
  ignoreKeys = [],
  deepLevel = 1,
  openLevels = [],
}: CardDetailsAttributeProps) => {
  const key = attributeKey.toLowerCase().replace(/\s/g, "-");
  const { className, ...restItemProps } = itemProps || {};

  const isObjectAttribute = typeof attributeValue === "object";

  const nativeAttribute = (() => {
    if (isObjectAttribute) {
      return "";
    }

    const attributeValueStr = String(attributeValue);

    if (dateRegex.test(attributeValueStr))
      return `${formatShortDate(attributeValueStr)} - ${formatTimeToSec(
        attributeValueStr
      )} (${getUTCOffset(attributeValueStr)})`;

    return attributeValueStr;
  })();

  const detailItemsClass = combineClassNames("attribute-item", className);

  const attributeKeyName =
    customAttributeKey || reservedKeysFilter(attributeKey);

  if (ignoreKeys.includes(attributeKey)) return null;

  if (!isObjectAttribute) {
    return (
      <CardDetailsItem
        keyValue={`${attributeKeyName}:`}
        info={nativeAttribute}
        testId={`attribute-${key}`}
        className={detailItemsClass}
        {...restItemProps}
      />
    );
  }

  if (!attributeValue) return null;

  return (
    <IonAccordionGroup
      data-testid="nested-attributes"
      className="attributes-accordion-group"
      value={openLevels.map((value) => String(value))}
      multiple
    >
      <IonAccordion
        className="accordion nested-attribute"
        toggleIconSlot="start"
        toggleIcon={chevronForwardOutline}
        value={`${deepLevel}`}
      >
        <IonItem
          className="accordion-header"
          lines="none"
          slot="header"
        >
          <span>{attributeKeyName}</span>
        </IonItem>
        <div
          className="nested-list-item"
          slot="content"
        >
          {Object.entries(attributeValue).map(([key, value]) => {
            return (
              <CardDetailsAttribute
                deepLevel={deepLevel + 1}
                attributeKey={key}
                attributeValue={value}
                key={key}
                openLevels={openLevels}
              />
            );
          })}
        </div>
      </IonAccordion>
    </IonAccordionGroup>
  );
};

export { CardDetailsAttribute };
