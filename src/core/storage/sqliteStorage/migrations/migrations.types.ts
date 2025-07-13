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

type CloudMigration = BaseMigration & {
  type: MigrationType.CLOUD;
  requiresKeriaConnection: boolean;
  cloudMigrationStatements: (signifyClient: SignifyClient) => Promise<void>;
};

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

export { MigrationType };

export type { SqlMigration, TsMigration, CloudMigration, HybridMigration };
