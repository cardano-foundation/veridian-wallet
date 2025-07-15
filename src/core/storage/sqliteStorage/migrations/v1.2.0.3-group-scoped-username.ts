import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, HybridMigration } from "./migrations.types";
import { formatToV1_2_0_3, parseHabName } from "../../../utils/habName";

const migrationVersion = "1.2.0.3";

export const MIGRATION_V1_2_0_3: HybridMigration = {
  version: migrationVersion,
  type: MigrationType.HYBRID,
  localMigrationStatements: async (session: SQLiteDBConnection) => {
    const statements = [];
    const queryResult = await session.query(
      "SELECT id, displayName FROM identifierMetadata;"
    );
    const identifiers = queryResult.values || [];

    for (const identifier of identifiers) {
      const currentName = identifier.displayName;
      const parts = parseHabName(currentName);

      if (parts.version === migrationVersion) {
        continue;
      }

      const newName = formatToV1_2_0_3({
        ...parts,
        userName: parts.isGroupMember ? "" : null,
      });

      statements.push({
        statement:
          "UPDATE identifierMetadata SET displayName = ? WHERE id = ?;",
        values: [newName, identifier.id],
      });
    }

    return statements;
  },
  cloudMigrationStatements: async (signifyClient) => {
    const pageSize = 24;
    let returned = -1;
    let iteration = 0;

    while (returned !== 0) {
      const start = iteration * pageSize;
      const end = start + pageSize - 1;
      const result = await signifyClient.identifiers().list(start, end);

      const batchToProcess = result.aids;
      returned = batchToProcess.length;

      for (const identifier of batchToProcess) {
        const currentName = identifier.name;
        const parts = parseHabName(currentName);

        if (parts.version === migrationVersion) {
          continue;
        }

        const newName = formatToV1_2_0_3({
          ...parts,
          userName: parts.isGroupMember ? "" : null,
        });
        await signifyClient
          .identifiers()
          .update(identifier.prefix, { name: newName });
      }
      iteration += 1;
    }
  },
};
