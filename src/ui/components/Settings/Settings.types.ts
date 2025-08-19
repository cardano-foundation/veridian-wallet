import { ReactNode } from "react";

enum SettingScreen {
  Settings,
  ManagePassword,
  TermsAndPrivacy,
  RecoverySeedPhrase,
}

interface SettingListProps {
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
  DeleteAccount,
}

interface SettingsItemProps {
  item: OptionProps;
  handleOptionClick: (item: OptionProps) => void;
}

export type { SettingsProps, OptionProps, SettingsItemProps, SettingListProps };
export { OptionIndex, SettingScreen };
