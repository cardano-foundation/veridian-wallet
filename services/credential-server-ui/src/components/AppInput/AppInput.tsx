import {
  FormControl,
  FormHelperText,
  InputBase,
  InputBaseProps,
  InputLabel,
} from "@mui/material";
import { i18n } from "../../i18n";
import "./AppInput.scss";
import { NumberInput } from "./NumberInput/NumberInput";

interface AppInputProps extends InputBaseProps {
  label: string;
  optional?: boolean;
  errorMessage?: string;
  type?: "string" | "integer";
}

const AppInput = ({
  label,
  optional,
  error,
  errorMessage,
  id,
  className,
  type = "string",
  onChange,
  value,
  min,
  max,
  step,
  hideActionButtons,
  ...inputProps
}: AppInputProps & {
  value?: number | string | null;
  min?: number;
  max?: number;
  step?: number;
  hideActionButtons?: boolean;
}) => (
  <FormControl
    variant="standard"
    className={`app-input ${className ?? ""}`}
  >
    <InputLabel
      shrink
      htmlFor={id}
      sx={(theme) => ({
        color: theme.palette.text.primary,
        "&.Mui-focused": {
          color: theme.palette.text.primary,
        },
      })}
    >
      <span className="app-input-label">{label}</span>
      {optional && (
        <span className="app-input-optional">{i18n.t("general.optional")}</span>
      )}
    </InputLabel>
    {type === "integer" ? (
      <NumberInput
        id={id}
        label={label}
        optional={optional}
        error={error}
        errorMessage={errorMessage}
        value={
          typeof value === "number"
            ? value
            : value === ""
              ? null
              : Number(value)
        }
        onChange={onChange as ((value: number | null) => void) | undefined}
        min={min}
        max={max}
        step={step}
        hideActionButtons={hideActionButtons}
      />
    ) : (
      <InputBase
        {...inputProps}
        id={id}
        error={error}
        type="text"
        value={
          typeof value === "string" ? value : value == null ? "" : String(value)
        }
        onChange={onChange}
      />
    )}
    {error && <FormHelperText error>{errorMessage}</FormHelperText>}
  </FormControl>
);

export { AppInput };
