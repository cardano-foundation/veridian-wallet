interface ChangePinModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface ChangePinPageProps {
  pageId: string;
  overrideAlertZIndex?: boolean;
  onCancel: (shouldCloseParent?: boolean) => void;
}

interface ChangePinModuleRef {
  clearState: () => void;
}

export type { ChangePinModalProps, ChangePinModuleRef, ChangePinPageProps };
