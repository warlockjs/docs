# @warlock.js/core Audit — Dev Server & Builder

**Status:** 🟡 Healthy (Conceptual) / 🔴 Silent (Technical)
**Corpus:** `src/dev-server/`, `src/builder/`

## Dev-Server Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Server Lifecycle** | `DevelopmentServer.run/stop` | 100% (Usage) | 🟢 Healthy |
| **Files Orchestrator** | `FilesOrchestrator` class | 0% | 🔴 Silent |
| **Dependency Graph** | `DependencyGraph` class | 0% | 🔴 Silent |
| **HMR Registry** | `HMRRegistry` class | 0% | 🔴 Silent |
| **Production Builder** | `ProductionBuilder.build` | 90% (CLI) | 🟢 Healthy |
| **Health Checks** | `TypescriptChecker/EslintChecker` | 90% | 🟢 Healthy |

---

## Technical Findings

### 1. The HMR Black Box (Silent Internal APIs)
While the *experience* of HMR is perfectly documented, the *engine* behind it is silent.
- **Gap**: There is no technical documentation for `FilesOrchestrator` or `DependencyGraph`. 
- **Impact**: Developers wishing to extend the dev server (e.g., adding a custom file transformer or watching non-standard file types) have no guidance on how Warlock orchestrates these events.

### 2. Module Swapping (HMRRegistry)
`HMRRegistry` is the brain that decides which module to eject and re-inject.
- **Gap**: Completely silent. Knowledge of how modules are registered and cleared is vital for building complex plugins that might maintain their own state.

### 3. Programmatic Build
The `ProductionBuilder` is documented as a CLI command (`warlock build`), but its programmatic API is silent.
- **Gap**: Zero documentation on how to trigger a production build from a script (e.g., a custom CI/CD runner if not using raw shell).

### 4. Manifest Persistence
The relationship between the `dev-server` and the `manifest.json` in `.warlock/` is explained conceptually, but the programmatic manipulation of this manifest via the Foundation's `ManifestManager` is undocumented.

---

## Action Plan (Dev-Server)
- [ ] Create an "Internal Architecture" or "HMR Deep Dive" guide for advanced developers.
- [ ] Document the `DependencyGraph` and `HMRRegistry` classes.
- [ ] Add a "Programmatic Build" section for the `ProductionBuilder` class.
- [ ] Explain the transformation sequence (Transpile -> Inject HMR Logic -> Cache).
