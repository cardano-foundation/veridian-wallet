import { Box } from "@mui/material";
import { i18n } from "../../i18n";
import { AppInput } from "../AppInput";
import { InputAttributeProps } from "./RequestPresentationModal.types";

const InputAttribute = ({
  attributeOptional,
  attributes,
  value,
  setValue,
}: InputAttributeProps) => {
  if (!attributes) return null;

  return (
    <Box className="input-attribute">
      {attributes.map((attribute) => {
        const inputLabelText = attribute.replace(/([a-z])([A-Z])/g, "$1 $2");

        return (
          <AppInput
            key={attribute}
            fullWidth
            label={`${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`}
            optional={attributeOptional}
            value={value[attribute] || ""}
            onChange={(e) => setValue(attribute, e.target.value)}
            placeholder={i18n.t(
              "pages.credentialDetails.issueCredential.inputAttribute.placeholder"
            )}
          />
        );
      })}
    </Box>
  );
};

export { InputAttribute };
