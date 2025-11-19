import { DAppConnection } from "../../ConnectdApp.types";

interface ConnectionsProps {
  pageId: string;
  onCardClick: (data: DAppConnection) => void;
  handleDelete: (data: DAppConnection) => void;
  handleScanQR: () => void;
}

export type { ConnectionsProps };
