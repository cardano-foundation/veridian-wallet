import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, HybridMigration } from "./migrations.types";
import { formatToV1_2_0_3, parseHabName } from "../../../utils/habName";

export const MIGRATION_V1_2_0_3: HybridMigration = {
  version: "1.2.0.3",
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

      if (parts.version === "v1.2.0.3") {
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
    // TODO
  },
};
