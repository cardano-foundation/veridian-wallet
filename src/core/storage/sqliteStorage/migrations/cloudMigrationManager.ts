import { SignifyClient } from "signify-ts";
import { versionCompare } from "../utils";
import { CloudOnlyMigration } from "./migrations.types";
import { CLOUD_ONLY_MIGRATIONS, COMBINED_MIGRATIONS } from "./index";

export class CloudMigrationManager {
  constructor(
    private signifyClient: SignifyClient,
    private markMigrationComplete?: (version: string) => Promise<void>
  ) {}

  /**
   * Executes all pending cloud migrations
   * @param currentVersion The current database version
   * @param cloudMigrationStatus Current cloud migration completion status
   * @returns Promise<void>
   */
  async executeCloudMigrations(
    currentVersion: string,
    cloudMigrationStatus: Record<string, boolean>
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("Starting cloud migration execution...");

    const allCloudMigrations = [
      ...CLOUD_ONLY_MIGRATIONS,
      ...COMBINED_MIGRATIONS.map((migration) => ({
        version: migration.version,
        cloudMigrationStatements: migration.cloudMigrationStatements,
      })),
    ];

    const orderedMigrations = allCloudMigrations.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    // Filter migrations that need to be executed
    const pendingMigrations = orderedMigrations.filter((migration) => {
      const needsMigration =
        versionCompare(migration.version, currentVersion) === 1;
      const notCompleted = !cloudMigrationStatus[migration.version];
      return needsMigration && notCompleted;
    });

    if (pendingMigrations.length === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `No cloud migrations needed. Current version: ${currentVersion}`
      );
      return;
    }

    const targetVersion =
      pendingMigrations[pendingMigrations.length - 1].version;
    // eslint-disable-next-line no-console
    console.log(
      `Starting cloud migration from version ${currentVersion} to ${targetVersion}...`
    );

    for (const migration of pendingMigrations) {
      // eslint-disable-next-line no-console
      console.log(`Executing cloud migration: ${migration.version}`);

      try {
        await this.executeCloudMigration(migration);

        // Mark migration as complete if callback is provided
        if (this.markMigrationComplete) {
          await this.markMigrationComplete(migration.version);
        }

        // eslint-disable-next-line no-console
        console.log(`Completed cloud migration: ${migration.version}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to execute cloud migration ${migration.version}:`,
          error
        );
        throw error;
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `Cloud migration completed. Updated from version ${currentVersion} to ${targetVersion}`
    );
  }

  /**
   * Validates and runs any missed cloud migrations after recovery
   * Should be called when KERIA connection is established after recovery
   */
  async validateCloudMigrationsOnRecovery(
    currentVersion: string,
    cloudMigrationStatus: Record<string, boolean>
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("Validating cloud migrations after recovery...");

    const allCloudMigrations = [
      ...CLOUD_ONLY_MIGRATIONS,
      ...COMBINED_MIGRATIONS.map((migration) => ({
        version: migration.version,
        cloudMigrationStatements: migration.cloudMigrationStatements,
      })),
    ];

    const orderedMigrations = allCloudMigrations.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    const missedCloudMigrations = orderedMigrations.filter(
      (migration) =>
        versionCompare(migration.version, currentVersion) <= 0 && // Migration version is at or before current local version
        !cloudMigrationStatus[migration.version] // But cloud migration wasn't completed
    );

    if (missedCloudMigrations.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No missed cloud migrations found");
      return;
    }

    const targetVersion =
      missedCloudMigrations[missedCloudMigrations.length - 1].version;
    // eslint-disable-next-line no-console
    console.log(
      `Found ${missedCloudMigrations.length} missed cloud migrations to run (from version ${currentVersion} to ${targetVersion})`
    );

    for (const migration of missedCloudMigrations) {
      // eslint-disable-next-line no-console
      console.log(`Running missed cloud migration: ${migration.version}`);
      await this.executeCloudMigration(migration, true);

      // Mark migration as complete if callback is provided
      if (this.markMigrationComplete) {
        await this.markMigrationComplete(migration.version);
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `Recovery cloud migration completed. Updated from version ${currentVersion} to ${targetVersion}`
    );
  }

  private async executeCloudMigration(
    migration:
      | CloudOnlyMigration
      | { version: string; cloudMigrationStatements: any },
    isRecoveryValidation = false
  ): Promise<void> {
    const action = isRecoveryValidation ? "recovery validation" : "migration";
    // eslint-disable-next-line no-console
    console.log(`Starting cloud ${action} ${migration.version}`);

    await migration.cloudMigrationStatements(this.signifyClient);

    // eslint-disable-next-line no-console
    console.log(`Completed cloud ${action} ${migration.version}`);
  }
}
