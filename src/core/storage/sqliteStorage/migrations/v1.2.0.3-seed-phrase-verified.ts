import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, LocalMigration } from "./migrations.types";
import { createInsertItemStatement } from "./migrationUtils";

const migrationVersion = "1.2.0.3";

export const DATA_V1203: LocalMigration = {
  version: migrationVersion,
  type: MigrationType.TS,
  migrationStatements: async (session: SQLiteDBConnection) => {
    // eslint-disable-next-line no-console
    console.log(`Starting local migration for v${migrationVersion}...`);
    const statements: { statement: string; values?: unknown[] }[] = [];

    const existingVerifiedRecord = await session.query(
      "SELECT * FROM items WHERE id = ?",
      ["seed-phrase-verified"]
    );

    if (
      existingVerifiedRecord.values &&
      existingVerifiedRecord.values.length > 0
    ) {
      return statements;
    }

    const keriaConnectUrlRecord = await session.query(
      "SELECT * FROM items WHERE id = ?",
      ["keria-connect-url"]
    );

    const hasCompletedOnboarding =
      keriaConnectUrlRecord.values && keriaConnectUrlRecord.values.length > 0;

    if (hasCompletedOnboarding) {
      const verifiedRecord = {
        id: "seed-phrase-verified",
        type: "BasicRecord",
        content: { verified: true },
        createdAt: new Date().toISOString(),
      };

      statements.push(createInsertItemStatement(verifiedRecord));
    }
    // eslint-disable-next-line no-console
    console.log(
      `Local migration for v${migrationVersion} complete. Generated ${statements.length} update statements.`
    );
    return statements;
  },
};
