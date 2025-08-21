import { SQLiteDBConnection } from "@capacitor-community/sqlite";

enum MigrationType {
  SQL,
  TS,
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

// Type aliases for better organization
type LocalMigration = SqlMigration | TsMigration;

export { MigrationType };

export type { SqlMigration, TsMigration, LocalMigration };
