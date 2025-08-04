import { SignifyClient } from "signify-ts";
import { versionCompare } from "../utils";
import { CloudOnlyMigration, CombinedMigration } from "./migrations.types";
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
      ...COMBINED_MIGRATIONS.map(migration => ({
        version: migration.version,
        cloudMigrationStatements: migration.cloudMigrationStatements,
      }))
    ];

    const orderedMigrations = allCloudMigrations.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    for (const migration of orderedMigrations) {
      if (versionCompare(migration.version, currentVersion) !== 1) {
        continue;
      }

      // Skip if cloud migration is already completed
      if (cloudMigrationStatus[migration.version]) {
        // eslint-disable-next-line no-console
        console.log(`Cloud migration ${migration.version} already completed, skipping`);
        continue;
      }

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
        console.error(`Failed to execute cloud migration ${migration.version}:`, error);
        throw error;
      }
    }
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
      ...COMBINED_MIGRATIONS.map(migration => ({
        version: migration.version,
        cloudMigrationStatements: migration.cloudMigrationStatements,
      }))
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

    // eslint-disable-next-line no-console
    console.log(
      `Found ${missedCloudMigrations.length} missed cloud migrations to run`
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
  }

  private async executeCloudMigration(
    migration: CloudOnlyMigration | { version: string; cloudMigrationStatements: any },
    isRecoveryValidation: boolean = false
  ): Promise<void> {
    const action = isRecoveryValidation ? "recovery validation" : "migration";
    // eslint-disable-next-line no-console
    console.log(`Starting cloud ${action} ${migration.version}`);
    
    await migration.cloudMigrationStatements(this.signifyClient);
    
    // eslint-disable-next-line no-console
    console.log(`Completed cloud ${action} ${migration.version}`);
  }
} 