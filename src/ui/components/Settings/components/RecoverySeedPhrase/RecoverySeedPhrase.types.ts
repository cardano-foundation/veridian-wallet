interface RecoverySeedPhraseProps {
  title: string;
  showCloseButton?: boolean;
  onClose: () => void;
  starVerify?: (seedPhrase: string[]) => void;
  mode?: "view" | "verify";
  pageId: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onShowPhrase: () => void;
}

interface ConditionItemProps {
  text: string;
  index: number;
  checked: boolean;
  onClick: (index: number) => void;
}

export type { ConditionItemProps, ConfirmModalProps, RecoverySeedPhraseProps };
