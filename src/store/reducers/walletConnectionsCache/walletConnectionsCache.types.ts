import { ConnectionData } from "../profileCache";

interface WalletConnectState {
  connectedWallet: ConnectionData | null;
  pendingConnection: ConnectionData | null;
  isConnecting?: boolean;
  showConnectWallet?: boolean;
}

export type { WalletConnectState };
