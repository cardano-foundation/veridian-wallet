import {
  SqlMigration,
  TsMigration,
  CloudMigration,
  HybridMigration,
} from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V1201 } from "./v1.2.0.1-connections-per-account";

type Migration = SqlMigration | TsMigration | CloudMigration | HybridMigration;
const MIGRATIONS: Migration[] = [DATA_V001, DATA_V1201];

const LATEST_CONTACT_VERSION = "1.2.0.1";

export { MIGRATIONS, LATEST_CONTACT_VERSION };
