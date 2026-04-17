# Production

Production build tooling. Uses esbuild to bundle the application for production deployment, with custom plugins for import resolution and optimization.

## Key Files

| File                      | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `production-builder.ts`   | `ProductionBuilder` — configures and runs the esbuild production build |
| `build-app-production.ts` | Entry point function `buildAppForProduction()`                         |
| `esbuild-plugins.ts`      | Custom esbuild plugins for the production bundle                       |

## Key Exports

- `buildAppForProduction()` — triggers the production build
- `ProductionBuilder` — build orchestrator class

## Dependencies

### Internal (within `core/src`)

- `../config` — build configuration
- `../utils` — paths (root, src, output directories)
- `../dev-server` — may reuse transpilation utilities

### External

- `esbuild` — bundler

## Used By

- `cli/commands/` — `build` CLI command
