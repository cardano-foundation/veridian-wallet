import { SQLiteDBConnection } from "@capacitor-community/sqlite";

enum MigrationType {
  SQL,
  TS,
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

type HybridMigration = BaseMigration & {
  type: MigrationType.HYBRID;
  localMigrationStatements: (session: SQLiteDBConnection) => Promise<
    {
      statement: string;
      values?: unknown[];
    }[]
  >;
};

export { MigrationType };

export type { SqlMigration, TsMigration, HybridMigration };
