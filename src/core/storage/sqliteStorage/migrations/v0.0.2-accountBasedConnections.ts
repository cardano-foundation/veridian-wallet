import { MigrationType, CloudMigration } from "./migrations.types";
import { SignifyClient } from "signify-ts";
import { KeriaContactKeyPrefix } from "../../../agent/services/connectionService.types";

export const DATA_V002: CloudMigration = {
  type: MigrationType.CLOUD,
  version: "0.0.2",
  cloudMigrationStatements: async (signifyClient: SignifyClient) => {
    await migrateConnectionsToAccountBased(signifyClient);
  },
};

export async function migrateConnectionsToAccountBased(signifyClient: SignifyClient): Promise<void> {
  console.log('Starting migration: Converting connections to account-based model');
  
  // Get all identifiers (these become accounts)
  const identifiers = await signifyClient.identifiers().list();
  
  if (identifiers.length === 0) {
    console.log('No identifiers found, skipping connection migration');
    return;
  }
  
  console.log(`Found ${identifiers.length} identifiers/accounts`);
  
  const contacts = await signifyClient.contacts().list();
  console.log(`Found ${contacts.length} connections to migrate`);
  
  for (const contact of contacts) {
    const connectionData = await signifyClient.contacts().get(contact.id);
    
    // Check if already migrated
    if (connectionData.accountBasedMigration) {
      console.log(`Connection ${contact.alias || contact.id} already migrated`);
      continue;
    }
    
    console.log(`Migrating connection: ${contact.alias || contact.id}`);
    
    const updates: Record<string, any> = {};
    const keysToDelete: string[] = [];
    
    Object.keys(connectionData).forEach((key) => {
      if (key.startsWith(KeriaContactKeyPrefix.HISTORY_IPEX) || 
          key.startsWith(KeriaContactKeyPrefix.HISTORY_REVOKE)) {
        
        const historyItem = JSON.parse(connectionData[key] as string);
        
        identifiers.forEach((identifier: any) => {
          const accountBasedKey = `${key}:${identifier.prefix}`;
          const accountBasedItem = {
            ...historyItem,
            accountId: identifier.prefix,
            migratedFrom: key,
            migratedAt: new Date().toISOString()
          };
          
          updates[accountBasedKey] = JSON.stringify(accountBasedItem);
        });
        
        keysToDelete.push(key);
      }
      
      if (key.startsWith(KeriaContactKeyPrefix.CONNECTION_NOTE)) {
        const note = JSON.parse(connectionData[key] as string);
        
        identifiers.forEach((identifier: any) => {
          const accountBasedKey = `${key}:${identifier.prefix}`;
          const accountBasedNote = {
            ...note,
            accountId: identifier.prefix,
            migratedFrom: key,
            migratedAt: new Date().toISOString()
          };
          
          updates[accountBasedKey] = JSON.stringify(accountBasedNote);
        });
        
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      updates[key] = null;
    });
    
    // Mark as migrated
    updates.accountBasedMigration = JSON.stringify({
      version: 1,
      migratedAt: new Date().toISOString(),
      accountIds: identifiers.map((id: any) => id.prefix),
      originalKeysRemoved: keysToDelete.length
    });
    
    // Apply all updates to this connection
    if (Object.keys(updates).length > 0) {
      await signifyClient.contacts().update(contact.id, updates);
      console.log(`Migrated connection ${contact.alias || contact.id}: ${keysToDelete.length} global entries -> ${identifiers.length} accounts`);
    }
  }
  
  console.log(`Migration completed: ${contacts.length} connections migrated to account-based model`);
} 