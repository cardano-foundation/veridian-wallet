import { MigrationType, TsMigration } from "./migrations.types";
import {
  createInsertItemTagsStatements,
  createInsertItemStatement,
} from "./migrationUtils";

export const DATA_V1201: TsMigration = {
  type: MigrationType.TS,
  version: "1.2.0.1",
  migrationStatements: async (session) => {
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    let identifiers = identifierResult.values;
    identifiers = identifiers
      ?.map((identifier: { value: string }) => JSON.parse(identifier.value))
      .filter(
        (identifier: { isDeleted?: boolean; pendingDeletion?: boolean }) =>
          !identifier.isDeleted && !identifier.pendingDeletion
      );

    if (!identifiers || identifiers.length === 0) {
      // eslint-disable-next-line no-console
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

      // we need to delete the connection with this id, because it will be replaced by the new connection in items table
      statements.push({
        statement: "DELETE FROM items WHERE id = ?",
        values: [connection.id],
      });

      const connectionPairsToInsert: Array<{
        id: string;
        contactId: string;
        createdAt: string;
        identifier: string;
        creationStatus: string;
        pendingDeletion: boolean;
        tags: Record<string, unknown>;
        type: string;
      }> = [];

      if (!connectionData.sharedIdentifier) {
        if (!connectionData.groupId) {
          // eslint-disable-next-line no-console
          console.log("No groupId found for connection, skipping migration");
          continue;
        }

        // No sharedIdentifier: create pair for every non-deleted identifier
        for (const identifier of identifiers) {
          connectionPairsToInsert.push({
            id: `${identifier.id}:${connectionData.id}`,
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
        const identifier = identifiers.find((identifier: { id: string }) => {
          return identifier.id === connectionData.sharedIdentifier;
        });
        if (identifier) {
          connectionPairsToInsert.push({
            id: `${identifier.id}:${connectionData.id}`,
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

      if (connectionPairsToInsert.length > 0 || connectionData.groupId) {
        statements.push(createInsertItemStatement(contactRecord));
        statements.push(...createInsertItemTagsStatements(contactRecord));

        for (const connectionPair of connectionPairsToInsert) {
          statements.push(createInsertItemStatement(connectionPair));
          statements.push(...createInsertItemTagsStatements(connectionPair));
        }
      }
    }

    return statements;
  },
};
