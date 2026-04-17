# Generations

Code scaffolding / generation system. Provides the `add` CLI command action that generates module boilerplate (model, migration, repository, resource, routes, etc.) from stubs.

## Key Files

| File                    | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `add-command.action.ts` | Main action: prompts for module name, generates files from templates |
| `stubs.ts`              | Template strings for generated files                                 |

## Key Exports

- `addCommandAction()` — interactive module scaffolding

## Dependencies

### Internal (within `core/src`)

- `../utils` — path helpers for output directories
- `../cli` — integrates as a CLI command

### External

- `@mongez/copper` — terminal prompts and colors
- `@mongez/fs` — file system operations

## Used By

- `cli/commands/` — the `warlock add` command
