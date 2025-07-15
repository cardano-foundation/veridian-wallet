import { SqlMigration, TsMigration, CloudMigration } from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";

type Migration = SqlMigration | TsMigration | CloudMigration;
const MIGRATIONS: Migration[] = [DATA_V001];

export { MIGRATIONS };
