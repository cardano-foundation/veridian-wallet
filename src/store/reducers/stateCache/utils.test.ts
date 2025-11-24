import {
  connectionsFix,
  multisignConnection,
} from "../../../ui/__fixtures__/connectionsFix";
import { credsFixAcdc } from "../../../ui/__fixtures__/credsFix";
import {
  filteredArchivedCredsFix,
  filteredCredsFix,
} from "../../../ui/__fixtures__/filteredCredsFix";
import { notificationsFix } from "../../../ui/__fixtures__/notificationsFix";
import { walletConnectionsFix } from "../../../ui/__fixtures__/walletConnectionsFix";
import { createProfileMapData } from "./utils";

describe("Create profile map data", () => {
  const errorLogMock = jest.fn();

  it("success", () => {
    const {
      profileArchivedCredentialsMap,
      profileConnectionsMap,
      profileCredentialsMap,
      profileNotificationsMap,
      profilePeerConnectionsMap,
      filterMutisigMap,
    } = createProfileMapData(
      filteredCredsFix,
      filteredArchivedCredsFix,
      connectionsFix,
      walletConnectionsFix,
      notificationsFix,
      [multisignConnection]
    );

    let totalArchCreds = 0;
    Object.entries(profileArchivedCredentialsMap).forEach(([key, creds]) => {
      totalArchCreds += creds.length;
      creds.forEach((item) => {
        expect(item.identifierId).toBe(key);
      });
    });

    expect(totalArchCreds).toBe(filteredArchivedCredsFix.length);

    let totalCreds = 0;
    Object.entries(profileCredentialsMap).forEach(([key, creds]) => {
      totalCreds += creds.length;
      creds.forEach((item) => {
        expect(item.identifierId).toBe(key);
      });
    });

    expect(totalCreds).toBe(filteredCredsFix.length);

    let totalConnections = 0;
    Object.entries(profileConnectionsMap).forEach(([key, con]) => {
      totalConnections += con.length;
      con.forEach((item) => {
        expect(item.identifier).toBe(key);
      });
    });

    expect(totalConnections).toBe(connectionsFix.length);

    let totalDappConnections = 0;
    Object.entries(profilePeerConnectionsMap).forEach(([key, con]) => {
      totalDappConnections += con.length;
      con.forEach((item) => {
        expect(item.selectedAid).toBe(key);
      });
    });

    expect(totalDappConnections).toBe(walletConnectionsFix.length);

    let totalNotification = 0;
    Object.entries(profileNotificationsMap).forEach(([key, notif]) => {
      totalNotification += notif.length;
      notif.forEach((item) => {
        expect(item.receivingPre).toBe(key);
      });
    });

    expect(totalNotification).toBe(notificationsFix.length);

    let totalMultisigConnection = 0;
    Object.entries(filterMutisigMap).forEach(([key, con]) => {
      totalMultisigConnection += con.length;
      con.forEach((item) => {
        expect(item.groupId).toBe(key);
      });
    });

    expect(totalMultisigConnection).toBe(1);
  });
});
