import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { logger } from "../../../../utils/logger/Logger";
import { MigrationType, LocalMigration } from "./migrations.types";
import { createInsertItemTagsStatements } from "./migrationUtils";

const migrationVersion = "1.2.0.2";

export const DATA_V1202: LocalMigration = {
  version: migrationVersion,
  type: MigrationType.TS,
  migrationStatements: async (session: SQLiteDBConnection) => {
    logger.info(`Starting local migration for v${migrationVersion}...`);
    const statements = [];

    const queryResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    const identifiers = queryResult.values || [];
    logger.info(`Found ${identifiers.length} identifiers to process locally.`);

    for (const identifier of identifiers) {
      logger.info(
        `[v${migrationVersion}] Processing local identifier ID: ${identifier.id}`
      );

      let recordValue = JSON.parse(identifier.value);
      const groupMetadata = recordValue.groupMetadata || {};

      recordValue = {
        ...recordValue,
        groupMetadata: { ...groupMetadata, userName: "" },
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
      statements.push(...createInsertItemTagsStatements(recordValue));
    }
    logger.info(
      `Local migration for v${migrationVersion} complete. Generated ${statements.length} update statements.`
    );
    return statements;
  },
};
