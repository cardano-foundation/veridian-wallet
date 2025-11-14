import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";

interface MultiSigGroup {
  groupId: string;
  connections: MultisigConnectionDetails[];
}

interface DAppConnection {
  meerkatId: string; //<dappId>
  name?: string;
  url?: string;
  createdAt?: string;
  iconB64?: string;
  selectedAid?: string; // <aid>
}

interface Profile {
  identity: IdentifierShortDetails;
  connections: RegularConnectionDetails[];
  multisigConnections: MultisigConnectionDetails[];
  peerConnections: DAppConnection[];
  credentials: CredentialShortDetails[];
  archivedCredentials: CredentialShortDetails[];
  notifications: KeriaNotification[];
  connectedDApp?: DAppConnection | null;
  pendingDAppConnection?: DAppConnection | null;
}

interface ProfileCache {
  profiles: Record<string, Profile>;
  defaultProfile?: string;
  recentProfiles: string[];
  multiSigGroup: MultiSigGroup | undefined;
  scanGroupId?: string;
  openConnectionId?: string;
  missingAliasUrl?: { url: string; identifier?: string };
  connectedDApp?: DAppConnection | null;
  pendingDAppConnection?: DAppConnection | null;
  isConnectingToDApp?: boolean;
  showDAppConnect?: boolean;
  showProfileState?: boolean;
}

export type { DAppConnection, MultiSigGroup, Profile, ProfileCache };
