import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { ConnectionData } from "../walletConnectionsCache";

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
}

export type { Profile, ProfileCache };
