interface WalletConnectStageOneProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  pendingDAppMeerkat: string;
}

interface WalletConnectStageTwoProps {
  isOpen: boolean;
  pendingDAppMeerkat: string;
  onClose: () => void;
  onBackClick: () => void;
  className?: string;
}

export type { WalletConnectStageOneProps, WalletConnectStageTwoProps };
