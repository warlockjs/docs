# @warlock.js/core — Documentation Audit Index

**Status:** ✅ Audit Completed
**Objective:** Compare 100% of signatures in `@warlock.js/core` inventory against existing documentation to identify "Silent APIs" and legacy v3 patterns.

## Audit Summary

| Component | Status | Gap Level | Summary of Gaps |
| :--- | :--- | :--- | :--- |
| **Foundation** | ✅ | 🔴 Critical | Application State, ManifestManager (Total Blackout) |
| **Routing** | ✅ | 🟡 Mid | API Proxies, RouteBuilder Nesting |
| **HTTP System** | ✅ | 🟡 Mid | Request Context helpers (useRequest), SSE/Streaming |
| **Data Layer** | ✅ | 🟡 Mid | Vector Search (similarTo), Upserts (updateOrCreate) |
| **Validation** | ✅ | 🟢 Low | Localized Validation Plugin |
| **Infrastructure** | ✅ | 🟡 Mid | CLI Engine Extensibility (Custom Commands) |
| **Services** | ✅ | 🔴 Critical | UseCase Engine, Advanced Image Transformations |
| **Utilities** | ✅ | 🟡 Mid | Extensive String/Object/Array library re-exports |
| **Dev Server** | ✅ | 🟡 Mid | HMR internals (Dependency Graph, Registry) |

---

## Detailed Reports

1. [Foundation Audit](./core/foundation.md)
2. [Routing Audit](./core/routing.md)
3. [HTTP Audit](./core/http.md)
4. [Data Audit](./core/data.md)
5. [Validation Audit](./core/validation.md)
6. [Infrastructure Audit](./core/infrastructure.md)
7. [Services Audit](./core/services.md)
8. [Utils Audit](./core/utils.md)
9. [Dev-Server Audit](./core/dev-server.md)

---

## Technical Observations (Executive Level)
- **The "Black Box" Engine**: Core infrastructure like the `UseCase` engine and `CLI` extensibility are completely silent. This hinders senior developers from adding framework-level features.
- **Async Context Gap**: The `RequestContext` system (AsyncLocalStorage) is a powerful v4 feature but has 0% documentation in the HTTP guides.
- **Image Processing Depths**: While basic resizing is covered, 80% of the Sharp-wrapped fluent API for images is undocumented.
- **Utility Blindness**: A massive library of string/object/array helpers is available but undocumented, leading to redundant third-party dependencies.

**Next Phase**: Implement documentation fixes for "Critical" and "Mid" gaps.
