enum ForgotType {
  Passcode = "passcode",
  Password = "password",
}

interface ForgotAuthInfoProps {
  isOpen: boolean;
  onClose: (shouldCloseParent?: boolean) => void;
  type: ForgotType;
  overrideAlertZIndex?: boolean;
}

interface VerifySeedPhraseProps {
  onVerifySuccess: () => void;
  onCancel: () => void;
  type: ForgotType;
  overrideAlertZIndex?: boolean;
}

export type { ForgotAuthInfoProps, VerifySeedPhraseProps };
export { ForgotType };
