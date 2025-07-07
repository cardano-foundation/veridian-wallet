import { HybridMigration, SqlMigration, TsMigration } from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V002 } from "./v0.0.2-accountBasedPeerConnections";

type Migration = SqlMigration | TsMigration | HybridMigration;
const MIGRATIONS: Migration[] = [DATA_V001, DATA_V002];

export { MIGRATIONS };
