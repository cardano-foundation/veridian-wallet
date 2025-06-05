import * as React from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  type IconButtonProps,
  type TextFieldProps,
} from "@mui/material";
import { i18n } from "../../../i18n";

type NumberInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  hideActionButtons?: boolean;
  max?: number;
  min?: number;
  onChange?: (value: number | null) => void;
  step?: number;
  value?: number | null;
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
      const val = e.target.value.replace(/[^\d-]/g, ""); // Only digits and minus
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
      if (value === null || value === undefined || !Number.isInteger(value)) {
        setValue(min > -Infinity ? min : 0);
      }
    };

    const commonAdornmentButtonProps: IconButtonProps = {
      edge: "end",
      sx: { p: size !== "small" ? "1px" : 0 },
    };

    return (
      <TextField
        {...rest}
        ref={ref}
        value={value ?? ""}
        disabled={disabled}
        size={size}
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*",
          min,
          max,
          step,
        }}
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
            endAdornment: !hideActionButtons && (
              <InputAdornment position="end">
                <Stack>
                  <IconButton
                    aria-label={i18n.t("NumberInput.incrementAriaLabel")}
                    disabled={disabled || (value ?? 0) + step > max}
                    onClick={increment}
                    {...commonAdornmentButtonProps}
                  >
                    <KeyboardArrowUpIcon fontSize={size} />
                  </IconButton>
                  <IconButton
                    aria-label={i18n.t("NumberInput.decrementAriaLabel")}
                    disabled={disabled || (value ?? 0) - step < min}
                    onClick={decrement}
                    {...commonAdornmentButtonProps}
                  >
                    <KeyboardArrowDownIcon fontSize={size} />
                  </IconButton>
                </Stack>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  }
);

export { NumberInput };
