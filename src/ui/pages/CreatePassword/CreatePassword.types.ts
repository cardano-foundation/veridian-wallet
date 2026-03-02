import { MutableRefObject } from "react";

interface RegexItemProps {
  condition: boolean;
  label: string;
}
interface PasswordRegexProps {
  password: string;
}

interface CreatePasswordProps {
  handleClear: () => void;
  isSetting?: boolean;
  userAction?: MutableRefObject<string>;
  showSkip?: boolean;
}

export type { PasswordRegexProps, RegexItemProps, CreatePasswordProps };
