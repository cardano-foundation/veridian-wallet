import { Box, Chip, Tooltip } from "@mui/material";
import { PresentationRequestData } from "../../../store/reducers/connectionsSlice.types";
import "./AttributeDisplay.scss";

interface AttributeDisplayProps {
  data: PresentationRequestData;
  maxLength?: number;
}

export const AttributeDisplay = ({
  data,
  maxLength = 25,
}: AttributeDisplayProps) => {
  const { attributes } = data;

  const attributeKeys = Object.keys(attributes);
  const firstKey = attributeKeys[0];
  const firstValue = firstKey ? attributes[firstKey] : "";

  const additionalCount = attributeKeys.length - 1;

  const displayText =
    firstValue.length > maxLength
      ? `${firstValue.substring(0, maxLength)}...`
      : firstValue;

  const showBadge = additionalCount > 0;

  return (
    <Box className="attribute-display">
      <Tooltip
        title={`${firstKey}: ${firstValue}`}
        placement="top"
      >
        <Box className="attribute-display__text">{displayText}</Box>
      </Tooltip>

      {showBadge && (
        <Tooltip
          title={`+${additionalCount} more attribute${additionalCount > 1 ? "s" : ""}`}
          placement="top"
        >
          <Chip
            label={`+${additionalCount}`}
            size="small"
            className="attribute-display__badge"
          />
        </Tooltip>
      )}
    </Box>
  );
};
