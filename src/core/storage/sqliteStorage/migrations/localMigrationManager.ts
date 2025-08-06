import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { versionCompare } from "../utils";
import { LocalMigration, MigrationType } from "./migrations.types";
import { LOCAL_MIGRATIONS } from "./index";

export class LocalMigrationManager {
  constructor(private session: SQLiteDBConnection) {}

  /**
   * Executes all pending local migrations
   * @param currentVersion The current database version
   * @returns Promise<void>
   */
  async executeLocalMigrations(currentVersion: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("Starting local migration execution...");

    const orderedMigrations = LOCAL_MIGRATIONS.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    // Filter migrations that need to be executed
    const pendingMigrations = orderedMigrations.filter(
      (migration) => versionCompare(migration.version, currentVersion) === 1
    );

    if (pendingMigrations.length === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `No local migrations needed. Current version: ${currentVersion}`
      );
      return;
    }

    const targetVersion =
      pendingMigrations[pendingMigrations.length - 1].version;
    // eslint-disable-next-line no-console
    console.log(
      `Starting local migration from version ${currentVersion} to ${targetVersion}...`
    );

    for (const migration of pendingMigrations) {
      // eslint-disable-next-line no-console
      console.log(`Executing local migration: ${migration.version}`);

      const migrationStatements = await this.executeLocalMigration(migration);

      // Update version after successful migration
      migrationStatements.push({
        statement: "INSERT OR REPLACE INTO kv (key,value) VALUES (?,?)",
        values: ["VERSION_DATABASE_KEY", JSON.stringify(migration.version)],
      });

      if (migrationStatements.length > 0) {
        await this.session.executeTransaction(migrationStatements);
      }

      // eslint-disable-next-line no-console
      console.log(`Completed local migration: ${migration.version}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Local migration completed. Updated from version ${currentVersion} to ${targetVersion}`
    );
  }

  private async executeLocalMigration(
    migration: LocalMigration
  ): Promise<{ statement: string; values?: unknown[] }[]> {
    const migrationStatements: { statement: string; values?: unknown[] }[] = [];

    if (migration.type === MigrationType.SQL) {
      // Handle SQL migrations
      const sqlMigration = migration as any;
      for (const sqlStatement of sqlMigration.sql) {
        migrationStatements.push({ statement: sqlStatement });
      }
    } else if (migration.type === MigrationType.TS) {
      // Handle TypeScript migrations
      const tsMigration = migration as any;
      const statements = await tsMigration.migrationStatements(this.session);
      migrationStatements.push(...statements);
    }

    return migrationStatements;
  }
}
