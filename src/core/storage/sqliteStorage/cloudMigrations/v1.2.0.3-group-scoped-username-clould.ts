import { formatToV1_2_0_3, parseHabName } from "../../../utils/habName";
import { CloudMigration } from "./cloudMigrations.types";

const migrationVersion = "1.2.0.3";

export const CLOUD_V1203: CloudMigration = {
  version: migrationVersion,
  cloudMigrationStatements: async (signifyClient) => {
    // eslint-disable-next-line no-console
    console.log(`Starting cloud migration for v${migrationVersion}...`);
    const pageSize = 24;
    let returned = -1;
    let iteration = 0;
    let totalProcessed = 0;

    while (returned !== 0) {
      const result = await signifyClient
        .identifiers()
        .list(
          iteration * (pageSize + 1),
          pageSize + iteration * (pageSize + 1)
        );

      const batchToProcess = result.aids;
      returned = batchToProcess.length;
      // eslint-disable-next-line no-console
      console.log(
        `[v${migrationVersion}] Cloud migration: Fetched ${returned} identifiers in page ${iteration}.`
      );

      for (const identifier of batchToProcess) {
        const currentName = identifier.name;
        const parts = parseHabName(currentName);

        if (!parts) {
          throw new Error(
            `Invalid identifier name format: ${currentName}. Expected format is version:theme:groupPart:displayName or version:theme:displayName.`
          );
        }

        if (parts.version === migrationVersion) {
          // eslint-disable-next-line no-console
          console.log(
            `[v${migrationVersion}] Identifier ${currentName} is already on version ${migrationVersion}. Skipping.`
          );
          continue;
        }

        // eslint-disable-next-line no-console
        console.log(
          `[v${migrationVersion}] Updating cloud identifier: ${currentName} (${identifier.prefix})`
        );

        const newName = formatToV1_2_0_3({
          ...parts,
          groupMetadata: parts.groupMetadata,
        });
        await signifyClient
          .identifiers()
          .update(identifier.prefix, { name: newName });
        totalProcessed += 1;
      }
      iteration += 1;
    }
    // eslint-disable-next-line no-console
    console.log(
      `Cloud migration for v${migrationVersion} complete. Updated ${totalProcessed} identifiers.`
    );
  },
};
