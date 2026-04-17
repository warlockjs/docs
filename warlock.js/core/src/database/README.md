# Database

Database lifecycle actions invoked by CLI commands: running migrations, seeding, creating databases, and dropping tables. Acts as the bridge between the CLI layer and the `@warlock.js/cascade` ORM.

## Key Files

| File                        | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `migrate-action.ts`         | Runs pending migrations, tracks state, handles ordering and `createdAt` parsing |
| `seed-command-action.ts`    | Executes database seeders                                                       |
| `create-database-action.ts` | Creates the database if it doesn't exist                                        |
| `drop-tables-action.ts`     | Drops all tables (with optional `--force` flag)                                 |
| `utils.ts`                  | Shared utilities (e.g., date parsing for migration filenames)                   |
| `models/`                   | Migration state model (tracks which migrations have run)                        |
| `seeds/`                    | Seed infrastructure and built-in seeders                                        |
| `index.ts`                  | Barrel export                                                                   |

## Key Exports

- `migrateAction()` — execute pending migrations
- `seedAction()` — run seeders
- `createDatabaseAction()` — create database
- `dropTablesAction()` — drop all tables

## Dependencies

### Internal (within `core/src`)

- `../config` — reads database configuration
- `../utils` — path helpers

### External

- `@warlock.js/cascade` — `dataSourceRegistry`, migration drivers, model definitions

## Used By

- `cli/commands/` — `migrate`, `seed`, `db:create`, `drop.tables` CLI commands
- `tests/` — may reset database state between test runs
