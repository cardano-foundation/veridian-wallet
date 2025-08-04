import { ReactElement, ReactNode } from "react";

interface SubMenuData {
  Component: (props?: {
    switchView: (key: SubMenuKey) => void;
  }) => ReactElement;
  title: string;
  closeButtonLabel?: string;
  closeButtonAction?: () => void;
  actionButton?: boolean;
  actionButtonAction?: () => void;
  actionButtonLabel?: string;
  additionalButtons: ReactNode;
  pageId: string;
  nestedMenu: boolean;
  renderAsModal?: boolean;
}

interface SubMenuProps {
  showSubMenu: boolean;
  setShowSubMenu: (value: boolean) => void;
  title: string;
  closeButtonLabel?: string;
  closeButtonAction?: () => void;
  actionButton?: boolean;
  actionButtonAction?: () => void;
  actionButtonLabel?: string;
  additionalButtons?: ReactNode;
  children: ReactNode;
}

interface MenuItemProps {
  itemKey: SubMenuKey;
  icon: string;
  label: string;
  subLabel?: string;
  onClick: (key: SubMenuKey) => void;
  hidden?: boolean;
}

enum SubMenuKey {
  Crypto,
  Connections,
  ConnectWallet,
  Chat,
  ManagePassword,
  TermsAndPrivacy,
  RecoverySeedPhrase,
}

export type { SubMenuProps, MenuItemProps, SubMenuData };
export { SubMenuKey };
