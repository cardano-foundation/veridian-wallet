import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";

interface MultiSigGroup {
  groupId: string;
  connections: ConnectionShortDetails[];
}

interface ConnectionData {
  meerkatId: string; //<dappId>
  name?: string;
  url?: string;
  createdAt?: string;
  iconB64?: string;
  selectedAid?: string; // <aid>
}

interface Profile {
  identity: IdentifierShortDetails;
  connections: ConnectionShortDetails[];
  multisigConnections: ConnectionShortDetails[];
  peerConnections: ConnectionData[];
  credentials: CredentialShortDetails[];
  archivedCredentials: CredentialShortDetails[];
  notifications: KeriaNotification[];
}

interface ProfileCache {
  profiles: Record<string, Profile>;
  defaultProfile?: string;
  recentProfiles: string[];
  multiSigGroup: MultiSigGroup | undefined;
  scanGroupId?: string;
  individualFirstCreate?: boolean;
}

export type { Profile, ProfileCache, ConnectionData, MultiSigGroup };
