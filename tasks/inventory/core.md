# @warlock.js/core — API Inventory

*The master index for the Warlock Core Framework API.*

## Overview
The core inventory is divided into specialized modules to ensure 100% coverage of signatures, types, and exported members.

## Sub-Inventories

| Component | Description | Inventory File |
| :--- | :--- | :--- |
| **Foundation** | Application lifecycle, runtime state, and bootstrapping. | [foundation.md](./core/foundation.md) |
| **Routing** | Route registration, grouping, and resource controllers. | [routing.md](./core/routing.md) |
| **HTTP System** | Request/Response objects, context, and file uploads. | [http.md](./core/http.md) |
| **Data Layer** | Resource transformations and response formatting. | [data.md](./core/data.md) |
| **Validation** | Schema-based validation and framework integration. | [validation.md](./core/validation.md) |
| **Infrastructure** | Connectors, CLI manager, and configuration systems. | [infrastructure.md](./core/infrastructure.md) |
| **Services** | Storage, Mail, Cache, Image, and Encryption services. | [services.md](./core/services.md) |
| **Utilities** | Helper functions, URL/Path resolving, and Benchmarking. | [utils.md](./core/utils.md) |
| **Dev & Build** | HMR engine, Dependency Graph, and Production Builder. | [dev-server.md](./core/dev-server.md) |

---

## Technical Standards
- **Mixed Visibility**: Public and protected members are documented together.
- **Strict Signatures**: No implementation logic; focus on parameters and return types.
- **Type Safety**: All exported types and interfaces are captured in their respective modules.
