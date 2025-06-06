import * as React from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  FormControl,
  InputAdornment,
  Stack,
  TextField,
  FormHelperText,
  type TextFieldProps,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { i18n } from "../../../i18n";
import "./NumberInput.scss";

type NumberInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  hideActionButtons?: boolean;
  max?: number;
  min?: number;
  onChange?: (value: number | null) => void;
  step?: number;
  value?: number | null;
  label: string;
  optional?: boolean;
  errorMessage?: string;
};

const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
  function NumberInput(props, ref) {
    const {
      disabled = false,
      hideActionButtons = false,
      max = Infinity,
      min = -Infinity,
      onChange,
      size,
      step = 1,
      value: valueProp,
      label,
      optional,
      error,
      errorMessage,
      id,
      className,
      ...rest
    } = props;

    const isControlled = valueProp !== undefined && onChange !== undefined;
    const [internalValue, setInternalValue] = React.useState<number | null>(
      valueProp ?? null
    );

    React.useEffect(() => {
      if (isControlled) setInternalValue(valueProp ?? null);
    }, [valueProp, isControlled]);

    const value = isControlled ? valueProp : internalValue;
    const setValue = (val: number | null) => {
      if (!isControlled) setInternalValue(val);
      if (onChange) onChange(val);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^\d-]/g, "");
      if (val === "" || val === "-") {
        setValue(null);
        return;
      }
      let num = Number(val);
      if (!Number.isInteger(num)) return;
      if (num > max) num = max;
      if (num < min) num = min;
      setValue(num);
    };

    const increment = () => {
      const newValue =
        (value != null && !Number.isNaN(value) ? value : 0) + step;
      if (newValue > max) return;
      setValue(newValue);
    };

    const decrement = () => {
      const newValue =
        (value != null && !Number.isNaN(value) ? value : 0) - step;
      if (newValue < min) return;
      setValue(newValue);
    };

    const handleBlur = () => {
      if (value === null || value === undefined) return;
      const num = Number(value);
      if (num > max) setValue(max);
      else if (num < min) setValue(min);
    };

    return (
      <FormControl
        variant="standard"
        className={`app-input number-input ${className ?? ""}`}
        error={!!error}
      >
        <TextField
          {...rest}
          id={id}
          inputRef={ref}
          label={undefined}
          value={value ?? ""}
          disabled={disabled}
          size={size}
          error={!!error}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              increment();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              decrement();
            }
          }}
          slotProps={{
            input: {
              inputProps: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                min,
                max,
                step,
              },
              endAdornment: !hideActionButtons && (
                <InputAdornment position="end">
                  <Stack>
                    <IconButton
                      className="number-input-btn"
                      aria-label={i18n.t("NumberInput.incrementAriaLabel")}
                      disabled={disabled || (value ?? 0) + step > max}
                      onClick={increment}
                    >
                      <KeyboardArrowUpIcon fontSize={size} />
                    </IconButton>
                    <IconButton
                      className="number-input-btn"
                      aria-label={i18n.t("NumberInput.decrementAriaLabel")}
                      disabled={disabled || (value ?? 0) - step < min}
                      onClick={decrement}
                    >
                      <KeyboardArrowDownIcon fontSize={size} />
                    </IconButton>
                  </Stack>
                </InputAdornment>
              ),
            },
          }}
        />
        {error && <FormHelperText error>{errorMessage}</FormHelperText>}
      </FormControl>
    );
  }
);

export { NumberInput };
