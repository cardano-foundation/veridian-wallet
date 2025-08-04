import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { SignifyClient } from "signify-ts";

enum MigrationType {
  SQL,
  TS,
  CLOUD,
  HYBRID,
}

type BaseMigration = {
  version: string;
};

// Local-only migrations (SQLite database)
type SqlMigration = BaseMigration & {
  type: MigrationType.SQL;
  sql: string[];
};

type TsMigration = BaseMigration & {
  type: MigrationType.TS;
  migrationStatements: (session: SQLiteDBConnection) => Promise<
    {
      statement: string;
      values?: unknown[];
    }[]
  >;
};

// Cloud-only migrations (KERIA storage)
type CloudMigration = BaseMigration & {
  type: MigrationType.CLOUD;
  cloudMigrationStatements: (signifyClient: SignifyClient) => Promise<void>;
};

// Hybrid migrations (both local and cloud)
type HybridMigration = BaseMigration & {
  type: MigrationType.HYBRID;
  localMigrationStatements: (session: SQLiteDBConnection) => Promise<
    {
      statement: string;
      values?: unknown[];
    }[]
  >;
  cloudMigrationStatements: (signifyClient: SignifyClient) => Promise<void>;
};

// Type aliases for better organization
type LocalMigration = SqlMigration | TsMigration;
type CloudOnlyMigration = CloudMigration;
type CombinedMigration = HybridMigration;

export { MigrationType };

export type {
  SqlMigration,
  TsMigration,
  CloudMigration,
  HybridMigration,
  LocalMigration,
  CloudOnlyMigration,
  CombinedMigration,
};
