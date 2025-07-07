import { PeerConnectionAccountRecord } from "../../../agent/records";
import { CreationStatus } from "../../../agent/agent.types";
import { MigrationType, TsMigration } from "./migrations.types";

export const DATA_V002: TsMigration = {
  type: MigrationType.TS,
  version: "0.0.2",
  migrationStatements: async (session) => {
    // Get all identifiers from local database
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );

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

    const peerConnections = peerConnectionResult.values || [];

    const statements: { statement: string; values?: unknown[] }[] = [];

    for (const peerConnection of peerConnections) {
      const peerConnectionData = JSON.parse(peerConnection.value);

      // Create PeerConnectionAccountRecords for each identifier
      for (const identifier of identifiers) {
        const identifierData = JSON.parse(identifier.value);

        const peerConnectionAccountRecord = new PeerConnectionAccountRecord({
          peerConnectionId: peerConnectionData.id,
          accountId: identifierData.id,
          creationStatus:
            peerConnectionData.creationStatus || CreationStatus.COMPLETE,
          pendingDeletion: peerConnectionData.pendingDeletion || false,
        });

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
      statements.push({
        statement: "DELETE FROM items WHERE id = ?",
        values: [peerConnection.id],
      });
    }

    return statements;
  },
};
