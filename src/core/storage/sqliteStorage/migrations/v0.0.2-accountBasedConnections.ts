import { MigrationType, HybridMigration } from "./migrations.types";
import { SignifyClient } from "signify-ts";
import { KeriaContactKeyPrefix } from "../../../agent/services/connectionService.types";
import { ContactRecord, ConnectionPairRecord } from "../../../agent/records";
import { CreationStatus } from "../../../agent/agent.types";

export const DATA_V002: HybridMigration = {
  type: MigrationType.HYBRID,
  version: "0.0.2",
  localMigrationStatements: async (session) => {
    const identifierResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["IdentifierMetadataRecord"]
    );
    
    if (identifierResult.values && identifierResult.values.length === 0) {
      console.log('No identifiers found in local database, deleting all connections');
      return [{
        statement: "DELETE FROM items WHERE category = ?",
        values: ["ConnectionRecord"]
      }];
    }
    
    const identifiers = identifierResult.values || [];
    
    // Get all connection records from items
    const connectionResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["ConnectionRecord"]
    );
    
    const connections = connectionResult.values || [];
    const statements: { statement: string; values?: unknown[] }[] = [];
    
    for (const connection of connections) {
      const connectionData = JSON.parse(connection.value);
      
      // Create ContactRecord
      const contactRecord = new ContactRecord({
        id: connectionData.id,
        createdAt: connectionData.createdAtUTC,
        alias: connectionData.alias,
        oobi: connectionData.oobi,
        groupId: connectionData.groupId,
        tags: connectionData.tags,
      });
      
      // Insert ContactRecord into items
      statements.push({
        statement: "INSERT OR IGNORE INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
        values: [
          contactRecord.id,
          "ContactRecord",
          contactRecord.id,
          JSON.stringify(contactRecord)
        ]
      });
      
      for (const identifier of identifiers) {
        const identifierData = JSON.parse(identifier.value);
        if(connectionData.sharedIdentifier === identifierData.id) {
          const connectionPairRecord = new ConnectionPairRecord({
            contactId: contactRecord.id,
            accountId: identifierData.id,
            creationStatus: connectionData.creationStatus || CreationStatus.PENDING,
            pendingDeletion: connectionData.pendingDeletion || false,
          });

          statements.push({
            statement: "INSERT OR IGNORE INTO items (id, category, name, value) VALUES (?, ?, ?, ?)",
            values: [
              connectionPairRecord.id,
              "ConnectionPairRecord",
              connectionPairRecord.id,
              JSON.stringify(connectionPairRecord)
            ]
          });
        }
      }
    }
    
    return statements;
  },
  
  cloudMigrationStatements: async (signifyClient: SignifyClient) => {
    console.log('Starting cloud KERIA migration: Converting connections to account-based model');
    
    const identifiers = (await signifyClient.identifiers().list()).aids;
    console.log(`Found ${identifiers.length} identifiers/accounts`);

    if(identifiers.length === 0) {
      console.log('No identifiers found, skipping migration');
      return;
    }

    const oldestIdentifier = identifiers.sort((a: any, b: any) =>   
      new Date(a.icp_dt).getTime() - new Date(b.icp_dt).getTime()
    )[0];

    const oldestIdentifierPrefix = oldestIdentifier.prefix;
    
    const contacts = await signifyClient.contacts().list();
    console.log(`Found ${contacts.length} connections to migrate`);
    
    for (const contact of contacts) {
      const contractUpdates: Record<string, any> = {};

      const keysToDelete: string[] = [];
      const historyItems: Array<{ key: string; data: any}> = [];
      let noteKey: string | undefined;

      Object.keys(contact).forEach((key) => {
        if (key.startsWith(KeriaContactKeyPrefix.HISTORY_IPEX) || 
                  key.startsWith(KeriaContactKeyPrefix.HISTORY_REVOKE)) {
          
          historyItems.push({ key, data: contact[key] });
        } else if (key.startsWith(KeriaContactKeyPrefix.CONNECTION_NOTE)) {
          noteKey = key;
        }
      });

      const associatedIdentifierPrefix = contact.sharedIdentifier;

      if (historyItems.length === 0) {
        contractUpdates[`${oldestIdentifierPrefix}:createdAt`] = contact['createdAt'];
        keysToDelete.push('createdAt');
        
        // update note to be prefixed with the oldest identifier prefix
        if(noteKey) {
          const newPrefixedNote = `${oldestIdentifierPrefix}:${noteKey}`;
          contractUpdates[newPrefixedNote] = contact[noteKey];
          keysToDelete.push(noteKey);
        }
      }

      if(associatedIdentifierPrefix) {
        const associatedIdentifier = identifiers.find((id: any) => id.prefix === associatedIdentifierPrefix);
        if(associatedIdentifier) {
          contractUpdates[`${associatedIdentifierPrefix}:createdAt`] = contact['createdAt'];
          keysToDelete.push('createdAt');

          // update history items to be prefixed with the associated identifier prefix
          for(const historyItem of historyItems) {
            const newPrefixedHistoryItem = `${associatedIdentifierPrefix}:${historyItem.key}`;
            contractUpdates[newPrefixedHistoryItem] = historyItem.data;
            keysToDelete.push(historyItem.key);
          }

          // update note to be prefixed with the associated identifier prefix
          if(noteKey) {
            const newPrefixedNote = `${associatedIdentifierPrefix}:${noteKey}`;
            contractUpdates[newPrefixedNote] = contact[noteKey];
            keysToDelete.push(noteKey);
          }
        } else {
          console.log(`Connection ${contact.alias || contact.id} has no associated identifier, skipping`);
          continue;
        }
      }

      // Delete all keys that are prefixed with the oldest identifier prefix
      // for(const key of keysToDelete) {
      //   contractUpdates[key] = null;
      // }

      //Apply all updates to this connection
      try {
        await signifyClient.contacts().update(contact.id, contractUpdates);
      } catch(e) {
        console.error(`Error migrating connection ${contact.alias || contact.id}: ${e}`);
      }
    }
    
    console.log(`Cloud migration completed: ${contacts.length} connections migrated to account-based model`);
  },
}; 