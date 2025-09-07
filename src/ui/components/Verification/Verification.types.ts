interface VerifyProps {
  verifyIsOpen: boolean;
  setVerifyIsOpen: (value: boolean, isCancel?: boolean) => void;
  onVerify: () => void;
}

export type { VerifyProps };
