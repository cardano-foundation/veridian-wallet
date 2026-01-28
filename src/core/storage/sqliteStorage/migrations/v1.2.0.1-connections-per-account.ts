import { MigrationType, TsMigration } from "./migrations.types";
import {
  createInsertItemTagsStatements,
  createInsertItemStatement,
} from "./migrationUtils";

enum CreationStatus_V1_1_0 {
  PENDING = "PENDING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

interface GroupMetadata_V1_1_0 {
  groupId: string;
  groupInitiator: boolean;
  groupCreated: boolean;
}

interface IdentifierMetadataRecordProps_V1_1_0 {
  id: string;
  displayName: string;
  creationStatus?: CreationStatus_V1_1_0;
  createdAt?: Date;
  isDeleted?: boolean;
  theme: number;
  groupMemberPre?: string;
  groupMetadata?: GroupMetadata_V1_1_0;
  pendingDeletion?: boolean;
  sxlt?: string;
}

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
      ?.map(
        (row: { value: string }): IdentifierMetadataRecordProps_V1_1_0 =>
          JSON.parse(row.value) as IdentifierMetadataRecordProps_V1_1_0
      )
      .filter(
        (identifier: IdentifierMetadataRecordProps_V1_1_0) =>
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

    for (const connection of connections || []) {
      const connectionData = JSON.parse(connection.value);
      const contactRecord = {
        id: connectionData.id,
        createdAt: connectionData.createdAt,
        alias: connectionData.alias,
        oobi: connectionData.oobi,
        groupId: connectionData.groupId,
        type: "ContactRecord",
      };

      const contactTags = {
        groupId: connectionData.groupId,
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
        alias: string;
        creationStatus: string;
        pendingDeletion: boolean;
        type: string;
      }> = [];

      const connectionPairTags: Record<
        string,
        {
          identifier: string;
          contactId: string;
          creationStatus: string;
          pendingDeletion: boolean;
        }
      > = {};

      if (!connectionData.sharedIdentifier) {
        if (!connectionData.groupId) {
          // No sharedIdentifier: create pair for every non-deleted identifier (unless this is a group connection)
          for (const identifier of identifiers) {
            const pairId = `${identifier.id}:${connectionData.id}`;
            connectionPairsToInsert.push({
              id: pairId,
              contactId: contactRecord.id,
              createdAt: connectionData.createdAt,
              identifier: identifier.id,
              alias: connectionData.alias,
              creationStatus: connectionData.creationStatus,
              pendingDeletion: connectionData.pendingDeletion,
              type: "ConnectionPairRecord",
            });
            connectionPairTags[pairId] = {
              identifier: identifier.id,
              contactId: contactRecord.id,
              creationStatus: connectionData.creationStatus,
              pendingDeletion: connectionData.pendingDeletion,
            };
          }
        }
      } else {
        // Has sharedIdentifier: only create pair if identifier exists and is not deleted/pending
        const identifier = identifiers.find((identifier: { id: string }) => {
          return identifier.id === connectionData.sharedIdentifier;
        });
        if (identifier) {
          const pairId = `${identifier.id}:${connectionData.id}`;
          connectionPairsToInsert.push({
            id: pairId,
            contactId: contactRecord.id,
            identifier: identifier.id,
            createdAt: connectionData.createdAt,
            alias: connectionData.alias,
            creationStatus: connectionData.creationStatus,
            pendingDeletion: connectionData.pendingDeletion,
            type: "ConnectionPairRecord",
          });
          connectionPairTags[pairId] = {
            identifier: identifier.id,
            contactId: contactRecord.id,
            creationStatus: connectionData.creationStatus,
            pendingDeletion: connectionData.pendingDeletion,
          };
        }
      }

      if (connectionPairsToInsert.length > 0 || connectionData.groupId) {
        statements.push(createInsertItemStatement(contactRecord));
        statements.push(
          ...createInsertItemTagsStatements({
            id: contactRecord.id,
            tags: contactTags,
          })
        );

        for (const connectionPair of connectionPairsToInsert) {
          statements.push(createInsertItemStatement(connectionPair));
          statements.push(
            ...createInsertItemTagsStatements({
              id: connectionPair.id,
              tags: connectionPairTags[connectionPair.id],
            })
          );
        }
      }
    }

    return statements;
  },
};
