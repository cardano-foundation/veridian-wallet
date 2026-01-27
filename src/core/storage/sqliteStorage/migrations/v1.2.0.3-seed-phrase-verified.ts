import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { MigrationType, LocalMigration } from "./migrations.types";
import { createInsertItemStatement } from "./migrationUtils";

const migrationVersion = "1.2.0.3";

/**
 * Migration v1.2.0.3: Mark existing users' seed phrase as verified
 *
 * Problem:
 * - V0 (1.0.0/1.1.0) users already verified their seed phrase during onboarding
 * - V1 (1.2.0) introduces a new record `seed-phrase-verified` to track verification
 * - When V0 users migrate to V1, this record doesn't exist
 * - V1 will force them to re-verify their seed phrase (after 14 days or 5 critical actions)
 *
 * Solution:
 * - Check if user is an existing user (has identifiers in database)
 * - If existing user, create the `seed-phrase-verified` record with `{ verified: true }`
 * - New users (no identifiers) will go through normal verification flow
 */
export const DATA_V1203: LocalMigration = {
  version: migrationVersion,
  type: MigrationType.TS,
  migrationStatements: async (session: SQLiteDBConnection) => {
    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG-MIG-1203] ========== START Migration v${migrationVersion} ==========`
    );
    // eslint-disable-next-line no-console
    console.log(
      "[DEBUG-MIG-1203] Checking if existing user needs seed-phrase-verified record"
    );

    const statements: { statement: string; values?: unknown[] }[] = [];

    // Check if SEED_PHRASE_VERIFIED already exists
    const existingVerifiedRecord = await session.query(
      "SELECT * FROM items WHERE id = ?",
      ["seed-phrase-verified"]
    );

    if (
      existingVerifiedRecord.values &&
      existingVerifiedRecord.values.length > 0
    ) {
      // eslint-disable-next-line no-console
      console.log(
        "[DEBUG-MIG-1203] SEED_PHRASE_VERIFIED record already exists, skipping"
      );
      // eslint-disable-next-line no-console
      console.log(
        `[DEBUG-MIG-1203] ========== END Migration v${migrationVersion} ==========`
      );
      return statements;
    }

    // Check if user is existing (has identifiers)
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    const hasIdentifiers =
      identifierResult.values && identifierResult.values.length > 0;
    // eslint-disable-next-line no-console
    console.log(
      "[DEBUG-MIG-1203] Has identifiers:",
      hasIdentifiers,
      "count:",
      identifierResult.values?.length ?? 0
    );

    if (hasIdentifiers) {
      // Existing user - mark as verified
      // eslint-disable-next-line no-console
      console.log(
        "[DEBUG-MIG-1203] Existing user detected, creating SEED_PHRASE_VERIFIED record"
      );

      const verifiedRecord = {
        id: "seed-phrase-verified",
        type: "BasicRecord",
        content: { verified: true },
        createdAt: new Date().toISOString(),
      };

      statements.push(createInsertItemStatement(verifiedRecord));
      // eslint-disable-next-line no-console
      console.log(
        "[DEBUG-MIG-1203] Created SEED_PHRASE_VERIFIED record with verified=true"
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        "[DEBUG-MIG-1203] New user (no identifiers), skipping - will go through normal verification"
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG-MIG-1203] Generated ${statements.length} SQL statements`
    );
    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG-MIG-1203] ========== END Migration v${migrationVersion} ==========`
    );
    return statements;
  },
};
