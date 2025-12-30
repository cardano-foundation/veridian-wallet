import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, LocalMigration } from "./migrations.types";
import { createInsertItemTagsStatements } from "./migrationUtils";

const migrationVersion = "1.2.0.2";

export const DATA_V1202: LocalMigration = {
  version: migrationVersion,
  type: MigrationType.TS,
  migrationStatements: async (session: SQLiteDBConnection) => {
    // eslint-disable-next-line no-console
    console.log(`Starting local migration for v${migrationVersion}...`);
    const statements = [];

    const queryResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    const identifiers = queryResult.values || [];
    // eslint-disable-next-line no-console
    console.log(`Found ${identifiers.length} identifiers to process locally.`);

    for (const identifier of identifiers) {
      // eslint-disable-next-line no-console
      console.log(
        `[v${migrationVersion}] Processing local identifier ID: ${identifier.id}`
      );

      let recordValue = JSON.parse(identifier.value);

      if (!recordValue.groupMetadata || recordValue.groupMemberPre) {
        // eslint-disable-next-line no-console
        console.log(
          `  - Skipping identifier ${identifier.id} (not a group member)`
        );
        continue;
      }

      recordValue = {
        ...recordValue,
        groupMetadata: {
          ...recordValue.groupMetadata,
          proposedUsername: "",
        },
      };

      const calculatedTags = {
        ...(recordValue.tags || {}),
        groupId: recordValue.groupMetadata.groupId,
        isDeleted: recordValue.isDeleted,
        creationStatus: recordValue.creationStatus,
        groupCreated: recordValue.groupMetadata.groupCreated,
        pendingDeletion: recordValue.pendingDeletion,
        pendingUpdate: recordValue.pendingUpdate,
      };

      statements.push({
        statement: "UPDATE items SET value = ? WHERE id = ? AND category = ?;",
        values: [
          JSON.stringify(recordValue),
          identifier.id,
          "IdentifierMetadataRecord",
        ],
      });
      statements.push({
        statement: "DELETE FROM items_tags WHERE item_id = ?",
        values: [identifier.id],
      });
      statements.push(
        ...createInsertItemTagsStatements({
          id: identifier.id,
          tags: calculatedTags,
        })
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      `Local migration for v${migrationVersion} complete. Generated ${statements.length} update statements.`
    );
    return statements;
  },
};
