import { CloudMigration } from "./cloudMigrations.types";
import { CLOUD_V1201 } from "./v1.2.0.1-connections-account-based";

// Cloud migrations (KERIA storage only)
const CLOUD_MIGRATIONS: CloudMigration[] = [
  CLOUD_V1201, // Convert connections to account-based model
];

const LATEST_CONTACT_VERSION = "1.2.0.1";

export { CLOUD_MIGRATIONS, LATEST_CONTACT_VERSION };
