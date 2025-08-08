import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { ConnectionData } from "../profileCache";

const filterProfileData = (
  identifiers: Record<string, IdentifierShortDetails>,
  allCreds: CredentialShortDetails[],
  allArchivedCreds: CredentialShortDetails[],
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
  const profilePeerConnections = allPeerConnections.filter(
    (conn) => conn.selectedAid === profileId
  );
  const profileNotifications = allNotifications.filter(
    (noti) => noti.receivingPre === profileId
  );

  return {
    profileIdentifier: profileIdentifier,
    profileCredentials: profileCreds,
    profileArchivedCredentials: profileArchivedCreds,
    profilePeerConnections: profilePeerConnections,
    profileNotifications: profileNotifications,
  };
};

export { filterProfileData };
