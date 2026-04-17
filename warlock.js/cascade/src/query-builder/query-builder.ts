/**
 * Pure Query Builder Base Class
 *
 * Driver-agnostic operation recorder. All fluent methods push typed entries into
 * `operations[]`. No SQL, no driver references, no table property, no execution.
 *
 * ┌─────────────────────────────────────────────────┐
 * │  Usage contexts                                 │
 * │  (a) Subclassed — PG / Mongo / MySQL / …       │
 * │  (b) Instantiated directly (new QueryBuilder()) │
 * │      inside callbacks for:                      │
 * │      • nested where groups                      │
 * │      • joinWith constraints                     │
 * │      • whereExists / whereHas subqueries        │
 * └─────────────────────────────────────────────────┘
 *
 * Design rules:
 *  - `table` / alias are NOT here — the parser gets them from the executor.
 *  - `opIndex` is protected so subclasses can rebuild after direct mutation.
 *  - Op type names are stable — parsers switch on them; no renaming without
 *    a parser update.
 *  - OR-variants keep distinct op types (orWhere, orWhereColumn, …) so existing
 *    parsers that switch on type need no changes.
 *  - `joinWith` eagerly resolves callbacks → subOps at record time so the
 *    driver executor receives a plain data structure, not a live function.
 *
 * @module cascade/query-builder
 */

import type {
  GroupByInput,
  HavingInput,
  JoinOptions,
  OrderDirection,
  RawExpression,
  WhereCallback,
  WhereObject,
  WhereOperator,
} from "../contracts/query-builder.contract";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single recorded query operation.
 * `type` is the discriminator; `data` carries all parameters.
 */
export type Op = {
  readonly type: string;
  readonly data: Record<string, unknown>;
};

/**
 * Constraint value accepted by `joinWith()`.
 *
 * - `string`  → comma-separated column shorthand: `"id,name,createdAt"`
 * - `fn`      → callback receives a bare QueryBuilder to record sub-ops
 *
 * @example
 * joinWith({ actions: "id,status" })
 * joinWith({ actions: q => q.where("status", "pending").limit(5) })
 */
export type JoinWithConstraint = string | ((q: QueryBuilder) => void);

// ============================================================================
// QUERY BUILDER — CONCRETE, DIRECTLY INSTANTIABLE
// ============================================================================

/**
 * Pure, driver-agnostic query builder.
 *
 * Records operations in `operations[]`. Subclasses own execution, parsing, and
 * driver-specific clause generation. Safe to instantiate directly inside
 * callbacks where only operation recording is needed.
 *
 * @example
 * ```ts
 * // Driver subclass usage:
 * const users = await User.query()
 *   .select(["id", "name"])
 *   .where("status", "active")
 *   .where(q => q.where("role", "admin").orWhere("role", "mod"))
 *   .orderBy("createdAt", "desc")
 *   .limit(10)
 *   .get();
 *
 * // Direct instantiation (callback context — no driver needed):
 * joinWith({ actions: q => q.where("status", "pending").limit(5) });
 * // The sub-QB's operations[] are captured and stored in the joinWith op data.
 * ```
 */
export class QueryBuilder<T = unknown> {
  // ════════════════════════════════════════════════════════
  // OPERATION STORE
  // ════════════════════════════════════════════════════════

  /** Flat, ordered list of recorded operations. Public for parser access. */
  public operations: Op[] = [];

  /**
   * type → ordered list of indices into `operations[]`.
   *
   * Protected (not private) so:
   *  - `rebuildIndex()` can reset it after direct `operations[]` mutation.
   *  - Subclasses can inspect it without unsafe casts.
   *
   * External consumers should use `getOps(type)` instead.
   */
  protected opIndex: Map<string, number[]> = new Map();

  // ════════════════════════════════════════════════════════
  // SCOPE STATE  (injected by Model.query(), consumed before execution)
  // ════════════════════════════════════════════════════════

  /** Global scope definitions injected by Model.query(). Keyed by scope name. */
  public pendingGlobalScopes?: Map<string, any>;
  /** Local scope callbacks injected by Model.query(). Applied on demand via scope(). */
  public availableLocalScopes?: Map<string, (...args: any[]) => void>;
  /** Names of global scopes that have been intentionally disabled. */
  public disabledGlobalScopes: Set<string> = new Set();
  /** True once the driver subclass has applied pending scopes. */
  public scopesApplied = false;

  // ════════════════════════════════════════════════════════
  // RELATION STATE  (consumed by driver subclass at execute time)
  // ════════════════════════════════════════════════════════

  /** Relations to eager-load via separate queries. */
  public eagerLoadRelations: Map<string, boolean | ((query: any) => void)> = new Map();
  /** Relation names to count alongside results. */
  public countRelations: string[] = [];
  /** Relation definition map injected from the owning Model. */
  public relationDefinitions?: Record<string, any>;
  /** The Model class reference, required for relation resolution. */
  public modelClass?: any;

  // ════════════════════════════════════════════════════════
  // CORE INTERNALS
  // ════════════════════════════════════════════════════════

  /**
   * Append an operation to `operations[]` and update `opIndex`.
   * Every fluent method calls this.
   */
  protected addOperation(type: string, data: Record<string, unknown>): void {
    const idx = this.operations.length;
    this.operations.push({ type, data });
    const list = this.opIndex.get(type);
    if (list) {
      list.push(idx);
    } else {
      this.opIndex.set(type, [idx]);
    }
  }

  /**
   * Return all recorded operations of the specified types in original
   * insertion order.
   *
   * @example
   * builder.getOps("where", "orWhere", "whereIn")
   */
  public getOps(...types: string[]): Op[] {
    if (types.length === 1) {
      return (this.opIndex.get(types[0]) ?? []).map((i) => this.operations[i]);
    }
    const result: Array<{ idx: number; op: Op }> = [];
    for (const type of types) {
      for (const idx of this.opIndex.get(type) ?? []) {
        result.push({ idx, op: this.operations[idx] });
      }
    }
    return result.sort((a, b) => a.idx - b.idx).map((r) => r.op);
  }

  /**
   * Rebuild `opIndex` from scratch.
   *
   * Call this after any direct mutation of `this.operations[]` (e.g. scope
   * injection, joinWith consumption in the executor, clone post-processing).
   */
  public rebuildIndex(): void {
    this.opIndex = new Map();
    for (let i = 0; i < this.operations.length; i++) {
      const type = this.operations[i].type;
      const list = this.opIndex.get(type);
      if (list) {
        list.push(i);
      } else {
        this.opIndex.set(type, [i]);
      }
    }
  }

  /**
   * Factory for sub-QueryBuilders used inside callbacks.
   *
   * Override in driver subclasses to return a driver-typed instance, so that
   * driver-specific methods (e.g. `whereArrayContains`) are available inside
   * nested `where(q => ...)` / `whereHas` / `joinWith` callbacks.
   *
   * @example
   * // In PostgresQueryBuilder:
   * protected override subQuery(): QueryBuilder {
   *   return new PostgresQueryBuilder("__sub__", this.dataSource);
   * }
   */
  protected subQuery(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Shallow-clone this builder — copies operations, opIndex, and all shared state.
   *
   * Subclasses MUST call `super.clone()` and then copy their own fields
   * (dataSource, joinRelations, …).
   */
  public clone(): this {
    const cloned = Object.create(Object.getPrototypeOf(this)) as this;
    cloned.operations = [...this.operations];
    cloned.opIndex = new Map(Array.from(this.opIndex.entries()).map(([k, v]) => [k, [...v]]));
    cloned.pendingGlobalScopes = this.pendingGlobalScopes;
    cloned.availableLocalScopes = this.availableLocalScopes;
    cloned.disabledGlobalScopes = new Set(this.disabledGlobalScopes);
    cloned.scopesApplied = this.scopesApplied;
    cloned.eagerLoadRelations = new Map(this.eagerLoadRelations);
    cloned.countRelations = [...this.countRelations];
    cloned.relationDefinitions = this.relationDefinitions;
    cloned.modelClass = this.modelClass;
    return cloned;
  }

  // ════════════════════════════════════════════════════════
  // SCOPES
  // ════════════════════════════════════════════════════════

  /** Disable one or more named global scopes for this query. */
  public withoutGlobalScope(...scopeNames: string[]): this {
    scopeNames.forEach((name) => this.disabledGlobalScopes.add(name));
    return this;
  }

  /** Disable ALL pending global scopes for this query. */
  public withoutGlobalScopes(): this {
    this.pendingGlobalScopes?.forEach((_, name) => this.disabledGlobalScopes.add(name));
    return this;
  }

  /**
   * Apply a registered local scope by name.
   * @throws if no local scopes are available or the named scope is not found
   */
  public scope(scopeName: string, ...args: unknown[]): this {
    if (!this.availableLocalScopes) {
      throw new Error("No local scopes available on this query builder.");
    }
    const cb = this.availableLocalScopes.get(scopeName);
    if (!cb) throw new Error(`Local scope "${scopeName}" not found.`);
    cb(this, ...args);
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — CORE
  // ════════════════════════════════════════════════════════

  /**
   * Add a WHERE clause (AND).
   *
   * @example
   * q.where("status", "active")
   * q.where("age", ">", 18)
   * q.where({ role: "admin", active: true })
   * q.where(q => q.where("a", 1).orWhere("b", 2))
   */
  public where(field: string, value: unknown): this;
  public where(field: string, operator: WhereOperator, value: unknown): this;
  public where(conditions: WhereObject): this;
  public where(callback: WhereCallback<T>): this;
  public where(...args: unknown[]): this {
    if (args.length === 1 && typeof args[0] === "function") {
      const sub = this.subQuery();
      (args[0] as (q: QueryBuilder) => void)(sub);
      this.addOperation("where", { nested: sub.operations });
    } else if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      for (const [key, value] of Object.entries(args[0] as WhereObject)) {
        this.addOperation("where", { field: key, operator: "=", value });
      }
    } else if (args.length === 2) {
      this.addOperation("where", { field: args[0], operator: "=", value: args[1] });
    } else {
      this.addOperation("where", { field: args[0], operator: args[1], value: args[2] });
    }
    return this;
  }

  /**
   * Add an OR WHERE clause.
   *
   * @example
   * q.where("role", "admin").orWhere("role", "mod")
   */
  public orWhere(field: string, value: unknown): this;
  public orWhere(field: string, operator: WhereOperator, value: unknown): this;
  public orWhere(conditions: WhereObject): this;
  public orWhere(callback: WhereCallback<T>): this;
  public orWhere(...args: unknown[]): this {
    if (args.length === 1 && typeof args[0] === "function") {
      const sub = this.subQuery();
      (args[0] as (q: QueryBuilder) => void)(sub);
      this.addOperation("orWhere", { nested: sub.operations });
    } else if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      for (const [key, value] of Object.entries(args[0] as WhereObject)) {
        this.addOperation("orWhere", { field: key, operator: "=", value });
      }
    } else if (args.length === 2) {
      this.addOperation("orWhere", { field: args[0], operator: "=", value: args[1] });
    } else {
      this.addOperation("orWhere", { field: args[0], operator: args[1], value: args[2] });
    }
    return this;
  }

  /**
   * Raw WHERE expression in the target dialect (AND).
   *
   * @example
   * q.whereRaw("age > ? AND role = ?", [18, "admin"])           // SQL
   * q.whereRaw({ $expr: { $gt: ["$stock", "$reserved"] } })     // MongoDB
   */
  public whereRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("whereRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  /** Raw OR WHERE expression. */
  public orWhereRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("orWhereRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — COLUMN COMPARISONS
  // ════════════════════════════════════════════════════════

  /**
   * Compare two columns directly (AND).
   * @example q.whereColumn("stock", ">", "reserved")
   */
  public whereColumn(first: string, operator: WhereOperator, second: string): this {
    this.addOperation("whereColumn", { first, operator, second });
    return this;
  }

  /** Compare two columns directly (OR). */
  public orWhereColumn(first: string, operator: WhereOperator, second: string): this {
    this.addOperation("orWhereColumn", { first, operator, second });
    return this;
  }

  /** Compare multiple column pairs in one call. */
  public whereColumns(
    comparisons: Array<[left: string, operator: WhereOperator, right: string]>,
  ): this {
    for (const [left, operator, right] of comparisons) {
      this.whereColumn(left, operator, right);
    }
    return this;
  }

  /**
   * Field value must fall between two other column values.
   * Stored as a `whereBetween` op with `useColumns: true` so the SQL parser
   * knows to quote the values as identifiers rather than bind them.
   */
  public whereBetweenColumns(field: string, lowerColumn: string, upperColumn: string): this {
    this.addOperation("whereBetween", { field, lowerColumn, upperColumn, useColumns: true });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — STANDARD COMPARISON OPERATORS
  // ════════════════════════════════════════════════════════

  /** WHERE field IN values. */
  public whereIn(field: string, values: unknown[]): this {
    this.addOperation("whereIn", { field, values });
    return this;
  }

  /** WHERE field NOT IN values. */
  public whereNotIn(field: string, values: unknown[]): this {
    this.addOperation("whereNotIn", { field, values });
    return this;
  }

  /** WHERE field IS NULL. */
  public whereNull(field: string): this {
    this.addOperation("whereNull", { field });
    return this;
  }

  /** WHERE field IS NOT NULL. */
  public whereNotNull(field: string): this {
    this.addOperation("whereNotNull", { field });
    return this;
  }

  /** WHERE field BETWEEN low AND high. */
  public whereBetween(field: string, range: [unknown, unknown]): this {
    this.addOperation("whereBetween", { field, range });
    return this;
  }

  /** WHERE field NOT BETWEEN low AND high. */
  public whereNotBetween(field: string, range: [unknown, unknown]): this {
    this.addOperation("whereNotBetween", { field, range });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — PATTERN MATCHING
  // ════════════════════════════════════════════════════════

  /**
   * LIKE pattern match (AND).
   * @example q.whereLike("email", "%@gmail.com")
   */
  public whereLike(field: string, pattern: RegExp | string): this {
    const patternStr = pattern instanceof RegExp ? pattern.source : pattern;
    this.addOperation("whereLike", { field, pattern: patternStr });
    return this;
  }

  /** NOT LIKE pattern match. */
  public whereNotLike(field: string, pattern: RegExp | string): this {
    const patternStr = pattern instanceof RegExp ? pattern.source : pattern;
    this.addOperation("whereNotLike", { field, pattern: patternStr });
    return this;
  }

  /** Starts with a prefix. */
  public whereStartsWith(field: string, value: string | number): this {
    return this.whereLike(field, `${value}%`);
  }

  /** Does NOT start with a prefix. */
  public whereNotStartsWith(field: string, value: string | number): this {
    return this.whereNotLike(field, `${value}%`);
  }

  /** Ends with a suffix. */
  public whereEndsWith(field: string, value: string | number): this {
    return this.whereLike(field, `%${value}`);
  }

  /** Does NOT end with a suffix. */
  public whereNotEndsWith(field: string, value: string | number): this {
    return this.whereNotLike(field, `%${value}`);
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — DATE/TIME PARTIALS
  // ════════════════════════════════════════════════════════

  /**
   * Match on date portion only (time ignored).
   * @example q.whereDate("createdAt", "2024-05-01")
   */
  public whereDate(field: string, value: Date | string): this {
    this.addOperation("whereDate", { field, value });
    return this;
  }

  /** Alias for whereDate. */
  public whereDateEquals(field: string, value: Date | string): this {
    return this.whereDate(field, value);
  }

  /** Field date is before value. */
  public whereDateBefore(field: string, value: Date | string): this {
    this.addOperation("whereDateBefore", { field, value });
    return this;
  }

  /** Field date is after value. */
  public whereDateAfter(field: string, value: Date | string): this {
    this.addOperation("whereDateAfter", { field, value });
    return this;
  }

  /** Field date is within a range [from, to]. */
  public whereDateBetween(field: string, range: [Date | string, Date | string]): this {
    this.addOperation("whereDateBetween", { field, range });
    return this;
  }

  /** Field date is NOT within a range. */
  public whereDateNotBetween(field: string, range: [Date | string, Date | string]): this {
    this.addOperation("whereNotBetween", { field, range });
    return this;
  }

  /**
   * Match on the time portion of a datetime field.
   * Emits a `whereRaw` op with a driver-agnostic marker; the driver parser
   * rewrites it to the appropriate SQL (`TIME(field) = ?`) or Mongo expression.
   */
  public whereTime(field: string, value: string): this {
    this.addOperation("whereRaw", {
      expression: `TIME(${field}) = ?`,
      bindings: [value],
    });
    return this;
  }

  /**
   * Day-of-month from a date field (1–31).
   * Uses a `whereRaw` op so SQL parsers get the `EXTRACT` expression directly.
   * MongoDB drivers override to emit `$dayOfMonth`.
   */
  public whereDay(field: string, value: number): this {
    this.addOperation("whereRaw", {
      expression: `EXTRACT(DAY FROM ${field}) = ?`,
      bindings: [value],
    });
    return this;
  }

  /** Month extracted from a date field (1–12). */
  public whereMonth(field: string, value: number): this {
    this.addOperation("whereRaw", {
      expression: `EXTRACT(MONTH FROM ${field}) = ?`,
      bindings: [value],
    });
    return this;
  }

  /** Year extracted from a date field. */
  public whereYear(field: string, value: number): this {
    this.addOperation("whereRaw", {
      expression: `EXTRACT(YEAR FROM ${field}) = ?`,
      bindings: [value],
    });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — JSON / STRUCTURED DATA
  // ════════════════════════════════════════════════════════

  /**
   * JSON/array path contains the given value.
   * @example q.whereJsonContains("tags", "typescript")
   */
  public whereJsonContains(path: string, value: unknown): this {
    this.addOperation("whereJsonContains", { path, value });
    return this;
  }

  /** JSON/array path does NOT contain the value. */
  public whereJsonDoesntContain(path: string, value: unknown): this {
    this.addOperation("whereJsonDoesntContain", { path, value });
    return this;
  }

  /**
   * JSON path key exists.
   * Uses a `whereRaw` so existing SQL parsers get `IS NOT NULL` immediately.
   */
  public whereJsonContainsKey(path: string): this {
    this.addOperation("whereRaw", { expression: `${path} IS NOT NULL`, bindings: [] });
    return this;
  }

  /**
   * Constrain the length of a JSON array at a path.
   * @example q.whereJsonLength("tags", ">", 3)
   */
  public whereJsonLength(path: string, operator: WhereOperator, value: number): this {
    this.addOperation("whereRaw", {
      expression: `jsonb_array_length(${path}) ${operator} ?`,
      bindings: [value],
    });
    return this;
  }

  /** JSON path must resolve to an array. */
  public whereJsonIsArray(path: string): this {
    this.addOperation("whereRaw", {
      expression: `jsonb_typeof(${path}) = 'array'`,
      bindings: [],
    });
    return this;
  }

  /** JSON path must resolve to an object. */
  public whereJsonIsObject(path: string): this {
    this.addOperation("whereRaw", {
      expression: `jsonb_typeof(${path}) = 'object'`,
      bindings: [],
    });
    return this;
  }

  /**
   * Constrain the number of elements in an array field.
   * @example q.whereArrayLength("roles", ">=", 2)
   */
  public whereArrayLength(field: string, operator: WhereOperator, value: number): this {
    this.addOperation("whereRaw", {
      expression: `array_length(${field}, 1) ${operator} ?`,
      bindings: [value],
    });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — CONVENIENCE SHORTCUTS
  // ════════════════════════════════════════════════════════

  /** WHERE id = value. */
  public whereId(value: string | number): this {
    return this.where("id", value);
  }

  /** WHERE id IN values. */
  public whereIds(values: Array<string | number>): this {
    return this.whereIn("id", values);
  }

  /** WHERE uuid = value. */
  public whereUuid(value: string): this {
    return this.where("uuid", value);
  }

  /** WHERE ulid = value. */
  public whereUlid(value: string): this {
    return this.where("ulid", value);
  }

  /**
   * Full-text search across one or more fields.
   * @example q.whereFullText(["title", "body"], "typescript")
   */
  public whereFullText(fields: string | string[], query: string): this {
    this.addOperation("whereFullText", {
      fields: Array.isArray(fields) ? fields : [fields],
      query,
    });
    return this;
  }

  /** Full-text search (OR). */
  public orWhereFullText(fields: string | string[], query: string): this {
    return this.whereFullText(fields, query);
  }

  /** Alias for whereFullText with a single field. */
  public whereSearch(field: string, query: string): this {
    return this.whereFullText([field], query);
  }

  /**
   * Text search with optional extra equality filters.
   * MongoDB-style convenience shorthand.
   */
  public textSearch(query: string, filters?: WhereObject): this {
    if (filters) {
      for (const [key, value] of Object.entries(filters)) this.where(key, value as never);
    }
    return this;
  }

  // ════════════════════════════════════════════════════════
  // WHERE CLAUSES — EXISTENCE / SUBQUERIES
  // ════════════════════════════════════════════════════════

  /**
   * WHERE EXISTS (subquery callback) or field IS NOT NULL (string).
   *
   * @example
   * q.whereExists(sub => sub.where("userId", "users.id"))
   * q.whereExists("optionalField")
   */
  public whereExists(field: string): this;
  public whereExists(callback: WhereCallback<T>): this;
  public whereExists(param: string | WhereCallback<T>): this {
    if (typeof param === "function") {
      const sub = this.subQuery();
      param(sub as any);
      this.addOperation("whereExists", { subquery: sub.operations });
    } else {
      this.addOperation("whereNotNull", { field: param });
    }
    return this;
  }

  /**
   * WHERE NOT EXISTS (subquery callback) or field IS NULL (string).
   */
  public whereNotExists(field: string): this;
  public whereNotExists(callback: WhereCallback<T>): this;
  public whereNotExists(param: string | WhereCallback<T>): this {
    if (typeof param === "function") {
      const sub = this.subQuery();
      param(sub as any);
      this.addOperation("whereNotExists", { subquery: sub.operations });
    } else {
      this.addOperation("whereNull", { field: param });
    }
    return this;
  }

  /**
   * Constrain an array/collection field by element count.
   *
   * @example
   * q.whereSize("tags", 3)         // exactly 3
   * q.whereSize("tags", ">=", 1)   // at least 1
   */
  public whereSize(field: string, size: number): this;
  public whereSize(field: string, operator: WhereOperator, size: number): this;
  public whereSize(field: string, ...args: unknown[]): this {
    const operator = args.length === 2 ? (args[0] as WhereOperator) : "=";
    const size = (args.length === 2 ? args[1] : args[0]) as number;
    return this.whereArrayLength(field, operator, size);
  }

  /**
   * AND NOT wrapper — negate a nested group.
   * @example q.whereNot(q => q.where("status", "banned").where("role", "user"))
   */
  public whereNot(callback: WhereCallback<T>): this {
    const sub = this.subQuery();
    callback(sub as any);
    this.addOperation("whereNot", { nested: sub.operations });
    return this;
  }

  /** OR NOT wrapper. */
  public orWhereNot(callback: WhereCallback<T>): this {
    const sub = this.subQuery();
    callback(sub as any);
    this.addOperation("orWhereNot", { nested: sub.operations });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // JOINS — STANDARD SQL-STYLE
  // Note: Op type names match parser switch cases exactly.
  //   join / innerJoin → INNER JOIN
  //   leftJoin → LEFT JOIN
  //   rightJoin → RIGHT JOIN
  //   fullJoin → FULL OUTER JOIN
  //   crossJoin → CROSS JOIN
  //   joinRaw → raw expression
  // ════════════════════════════════════════════════════════

  /**
   * INNER JOIN.
   * @example q.join("categories", "posts.categoryId", "categories.id")
   */
  public join(table: string, localField: string, foreignField: string): this;
  public join(options: JoinOptions): this;
  public join(...args: unknown[]): this {
    if (args.length === 3) {
      this.addOperation("join", { table: args[0], localField: args[1], foreignField: args[2] });
    } else {
      this.addOperation("join", args[0] as Record<string, unknown>);
    }
    return this;
  }

  /** LEFT JOIN. */
  public leftJoin(table: string, localField: string, foreignField: string): this;
  public leftJoin(options: JoinOptions): this;
  public leftJoin(...args: unknown[]): this {
    if (args.length === 3) {
      this.addOperation("leftJoin", { table: args[0], localField: args[1], foreignField: args[2] });
    } else {
      this.addOperation("leftJoin", args[0] as Record<string, unknown>);
    }
    return this;
  }

  /** RIGHT JOIN. */
  public rightJoin(table: string, localField: string, foreignField: string): this;
  public rightJoin(options: JoinOptions): this;
  public rightJoin(...args: unknown[]): this {
    if (args.length === 3) {
      this.addOperation("rightJoin", {
        table: args[0],
        localField: args[1],
        foreignField: args[2],
      });
    } else {
      this.addOperation("rightJoin", args[0] as Record<string, unknown>);
    }
    return this;
  }

  /** INNER JOIN (alias for join). */
  public innerJoin(table: string, localField: string, foreignField: string): this;
  public innerJoin(options: JoinOptions): this;
  public innerJoin(...args: unknown[]): this {
    if (args.length === 3) {
      this.addOperation("innerJoin", {
        table: args[0],
        localField: args[1],
        foreignField: args[2],
      });
    } else {
      this.addOperation("innerJoin", args[0] as Record<string, unknown>);
    }
    return this;
  }

  /** FULL OUTER JOIN. */
  public fullJoin(table: string, localField: string, foreignField: string): this;
  public fullJoin(options: JoinOptions): this;
  public fullJoin(...args: unknown[]): this {
    if (args.length === 3) {
      this.addOperation("fullJoin", { table: args[0], localField: args[1], foreignField: args[2] });
    } else {
      this.addOperation("fullJoin", args[0] as Record<string, unknown>);
    }
    return this;
  }

  /** CROSS JOIN. */
  public crossJoin(table: string): this {
    this.addOperation("crossJoin", { table });
    return this;
  }

  /** Raw JOIN expression. Driver responsible for handling. */
  public joinRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("joinRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // RELATION EAGER LOADING — JOIN-BASED (joinWith)
  // ════════════════════════════════════════════════════════

  /**
   * Eager-load named relations via a single JOIN / $lookup query.
   *
   * Constraints are eagerly resolved at call time:
   *  - Callbacks are invoked immediately → `subOps` stored in op data.
   *  - Column shorthands are parsed into a `columns[]` array.
   *
   * The driver executor reads the `joinWith` op and uses the resolved data
   * alongside its own relation definition map to emit the appropriate SQL JOIN
   * or MongoDB $lookup stage.
   *
   * Supported arg forms (may be mixed):
   *   - `"author"` / `["author", "category"]` — no constraint
   *   - `{ author: "id,name" }` — column shorthand
   *   - `{ actions: q => q.where("status","pending").limit(5) }` — callback
   *
   * @example
   * Post.joinWith("author", "category")
   * ChatMessage.joinWith({ actions: q => q.where("status", "pending").limit(5) })
   * ChatMessage.joinWith({ org: "id,name", actions: q => q.orderBy("sort_order") })
   */
  public joinWith(...args: unknown[]): this {
    const resolved: Record<string, { columns?: string[]; subOps?: Op[] }> = {};

    for (const arg of args) {
      if (typeof arg === "string") {
        resolved[arg] = {};
      } else if (Array.isArray(arg)) {
        for (const rel of arg as string[]) resolved[rel] = {};
      } else if (typeof arg === "object" && arg !== null) {
        for (const [rel, constraint] of Object.entries(arg as Record<string, JoinWithConstraint>)) {
          if (typeof constraint === "function") {
            const sub = this.subQuery();
            constraint(sub);
            resolved[rel] = { subOps: sub.operations };
          } else if (typeof constraint === "string" && constraint !== "") {
            resolved[rel] = {
              columns: constraint
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            };
          } else {
            resolved[rel] = {};
          }
        }
      }
    }

    this.addOperation("joinWith", { resolved });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // RELATION EAGER LOADING — SEPARATE QUERIES (with)
  // ════════════════════════════════════════════════════════

  /**
   * Eager-load relations via separate queries (N+1 avoided by batching).
   *
   * @example
   * q.with("posts")
   * q.with("posts", q => q.where("published", true))
   * q.with({ posts: true, comments: q => q.limit(5) })
   */
  public with(
    ...args: (string | Record<string, boolean | ((q: any) => void)> | ((q: any) => void))[]
  ): this {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === "string") {
        const next = args[i + 1];
        if (typeof next === "function") {
          this.eagerLoadRelations.set(arg, next as (q: any) => void);
          i++;
        } else {
          this.eagerLoadRelations.set(arg, true);
        }
      } else if (typeof arg === "object" && arg !== null) {
        for (const [key, value] of Object.entries(
          arg as Record<string, boolean | ((q: any) => void)>,
        )) {
          this.eagerLoadRelations.set(key, value);
        }
      }
    }
    return this;
  }

  /** Count related models alongside results. */
  public withCount(...relations: string[]): this {
    this.countRelations.push(...relations);
    return this;
  }

  /**
   * Filter to rows that have at least one related record.
   * @example q.has("comments")
   * @example q.has("comments", ">=", 3)
   */
  public has(relation: string, operator?: WhereOperator, count?: number): this {
    this.addOperation("has", { relation, operator: operator ?? ">=", count: count ?? 1 });
    return this;
  }

  /**
   * Filter to rows with related records matching a sub-query (AND).
   * @example q.whereHas("comments", q => q.where("approved", true))
   */
  public whereHas(relation: string, callback: (q: any) => void): this {
    const sub = this.subQuery();
    callback(sub);
    this.addOperation("whereHas", { relation, subquery: sub.operations });
    return this;
  }

  /** Same as whereHas but OR-joined. */
  public orWhereHas(relation: string, callback: (q: any) => void): this {
    const sub = this.subQuery();
    callback(sub);
    this.addOperation("orWhereHas", { relation, subquery: sub.operations });
    return this;
  }

  /** Filter to rows with NO related records. */
  public doesntHave(relation: string): this {
    this.addOperation("doesntHave", { relation });
    return this;
  }

  /** Filter to rows with NO related records matching conditions. */
  public whereDoesntHave(relation: string, callback: (q: any) => void): this {
    const sub = this.subQuery();
    callback(sub);
    this.addOperation("whereDoesntHave", { relation, subquery: sub.operations });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // SELECT / PROJECTION
  // ════════════════════════════════════════════════════════

  /**
   * Select specific columns.
   *
   * @example
   * q.select(["id", "name"])
   * q.select("id", "name")
   * q.select({ name: 1, password: 0 })   // MongoDB-style projection
   */
  public select(fields: string[]): this;
  public select(fields: Record<string, 0 | 1 | boolean>): this;
  public select(...fields: Array<string | string[]>): this;
  public select(...args: unknown[]): this {
    if (args.length === 1 && Array.isArray(args[0])) {
      this.addOperation("select", { fields: args[0] });
    } else if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
      this.addOperation("select", { fields: args[0] as Record<string, unknown> });
    } else {
      this.addOperation("select", { fields: (args as Array<string | string[]>).flat() });
    }
    return this;
  }

  /** Select a field under an alias. @example q.selectAs("fullName", "name") */
  public selectAs(field: string, alias: string): this {
    this.addOperation("select", { fields: { [field]: alias } });
    return this;
  }

  /**
   * Raw SELECT expression.
   * @example q.selectRaw("COUNT(*) AS total")
   */
  public selectRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("selectRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  /** Multiple raw SELECT expressions in one call. */
  public selectRawMany(
    definitions: Array<{ alias: string; expression: RawExpression; bindings?: unknown[] }>,
  ): this {
    for (const def of definitions) {
      this.selectRaw({ [def.alias]: def.expression }, def.bindings);
    }
    return this;
  }

  /** Subquery as a named projected field. */
  public selectSub(expression: RawExpression, alias: string): this {
    this.addOperation("selectRaw", { expression: { [alias]: expression } });
    return this;
  }

  /** Alias for selectSub. */
  public addSelectSub(expression: RawExpression, alias: string): this {
    return this.selectSub(expression, alias);
  }

  /**
   * Aggregate function as a projected field.
   * @example q.selectAggregate("price", "sum", "totalRevenue")
   */
  public selectAggregate(
    field: string,
    aggregate: "sum" | "avg" | "min" | "max" | "count" | "first" | "last",
    alias: string,
  ): this {
    return this.selectRaw({ [alias]: `${aggregate.toUpperCase()}(${field})` });
  }

  /** Existence check as a projected boolean field. */
  public selectExists(field: string, alias: string): this {
    return this.selectRaw({ [alias]: `${field} IS NOT NULL` });
  }

  /** COUNT as a projected field. */
  public selectCount(field: string, alias: string): this {
    return this.selectAggregate(field, "count", alias);
  }

  /**
   * CASE / switch expression.
   * @example q.selectCase([{ when: "status = 1", then: "'active'" }], "'inactive'", "statusLabel")
   */
  public selectCase(
    cases: Array<{ when: RawExpression; then: RawExpression | unknown }>,
    otherwise: RawExpression | unknown,
    alias: string,
  ): this {
    const caseExpr = cases.map((c) => `WHEN ${c.when} THEN ${c.then}`).join(" ");
    return this.selectRaw({ [alias]: `CASE ${caseExpr} ELSE ${otherwise} END` });
  }

  /** IF/ELSE conditional field. */
  public selectWhen(
    condition: RawExpression,
    thenValue: RawExpression | unknown,
    elseValue: RawExpression | unknown,
    alias: string,
  ): this {
    return this.selectRaw({
      [alias]: `CASE WHEN ${condition} THEN ${thenValue} ELSE ${elseValue} END`,
    });
  }

  /**
   * Driver-native projection manipulation.
   * No-op in base — override in driver subclasses.
   */
  public selectDriverProjection(_callback: (projection: Record<string, unknown>) => void): this {
    return this;
  }

  /** JSON path extraction as a projected field. */
  public selectJson(path: string, alias?: string): this {
    const parts = path.split("->");
    const column = parts[0];
    const jsonPath = parts.slice(1).join("->");
    const expr = jsonPath ? `${column}->>'${jsonPath}'` : column;
    return alias ? this.selectAs(expr, alias) : this.selectRaw(expr);
  }

  /** JSON extraction via raw expression. */
  public selectJsonRaw(_path: string, expression: RawExpression, alias: string): this {
    return this.selectRaw({ [alias]: expression });
  }

  /** Exclude a JSON path from projection. */
  public deselectJson(path: string): this {
    return this.deselect([path]);
  }

  /** String concatenation as a projected field. */
  public selectConcat(fields: Array<string | RawExpression>, alias: string): this {
    return this.selectRaw({ [alias]: fields.join(" || ") });
  }

  /** COALESCE (first non-null) as a projected field. */
  public selectCoalesce(fields: Array<string | RawExpression>, alias: string): this {
    return this.selectRaw({ [alias]: `COALESCE(${fields.join(", ")})` });
  }

  /** Window function expression. */
  public selectWindow(spec: RawExpression): this {
    this.addOperation("selectRaw", { expression: spec });
    return this;
  }

  /** Exclude specific columns from results. */
  public deselect(fields: string[]): this {
    this.addOperation("deselect", { fields });
    return this;
  }

  /**
   * Remove all select operations (resets to wildcard).
   * Uses `rebuildIndex()` — no unsafe casts.
   */
  public clearSelect(): this {
    this.operations = this.operations.filter(
      (op) => !op.type.startsWith("select") && op.type !== "deselect",
    );
    this.rebuildIndex();
    return this;
  }

  /** Alias for clearSelect. */
  public selectAll(): this {
    return this.clearSelect();
  }

  /** Alias for clearSelect. */
  public selectDefault(): this {
    return this.clearSelect();
  }

  /** Append additional fields to existing selection. */
  public addSelect(fields: string[]): this {
    this.addOperation("select", { fields, add: true });
    return this;
  }

  /**
   * Record a DISTINCT flag (fluent — does not execute).
   * Subclasses expose a separate async `distinct(field)` execution method.
   */
  public distinctValues(fields?: string | string[]): this {
    const fieldList = fields ? (Array.isArray(fields) ? fields : [fields]) : [];
    this.addOperation("distinct", { fields: fieldList });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // ORDERING
  // ════════════════════════════════════════════════════════

  /**
   * ORDER BY a column.
   *
   * @example
   * q.orderBy("createdAt", "desc")
   * q.orderBy({ name: "asc", age: "desc" })
   */
  public orderBy(field: string, direction?: OrderDirection): this;
  public orderBy(fields: Record<string, OrderDirection>): this;
  public orderBy(...args: unknown[]): this {
    if (typeof args[0] === "string") {
      this.addOperation("orderBy", {
        field: args[0],
        direction: (args[1] as OrderDirection) ?? "asc",
      });
    } else {
      for (const [field, direction] of Object.entries(args[0] as Record<string, OrderDirection>)) {
        this.addOperation("orderBy", { field, direction });
      }
    }
    return this;
  }

  /** ORDER BY descending shorthand. */
  public orderByDesc(field: string): this {
    return this.orderBy(field, "desc");
  }

  /**
   * Raw ORDER BY expression.
   * @example q.orderByRaw("RANDOM()")
   * @example q.orderByRaw({ $meta: "textScore" })
   */
  public orderByRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("orderByRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  /**
   * Random order. Maps to `RANDOM()` in SQL or `$sample` in MongoDB.
   * @param limit - Optional limit (required for MongoDB $sample)
   */
  public orderByRandom(limit?: number): this {
    this.addOperation("orderByRaw", { expression: "RANDOM()" });
    if (limit !== undefined) this.limit(limit);
    return this;
  }

  /** Order ascending by a date column (oldest first). */
  public oldest(column = "createdAt"): this {
    return this.orderBy(column, "asc");
  }

  // ════════════════════════════════════════════════════════
  // LIMIT / OFFSET
  // ════════════════════════════════════════════════════════

  /** Limit number of results. */
  public limit(value: number): this {
    this.addOperation("limit", { value });
    return this;
  }

  /** Skip N results (OFFSET). */
  public skip(value: number): this {
    this.addOperation("offset", { value });
    return this;
  }

  /** Alias for skip. */
  public offset(value: number): this {
    return this.skip(value);
  }

  /** Alias for limit. */
  public take(value: number): this {
    return this.limit(value);
  }

  // ════════════════════════════════════════════════════════
  // GROUPING / AGGREGATION
  // ════════════════════════════════════════════════════════

  /**
   * GROUP BY clause.
   * @example q.groupBy("status")
   * @example q.groupBy(["year", "month"])
   */
  public groupBy(input: GroupByInput): this {
    const fields = Array.isArray(input) ? input : [input];
    this.addOperation("groupBy", { fields });
    return this;
  }

  /** Raw GROUP BY expression. */
  public groupByRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("groupBy", { expression, bindings: bindings ?? [] });
    return this;
  }

  /**
   * HAVING clause (post-group filter).
   *
   * @example
   * q.having("total", ">", 100)
   * q.having(["total", ">", 100])
   * q.having({ total: 100 })
   */
  public having(field: string, value: unknown): this;
  public having(field: string, operator: WhereOperator, value: unknown): this;
  public having(condition: HavingInput): this;
  public having(...args: unknown[]): this {
    if (args.length === 1) {
      const input = args[0] as HavingInput;
      if (Array.isArray(input)) {
        if (input.length === 2) {
          this.addOperation("having", { field: input[0], operator: "=", value: input[1] });
        } else {
          this.addOperation("having", { field: input[0], operator: input[1], value: input[2] });
        }
      } else {
        for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
          this.addOperation("having", { field: key, operator: "=", value });
        }
      }
    } else if (args.length === 2) {
      this.addOperation("having", { field: args[0], operator: "=", value: args[1] });
    } else {
      this.addOperation("having", { field: args[0], operator: args[1], value: args[2] });
    }
    return this;
  }

  /** Raw HAVING expression. */
  public havingRaw(expression: RawExpression, bindings?: unknown[]): this {
    this.addOperation("havingRaw", { expression, bindings: bindings ?? [] });
    return this;
  }

  // ════════════════════════════════════════════════════════
  // UTILITY / CONTROL FLOW
  // ════════════════════════════════════════════════════════

  /**
   * Side-effect tap — executes callback synchronously and returns `this`.
   * @example q.where(...).tap(q => console.log(q.operations.length)).limit(10)
   */
  public tap(callback: (builder: this) => void): this {
    callback(this);
    return this;
  }

  /**
   * Conditionally apply query modifications.
   *
   * @example
   * q.when(userId, (q, id) => q.where("userId", id))
   * q.when(isAdmin, q => q.withoutGlobalScopes(), q => q.scope("active"))
   */
  public when<V>(
    condition: V | boolean,
    callback: (builder: this, value: V) => void,
    otherwise?: (builder: this) => void,
  ): this {
    if (condition) {
      callback(this, condition as V);
    } else if (otherwise) {
      otherwise(this);
    }
    return this;
  }
}
