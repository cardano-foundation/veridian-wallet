interface RegexItemProps {
  condition: boolean;
  label: string;
}

interface PasswordRegexProps {
  password: string;
}

interface PasswordModuleProps {
  testId: string;
  title?: string;
  description?: string;
  onValidationChange?: (validated: boolean) => void;
}

interface PasswordModuleRef {
  clearState: () => void;
  savePassword: () => Promise<boolean | undefined>;
}

export type {
  PasswordRegexProps,
  RegexItemProps,
  PasswordModuleProps,
  PasswordModuleRef,
};
