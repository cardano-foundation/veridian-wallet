import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";
import { SignerData } from "../SetupSignerModal/SetupSignerModal.types";

interface SetupMemberModalProps {
  isOpen: boolean;
  connections: ConnectionShortDetails[];
  currentSelectedConnections: ConnectionShortDetails[];
  setOpen: (value: boolean) => void;
  onSubmit: (data: ConnectionShortDetails[], signerData: SignerData) => void;
}

export type { SetupMemberModalProps };
