import { MigrationType, HybridMigration } from "./migrations.types";
import { SignifyClient } from "signify-ts";
import { randomSalt } from "../../../agent/services/utils";

export const DATA_V1201: HybridMigration = {
  type: MigrationType.HYBRID,
  version: "1.2.0.1",
  localMigrationStatements: async (session) => {
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    let identifiers = identifierResult.values;
    identifiers = identifiers
      ?.map((identifier: any) => JSON.parse(identifier.value))
      .filter(
        (identifier: any) =>
          !identifier.isDeleted && !identifier.pendingDeletion
      );

    if (!identifiers || identifiers.length === 0) {
      console.log(
        "No identifiers found in local database, deleting all connections"
      );
      return [
        {
          statement: "DELETE FROM items WHERE category = ?",
          values: ["ConnectionRecord"],
        },
      ];
    }

    const connectionResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["ConnectionRecord"]
    );
    const connections = connectionResult.values;
    const statements: { statement: string; values?: unknown[] }[] = [];

    function insertItem(record: any) {
      return {
        statement:
          "INSERT INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
        values: [record.id, record.type, record.id, JSON.stringify(record)],
      };
    }

    function instertItemTags(itemRecord: any) {
      const statements = [];
      const statement =
        "INSERT INTO items_tags (item_id, name, value, type) VALUES (?,?,?,?)";
      const tags = itemRecord.tags;
      console.log("tags", tags);
      for (const key of Object.keys(tags)) {
        if (tags[key] === undefined || tags[key] === null) continue;
        if (typeof tags[key] === "boolean") {
          statements.push({
            statement: statement,
            values: [itemRecord.id, key, tags[key] ? "1" : "0", "boolean"],
          });
        } else if (typeof tags[key] === "string") {
          statements.push({
            statement: statement,
            values: [itemRecord.id, key, tags[key], "string"],
          });
        }
      }
      return statements;
    }

    for (const connection of connections || []) {
      const connectionData = JSON.parse(connection.value);
      const contactRecord = {
        id: connectionData.id,
        createdAt: connectionData.createdAt,
        alias: connectionData.alias,
        oobi: connectionData.oobi,
        groupId: connectionData.groupId,
        tags: {
          groupId: connectionData.groupId,
        },
        type: "ContactRecord",
      };
      console.log("contactRecord", contactRecord);

      // we need to delete the connection with this id, because it will be replaced by the new connection in items table
      statements.push({
        statement: "DELETE FROM items WHERE id = ?",
        values: [connection.id],
      });

      const connectionPairsToInsert: any[] = [];

      if (!connectionData.sharedIdentifier) {
        // No sharedIdentifier: create pair for every non-deleted identifier
        for (const identifier of identifiers) {
          connectionPairsToInsert.push({
            id: randomSalt(),
            contactId: contactRecord.id,
            createdAt: connectionData.createdAt,
            identifier: identifier.id,
            creationStatus: connectionData.creationStatus,
            pendingDeletion: connectionData.pendingDeletion,
            tags: {
              identifier: identifier.id,
              contactId: contactRecord.id,
              creationStatus: connectionData.creationStatus,
              pendingDeletion: connectionData.pendingDeletion,
            },
            type: "ConnectionPairRecord",
          });
        }
      } else {
        // Has sharedIdentifier: only create pair if identifier exists and is not deleted/pending
        const identifier = identifiers.find((identifier: any) => {
          return identifier.id === connectionData.sharedIdentifier;
        });
        if (identifier) {
          connectionPairsToInsert.push({
            id: randomSalt(),
            contactId: contactRecord.id,
            identifier: identifier.id,
            createdAt: connectionData.createdAt,
            creationStatus: connectionData.creationStatus,
            pendingDeletion: connectionData.pendingDeletion,
            tags: {
              identifier: identifier.id,
              contactId: contactRecord.id,
              creationStatus: connectionData.creationStatus,
              pendingDeletion: connectionData.pendingDeletion,
            },
            type: "ConnectionPairRecord",
          });
        }
      }

      // Only insert the contact if there is at least one pair
      if (connectionPairsToInsert.length > 0) {
        statements.push(insertItem(contactRecord));
        statements.push(...instertItemTags(contactRecord));
        for (const connectionPair of connectionPairsToInsert) {
          statements.push(insertItem(connectionPair));
          statements.push(...instertItemTags(connectionPair));
        }
      }
    }

    return statements;
  },

  cloudMigrationStatements: async (signifyClient: SignifyClient) => {
    console.log(
      "Starting cloud KERIA migration: Converting connections to account-based model"
    );

    let identifiers = (await signifyClient.identifiers().list()).aids;

    identifiers = identifiers.filter(
      (identifier: any) => !identifier.name.startsWith("XX")
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
        data: any;
      }> = [];
      const noteItems: Array<{ key: string; data: any }> = [];

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
          (id: any) => id.prefix === sharedIdentifierPrefix
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
            (id: any) => id.prefix === historyItem.identifier
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
