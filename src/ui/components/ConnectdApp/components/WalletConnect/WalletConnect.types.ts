import { DAppConnection, Step } from "../../ConnectdApp.types";

interface WalletConnectProps {
  close: (step: Step) => void;
  handleAfterConnect?: (connection: DAppConnection) => void;
}

export type { WalletConnectProps };
