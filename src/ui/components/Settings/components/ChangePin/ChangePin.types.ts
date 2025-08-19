interface ChangePinModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface ChangePinModuleRef {
  clearState: () => void;
}

export type { ChangePinModalProps, ChangePinModuleRef };
