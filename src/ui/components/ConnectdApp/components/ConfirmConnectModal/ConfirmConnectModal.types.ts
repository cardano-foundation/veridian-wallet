import { DAppConnection } from "../../ConnectdApp.types";

interface ConfirmConnectModalProps {
  openModal: boolean;
  closeModal: () => void;
  onConfirm: () => void;
  onDeleteConnection: (data: DAppConnection) => void;
  isConnectModal: boolean;
  connectionData?: DAppConnection;
}

export type { ConfirmConnectModalProps };
