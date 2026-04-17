# query-builder

Houses the driver-agnostic `QueryBuilder` base class that records all fluent query operations as an ordered `Op[]` list for later consumption by a database-specific parser. The builder itself never executes anything; drivers extend or wrap it, read its operations via `getOps()`, and translate them into driver-specific queries. Over 100 fluent methods cover where clauses, joins, ordering, pagination, aggregation, JSON queries, relation loading, and scope management.

last-updated: 2026-04-17
updated-by: claude-sonnet-4-6

## Files

- [query-builder.md](./query-builder.md) — Op type, JoinWithConstraint union, and the QueryBuilder class with 100+ fluent query methods
