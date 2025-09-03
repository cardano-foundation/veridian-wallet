import { SignifyClient } from "signify-ts";
import { CloudMigration } from "./cloudMigrations.types";

export const CLOUD_V1201: CloudMigration = {
  version: "1.2.0.1",
  cloudMigrationStatements: async (signifyClient: SignifyClient) => {
    // eslint-disable-next-line no-console
    console.log(
      "Starting cloud KERIA migration: Converting connections to account-based model"
    );

    let identifiers: Array<{ prefix: string; name: string }> = [];
    let returned = -1;
    let iteration = 0;

    while (returned !== 0) {
      const result = await signifyClient
        .identifiers()
        .list(iteration * (24 + 1), 24 + iteration * (24 + 1));
      identifiers.push(...result.aids);

      returned = result.aids.length;
      iteration += 1;
    }

    identifiers = identifiers.filter(
      (identifier: { prefix: string; name: string }) =>
        !identifier.name.startsWith("XX")
    );

    const contacts = await signifyClient.contacts().list();
    if (identifiers.length === 0) {
      for (const contact of contacts) {
        await signifyClient.contacts().delete(contact.id);
      }
      return;
    }

    for (const contact of contacts) {
      if (contact["version"] === "1.2.0") {
        // eslint-disable-next-line no-console
        console.log(
          `Contact ${contact.id} is already migrated from v1.2.0, skipping migration`
        );
        continue;
      }

      const contactUpdates: Record<string, unknown> = {};
      contactUpdates["version"] = "1.2.0";

      const keysToDelete: string[] = [];
      const historyItems: Array<{
        key: string;
        identifier: string;
        data: string;
      }> = [];
      const noteItems: Array<{ key: string; data: unknown }> = [];

      for (const key of Object.keys(contact)) {
        if (
          key.startsWith("history:ipex") ||
          key.startsWith("history:revoke")
        ) {
          const historyData = JSON.parse(contact[key] as string);
          const historyID = historyData.id;

          const exchange = await signifyClient.exchanges().get(historyID);

          historyData.historyType =
            connectionHistoryTypeNumericToStringValueMap[
              historyData.historyType
            ];

          if (historyData.historyType === "CREDENTIAL_PRESENTED") {
            historyItems.push({
              key,
              identifier: exchange.exn.i,
              data: JSON.stringify(historyData),
            });
          } else {
            historyItems.push({
              key,
              identifier: exchange.exn.rp,
              data: JSON.stringify(historyData),
            });
          }
        } else if (key.startsWith("note:")) {
          noteItems.push({ key, data: contact[key] });
        }
      }

      const sharedIdentifierPrefix = contact.sharedIdentifier;

      if (sharedIdentifierPrefix) {
        const sharedIdentifier = identifiers.find(
          (id: { prefix: string; name: string }) =>
            id.prefix === sharedIdentifierPrefix
        );

        if (sharedIdentifier) {
          for (const historyItem of historyItems) {
            if (sharedIdentifier.prefix === historyItem.identifier) {
              const newPrefixedHistoryItem = `${sharedIdentifierPrefix}:${historyItem.key}`;
              contactUpdates[newPrefixedHistoryItem] = historyItem.data;
            }

            keysToDelete.push(historyItem.key);
          }

          for (const noteItem of noteItems) {
            const newPrefixedNote = `${sharedIdentifierPrefix}:${noteItem.key}`;
            contactUpdates[newPrefixedNote] = noteItem.data;
            keysToDelete.push(noteItem.key);
          }

          contactUpdates[`${sharedIdentifierPrefix}:createdAt`] =
            contact["createdAt"];

          keysToDelete.push("sharedIdentifier");
          keysToDelete.push("createdAt");
        } else {
          // delete contact if sharedIdentifier soft deleted
          await signifyClient.contacts().delete(contact.id);
          continue;
        }
      } else {
        // associate history items to the correct identifier
        for (const historyItem of historyItems) {
          const identifier = identifiers.find(
            (id: { prefix: string; name: string }) =>
              id.prefix === historyItem.identifier
          );
          if (identifier) {
            contactUpdates[`${identifier.prefix}:${historyItem.key}`] =
              historyItem.data;
          }
          keysToDelete.push(historyItem.key);
        }

        // associate createdAt and all notes for every non-deleted identifier
        for (const prefix of identifiers) {
          contactUpdates[`${prefix}:createdAt`] = contact["createdAt"];

          for (const noteItem of noteItems) {
            const newPrefixedNote = `${prefix}:${noteItem.key}`;
            contactUpdates[newPrefixedNote] = noteItem.data;
          }
        }

        // remove createdAt and all notes
        keysToDelete.push("createdAt");
        for (const noteItem of noteItems) {
          keysToDelete.push(noteItem.key);
        }
      }

      for (const key of keysToDelete) {
        contactUpdates[key] = null;
      }

      await signifyClient.contacts().update(contact.id, contactUpdates);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Cloud migration completed: ${contacts.length} connections migrated to account-based model`
    );
  },
};

// Map old values to new string values for migration
const connectionHistoryTypeNumericToStringValueMap: Record<string, string> = {
  "0": "CREDENTIAL_ISSUANCE",
  "1": "CREDENTIAL_REQUEST_PRESENT",
  "2": "CREDENTIAL_REVOKED",
  "3": "CREDENTIAL_PRESENTED",
  "4": "IPEX_AGREE_COMPLETE",
};
