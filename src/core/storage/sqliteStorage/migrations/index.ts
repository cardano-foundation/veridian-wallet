import { LocalMigration } from "./migrations.types";
import { DATA_V001 } from "./v0.0.1-init_sql";
import { DATA_V1201 } from "./v1.2.0.1-connections-per-account";
import { DATA_V1200 } from "./v1.2.0.0-peer_connection_account_migration";

// Local migrations (SQLite database only)
const LOCAL_MIGRATIONS: LocalMigration[] = [
  DATA_V001, // SQL migration for database initialization
  DATA_V1200, // TS migration for peer connection account migration
  DATA_V1201, // TS migration for connections per account (local part only)
];

const LATEST_LOCAL_VERSION = "1.2.0.1";
// Legacy export for backward compatibility with cloud services
const LATEST_CONTACT_VERSION = "1.2.0.1";

export { LOCAL_MIGRATIONS, LATEST_LOCAL_VERSION, LATEST_CONTACT_VERSION };
