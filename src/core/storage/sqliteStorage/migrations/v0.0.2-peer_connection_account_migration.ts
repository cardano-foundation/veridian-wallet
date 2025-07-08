import { PeerConnectionAccountRecord } from "../../../agent/records";
import { CreationStatus } from "../../../agent/agent.types";
import { MigrationType, TsMigration } from "./migrations.types";

export const DATA_V002: TsMigration = {
  type: MigrationType.TS,
  version: "0.0.2",
  migrationStatements: async (session) => {
    // eslint-disable-next-line no-console
    console.log("Running migration v0.0.2: Peer Connection Account Migration");

    // Get all identifiers from local database
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

    // eslint-disable-next-line no-console
    console.log(`Found ${identifierResult.values?.length ?? 0} identifiers.`);

    if (identifierResult.values && identifierResult.values.length === 0) {
      return [
        {
          statement: "DELETE FROM items WHERE category = ?",
          values: ["PeerConnectionMetadataRecord"],
        },
      ];
    }

    const identifiers = identifierResult.values || [];

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

    const peerConnections = peerConnectionResult.values || [];

    const statements: { statement: string; values?: unknown[] }[] = [];

    for (const peerConnection of peerConnections) {
      // eslint-disable-next-line no-console
      console.log(`Processing peer connection: ${peerConnection.id}`);
      const peerConnectionData = JSON.parse(peerConnection.value);

      // Create PeerConnectionAccountRecords for each identifier
      for (const identifier of identifiers) {
        const identifierData = JSON.parse(identifier.value);
        // eslint-disable-next-line no-console
        console.log(
          `  - Creating PeerConnectionAccountRecord for identifier: ${identifierData.id}`
        );
        const peerConnectionAccountRecord = new PeerConnectionAccountRecord({
          peerConnectionId: peerConnectionData.id,
          accountId: identifierData.id,
          creationStatus:
            peerConnectionData.creationStatus || CreationStatus.COMPLETE,
          pendingDeletion: peerConnectionData.pendingDeletion || false,
          name: peerConnectionData.name,
          url: peerConnectionData.url,
          iconB64: peerConnectionData.iconB64,
        });
        // eslint-disable-next-line no-console
        console.log(`    - New record ID: ${peerConnectionAccountRecord.id}`);

        statements.push({
          statement:
            "INSERT OR IGNORE INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
          values: [
            peerConnectionAccountRecord.id,
            "PeerConnectionAccountRecord",
            peerConnectionAccountRecord.id,
            JSON.stringify(peerConnectionAccountRecord),
          ],
        });
      }

      // Delete original PeerConnectionMetadataRecord from items
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
      `Migration v0.0.2 generated ${statements.length} SQL statements.`
    );
    return statements;
  },
};
