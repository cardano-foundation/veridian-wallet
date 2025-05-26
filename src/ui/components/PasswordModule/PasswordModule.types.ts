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
  onCreateSuccess: (skipped: boolean) => void;
}

interface PasswordModuleRef {
  clearState: () => void;
}

export type {
  PasswordRegexProps,
  RegexItemProps,
  PasswordModuleProps,
  PasswordModuleRef,
};
