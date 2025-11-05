import { ReactNode } from "react";

enum SettingScreen {
  Settings,
  ManagePassword,
  TermsAndPrivacy,
  RecoverySeedPhrase,
}

interface SettingsListProps {
  switchView?: (key: SettingScreen) => void;
  handleClose?: () => void;
}

interface SettingsProps {
  show: boolean;
  setShow: (value: boolean) => void;
}

interface OptionProps {
  index: number;
  icon: string;
  label: string;
  actionIcon?: ReactNode;
  note?: string;
  href?: string;
}

enum OptionIndex {
  BiometricUpdate,
  ChangePin,
  ManagePassword,
  RecoverySeedPhrase,
  Documentation,
  Term,
  Contact,
  Version,
  DeleteWallet,
}

export type { SettingsProps, OptionProps, SettingsListProps };
export { OptionIndex, SettingScreen };
