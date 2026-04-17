# validation/plugins
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Seal plugin that augments the `v` factory with `v.embed` and `v.embedMany` methods for embedded model validation.

## What lives here
- `embed-validator-plugin.ts` — exports `embedValidator` as a `SealPlugin` that installs embed methods onto seal's `v` object

## Public API
- `embedValidator: SealPlugin` — plugin object with `name: "embed"`, `version: "1.0.0"`, and `install()` method
- `EmbedOptions` — `{ errorMessage?: string; embed?: string | string[] }` options type (module-local, used in augmented signatures)
- `v.embed(model, options?): EmbedModelValidator` — augmented method on seal `v` after plugin install
- `v.embedMany(model, options?): EmbedModelValidator` — augmented method on seal `v` after plugin install

## How it fits together
`database-seal-plugins.ts` calls `registerPlugin(embedValidator)` on import, which triggers `embedValidator.install()`. The `install` function assigns `v.embed` and `v.embedMany` directly onto the seal `v` factory, making them available everywhere `v` is imported. Both methods construct and return a configured `EmbedModelValidator` instance. The `ValidatorV` interface is augmented via `declare module` so TypeScript knows about these additional methods without modifying the seal package.

## Working examples
```typescript
// After database-seal-plugins has been imported:
import { v } from "@warlock.js/seal";

const embedSchema = v.embed(User);
const embedManySchema = v.embedMany("Post", { embed: ["id", "title"] });
```

## DO NOT
- Do NOT call `v.embed` or `v.embedMany` before the plugin has been installed via `registerPlugin(embedValidator)` — the methods will be undefined at runtime.
- Do NOT re-export `EmbedOptions` as a public type — it is module-local and used only for the augmented `ValidatorV` signatures.
- Do NOT attempt to install the plugin manually by calling `embedValidator.install()` directly — always use `registerPlugin` to ensure seal's registry is aware of the plugin.
