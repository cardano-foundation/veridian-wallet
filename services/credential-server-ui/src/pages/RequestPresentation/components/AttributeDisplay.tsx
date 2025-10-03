import { Box, Chip, Tooltip } from "@mui/material";
import { PresentationRequestData } from "../../../store/reducers/connectionsSlice.types";
import "./AttributeDisplay.scss";

interface AttributeDisplayProps {
  data: PresentationRequestData;
}

export const AttributeDisplay = ({ data }: AttributeDisplayProps) => {
  const attributes = data.acdcCredential
    ? (({ i, dt, u, d, ...rest }) => rest)(data.acdcCredential.a)
    : data.attributes;

  const attributeKeys = Object.keys(attributes);
  const firstKey = attributeKeys[0];
  const firstValue = firstKey ? attributes[firstKey] : "";

  const additionalCount = attributeKeys.length - 1;
  const displayValue =
    firstKey && firstValue ? `${firstKey}: ${firstValue}` : "";

  return (
    <Box className="attribute-display">
      <Box className="attribute-display__text">{displayValue}</Box>

      {additionalCount > 0 && (
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
