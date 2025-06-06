import { Box } from "@mui/material";
import { i18n } from "../../i18n";
import { AppInput } from "../AppInput";
import { InputAttributeProps } from "./IssueCredentialModal.types";

interface AttributeSchema {
  type: string;
  [key: string]: unknown;
}

const InputAttribute = ({
  attributes,
  value,
  setValue,
  required,
  properties,
}: InputAttributeProps & { properties: Record<string, AttributeSchema> }) => {
  return (
    <Box className="input-attribute">
      {attributes.map((attribute) => {
        const inputLabelText = attribute.replace(/([a-z])([A-Z])/g, "$1 $2");
        const schemaType = properties?.[attribute]?.type;
        const type = schemaType === "integer" ? "integer" : "string";

        const inputValue: string =
          value[attribute] !== undefined && value[attribute] !== null
            ? String(value[attribute])
            : "";

        return (
          <AppInput
            key={attribute}
            fullWidth
            label={`${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`}
            type={type}
            optional={!required}
            value={inputValue}
            onChange={
              type === "integer"
                ? // @ts-expect-error -- suppress type error for controlled number input
                  (val) => setValue(attribute, val == null ? "" : val)
                : (e) => setValue(attribute, e.target.value)
            }
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
