import { IdentifierShortDetails } from "../../../../../core/agent/services/identifier.types";
import { MultiSigGroup } from "../../../../../store/reducers/identifiersCache/identifiersCache.types";

interface SetupConnectionsProps {
  profile?: IdentifierShortDetails;
  group?: MultiSigGroup;
  oobi: string;
}

enum Tab {
  SetupMembers = "setup-members",
  Scan = "scan",
}

export { Tab };
export type { SetupConnectionsProps };
