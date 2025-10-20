interface RegexItemProps {
  condition: boolean;
  label: string;
}
interface PasswordRegexProps {
  password: string;
}

interface ConnectProps {
  onConnect: () => void;
}

interface SSIScanProps {
  setCurrentPage: (value: CurrentPage) => void;
  onScanFinish: (value: string) => Promise<void>;
}

interface AdvancedSettingProps {
  setCurrentPage: (value: CurrentPage) => void;
  onSubmitForm: (bootUrl: string, connectUrl: string) => Promise<void>;
  errors: SSIError;
  setErrors: (data: Partial<SSIError>) => void;
}

interface SSIAgentState {
  connectUrl?: string;
  bootUrl?: string;
}

interface SSIError {
  hasMismatchError: boolean;
  unknownError: boolean;
  isInvalidBootUrl: boolean;
  isInvalidConnectUrl: boolean;
  failedDiscoveryConnectUrl: boolean;
  connectURlNotFound: boolean;
}

enum CurrentPage {
  Connect,
  Scan,
  AdvancedSetting,
}

export { CurrentPage };

export type {
  SSIAgentState,
  PasswordRegexProps,
  RegexItemProps,
  SSIScanProps,
  SSIError,
  ConnectProps,
  AdvancedSettingProps,
};
