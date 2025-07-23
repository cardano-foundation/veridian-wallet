interface RecoverySeedPhraseProps {
  onClose: () => void;
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

export type { ConfirmModalProps, ConditionItemProps, RecoverySeedPhraseProps };
