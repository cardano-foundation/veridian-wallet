import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { randomPasscode } from "signify-ts";
import { versionCompare } from "./utils";
import { MIGRATIONS } from "./migrations";
import { MigrationType, CloudMigration } from "./migrations/migrations.types";
import { KeyStoreKeys, SecureStorage } from "../secureStorage";
import { Agent } from "../../agent/agent";
import { MiscRecordId } from "../../agent/agent.types";
import { BasicStorage } from "../../agent/records/basicStorage";

class SqliteSession {
  static readonly VERSION_DATABASE_KEY = "VERSION_DATABASE_KEY";
  static readonly CLOUD_MIGRATION_STATUS_KEY = "CLOUD_MIGRATION_STATUS_KEY";
  static readonly GET_KV_SQL = "SELECT * FROM kv where key = ?";
  static readonly INSERT_KV_SQL =
    "INSERT OR REPLACE INTO kv (key,value) VALUES (?,?)";
  static readonly BASE_VERSION = "0.0.0";

  private sessionInstance?: SQLiteDBConnection;

  private basicStorageService!: BasicStorage;

  get session() {
    return this.sessionInstance;
  }

  private async getKv(key: string): Promise<unknown> {
    const qValues = await this.sessionInstance?.query(
      SqliteSession.GET_KV_SQL,
      [key]
    );
    if (qValues && qValues.values && qValues.values.length === 1) {
      return JSON.parse(qValues.values[0]?.value);
    }
    return undefined;
  }

  private async setKv(key: string, value: unknown): Promise<void> {
    await this.sessionInstance?.query(SqliteSession.INSERT_KV_SQL, [
      key,
      JSON.stringify(value),
    ]);
  }

  private async getCurrentVersionDatabase(): Promise<string> {
    try {
      const currentVersionDatabase = (await this.getKv(
        SqliteSession.VERSION_DATABASE_KEY
      )) as string;
      return currentVersionDatabase ?? SqliteSession.BASE_VERSION;
    } catch (error) {
      return SqliteSession.BASE_VERSION;
    }
  }

  private async getCloudMigrationStatus(): Promise<Record<string, boolean>> {
    try {
      const status = await this.getKv(SqliteSession.CLOUD_MIGRATION_STATUS_KEY);
      return status ?? {};
    } catch (error) {
      return {};
    }
  }

  private async markCloudMigrationComplete(version: string): Promise<void> {
    const status = await this.getCloudMigrationStatus();
    status[version] = true;
    await this.setKv(SqliteSession.CLOUD_MIGRATION_STATUS_KEY, status);
  }

  async open(storageName: string): Promise<void> {
    const connection = new SQLiteConnection(CapacitorSQLite);

    const platform = Capacitor.getPlatform();
    const isPlatformEncryption = platform !== "web";
    const isEncryptInConfig = (await connection.isInConfigEncryption()).result;
    const isEncryption = isPlatformEncryption && isEncryptInConfig;
    if (isEncryption) {
      const isSetSecret = (await connection.isSecretStored()).result;
      if (!isSetSecret) {
        const newBran = randomPasscode();
        await SecureStorage.set(KeyStoreKeys.DB_ENCRYPTION_BRAN, newBran);
        await connection.setEncryptionSecret(newBran);
      }
    }

    const ret = await connection.checkConnectionsConsistency();
    const isConn = (await connection.isConnection(storageName, false)).result;
    if (ret.result && isConn) {
      this.sessionInstance = await connection.retrieveConnection(
        storageName,
        false
      );
    } else {
      this.sessionInstance = await connection.createConnection(
        storageName,
        true,
        "secret",
        1,
        false
      );
    }
    await this.sessionInstance.open();
    // TODO: initialize this.basicStorageService
    // this.basicStorageService = new BasicStorage(new SqliteStorage<BasicRecord>(this.session!));
    await this.migrateDb();
  }

  async wipe(storageName: string): Promise<void> {
    if (!this.sessionInstance) {
      return;
    }
    await this.sessionInstance.close();
    await CapacitorSQLite.deleteDatabase({ database: storageName });
  }

  /**
   * Validates and runs any missed cloud migrations after recovery
   * Should be called when KERIA connection is established after recovery
   */
  async validateCloudMigrationsOnRecovery(): Promise<void> {
    const isKeriaConfigured = await this.isKeriaConfigured();
    if (!isKeriaConfigured) {
      return;
    }

    const currentLocalVersion = await this.getCurrentVersionDatabase();
    const cloudMigrationStatus = await this.getCloudMigrationStatus();

    const orderedMigrations = MIGRATIONS.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    const missedCloudMigrations = orderedMigrations.filter(
      (migration) =>
        migration.type === MigrationType.CLOUD &&
        migration.requiresKeriaConnection &&
        versionCompare(migration.version, currentLocalVersion) <= 0 && // Migration version is at or before current local version
        !cloudMigrationStatus[migration.version] // But cloud migration wasn't completed
    );

    if (missedCloudMigrations.length > 0) {
      for (const migration of missedCloudMigrations) {
        await this.performCloudMigration(migration as CloudMigration, true);
      }
    }
  }

  private async migrateDb(): Promise<void> {
    const currentVersion = await this.getCurrentVersionDatabase();

    const orderedMigrations = MIGRATIONS.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    for (const migration of orderedMigrations) {
      if (versionCompare(migration.version, currentVersion) !== 1) {
        continue;
      }

      const migrationStatements = [];

      if (migration.type === MigrationType.SQL) {
        for (const sqlStatement of migration.sql) {
          migrationStatements.push({ statement: sqlStatement });
        }
      } else if (migration.type === MigrationType.TS) {
        if (!this.sessionInstance) {
          throw new Error("Session not initialized");
        }
        const statements = await migration.migrationStatements(
          this.sessionInstance
        );
        migrationStatements.push(...statements);
      } else if (migration.type === MigrationType.CLOUD) {
        // Handle cloud migrations
        await this.performCloudMigration(migration);
      }

      // Update version for all migration types
      migrationStatements.push({
        statement: SqliteSession.INSERT_KV_SQL,
        values: [
          SqliteSession.VERSION_DATABASE_KEY,
          JSON.stringify(migration.version),
        ],
      });

      if (migrationStatements.length > 0) {
        if (!this.sessionInstance) {
          throw new Error("Session not initialized");
        }
        await this.sessionInstance.executeTransaction(migrationStatements);
      }
    }
  }

  private async performCloudMigration(
    migration: CloudMigration,
    isRecoveryValidation = false
  ): Promise<void> {
    // Dynamic import to avoid circular dependencies
    const { Agent } = await import("../../agent/agent");

    const isKeriaConfigured = await this.isKeriaConfigured();

    if (!isKeriaConfigured) {
      if (migration.requiresKeriaConnection) {
        return;
      }
    } else {
      const wasOnline = Agent.agent.getKeriaOnlineStatus();

      try {
        if (!wasOnline) {
          await this.temporaryKeriaConnection();
        }

        const signifyClient = Agent.agent.client;
        await migration.cloudMigrationStatements(signifyClient);

        // Mark cloud migration as complete
        await this.markCloudMigrationComplete(migration.version);
      } finally {
        if (!wasOnline) {
          Agent.agent.markAgentStatus(false);
        }
      }
    }
  }

  private async isKeriaConfigured(): Promise<boolean> {
    try {
      const { MiscRecordId } = await import("../../agent/agent.types");
      const connectUrlRecord = (await this.getKv(
        MiscRecordId.KERIA_CONNECT_URL
      )) as { url: string };
      return !!connectUrlRecord?.url;
    } catch {
      return false;
    }
  }

  private async temporaryKeriaConnection(): Promise<void> {
    const connectUrlRecord = await this.basicStorageService.findById(
      MiscRecordId.KERIA_CONNECT_URL
    );
    await Agent.agent.start(connectUrlRecord?.content?.url as string);
  }
}

export { SqliteSession };
