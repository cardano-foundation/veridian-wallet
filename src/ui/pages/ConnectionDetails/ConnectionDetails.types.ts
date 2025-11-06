import { RegularConnectionDetails } from "../../../core/agent/agent.types";

interface ConnectionDetailsProps {
  connectionShortDetails: RegularConnectionDetails;
  handleCloseConnectionModal: () => void;
  restrictedOptions?: boolean;
}

export type { ConnectionDetailsProps };
