import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { combineClassNames } from "../../../utils/style";
import { CardDetailsBlock } from "../CardDetailsBlock";
import { CardDetailsItem } from "../CardDetailsItem";
import "./CardDetailsAttributes.scss";
import { CardDetailsNestedAttributesProps } from "./CardDetailsAttributes.types";
import { reservedKeysFilter } from "./CardDetailsAttributes.utils";

const CardDetailsNestedAttributes = ({
  attribute,
  cardKeyValue,
  itemProps,
}: CardDetailsNestedAttributesProps) => {
  const key = attribute[0];
  const item = attribute[1];
  const dateRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}([+-]\d{2}:\d{2}|Z)$/;

  const cardDetailInfo = (() => {
    if (typeof item === "string" && dateRegex.test(item))
      return `${formatShortDate(item)} - ${formatTimeToSec(
        item
      )} (${getUTCOffset(item)}))`;

    const isValuedType = typeof item === "string" || typeof item === "number";

    if (isValuedType) return item;

    return "";
  })();

  const { className, ...restItemProps } =
    typeof itemProps === "function" ? itemProps(key) : itemProps || {};
  const isObjectItem = typeof item === "object" && item !== null;
  const detailItemsClass = combineClassNames(
    "card-details-attribute-item",
    className,
    {
      "has-nested-item": isObjectItem,
    }
  );

  const infoTestId =
    typeof item === "string" && dateRegex.test(item)
      ? "cred-detail-time"
      : undefined;
  const innerCardKeyValue = cardKeyValue || `${reservedKeysFilter(key)}:`;

  return (
    <>
      <CardDetailsItem
        keyValue={innerCardKeyValue}
        info={cardDetailInfo}
        infoTestId={infoTestId}
        className={detailItemsClass}
        mask={false}
        {...restItemProps}
      />
      {isObjectItem && (
        <CardDetailsBlock className="card-details-nested-content">
          {Object.entries(item).map((sub, i: number) => {
            return (
              <CardDetailsNestedAttributes
                key={i}
                cardKeyValue={sub[0].replace(/([a-z])([A-Z])/g, "$1 $2") + ":"}
                attribute={sub}
                itemProps={itemProps}
              />
            );
          })}
        </CardDetailsBlock>
      )}
    </>
  );
};

export { CardDetailsNestedAttributes };
