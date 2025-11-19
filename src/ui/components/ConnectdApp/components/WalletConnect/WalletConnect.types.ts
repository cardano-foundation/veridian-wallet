import { Step } from "../../ConnectdApp.types";

interface WalletConnectProps {
  close: (step: Step) => void;
  handleAfterConnect?: () => void;
}

export type { WalletConnectProps };
