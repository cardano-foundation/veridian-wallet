import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";

interface MultiSigGroup {
  groupId: string;
  connections: ConnectionShortDetails[];
}

interface IdentifierCacheState {
  identifiers: Record<string, IdentifierShortDetails>;
  multiSigGroup: MultiSigGroup | undefined;
  openMultiSigId?: string;
  scanGroupId?: string;
  individualFirstCreate?: boolean;
}

export type { IdentifierCacheState, MultiSigGroup };
