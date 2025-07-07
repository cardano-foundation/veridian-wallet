interface ConnectionData {
  id: string;
  name?: string;
  url?: string;
  createdAt?: string;
  iconB64?: string;
  selectedAid?: string;
}

interface WalletConnectState {
  walletConnections: ConnectionData[];
  connectedWallet: ConnectionData | null;
  pendingConnection: ConnectionData | null;
  isConnecting?: boolean;
  showConnectWallet?: boolean;
}

export type { ConnectionData, WalletConnectState };
