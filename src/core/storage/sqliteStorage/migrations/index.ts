import {
  SqlMigration,
  TsMigration,
  CloudMigration,
  HybridMigration,
} from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V1200 } from "./v1.2.0.0-peer_connection_account_migration";
import { MIGRATION_V1_2_0_3 } from "./v1.2.0.3-group-scoped-username";

type Migration = SqlMigration | TsMigration | CloudMigration | HybridMigration;
const MIGRATIONS: Migration[] = [DATA_V001, DATA_V1200, MIGRATION_V1_2_0_3];

export { MIGRATIONS };
