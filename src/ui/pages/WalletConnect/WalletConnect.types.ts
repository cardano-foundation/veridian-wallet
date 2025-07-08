interface WalletConnectStageOneProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  className?: string;
}

interface WalletConnectStageTwoProps {
  isOpen: boolean;
  pendingDAppMeerkat: string;
  onClose: () => void;
  onBackClick: () => void;
  className?: string;
}

export type { WalletConnectStageOneProps, WalletConnectStageTwoProps };
