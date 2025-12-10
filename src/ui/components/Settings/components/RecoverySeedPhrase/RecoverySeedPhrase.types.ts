interface RecoverySeedPhraseProps {
  onClose: () => void;
  starVerify?: (seedPhrase: string[]) => void;
  mode?: "view" | "verify";
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
