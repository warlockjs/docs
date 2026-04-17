# CLI

Command-line interface system. Parses CLI arguments, discovers commands from the framework and user project, and executes them. Includes built-in commands for migrations, seeding, code generation, and more.

## Key Files

| File                        | Purpose                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `cli-command.ts`            | `CliCommand` base class — defines command name, options, handler                                 |
| `cli-commands.manager.ts`   | `CliCommandsManager` — registers, resolves, and runs commands; includes fuzzy matching for typos |
| `cli-commands.utils.ts`     | Utility functions for CLI output formatting                                                      |
| `parse-cli-args.ts`         | Parses raw `process.argv` into structured command + flags                                        |
| `commands-loader.ts`        | Discovers and loads commands from framework + project                                            |
| `framework-cli-commands.ts` | Registers all built-in framework commands                                                        |
| `start.ts`                  | Entry point that kicks off CLI processing                                                        |
| `string-similarity.ts`      | Fuzzy string matching for "did you mean?" suggestions                                            |
| `types.ts`                  | CLI-related TypeScript types                                                                     |
| `commands/`                 | Built-in command implementations (migrate, seed, generate, etc.)                                 |

## Key Exports

- `CliCommand` — base class to extend for custom commands
- `CliCommandsManager` / `cliCommandsManager` — singleton command registry
- `startCli()` — entry point

## Dependencies

### Internal (within `core/src`)

- `../database` — migration/seed actions
- `../generations` — code scaffolding actions
- `../config` — reads CLI config
- `../warlock-config` — loads `warlock.config.ts` for custom commands
- `../manifest` — caches command metadata in `commands.json`
- `../utils` — path helpers

### External

- `@mongez/copper` — terminal colors and prompts
- `@warlock.js/cascade` — database driver access for migration commands

## Used By

- Top-level `warlock` CLI entry point
- `dev-server/` — may invoke CLI commands programmatically
