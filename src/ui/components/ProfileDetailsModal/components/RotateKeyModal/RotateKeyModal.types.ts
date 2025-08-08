interface RotateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  signingKey: string;
  identifierId: string;
  onReloadData: () => Promise<void>;
}

export type { RotateKeyModalProps };
