import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { randomPasscode } from "signify-ts";
import { versionCompare } from "./utils";
import { MIGRATIONS } from "./migrations";
import { MigrationType } from "./migrations/migrations.types";
import { KeyStoreKeys, SecureStorage } from "../secureStorage";

class SqliteSession {
  static readonly VERSION_DATABASE_KEY = "VERSION_DATABASE_KEY";
  static readonly GET_KV_SQL = "SELECT * FROM kv where key = ?";
  static readonly INSERT_KV_SQL =
    "INSERT OR REPLACE INTO kv (key,value) VALUES (?,?)";
  static readonly BASE_VERSION = "0.0.0";

  private sessionInstance?: SQLiteDBConnection;

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
    await this.migrateDb();
  }

  async wipe(storageName: string): Promise<void> {
    await this.sessionInstance?.close();
    await CapacitorSQLite.deleteDatabase({ database: storageName });
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
      } else if (migration.type === MigrationType.HYBRID) {
        const statements = await migration.localMigrationStatements(
          this.session!
        );
        migrationStatements.push(...statements);
      }
      // CLOUD migrations are handled separately and don't produce local SQL statements.

      if (migrationStatements.length > 0) {
        migrationStatements.push({
          statement: SqliteSession.INSERT_KV_SQL,
          values: [
            SqliteSession.VERSION_DATABASE_KEY,
            JSON.stringify(migration.version),
          ],
        });
        await this.session!.executeTransaction(migrationStatements);
      }
    }
  }
}

export { SqliteSession };
