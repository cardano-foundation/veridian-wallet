import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, LocalMigration } from "./migrations.types";
import { createInsertItemTagsStatements } from "./migrationUtils";

const migrationVersion = "1.2.0.3";

export const DATA_V1203: LocalMigration = {
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
    console.log(
      `Found ${identifiers.length} identifier records to update pending flags.`
    );

    for (const identifier of identifiers) {
      const recordValue = JSON.parse(identifier.value);
      recordValue.pendingUpdate =
        recordValue.pendingUpdate === undefined
          ? false
          : Boolean(recordValue.pendingUpdate);

      recordValue._tags = {
        ...(recordValue._tags ?? {}),
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

      const tags = {
        ...(recordValue._tags ?? {}),
        groupId: recordValue.groupMetadata?.groupId,
        isDeleted: recordValue.isDeleted ?? false,
        creationStatus: recordValue.creationStatus ?? "PENDING",
        groupCreated: recordValue.groupMetadata?.groupCreated,
        pendingDeletion: recordValue.pendingDeletion ?? false,
        pendingUpdate: recordValue.pendingUpdate,
      };

      statements.push(
        ...createInsertItemTagsStatements({
          id: identifier.id,
          tags,
        })
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `Local migration for v${migrationVersion} complete. Generated ${statements.length} statements.`
    );
    return statements;
  },
};
