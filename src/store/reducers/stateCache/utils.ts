import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { ConnectionData } from "../profileCache";

const filterProfileData = (
  identifiers: Record<string, IdentifierShortDetails>,
  allCreds: CredentialShortDetails[],
  allArchivedCreds: CredentialShortDetails[],
  allConnections: RegularConnectionDetails[],
  allMultisigConnections: MultisigConnectionDetails[],
  allPeerConnections: ConnectionData[],
  allNotifications: KeriaNotification[],
  profileId: string
) => {
  const profileIdentifier = identifiers[profileId];
  const profileCreds = allCreds.filter(
    (cred) => cred.identifierId === profileId
  );
  const profileArchivedCreds = allArchivedCreds.filter(
    (cred) => cred.identifierId === profileId
  );
  const profileConnections = allConnections.filter(
    (conn) => conn.identifier === profileId
  );
  const profileMultisigConnections = allMultisigConnections.filter(
    (conn) => "groupId" in conn && conn.contactId === profileId
  );
  const profilePeerConnections = allPeerConnections.filter(
    (conn) => conn.selectedAid === profileId
  );
  const profileNotifications = allNotifications.filter(
    (noti) => noti.receivingPre === profileId
  );

  return {
    profileIdentifier: profileIdentifier,
    profileCredentials: profileCreds,
    profileConnections: profileConnections,
    profileMultisigConnections: profileMultisigConnections,
    profileArchivedCredentials: profileArchivedCreds,
    profilePeerConnections: profilePeerConnections,
    profileNotifications: profileNotifications,
  };
};

export { filterProfileData };
