import { MigrationType, HybridMigration } from "./migrations.types";
import { SignifyClient } from "signify-ts";
import { KeriaContactKeyPrefix } from "../../../agent/services/connectionService.types";
import { ContactRecord, ConnectionPairRecord } from "../../../agent/records";
import { CreationStatus } from "../../../agent/agent.types";

export const DATA_V002: HybridMigration = {
  type: MigrationType.HYBRID,
  version: "0.1.0",
  localMigrationStatements: async (session) => {
    console.log('Starting local SQLite migration: Converting connections to account-based model (items table)');
    
    // Get all identifiers from local database
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
    console.log(`Found ${identifiers.length} identifiers in local database`);
    
    // Get all connection records from items
    const connectionResult = await session.query(
      "SELECT * FROM items WHERE category = ?",
      ["ConnectionRecord"]
    );
    
    const connections = connectionResult.values || [];
    console.log(`Found ${connections.length} connections to migrate`);
    
    const statements: { statement: string; values?: unknown[] }[] = [];
    
    for (const connection of connections) {
      const connectionData = JSON.parse(connection.value);
      
      // Create ContactRecord
      const contactRecord = new ContactRecord({
        alias: connectionData.alias,
        oobi: connectionData.oobi,
        groupId: connectionData.groupId,
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
      
      // Create ConnectionPairRecords for each identifier
      for (const identifier of identifiers) {
        const identifierData = JSON.parse(identifier.value);
        
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
      
      // Delete original ConnectionRecord from items
      statements.push({
        statement: "DELETE FROM items WHERE id = ?",
        values: [connection.id]
      });
    }
    
    console.log(`Local migration completed: ${connections.length} connections migrated to account-based model (items table)`);
    return statements;
  },
  
  cloudMigrationStatements: async (signifyClient: SignifyClient) => {
    // console.log('Starting cloud KERIA migration: Converting connections to account-based model');
    
    // // Get all identifiers (these become accounts)
    // const identifiers = await signifyClient.identifiers().list();
    
    // if (identifiers.length === 0) {
    //   console.log('No identifiers found, deleting all contacts');
      
    //   const contacts = await signifyClient.contacts().list();
    //   for (const contact of contacts) {
    //     await signifyClient.contacts().delete(contact.id);
    //   }
      
    //   console.log(`Deleted ${contacts.length} contacts due to no identifiers`);
    //   return;
    // }
    
    // console.log(`Found ${identifiers.length} identifiers/accounts`);
    
    // const contacts = await signifyClient.contacts().list();
    // console.log(`Found ${contacts.length} connections to migrate`);
    
    // for (const contact of contacts) {
    //   const connectionData = await signifyClient.contacts().get(contact.id);
      
    //   // Check if already migrated
    //   if (connectionData.accountBasedMigration) {
    //     console.log(`Connection ${contact.alias || contact.id} already migrated`);
    //     continue;
    //   }
      
    //   console.log(`Migrating connection: ${contact.alias || contact.id}`);
      
    //   const updates: Record<string, any> = {};
    //   const keysToDelete: string[] = [];
    //   const historyItems: Array<{ key: string; data: any; accountId?: string }> = [];
    //   const notes: Array<{ key: string; data: any }> = [];
    //   let createdAt: string | undefined;
      
    //          // Collect all history items and notes
    //    Object.keys(connectionData).forEach((key) => {
    //      if (key === 'createdAt') {
    //        createdAt = connectionData[key] as string;
    //      } else if (key.startsWith(KeriaContactKeyPrefix.HISTORY_IPEX) || 
    //                 key.startsWith(KeriaContactKeyPrefix.HISTORY_REVOKE)) {
           
    //        const historyItem = JSON.parse(connectionData[key] as string);
    //        historyItems.push({ key, data: historyItem });
    //      } else if (key.startsWith(KeriaContactKeyPrefix.CONNECTION_NOTE)) {
    //        const note = JSON.parse(connectionData[key] as string);
    //        notes.push({ key, data: note });
    //      }
    //    });
      
    //   // Process history items - associate with relevant identifiers
    //   const processedAccountIds = new Set<string>();
      
    //   for (const historyItem of historyItems) {
    //     let targetAccountId: string | undefined;
        
    //     // Try to find matching identifier based on rp field or a.i field
    //     if (historyItem.data.rp) {
    //       targetAccountId = identifiers.find((id: any) => id.prefix === historyItem.data.rp)?.prefix;
    //     } else if (historyItem.data.a?.i) {
    //       targetAccountId = identifiers.find((id: any) => id.prefix === historyItem.data.a.i)?.prefix;
    //     }
        
    //     if (targetAccountId) {
    //       historyItem.accountId = targetAccountId;
    //       processedAccountIds.add(targetAccountId);
          
    //       // Create account-based history key
    //       const accountBasedKey = `${historyItem.key}:${targetAccountId}`;
    //       const accountBasedItem = {
    //         ...historyItem.data,
    //         accountId: targetAccountId,
    //         migratedFrom: historyItem.key,
    //         migratedAt: new Date().toISOString()
    //       };
          
    //       updates[accountBasedKey] = JSON.stringify(accountBasedItem);
    //     }
        
    //     keysToDelete.push(historyItem.key);
    //   }
      
    //   // If no history items exist, associate everything with the oldest identifier
    //   if (historyItems.length === 0 && identifiers.length > 0) {
    //     const oldestIdentifier = identifiers.sort((a: any, b: any) => 
    //       new Date(a.created).getTime() - new Date(b.created).getTime()
    //     )[0];
        
    //     processedAccountIds.add(oldestIdentifier.prefix);
    //   }
      
    //   // Process notes - associate with accounts that have history items
    //   for (const note of notes) {
    //     for (const accountId of processedAccountIds) {
    //       const accountBasedKey = `${note.key}:${accountId}`;
    //       const accountBasedNote = {
    //         ...note.data,
    //         accountId: accountId,
    //         migratedFrom: note.key,
    //         migratedAt: new Date().toISOString()
    //       };
          
    //       updates[accountBasedKey] = JSON.stringify(accountBasedNote);
    //     }
        
    //     keysToDelete.push(note.key);
    //   }
      
    //   // Create createdAt fields for each account with history items
    //   if (createdAt) {
    //     for (const accountId of processedAccountIds) {
    //       updates[`${accountId}:createdAt`] = createdAt;
    //     }
    //     keysToDelete.push('createdAt');
    //   }
      
    //   // Mark as migrated
    //   updates.accountBasedMigration = JSON.stringify({
    //     version: "1.2.0",
    //     migratedAt: new Date().toISOString(),
    //     accountIds: Array.from(processedAccountIds),
    //     originalKeysRemoved: keysToDelete.length
    //   });
      
    //   // Apply all updates to this connection
    //   if (Object.keys(updates).length > 0) {
    //     await signifyClient.contacts().update(contact.id, updates);
    //     console.log(`Migrated connection ${contact.alias || contact.id}: ${keysToDelete.length} global entries -> ${processedAccountIds.size} accounts`);
    //   }
    // }
    
    // console.log(`Cloud migration completed: ${contacts.length} connections migrated to account-based model`);
  },
}; 