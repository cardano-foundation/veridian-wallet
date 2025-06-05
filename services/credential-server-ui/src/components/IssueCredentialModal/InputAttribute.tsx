import { Box } from "@mui/material";
import { useEffect } from "react";
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
  useEffect(() => {
    attributes.forEach((attribute) => {
      const defaultValue = properties?.[attribute]?.default;
      if (
        (value[attribute] === undefined || value[attribute] === "") &&
        (typeof defaultValue === "string" || typeof defaultValue === "number")
      ) {
        setValue(attribute, String(defaultValue));
      }
    });
  }, [attributes, value, properties, setValue]);

  return (
    <Box className="input-attribute">
      {attributes.map((attribute) => {
        const inputLabelText = attribute.replace(/([a-z])([A-Z])/g, "$1 $2");
        const schemaType = properties?.[attribute]?.type;
        const type =
          schemaType === "integer" || schemaType === "number"
            ? "number"
            : "string";

        const defaultValue = properties?.[attribute]?.default;
        let inputValue =
          value[attribute] !== undefined && value[attribute] !== ""
            ? value[attribute]
            : typeof defaultValue === "string" ||
                typeof defaultValue === "number" ||
                defaultValue == null
              ? defaultValue
              : "";

        if (type === "string") {
          inputValue =
            inputValue === undefined || inputValue === null
              ? ""
              : String(inputValue);
        } else if (type === "number") {
          inputValue =
            inputValue === undefined || inputValue === null || inputValue === ""
              ? null
              : Number(inputValue);
        }

        return (
          <AppInput
            key={attribute}
            fullWidth
            label={`${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`}
            type={type}
            optional={!required}
            value={inputValue}
            onChange={
              type === "number"
                ? (val) => setValue(attribute, val == null ? "" : String(val))
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
