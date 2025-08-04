import {
  LocalMigration,
  CloudOnlyMigration,
  CombinedMigration,
} from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V1201 } from "./v1.2.0.1-connections-per-account";
import { DATA_V1200 } from "./v1.2.0.0-peer_connection_account_migration";

// Local migrations (SQLite database only)
const LOCAL_MIGRATIONS: LocalMigration[] = [DATA_V001, DATA_V1200];

// Cloud-only migrations (KERIA storage only)
const CLOUD_ONLY_MIGRATIONS: CloudOnlyMigration[] = [
  // Currently no cloud-only migrations
];

// Combined migrations (both local and cloud)
const COMBINED_MIGRATIONS: CombinedMigration[] = [DATA_V1201];

// Legacy export for backward compatibility
type Migration = LocalMigration | CloudOnlyMigration | CombinedMigration;
const MIGRATIONS: Migration[] = [
  ...LOCAL_MIGRATIONS,
  ...CLOUD_ONLY_MIGRATIONS,
  ...COMBINED_MIGRATIONS,
];

const LATEST_CONTACT_VERSION = "1.2.0.1";

export {
  MIGRATIONS,
  LOCAL_MIGRATIONS,
  CLOUD_ONLY_MIGRATIONS,
  COMBINED_MIGRATIONS,
  LATEST_CONTACT_VERSION,
};
