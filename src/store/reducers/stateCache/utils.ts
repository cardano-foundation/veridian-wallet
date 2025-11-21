import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { DAppConnection } from "../profileCache";

const createMapData = <T>(
  items: T[],
  filterKey: keyof T
): Record<string, T[]> => {
  return items.reduce((result, item) => {
    const id = item[filterKey] as string;
    if (result[id]) {
      result[id].push(item);
    } else {
      result[id] = [item];
    }

    return result;
  }, {} as Record<string, T[]>);
};

const filterProfileData = (
  allCreds: CredentialShortDetails[],
  allArchivedCreds: CredentialShortDetails[],
  allConnections: RegularConnectionDetails[],
  allPeerConnections: DAppConnection[],
  allNotifications: KeriaNotification[]
) => {
  const profileCreds = createMapData(allCreds, "identifierId");
  const profileArchivedCreds = createMapData(allArchivedCreds, "identifierId");
  const profileConnections = createMapData(allConnections, "identifier");
  const profilePeerConnections = createMapData(
    allPeerConnections,
    "selectedAid"
  );
  const profileNotifications = createMapData(allNotifications, "receivingPre");

  return {
    profileCredentialsMap: profileCreds,
    profileConnectionsMap: profileConnections,
    profileArchivedCredentialsMap: profileArchivedCreds,
    profilePeerConnectionsMap: profilePeerConnections,
    profileNotificationsMap: profileNotifications,
  };
};

const filterMutisigData = (
  identifiers: Record<string, IdentifierShortDetails>,
  allMultisigConnections: MultisigConnectionDetails[],
  profile: IdentifierShortDetails
) => {
  const groupIdToFilter = profile.groupMemberPre
    ? identifiers[profile.groupMemberPre]?.groupMetadata?.groupId
    : profile.groupMetadata?.groupId;

  return allMultisigConnections.filter(
    (conn) => "groupId" in conn && conn.groupId === groupIdToFilter
  );
};

export { filterMutisigData, filterProfileData as createProfileMapData };
