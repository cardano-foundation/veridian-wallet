# Migration System Diagrams

## Overview

This document contains visual diagrams showing how the migration system works with the clear separation between local (SQLite) and cloud (KERIA) migrations.

## 1. Migration Types Overview

```mermaid
graph TD
    A[Migration Types] --> B[Local Migrations]
    A --> C[Cloud Migrations]
    A --> D[Hybrid Migrations]
    
    B --> B1[SQL Migrations]
    B --> B2[TS Migrations]
    
    C --> C1[Cloud-Only Migrations]
    
    D --> D1[Combined Migrations]
    
    B1 --> B1A[Direct SQL statements]
    B2 --> B2A[TypeScript logic]
    C1 --> C1A[KERIA storage changes]
    D1 --> D1A[Local + Cloud parts]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
```

## 2. Migration Execution Flow

```mermaid
graph TD
    A[App Startup] --> B[Initialize SQLite Session]
    B --> C[Get Current Version]
    C --> D{Execute Local Migrations}
    
    D --> E[LocalMigrationManager]
    E --> F[Execute SQL Migrations]
    E --> G[Execute TS Migrations]
    E --> H[Execute Local Parts of Hybrid]
    
    F --> I[Update Local Version]
    G --> I
    H --> I
    
    I --> J{KERIA Configured?}
    J -->|No| K[Skip Cloud Migrations]
    J -->|Yes| L[Execute Cloud Migrations]
    
    L --> M[CloudMigrationManager]
    M --> N[Execute Cloud-Only Migrations]
    M --> O[Execute Cloud Parts of Hybrid]
    
    N --> P[Mark Cloud Migrations Complete]
    O --> P
    
    K --> Q[App Ready]
    P --> Q
    
    style D fill:#e1f5fe
    style L fill:#fff3e0
    style Q fill:#e8f5e8
```

## 3. Recovery Flow

```mermaid
graph TD
    A[Recovery Process] --> B[Local Migrations Already Complete]
    B --> C[Check Cloud Migration Status]
    C --> D{Missed Cloud Migrations?}
    
    D -->|No| E[Recovery Complete]
    D -->|Yes| F[Execute Missed Cloud Migrations]
    
    F --> G[CloudMigrationManager.validateCloudMigrationsOnRecovery]
    G --> H[Execute Cloud-Only Migrations]
    G --> I[Execute Cloud Parts of Hybrid]
    
    H --> J[Mark Migrations Complete]
    I --> J
    J --> E
    
    style B fill:#e1f5fe
    style F fill:#fff3e0
    style E fill:#e8f5e8
```

## 4. Migration Manager Architecture

```mermaid
graph TD
    A[SqliteSession] --> B[LocalMigrationManager]
    A --> C[CloudMigrationManager]
    
    B --> D[LOCAL_MIGRATIONS]
    B --> E[COMBINED_MIGRATIONS.local]
    
    C --> F[CLOUD_ONLY_MIGRATIONS]
    C --> G[COMBINED_MIGRATIONS.cloud]
    
    D --> H[SQL Migrations]
    D --> I[TS Migrations]
    
    E --> J[Local Parts of Hybrid]
    
    F --> K[Cloud-Only Logic]
    G --> L[Cloud Parts of Hybrid]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style A fill:#f3e5f5
```

## 5. Data Flow for Hybrid Migrations

```mermaid
graph LR
    A[Hybrid Migration] --> B[Local Part]
    A --> C[Cloud Part]
    
    B --> D[SQLite Database]
    C --> E[KERIA Storage]
    
    B --> F[LocalMigrationManager]
    C --> G[CloudMigrationManager]
    
    F --> H[Execute Local Statements]
    G --> I[Execute Cloud Logic]
    
    H --> J[Update Local Version]
    I --> K[Mark Cloud Complete]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style A fill:#f3e5f5
```

## 6. Migration Arrays Organization

```mermaid
graph TD
    A[Migration Arrays] --> B[LOCAL_MIGRATIONS]
    A --> C[CLOUD_ONLY_MIGRATIONS]
    A --> D[COMBINED_MIGRATIONS]
    
    B --> E[DATA_V001<br/>SQL Migration]
    B --> F[DATA_V1200<br/>TS Migration]
    
    C --> G[Empty Array<br/>No Cloud-Only Migrations]
    
    D --> H[DATA_V1201<br/>Hybrid Migration]
    
    H --> I[Local Part<br/>SQLite Changes]
    H --> J[Cloud Part<br/>KERIA Changes]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
```

## 7. Error Handling Flow

```mermaid
graph TD
    A[Migration Execution] --> B{Local Migration Error?}
    
    B -->|Yes| C[App Startup Fails]
    B -->|No| D{Cloud Migration Error?}
    
    D -->|Yes| E[Log Error, Continue]
    D -->|No| F[Migration Success]
    
    E --> G[App Continues<br/>Cloud Migration Retried Later]
    F --> H[App Ready]
    
    C --> I[User Must Fix<br/>Local Database]
    G --> J[Recovery Process<br/>Handles Later]
    
    style C fill:#ffebee
    style E fill:#fff3e0
    style F fill:#e8f5e8
```

## 8. Version Management

```mermaid
graph TD
    A[Version Storage] --> B[Local Version]
    A --> C[Cloud Migration Status]
    
    B --> D[SQLite kv table<br/>VERSION_DATABASE_KEY]
    C --> E[SQLite kv table<br/>CLOUD_MIGRATION_STATUS_KEY]
    
    D --> F[Track Local Migration Progress]
    E --> G[Track Cloud Migration Completion]
    
    F --> H[Prevent Re-running<br/>Local Migrations]
    G --> I[Allow Re-running<br/>Cloud Migrations]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
```

## 9. Migration Dependencies

```mermaid
graph TD
    A[Migration Dependencies] --> B[Local Dependencies]
    A --> C[Cloud Dependencies]
    A --> D[Cross Dependencies]
    
    B --> E[Local migrations can depend<br/>on other local migrations]
    C --> F[Cloud migrations can depend<br/>on other cloud migrations]
    D --> G[Cloud migrations can depend<br/>on local migrations being complete]
    
    E --> H[Version ordering<br/>ensures correct sequence]
    F --> H
    G --> I[Local migrations run first<br/>Cloud migrations run second]
    
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
```

## Color Legend

- **Blue (#e1f5fe)**: Local/SQLite operations
- **Orange (#fff3e0)**: Cloud/KERIA operations  
- **Purple (#f3e5f5)**: Hybrid/Combined operations
- **Green (#e8f5e8)**: Success/Completion states
- **Red (#ffebee)**: Error states

## Key Benefits of This Architecture

1. **Clear Separation**: Local and cloud migrations are completely decoupled
2. **Independent Execution**: Cloud migrations can be retried without affecting local migrations
3. **Recovery Resilience**: Missed cloud migrations are automatically detected and executed
4. **Type Safety**: Strong typing ensures correct migration categorization
5. **Maintainability**: Each migration manager has a single responsibility
6. **Scalability**: Easy to add new migration types or modify existing ones 