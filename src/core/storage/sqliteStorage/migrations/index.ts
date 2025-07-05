import {
  SqlMigration,
  TsMigration,
  CloudMigration,
  HybridMigration,
} from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V002 } from "./v0.0.2-accountBasedConnections";
import { DATA_V003 } from "./v0.0.3-accountBasedPeerConnections";

type Migration = SqlMigration | TsMigration | CloudMigration | HybridMigration;
const MIGRATIONS: Migration[] = [DATA_V001, DATA_V002, DATA_V003];

export { MIGRATIONS };
