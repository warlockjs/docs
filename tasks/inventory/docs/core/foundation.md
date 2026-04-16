# @warlock.js/core Audit — Foundation

**Status:** 🔴 Critical Gaps
**Corpus:** `src/application/`, `src/manifest/`, `src/bootstrap.ts`

## Foundation Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Application State** | `Application.isProduction/isTest` | 0% | 🔴 Silent |
| **Path Resolvers** | `Application.uploadsPath`, `rootPath` | 10% (via utils) | 🔴 Silent |
| **Runtime Strategy** | `Application.runtimeStrategy` | 0% | 🔴 Silent |
| **Manifest Manager** | `ManifestManager` class | 0% | 🔴 Silent |
| **Bootstrap Process** | `bootstrap()` function | 20% (Conceptual) | 🟡 Internal |
| **App Configurations** | `AppConfigurations` type | 70% | 🟢 Healthy |

---

## Technical Findings

### 1. The "Silent" Application Class
The `Application` class is the central state machine for a Warlock app, yet it is never introduced as a developer-facing utility. 
- **Missing**: No documentation on how to use `Application.isProduction` instead of manually checking `process.env.NODE_ENV`.
- **Missing**: Path getters like `Application.appPath()` or `Application.storagePath()` are vital for service-level code but are completely undocumented as part of the Foundation.

### 2. Manifest Manager (Resolved: Internal)
The `manifestManager` instance is a critical infrastructure component that manages background command metadata and persistence. 
- **Decision**: Per CTO clarification, this is an **Internal Engine API** and is not intended for public developer exposure. Silence is the correct and desired state here.

### 3. Bootstrap Logic
While `createHttpApplication` is documented, the lower-level `bootstrap()` and `displayEnvironmentMode()` functions are omitted. Given they are used in the default entry point of any Warlock app, a brief technical explanation in "Advanced" or "Internal Life Cycle" could be beneficial, though not critical.

---

## Action Plan (Foundation)
- [ ] Create "Foundation" guide or add to "Core Concepts" a technical section for the `Application` utility.
- [ ] Document `Application` path getters (can be merged with `utils/paths` documentation).
- [ ] Create a technical reference for `ManifestManager` under an "Internal" or "Advanced" category.
