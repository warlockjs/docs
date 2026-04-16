# @warlock.js/cascade — Documentation Audit Index

**Status:** 🏗 Audit in Progress
**Objective:** Perform a 100% signature-to-documentation comparison for the Cascade ORM to identify "Silent APIs" and driver-specific documentation gaps.

## Audit Summary

| Component | Status | Gap Level | Summary of Gaps |
| :--- | :--- | :--- | :--- |
| **Drivers & Connectivity** | `[ ]` | -- | -- |
| **Model Lifecycle** | `[ ]` | -- | -- |
| **Advanced Model Features** | `[ ]` | -- | -- |
| **Query Engine & Aggs** | `[ ]` | -- | -- |
| **Relationships** | `[ ]` | -- | -- |
| **Migrations** | `[ ]` | -- | -- |
| **Sync Engine** | `[ ]` | -- | -- |
| **Validation Integration** | `[ ]` | -- | -- |

---

## Detailed Reports

1. [Drivers & Connectivity](./cascade/drivers.md)
2. [Model Lifecycle](./cascade/models.md)
3. [Advanced Features](./cascade/advanced.md)
4. [Queries & Aggregates](./cascade/queries.md)
5. [Relationships](./cascade/relationships.md)
6. [Migrations](./cascade/migrations.md)
7. [Sync Engine](./cascade/sync.md)
8. [Validation & Plugins](./cascade/validation.md)

---

## Technical Observations (Cascade Level)
- **Driver Parity**: Ensuring docs reflect what's possible in MongoDB (sessions/aggregation) vs Postgres (standard SQL).
- **The "Sync" Mystery**: Cross-referencing `SyncManager` signatures against public APIs—identifying if "Model Sync" is a first-class feature or an internal orchestration piece.
- **Aggregates Depth**: Verifying if all `$agg` expressions documented in Cascade inventory are explained in `docs/cascade/aggregate/`.
