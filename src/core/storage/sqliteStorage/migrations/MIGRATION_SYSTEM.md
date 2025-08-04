# Migration System Architecture

## Overview

The migration system has been refactored to provide a clear separation between local (SQLite) and cloud (KERIA) migrations. This separation is crucial for the recovery flow, where local and cloud migrations must be completely decoupled.

## Migration Types

### 1. Local Migrations (SQLite Database)

**Types:**
- `SqlMigration`: Direct SQL statements for database schema changes
- `TsMigration`: Complex migrations using TypeScript logic

**Characteristics:**
- Execute only on the local SQLite database
- Run during app startup before cloud migrations
- Update the local database version
- Independent of KERIA connection status

**Examples:**
- Database initialization (`v0.0.1-init_sql.ts`)
- Schema changes
- Data transformations within SQLite

### 2. Cloud-Only Migrations (KERIA Storage)

**Type:**
- `CloudMigration`: Custom data migrations in KERIA cloud storage

**Characteristics:**
- Execute only on KERIA cloud storage
- Require active KERIA connection
- Track completion status separately from local migrations
- Can be skipped if KERIA is not configured

**Examples:**
- Cloud data structure changes
- KERIA-specific data transformations

### 3. Combined Migrations (Both Local and Cloud)

**Type:**
- `HybridMigration`: Migrations that affect both local and cloud storage

**Characteristics:**
- Execute local part first (SQLite changes)
- Execute cloud part second (KERIA changes)
- Both parts must succeed for the migration to be considered complete
- Cloud part can be retried during recovery

**Examples:**
- Data model changes that affect both local and cloud storage
- Account-based features that require both local and cloud updates

## Migration Managers

### LocalMigrationManager

Handles all local migrations (SQL and TS types) and the local parts of hybrid migrations.

**Responsibilities:**
- Execute SQL migrations
- Execute TypeScript migrations
- Execute local parts of hybrid migrations
- Update local database version
- Manage transaction boundaries

### CloudMigrationManager

Handles all cloud migrations and the cloud parts of hybrid migrations.

**Responsibilities:**
- Execute cloud-only migrations
- Execute cloud parts of hybrid migrations
- Track cloud migration completion status
- Handle recovery validation for missed cloud migrations
- Manage KERIA connection requirements

## Migration Flow

### Normal Startup Flow

1. **Local Migrations First**
   - Execute all pending local migrations
   - Update local database version
   - Ensure data consistency in SQLite

2. **Cloud Migrations Second**
   - Check KERIA connection status
   - Execute pending cloud migrations
   - Mark cloud migrations as complete
   - Handle any cloud-specific errors

### Recovery Flow

1. **Local Migrations Validation**
   - Local migrations are already complete
   - Database version is current

2. **Cloud Migrations Validation**
   - Check for missed cloud migrations
   - Execute any cloud migrations that were skipped
   - Update cloud migration completion status

## File Organization

```
migrations/
├── index.ts                    # Migration exports and organization
├── migrations.types.ts         # Type definitions
├── localMigrationManager.ts    # Local migration execution
├── cloudMigrationManager.ts    # Cloud migration execution
├── utils.ts                   # Shared utility functions
├── MIGRATION_SYSTEM.md        # This documentation
├── MIGRATION_DIAGRAMS.md      # Visual diagrams
├── v0.0.1-init_sql.ts         # Local SQL migration
├── v1.2.0.0-peer_connection_account_migration.ts  # Local TS migration
└── v1.2.0.1-connections-per-account.ts           # Hybrid migration
```

## Migration Arrays

### LOCAL_MIGRATIONS
Contains only local migrations (SQL and TS types).

### CLOUD_ONLY_MIGRATIONS
Contains only cloud migrations (currently empty).

### COMBINED_MIGRATIONS
Contains hybrid migrations that affect both local and cloud storage.

## Shared Utilities

### migrationUtils.ts
Contains shared utility functions used across multiple migrations:

- `createInsertItemTagsStatements()`: Creates SQL statements for inserting item tags into the `items_tags` table
- `createInsertItemStatement()`: Creates SQL statement for inserting items into the `items` table
- Handles boolean and string tag types
- Provides consistent logging and error handling
- Reduces code duplication across migration files

## Best Practices

### Creating New Migrations

1. **Local-Only Changes**: Use `SqlMigration` or `TsMigration`
2. **Cloud-Only Changes**: Use `CloudMigration`
3. **Combined Changes**: Use `HybridMigration`

### Code Reuse

1. **Use Shared Utilities**: Import functions from `utils.ts` to avoid code duplication
2. **Consistent Patterns**: Follow the established patterns for migration structure
3. **Type Safety**: Use the provided TypeScript types for better code quality

### Migration Dependencies

- Local migrations can depend on other local migrations
- Cloud migrations can depend on other cloud migrations
- Hybrid migrations should ensure local part completes before cloud part
- Cloud migrations can depend on local migrations being complete

### Error Handling

- Local migration failures prevent app startup
- Cloud migration failures are logged but don't prevent app startup
- Recovery validation ensures missed cloud migrations are executed
- Cloud migrations can be retried during recovery

### Version Management

- Local version is stored in SQLite `kv` table
- Cloud migration status is stored separately in SQLite `kv` table
- Versions are managed independently for local and cloud migrations
- Recovery ensures both local and cloud versions are consistent

## Migration Execution Order

1. **Version Check**: Compare current version with migration versions
2. **Local Execution**: Execute local migrations in version order
3. **Cloud Execution**: Execute cloud migrations in version order
4. **Status Update**: Mark migrations as complete
5. **Recovery Check**: Validate any missed cloud migrations

This architecture ensures that local and cloud migrations are completely decoupled while maintaining data consistency across both storage systems. 