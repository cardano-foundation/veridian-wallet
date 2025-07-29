import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { randomPasscode } from "signify-ts";
import { versionCompare } from "./utils";
import { MIGRATIONS } from "./migrations";
import {
  MigrationType,
  CloudMigration,
  HybridMigration,
} from "./migrations/migrations.types";
import { KeyStoreKeys, SecureStorage } from "../secureStorage";
import { BasicStorage } from "../../agent/records/basicStorage";
import { SqliteStorage } from "./sqliteStorage";
import { BasicRecord } from "../../agent/records/basicRecord";
import { Agent } from "../../agent/agent";
import { MiscRecordId } from "../../agent/agent.types";

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

  private async getKv(key: string): Promise<any> {
    const qValues = await this.sessionInstance?.query(
      SqliteSession.GET_KV_SQL,
      [key]
    );
    if (qValues && qValues.values && qValues.values.length === 1) {
      return JSON.parse(qValues.values[0]?.value);
    }
    return undefined;
  }

  private async setKv(key: string, value: any): Promise<void> {
    await this.sessionInstance?.query(SqliteSession.INSERT_KV_SQL, [
      key,
      JSON.stringify(value),
    ]);
  }

  private async getCurrentVersionDatabase(): Promise<string> {
    try {
      const currentVersionDatabase = await this.getKv(
        SqliteSession.VERSION_DATABASE_KEY
      );
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
    this.basicStorageService = new BasicStorage(
      new SqliteStorage<BasicRecord>(this.session!)
    );
    await this.migrateDb();
  }

  async wipe(storageName: string): Promise<void> {
    await this.sessionInstance?.close();
    await CapacitorSQLite.deleteDatabase({ database: storageName });
  }

  /**
   * Validates and runs any missed cloud migrations after recovery
   * Should be called when KERIA connection is established after recovery
   */
  async validateCloudMigrationsOnRecovery(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Validating cloud migrations after recovery...');

    const currentLocalVersion = await this.getCurrentVersionDatabase();
    const cloudMigrationStatus = await this.getCloudMigrationStatus();

    const orderedMigrations = MIGRATIONS.sort((a, b) =>
      versionCompare(a.version, b.version)
    );

    const missedCloudMigrations = orderedMigrations.filter(
      (migration) =>
        (migration.type === MigrationType.CLOUD ||
          migration.type === MigrationType.HYBRID) &&
        versionCompare(migration.version, currentLocalVersion) <= 0 && // Migration version is at or before current local version
        !cloudMigrationStatus[migration.version] // But cloud migration wasn't completed
    );

    if (missedCloudMigrations.length == 0) {
      // eslint-disable-next-line no-console
      console.log('No missed cloud migrations found');
      return;
    }
        
    // eslint-disable-next-line no-console
    console.log(`Found ${missedCloudMigrations.length} missed cloud migrations to run`);
    
    for (const migration of missedCloudMigrations) {
      // eslint-disable-next-line no-console
      console.log(`Running missed cloud migration: ${migration.version}`);
      await this.performCloudMigration(
        migration as CloudMigration | HybridMigration,
        true
      );
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
        const statements = await migration.migrationStatements(this.session!);
        migrationStatements.push(...statements);
      } else if (migration.type === MigrationType.CLOUD) {
        // Handle cloud migrations
        await this.performCloudMigration(migration);
      } else if (migration.type === MigrationType.HYBRID) {
        const statements = await migration.localMigrationStatements(
          this.session!
        );
        migrationStatements.push(...statements);
        await this.performCloudMigration(migration, false);
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
        await this.session!.executeTransaction(migrationStatements);
      }
    }
  }
  
  private async performCloudMigration(
    migration: CloudMigration | HybridMigration,
    isRecoveryValidation: boolean = false
  ): Promise<void> {
    const isKeriaConfigured = await this.isKeriaConfigured();
    if (!isKeriaConfigured) {
      const action = isRecoveryValidation
        ? "recovery validation"
        : "initial migration";
      // eslint-disable-next-line no-console
      console.log(
        `Skipping cloud migration ${migration.version} during ${action} - KERIA not configured`
      );
    } else {
      await this.temporaryKeriaConnection();

      const action = isRecoveryValidation ? "recovery validation" : "migration";
      // eslint-disable-next-line no-console
      console.log(`Starting cloud ${action} ${migration.version}`);
      const signifyClient = Agent.agent.client;
      await migration.cloudMigrationStatements(signifyClient);
      // eslint-disable-next-line no-console
      console.log(`Completed cloud ${action} ${migration.version}`);

      // Mark cloud migration as complete
      await this.markCloudMigrationComplete(migration.version);
    }
  }

  private async isKeriaConfigured(): Promise<boolean> {
    const connectUrlRecord = await this.basicStorageService.findById(
      MiscRecordId.KERIA_CONNECT_URL
    );
    return !!connectUrlRecord?.content?.url;
  }

  private async temporaryKeriaConnection(): Promise<void> {
    const connectUrlRecord = await this.basicStorageService.findById(
      MiscRecordId.KERIA_CONNECT_URL
    );
    await Agent.agent.start(connectUrlRecord?.content?.url as string);
  }
}

export { SqliteSession };
