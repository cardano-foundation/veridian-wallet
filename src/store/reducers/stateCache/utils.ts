import {
  MultisigConnectionDetails,
  RegularConnectionDetails,
} from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { DAppConnection } from "../profileCache";

const createMapData = <T>(
  items: T[],
  filterKey: keyof T
): Record<string, T[]> => {
  return items.reduce((result, item) => {
    const id = item[filterKey] as string | undefined;

    if (!id) {
      return result;
    }

    if (result[id]) {
      result[id].push(item);
    } else {
      result[id] = [item];
    }

    return result;
  }, {} as Record<string, T[]>);
};

const createProfileMapData = (
  allCreds: CredentialShortDetails[],
  allArchivedCreds: CredentialShortDetails[],
  allConnections: RegularConnectionDetails[],
  allPeerConnections: DAppConnection[],
  allNotifications: KeriaNotification[],
  allMultisigConnections: MultisigConnectionDetails[]
) => {
  const profileCreds = createMapData(allCreds, "identifierId");
  const profileArchivedCreds = createMapData(allArchivedCreds, "identifierId");
  const profileConnections = createMapData(allConnections, "identifier");
  const profilePeerConnections = createMapData(
    allPeerConnections,
    "selectedAid"
  );
  const profileNotifications = createMapData(allNotifications, "receivingPre");
  const filterMutisigMap = createMapData(allMultisigConnections, "groupId");

  return {
    profileCredentialsMap: profileCreds,
    profileConnectionsMap: profileConnections,
    profileArchivedCredentialsMap: profileArchivedCreds,
    profilePeerConnectionsMap: profilePeerConnections,
    profileNotificationsMap: profileNotifications,
    filterMutisigMap,
  };
};

export { createProfileMapData };
