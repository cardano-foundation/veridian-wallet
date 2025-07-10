import { PeerConnectionPairRecord } from "../../../agent/records";
import { MigrationType, TsMigration } from "./migrations.types";

export const DATA_V1200: TsMigration = {
  type: MigrationType.TS,
  version: "1.2.0.0",
  migrationStatements: async (session) => {
    // eslint-disable-next-line no-console
    console.log(
      "Running migration v1.2.0.0: Peer Connection Account Migration"
    );

    // Get all identifiers from local database
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ? AND value NOT LIKE '%\"isDeleted\":true%'",
      ["IdentifierMetadataRecord"]
    );

    // eslint-disable-next-line no-console
    console.log(`Found ${identifierResult.values?.length ?? 0} identifiers.`);

    if (!identifierResult.values || identifierResult.values.length === 0) {
      return [
        {
          statement: "DELETE FROM items WHERE category = ?",
          values: ["PeerConnectionMetadataRecord"],
        },
      ];
    }

    const identifiers = identifierResult.values;

    // Get all peer connection records from items
    const peerConnectionResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["PeerConnectionMetadataRecord"]
    );

    // eslint-disable-next-line no-console
    console.log(
      `Found ${
        peerConnectionResult.values?.length ?? 0
      } peer connections to migrate.`
    );

    const parsedIdentifiers = identifiers.map((id: any) =>
      JSON.parse(id.value)
    );
    const identifierMap = new Map(
      parsedIdentifiers.map((id: any) => [id.id, id])
    );

    const peerConnections = peerConnectionResult.values ?? [];

    const statements: { statement: string; values?: unknown[] }[] = [];

    for (const peerConnection of peerConnections) {
      // eslint-disable-next-line no-console
      console.log(`Processing peer connection: ${peerConnection.id}`);
      const peerConnectionData = JSON.parse(peerConnection.value);

      let selectedAidForNewRecord: string | undefined = undefined;
      if (peerConnectionData.selectedAid) {
        const matchingIdentifier = identifierMap.get(
          peerConnectionData.selectedAid
        );
        if (matchingIdentifier && !matchingIdentifier.isDeleted) {
          selectedAidForNewRecord = matchingIdentifier.id;
        }
      }

      if (selectedAidForNewRecord) {
        const peerConnectionPairRecord = new PeerConnectionPairRecord({
          id: peerConnectionData.id, // This is the dAppAddress
          selectedAid: selectedAidForNewRecord, // This is the identifier AID
          name: peerConnectionData.name,
          url: peerConnectionData.url,
          iconB64: peerConnectionData.iconB64,
        });
        // eslint-disable-next-line no-console
        console.log(`    - New record ID: ${peerConnectionPairRecord.id}`);
        statements.push({
          statement:
            "INSERT OR IGNORE INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
          values: [
            peerConnectionPairRecord.id,
            "peerConnectionPairRecord",
            peerConnectionPairRecord.id,
            JSON.stringify(peerConnectionPairRecord),
          ],
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `  - No valid identifier found for peer connection: ${peerConnection.id}. Scheduling for deletion.`
        );
      }

      // Delete original PeerConnectionMetadataRecord from items
      // This delete should happen regardless of whether a new record was created or not.
      // eslint-disable-next-line no-console
      console.log(
        `  - Scheduling deletion for old peer connection record: ${peerConnection.id}`
      );
      statements.push({
        statement: "DELETE FROM items WHERE id = ?",
        values: [peerConnection.id],
      });
    }

    // eslint-disable-next-line no-console
    console.log(
      `Migration v1.2.0.0 generated ${statements.length} SQL statements.`
    );
    return statements;
  },
};
