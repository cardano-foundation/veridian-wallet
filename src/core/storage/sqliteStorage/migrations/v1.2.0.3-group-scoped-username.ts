import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, HybridMigration } from "./migrations.types";
import { formatToV1_2_0_3, parseHabName } from "../../../utils/habName";

const migrationVersion = "1.2.0.3";

export const MIGRATION_V1203: HybridMigration = {
  version: migrationVersion,
  type: MigrationType.HYBRID,
  localMigrationStatements: async (session: SQLiteDBConnection) => {
    // eslint-disable-next-line no-console
    console.log(`Starting local migration for v${migrationVersion}...`);
    const statements = [];

    // TODO: @jimcase - refactor this to use a common function for inserting tags
    function insertItemTags(itemRecord: any) {
      const statements: { statement: string; values?: unknown[] }[] = [];
      const statement =
        "INSERT INTO items_tags (item_id, name, value, type) VALUES (?,?,?,?)";
      const tags = itemRecord.tags;
      if (!tags) {
        return statements;
      }
      // eslint-disable-next-line no-console
      console.log(`    - Inserting tags for ${itemRecord.id}:`, tags);
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
      statements.push(...insertItemTags(recordValue));
    }
    // eslint-disable-next-line no-console
    console.log(
      `Local migration for v${migrationVersion} complete. Generated ${statements.length} update statements.`
    );
    return statements;
  },
  cloudMigrationStatements: async (signifyClient) => {
    // eslint-disable-next-line no-console
    console.log(`Starting cloud migration for v${migrationVersion}...`);
    const pageSize = 24;
    let returned = -1;
    let iteration = 0;
    let totalProcessed = 0;

    while (returned !== 0) {
      const result = await signifyClient
        .identifiers()
        .list(
          iteration * (pageSize + 1),
          pageSize + iteration * (pageSize + 1)
        );

      const batchToProcess = result.aids;
      returned = batchToProcess.length;
      // eslint-disable-next-line no-console
      console.log(
        `[v${migrationVersion}] Cloud migration: Fetched ${returned} identifiers in page ${iteration}.`
      );

      for (const identifier of batchToProcess) {
        const currentName = identifier.name;
        const parts = parseHabName(currentName);

        if (!parts) {
          throw new Error(
            `Invalid identifier name format: ${currentName}. Expected format is version:theme:groupPart:displayName or version:theme:displayName.`
          );
        }

        if (parts.version === migrationVersion) {
          // eslint-disable-next-line no-console
          console.log(
            `[v${migrationVersion}] Identifier ${currentName} is already on version ${migrationVersion}. Skipping.`
          );
          continue;
        }

        // eslint-disable-next-line no-console
        console.log(
          `[v${migrationVersion}] Updating cloud identifier: ${currentName} (${identifier.prefix})`
        );

        const newName = formatToV1_2_0_3({
          ...parts,
          groupMetadata: parts.groupMetadata,
        });
        await signifyClient
          .identifiers()
          .update(identifier.prefix, { name: newName });
        totalProcessed += 1;
      }
      iteration += 1;
    }
    // eslint-disable-next-line no-console
    console.log(
      `Cloud migration for v${migrationVersion} complete. Updated ${totalProcessed} identifiers.`
    );
  },
};
