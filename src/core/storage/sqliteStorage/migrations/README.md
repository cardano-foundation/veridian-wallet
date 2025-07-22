## Data migration guide

**Method 1: Direct SQL Statements**: This method involves writing raw SQL statements in a file with the suffix `_sql.ts`, which should just be the initial setup.
**Method 2: TypeScript Functions Returning SQL Statements and Parameters**: This method involves writing TypeScript functions that return SQL statements and their parameters.

All migration files should be written in the `migration` directory and will apply the necessary updates when the application starts.

[Note](https://github.com/cardano-foundation/veridian-wallet/pull/1250/files#r2200512079): To ensure forward compatibility, migration scripts must be self-contained and avoid dependencies on application code such as classes, constants, or enums. Instead of instantiating imported classes, migrations should construct records as plain objects to prevent failures if the application's class definitions change in future versions.