import { CloudMigration } from "./cloudMigrations.types";
import { CLOUD_V1201 } from "./v1.2.0.1-connections-account-based";
import { CLOUD_V1203 } from "./v1.2.0.3-group-scoped-username-clould";

// Cloud migrations (KERIA storage only)
const CLOUD_MIGRATIONS: CloudMigration[] = [
  CLOUD_V1201, // Convert connections to account-based model
  CLOUD_V1203, // Add group scoped username
];

const LATEST_CONTACT_VERSION = "1.2.0.1";
const LATEST_IDENTIFIER_VERSION = "1.2.0.3";

export { CLOUD_MIGRATIONS, LATEST_CONTACT_VERSION, LATEST_IDENTIFIER_VERSION };
