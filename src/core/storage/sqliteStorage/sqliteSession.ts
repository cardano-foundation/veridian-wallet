import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { randomPasscode } from "signify-ts";
import { LocalMigrationManager } from "./migrations/localMigrationManager";
import { CloudMigrationManager } from "./migrations/cloudMigrationManager";
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
  private localMigrationManager?: LocalMigrationManager;
  private cloudMigrationManager?: CloudMigrationManager;

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
    console.log("Validating cloud migrations after recovery...");

    const currentLocalVersion = await this.getCurrentVersionDatabase();
    const cloudMigrationStatus = await this.getCloudMigrationStatus();

    if (!this.cloudMigrationManager) {
      await this.initializeCloudMigrationManager();
    }

    await this.cloudMigrationManager!.validateCloudMigrationsOnRecovery(
      currentLocalVersion,
      cloudMigrationStatus
    );
  }

  private async migrateDb(): Promise<void> {
    const currentVersion = await this.getCurrentVersionDatabase();

    await this.executeCloudMigrations(currentVersion);
    await this.executeLocalMigrations(currentVersion);
  }

  private async executeLocalMigrations(currentVersion: string): Promise<void> {
    if (!this.localMigrationManager) {
      this.localMigrationManager = new LocalMigrationManager(this.session!);
    }

    await this.localMigrationManager.executeLocalMigrations(currentVersion);
  }

  private async executeCloudMigrations(currentVersion: string): Promise<void> {
    const isKeriaConfigured = await this.isKeriaConfigured();
    if (!isKeriaConfigured) {
      // eslint-disable-next-line no-console
      console.log("Skipping cloud migrations - KERIA not configured");
      return;
    }

    await this.initializeCloudMigrationManager();
    const cloudMigrationStatus = await this.getCloudMigrationStatus();

    await this.cloudMigrationManager!.executeCloudMigrations(
      currentVersion,
      cloudMigrationStatus
    );
  }

  private async initializeCloudMigrationManager(): Promise<void> {
    await this.temporaryKeriaConnection();
    this.cloudMigrationManager = new CloudMigrationManager(
      Agent.agent.client,
      this.markCloudMigrationComplete.bind(this)
    );
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
