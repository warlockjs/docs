# @warlock.js/core Audit — Infrastructure

**Status:** 🟡 Significant Gaps
**Corpus:** `src/connectors/`, `src/config/`, `src/cli/`, `src/warlock-config/`

## Infrastructure Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Connectors Lifecycle** | `BaseConnector` connect/disconnect | 90% | 🟢 Healthy |
| **Connectors Registry** | `ConnectorsManager.get/list` | 0% | 🔴 Silent |
| **Config Accessor** | `config.get/key` | 100% | 🟢 Healthy |
| **Config Mutation** | `config.set/has` | 0% | 🔴 Silent |
| **Warlock Config** | `defineConfig` | 100% | 🟢 Healthy |
| **CLI Engine** | `CLICommand` class & factory | 0% | 🔴 Silent |
| **Built-in CLI** | `migrate/seed/dev/build` | 100% (Manuals) | 🟢 Healthy |

---

## Technical Findings

### 1. CLI Command Engine (Total Blackout)
Warlock.js has a robust internal engine for defining CLI commands (`src/cli/cli-command.ts`). 
- **Gap**: There is zero documentation on how a developer can add a custom command (e.g., `warlock report:generate`) by extending `CLICommand`. While the framework commands themselves are documented in terms of usage, the extensibility path is a "Silent API".

### 2. Connectors Registry Inspection
The `connectorsManager` instance allows for programmatic inspection of all registered services.
- **Gap**: Documentation for `connectorsManager.get('database')` is missing. This is necessary for developers who want to check connection status or perform manual re-connects in advanced scenarios.

### 3. Config Manager Mutation
While reading configuration is well-covered, the ability to check for existence (`config.has()`) or override values at runtime (`config.set()`) is undocumented. 

### 4. Warlock Config Priority
The `WarlockConfigManager` handles the `warlock.config.ts` loading and defaults.
- **Observation**: The priority and loading sequence of `warlock.config.ts` vs environment variables could be more explicitly documented for clarity during the build process.

---

## Action Plan (Infrastructure)
- [ ] Create a "Custom CLI Commands" guide explaining how to use the `command()` factory and `CLICommand` class.
- [ ] Add a "Programmatic Access" section to the Connectors guide to document `connectorsManager`.
- [ ] Update "Environment & Configuration" to include `config.has()` and `config.set()` methods.
