import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { randomPasscode } from "signify-ts";
import { logger } from "../../../utils/logger/Logger";
import { LocalMigrationManager } from "./migrations/localMigrationManager";
import { CloudMigrationManager } from "./cloudMigrations/cloudMigrationManager";
import { KeyStoreKeys, SecureStorage } from "../secureStorage";
import { BasicStorage } from "../../agent/records/basicStorage";
import { SqliteStorage } from "./sqliteStorage";
import { BasicRecord } from "../../agent/records/basicRecord";
import { Agent } from "../../agent/agent";
import { MiscRecordId } from "../../agent/agent.types";

class SqliteSession {
  static readonly VERSION_DATABASE_KEY = "VERSION_DATABASE_KEY";
  static readonly CLOUD_VERSION_KEY = "CLOUD_VERSION_KEY";
  static readonly GET_KV_SQL = "SELECT * FROM kv where key = ?";
  static readonly INSERT_KV_SQL =
    "INSERT OR REPLACE INTO kv (key,value) VALUES (?,?)";
  static readonly BASE_VERSION = "0.0.0";
  private sessionInstance?: SQLiteDBConnection;
  private basicStorageService!: BasicStorage;
  private localMigrationManager?: LocalMigrationManager;

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
      const currentVersionDatabase = await this.getKv(
        SqliteSession.VERSION_DATABASE_KEY
      );
      return (currentVersionDatabase as string) ?? SqliteSession.BASE_VERSION;
    } catch (error) {
      return SqliteSession.BASE_VERSION;
    }
  }

  private async getCloudVersion(): Promise<string> {
    try {
      const cloudVersion = await this.getKv(SqliteSession.CLOUD_VERSION_KEY);
      return (cloudVersion as string) ?? SqliteSession.BASE_VERSION;
    } catch (error) {
      return SqliteSession.BASE_VERSION;
    }
  }

  private async setCloudVersion(version: string): Promise<void> {
    await this.setKv(SqliteSession.CLOUD_VERSION_KEY, version);
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
    if (!this.sessionInstance) {
      throw new Error("Failed to open SQLite session");
    }
    this.basicStorageService = new BasicStorage(
      new SqliteStorage<BasicRecord>(this.sessionInstance)
    );
    await this.migrateDb();
  }

  async wipe(storageName: string): Promise<void> {
    await this.sessionInstance?.close();
    await CapacitorSQLite.deleteDatabase({ database: storageName });
  }

  /**
   * Executes cloud migrations when connecting to KERIA
   * Should be called on normal startup or recovery when KERIA connection is established
   */
  async executeCloudMigrationsOnConnection(): Promise<void> {
    const isKeriaConfigured = await this.isKeriaConfigured();
    if (!isKeriaConfigured) {
      logger.info("Skipping cloud migrations - KERIA not configured");
      return;
    }

    if (!Agent.isOnline) {
      await this.temporaryKeriaConnection();
    }

    const cloudMigrationManager = new CloudMigrationManager(
      Agent.agent.client,
      this.getCloudVersion.bind(this),
      this.setCloudVersion.bind(this)
    );

    await cloudMigrationManager.executeCloudMigrations();
  }

  private async migrateDb(): Promise<void> {
    const currentVersion = await this.getCurrentVersionDatabase();
    await this.executeLocalMigrations(currentVersion);
  }

  private async executeLocalMigrations(currentVersion: string): Promise<void> {
    if (!this.localMigrationManager) {
      if (!this.sessionInstance) {
        throw new Error("Session instance not available");
      }
      this.localMigrationManager = new LocalMigrationManager(
        this.sessionInstance
      );
    }

    await this.localMigrationManager.executeLocalMigrations(currentVersion);
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
