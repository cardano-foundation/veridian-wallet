import {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SetStateAction,
} from "react";

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

interface CustomInputProps {
  dataTestId: string;
  title?: string;
  autofocus?: boolean;
  placeholder?: string;
  hiddenInput?: boolean;
  value: string;
  onChangeInput: (text: string) => void;
  onChangeFocus?: Dispatch<SetStateAction<boolean>>;
  optional?: boolean;
  error?: boolean;
  actionIcon?: string;
  action?: (e: ReactMouseEvent<HTMLElement, MouseEvent>) => void;
  className?: string;
  labelAction?: ReactNode;
  endAction?: ReactNode;
  type?: TextFieldTypes;
}

export type { CustomInputProps };
