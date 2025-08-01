import { ConnectionData } from "../../ConnectdApp.types";

interface ConfirmConnectModalProps {
  openModal: boolean;
  closeModal: () => void;
  onConfirm: () => void;
  onDeleteConnection: (data: ConnectionData) => void;
  isConnectModal: boolean;
  connectionData?: ConnectionData;
}

export type { ConfirmConnectModalProps };
