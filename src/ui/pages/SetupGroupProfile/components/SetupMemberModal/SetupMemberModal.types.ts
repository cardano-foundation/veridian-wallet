import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";

interface SetupMemberModalProps {
  isOpen: boolean;
  connections: ConnectionShortDetails[];
  currentSelectedConnections: ConnectionShortDetails[];
  setOpen: (value: boolean) => void;
  onSubmit: (data: ConnectionShortDetails[]) => void;
}

export type { SetupMemberModalProps };
