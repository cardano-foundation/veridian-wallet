import { Dispatch, SetStateAction } from "react";
import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";

enum Stage {
  SetupConnection,
  Members,
  SetupThreshold,
  Summary,
}

interface StageProps {
  setState: Dispatch<SetStateAction<GroupInfomation>>;
  state: GroupInfomation;
}

interface GroupInfomation {
  stage: Stage;
  displayNameValue: string;
  threshold: number;
  scannedConections: ConnectionShortDetails[];
  selectedConnections: ConnectionShortDetails[];
  newIdentifier: IdentifierShortDetails;
  ourIdentifier: string;
}

enum Tab {
  SetupMembers = "setup-members",
  Scan = "scan",
}

export { Stage, Tab };

export type { GroupInfomation, StageProps };
