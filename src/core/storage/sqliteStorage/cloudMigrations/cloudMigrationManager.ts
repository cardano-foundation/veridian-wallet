import { SignifyClient } from "signify-ts";
import { logger } from "../../../../utils/logger/Logger";
import { formatErrorContext } from "../../../../utils/logger/loggerUtils";
import { versionCompare } from "../utils";
import { CLOUD_MIGRATIONS } from "./index";

export class CloudMigrationManager {
  static readonly CLOUD_VERSION_KEY = "CLOUD_VERSION_KEY";

  constructor(
    private signifyClient: SignifyClient,
    private getCloudVersion: () => Promise<string>,
    private setCloudVersion: (version: string) => Promise<void>
  ) {}

  /**
   * Executes all pending cloud migrations
   * Should be called when connecting to KERIA (startup or recovery)
   */
  async executeCloudMigrations(): Promise<void> {
    const currentVersion = await this.getCloudVersion();

    logger.info("Starting cloud migration execution...");

    const orderedMigrations = CLOUD_MIGRATIONS.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    // Filter migrations that need to be executed
    const pendingMigrations = orderedMigrations.filter((migration) => {
      return versionCompare(migration.version, currentVersion) === 1;
    });

    if (pendingMigrations.length === 0) {
      logger.info(
        `No cloud migrations needed. Current cloud version: ${currentVersion}`
      );
      return;
    }

    const targetVersion =
      pendingMigrations[pendingMigrations.length - 1].version;
    logger.info(
      `Starting cloud migration from version ${currentVersion} to ${targetVersion}...`
    );

    for (const migration of pendingMigrations) {
      logger.info(`Executing cloud migration: ${migration.version}`);

      try {
        await migration.cloudMigrationStatements(this.signifyClient);

        // Update cloud version after successful migration
        await this.setCloudVersion(migration.version);

        logger.info(`Completed cloud migration: ${migration.version}`);
      } catch (error) {
        logger.error(
          `Failed to execute cloud migration ${migration.version}:`,
          formatErrorContext(error)
        );
        throw error;
      }
    }

    logger.info(
      `Cloud migration completed. Updated from version ${currentVersion} to ${targetVersion}`
    );
  }
}
