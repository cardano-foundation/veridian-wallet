import { SignifyClient } from "signify-ts";

type BaseMigration = {
  version: string;
};

// Cloud-only migrations (KERIA storage)
type CloudMigration = BaseMigration & {
  cloudMigrationStatements: (signifyClient: SignifyClient) => Promise<void>;
};

export type { CloudMigration };
