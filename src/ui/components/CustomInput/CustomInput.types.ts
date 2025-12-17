import { MouseEvent as ReactMouseEvent, ReactNode } from "react";

type TextFieldTypes =
  | "date"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "url"
  | "time"
  | "week"
  | "month"
  | "datetime-local";

type InputMode =
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search"
  | undefined;

interface CustomInputProps {
  dataTestId: string;
  title?: string;
  autofocus?: boolean;
  placeholder?: string;
  hiddenInput?: boolean;
  value: string;
  onChangeInput: (text: string) => void;
  onChangeFocus?: (value: boolean) => void;
  optional?: boolean;
  error?: boolean;
  actionIcon?: string;
  action?: (e: ReactMouseEvent<HTMLElement, MouseEvent>) => void;
  className?: string;
  labelAction?: ReactNode;
  endAction?: ReactNode;
  type?: TextFieldTypes;
  inputMode?: InputMode;
}

export type { CustomInputProps };
