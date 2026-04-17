/**
 * PostgreSQL Query Builder
 *
 * Extends the pure QueryBuilder base with PostgreSQL-specific execution,
 * SQL generation, relation hydration, and scope management.
 *
 * @module cascade/drivers/postgres
 */

import type { GenericObject } from "@mongez/reinforcements";
import type {
  ChunkCallback,
  CursorPaginationOptions,
  CursorPaginationResult,
  DriverQuery,
  PaginationOptions,
  PaginationResult,
  QueryBuilderContract,
} from "../../contracts/query-builder.contract";
import type { DataSource } from "../../data-source/data-source";
import { dataSourceRegistry } from "../../data-source/data-source-registry";
import type { GlobalScopeDefinition } from "../../model/model";
import { getModelFromRegistry, resolveModelClass } from "../../model/register-model";
import { QueryBuilder, type Op } from "../../query-builder/query-builder";
import type { PostgresDriver } from "./postgres-driver";
import { PostgresQueryParser, type PostgresParserOperation } from "./postgres-query-parser";

// ============================================================================
// HELPER
// ============================================================================

/**
 * Cast an Op[] to PostgresParserOperation[] — the shapes are compatible since
 * both have `type: string` and `data: Record<string, unknown>`.
 */
function toParserOps(ops: Op[]): PostgresParserOperation[] {
  return ops as unknown as PostgresParserOperation[];
}

// ============================================================================
// JOIN RELATIONS MAP TYPE
// ============================================================================

type JoinRelationConfig = {
  alias: string;
  type: "belongsTo" | "hasOne" | "hasMany";
  model?: unknown;
  localKey?: string;
  foreignKey?: string;
  ownerKey?: string;
  parentPath?: string | null;
  relationName?: string;
  parentModel?: unknown;
  select?: string[];
  /** Operations recorded by a joinWith constraint callback. */
  constraintOps?: Op[];
};

// ============================================================================
// POSTGRES QUERY BUILDER
// ============================================================================

/**
 * PostgreSQL Query Builder.
 *
 * Collects query operations (via the base class) and delegates SQL generation
 * to `PostgresQueryParser`. Owns execution, hydration, and relation loading.
 *
 * @example
 * ```typescript
 * const users = await User.query()
 *   .select(["id", "name", "email"])
 *   .where("status", "active")
 *   .orderBy("createdAt", "desc")
 *   .limit(10)
 *   .get();
 * ```
 */
export class PostgresQueryBuilder<T = unknown>
  extends QueryBuilder<T>
  implements QueryBuilderContract<T>
{
  // ──────────────────────────────────────────────────────────────
  // POSTGRES-SPECIFIC STATE
  // ──────────────────────────────────────────────────────────────

  /** Data source backing this builder. */
  public readonly dataSource: DataSource;

  /** Hydration callback for transforming result rows into model instances. */
  public hydrateCallback?: (data: unknown, index: number) => unknown;

  /** Invoked before query execution. */
  private fetchingCallback?: (query: this) => void | Promise<void>;

  /** Invoked after fetch but before hydration. */
  private hydratingCallback?: (records: unknown[], context: unknown) => void | Promise<void>;

  /** Invoked after fetch and hydration. */
  private fetchedCallback?: (records: unknown[], context: unknown) => void | Promise<void>;

  /**
   * Map of relations registered via `joinWith()`.
   * Keyed by dot-notation path (e.g. "organizationAiModel.aiModel").
   */
  public joinRelations = new Map<string, JoinRelationConfig>();

  // ──────────────────────────────────────────────────────────────
  // CONSTRUCTOR
  // ──────────────────────────────────────────────────────────────

  /**
   * @param table - Target table name
   * @param dataSource - Optional (uses default data source from registry if omitted)
   */
  public constructor(
    public readonly table: string,
    dataSource?: DataSource,
  ) {
    super();
    this.dataSource = dataSource ?? dataSourceRegistry.get()!;
  }

  // ──────────────────────────────────────────────────────────────
  // DRIVER
  // ──────────────────────────────────────────────────────────────

  private get driver(): PostgresDriver {
    return this.dataSource.driver as PostgresDriver;
  }

  // ──────────────────────────────────────────────────────────────
  // CLONE
  // ──────────────────────────────────────────────────────────────

  public clone(): this {
    const cloned = new PostgresQueryBuilder<T>(this.table, this.dataSource) as this;

    // Copy base-class state
    cloned.operations = [...this.operations];
    cloned.pendingGlobalScopes = this.pendingGlobalScopes;
    cloned.availableLocalScopes = this.availableLocalScopes;
    cloned.disabledGlobalScopes = new Set(this.disabledGlobalScopes);
    cloned.scopesApplied = this.scopesApplied;
    cloned.eagerLoadRelations = new Map(this.eagerLoadRelations);
    cloned.countRelations = [...this.countRelations];
    cloned.relationDefinitions = this.relationDefinitions;
    cloned.modelClass = this.modelClass;

    // Copy PG-specific state
    cloned.hydrateCallback = this.hydrateCallback;
    cloned.joinRelations = new Map(this.joinRelations);

    return cloned;
  }

  // ============================================================================
  // PG-SPECIFIC FLUENT METHODS
  // ============================================================================

  /**
   * Native-query escape hatch. Passes `operations[]` to the callback for
   * direct manipulation. Use sparingly — only when fluent API is insufficient.
   *
   * @example
   * q.raw(ops => ops.push({ type: "whereRaw", data: { expression: "1=1" } }))
   */
  public raw(callback: (operations: Op[]) => void): this {
    callback(this.operations);
    return this;
  }

  /**
   * Record a DISTINCT flag AND auto-select the field(s).
   * In PostgreSQL, DISTINCT ON (col) requires the col to appear in SELECT.
   *
   * @example
   * q.distinctValues("category")               // SELECT category … DISTINCT ON (category)
   * q.distinctValues(["category", "status"])   // both fields in DISTINCT ON and SELECT
   */
  public override distinctValues(fields?: string | string[]): this {
    // Record the base DISTINCT flag op
    super.distinctValues(fields);
    // Also add a select for the field(s) so they appear in the SELECT clause
    if (fields) {
      const fieldArr = Array.isArray(fields) ? fields : [fields];
      this.addOperation("select", { fields: fieldArr });
    }
    return this;
  }

  /**
   * Nearest-neighbour vector similarity search via pgvector cosine distance.
   *
   * Adds two operations atomically:
   * 1. `selectRaw` → `1 - (column <=> $n::vector) AS <alias>`
   *    Makes the similarity score available on every returned row.
   * 2. `orderByRaw` → `column <=> $n::vector`
   *    Tells the PostgreSQL query planner to use the IVFFlat/HNSW vector index.
   *    Using the alias in ORDER BY would bypass the index — the raw expression is required.
   *
   * @example
   * ```typescript
   * const results = await Vector.query()
   *   .where({ organization_id: "org-123", content_type: "summary" })
   *   .similarTo("embedding", queryEmbedding)
   *   .limit(5)
   *   .get<VectorRow & { score: number }>();
   * ```
   */
  public similarTo(column: string, embedding: number[], alias = "score"): this {
    // pgvector expects the literal format: [n,n,n,...]
    const literal = `[${embedding.join(",")}]`;
    const quotedCol = this.driver.dialect.quoteIdentifier(column);
    const quotedTable = this.driver.dialect.quoteIdentifier(this.table);

    // 0 — Preserve all table columns.
    //     Adding a selectRaw suppresses the parser's "SELECT *" fallback,
    //     so we must explicitly include table.* before the score expression.
    this.addOperation("selectRaw", {
      expression: `${quotedTable}.*`,
      bindings: [],
    });

    // 1 — Add similarity score to SELECT
    this.addOperation("selectRaw", {
      expression: `1 - (${quotedCol} <=> ?::vector) AS ${alias}`,
      bindings: [literal],
    });

    // 2 — ORDER BY the raw expression so the vector index is used
    this.addOperation("orderByRaw", {
      expression: `${quotedCol} <=> ?::vector`,
      bindings: [literal],
    });

    return this;
  }

  /** Set a hydration callback that transforms each result row. */
  public hydrate(callback: (data: unknown, index: number) => unknown): this {
    this.hydrateCallback = callback;
    return this;
  }

  /** Register a callback invoked before query execution. */
  public onFetching(callback: (query: this) => void | Promise<void>): () => void {
    this.fetchingCallback = callback;
    return () => {
      this.fetchingCallback = undefined;
    };
  }

  /** Register a callback invoked after fetch but before hydration. */
  public onHydrating(
    callback: (records: unknown[], context: unknown) => void | Promise<void>,
  ): () => void {
    this.hydratingCallback = callback;
    return () => {
      this.hydratingCallback = undefined;
    };
  }

  /** Register a callback invoked after fetch and hydration. */
  public onFetched(
    callback: (records: unknown[], context: unknown) => void | Promise<void>,
  ): () => void {
    this.fetchedCallback = callback;
    return () => {
      this.fetchedCallback = undefined;
    };
  }

  // ============================================================================
  // SCOPES
  // ============================================================================

  /** Apply pending global scopes to the operations list. */
  private applyPendingScopes(): void {
    if (!this.pendingGlobalScopes || this.scopesApplied) return;

    const beforeOps: Op[] = [];
    const afterOps: Op[] = [];

    for (const [name, { callback, timing }] of this.pendingGlobalScopes as Map<
      string,
      GlobalScopeDefinition
    >) {
      if (this.disabledGlobalScopes.has(name)) continue;

      const temp = new PostgresQueryBuilder(this.table, this.dataSource);
      callback(temp as unknown as QueryBuilderContract<T>);

      if (timing === "before") {
        beforeOps.push(...temp.operations);
      } else {
        afterOps.push(...temp.operations);
      }
    }

    this.operations = [...beforeOps, ...this.operations, ...afterOps];
    this.scopesApplied = true;
  }

  // ============================================================================
  // WHERE — POSTGRES-SPECIFIC (driver.dialect required)
  // ============================================================================

  /** Array field contains a value (or object with key). */
  public whereArrayContains(field: string, value: unknown, key?: string): this {
    const quotedField = this.driver.dialect.quoteIdentifier(field);
    if (key) {
      this.addOperation("whereRaw", {
        expression: `${quotedField} @> ?::jsonb`,
        bindings: [JSON.stringify([{ [key]: value }])],
      });
    } else {
      this.addOperation("whereRaw", {
        expression: `? = ANY(${quotedField})`,
        bindings: [value],
      });
    }
    return this;
  }

  /** Array field does NOT contain a value (or object with key). */
  public whereArrayNotContains(field: string, value: unknown, key?: string): this {
    const quotedField = this.driver.dialect.quoteIdentifier(field);
    if (key) {
      this.addOperation("whereRaw", {
        expression: `NOT (${quotedField} @> ?::jsonb)`,
        bindings: [JSON.stringify([{ [key]: value }])],
      });
    } else {
      this.addOperation("whereRaw", {
        expression: `NOT (? = ANY(${quotedField}))`,
        bindings: [value],
      });
    }
    return this;
  }

  /** Array field contains value OR is empty. */
  public whereArrayHasOrEmpty(field: string, value: unknown, key?: string): this {
    const quotedField = this.driver.dialect.quoteIdentifier(field);
    if (key) {
      this.addOperation("whereRaw", {
        expression: `(${quotedField} @> ?::jsonb OR ${quotedField} = '[]'::jsonb OR ${quotedField} IS NULL)`,
        bindings: [JSON.stringify([{ [key]: value }])],
      });
    } else {
      this.addOperation("whereRaw", {
        expression: `(? = ANY(${quotedField}) OR array_length(${quotedField}, 1) IS NULL)`,
        bindings: [value],
      });
    }
    return this;
  }

  /** Array field does NOT contain value OR is empty. */
  public whereArrayNotHaveOrEmpty(field: string, value: unknown, key?: string): this {
    const quotedField = this.driver.dialect.quoteIdentifier(field);
    if (key) {
      this.addOperation("whereRaw", {
        expression: `(NOT (${quotedField} @> ?::jsonb) OR ${quotedField} = '[]'::jsonb OR ${quotedField} IS NULL)`,
        bindings: [JSON.stringify([{ [key]: value }])],
      });
    } else {
      this.addOperation("whereRaw", {
        expression: `(NOT (? = ANY(${quotedField})) OR array_length(${quotedField}, 1) IS NULL)`,
        bindings: [value],
      });
    }
    return this;
  }

  // ============================================================================
  // joinWith — RESOLVE RELATION DEFINITIONS
  // ============================================================================

  /**
   * Load relations via SQL JOINs (single query) with optional per-relation constraints.
   *
   * Supports:
   * - `joinWith("author")` / `joinWith(["author", "category"])`
   * - `joinWith({ actions: q => q.where("status", "pending").limit(5) })`
   * - `joinWith({ organizationAiModel: "id,name", actions: q => q.orderBy("sort_order") })`
   *
   * @example
   * ChatMessage.joinWith({
   *   actions: q => q.where("status", "pending").orderBy("sort_order", "asc").limit(5),
   *   organizationAiModel: "id,createdAt",
   * })
   */
  public override joinWith(...args: unknown[]): this {
    // Normalise all args into an array of { path, constraint } pairs
    type Entry = { path: string; constraint?: string | ((q: QueryBuilder) => void) };
    const entries: Entry[] = [];

    for (const arg of args) {
      if (typeof arg === "string") {
        entries.push({ path: arg });
      } else if (Array.isArray(arg)) {
        for (const rel of arg as string[]) {
          entries.push({ path: rel });
        }
      } else if (typeof arg === "object" && arg !== null) {
        for (const [rel, val] of Object.entries(
          arg as Record<string, string | ((q: QueryBuilder) => void)>,
        )) {
          entries.push({ path: rel, constraint: val });
        }
      }
    }

    for (const { path, constraint } of entries) {
      // Parse each dot-notation path segment (supports "rel1.rel2" nesting)
      const segments = path.split(".");
      let currentModel: unknown = this.modelClass;
      let currentPath = "";

      for (let i = 0; i < segments.length; i++) {
        const rawSeg = segments[i];
        // String shorthand: "relName:col1,col2"
        const colonIdx = rawSeg.indexOf(":");
        const segName = colonIdx === -1 ? rawSeg : rawSeg.slice(0, colonIdx);
        const segColumns =
          colonIdx === -1
            ? undefined
            : rawSeg
                .slice(colonIdx + 1)
                .split(",")
                .filter(Boolean);

        currentPath = currentPath ? `${currentPath}.${segName}` : segName;

        // If already registered, update if new select columns given; advance model
        if (this.joinRelations.has(currentPath)) {
          const existing = this.joinRelations.get(currentPath)!;
          if (segColumns) existing.select = segColumns;

          // Apply constraint only on the deepest segment
          if (i === segments.length - 1 && constraint !== undefined) {
            existing.constraintOps = this._resolveConstraintOps(constraint);
          }

          currentModel =
            typeof existing.model === "string"
              ? getModelFromRegistry(existing.model as string)
              : existing.model;
          continue;
        }

        if (!this.relationDefinitions) continue;

        const def = (
          i === 0
            ? (this.relationDefinitions as Record<string, unknown>)
            : (currentModel as { relations?: Record<string, unknown> })?.relations
        )?.[segName] as Record<string, unknown> | undefined;

        if (!def) {
          throw new Error(
            `Relation "${segName}" not found on model ${(currentModel as { name?: string })?.name ?? "unknown"}`,
          );
        }

        // Resolve select columns: colon shorthand > constraint string > def.select
        let selectColumns: string[] | undefined =
          segColumns ?? (def.select as string[] | undefined);

        let constraintOps: Op[] | undefined;
        if (i === segments.length - 1 && constraint !== undefined) {
          if (typeof constraint === "string") {
            selectColumns = constraint.split(",").filter(Boolean);
          } else {
            constraintOps = this._resolveConstraintOps(constraint);
          }
        }

        const alias = currentPath.replace(/\./g, "_");

        this.joinRelations.set(currentPath, {
          alias,
          type: def.type as JoinRelationConfig["type"],
          model: def.model,
          localKey: def.localKey as string | undefined,
          foreignKey: def.foreignKey as string | undefined,
          ownerKey: def.ownerKey as string | undefined,
          parentPath: i > 0 ? currentPath.substring(0, currentPath.lastIndexOf(".")) : null,
          relationName: segName,
          parentModel: currentModel,
          select: selectColumns,
          constraintOps,
        });

        currentModel =
          typeof def.model === "string" ? getModelFromRegistry(def.model as string) : def.model;

        if (!currentModel) {
          throw new Error(`Relation model not found for "${segName}" in "${currentPath}"`);
        }
      }
    }

    return this;
  }

  /** Run a joinWith constraint callback against a sub-QB and capture its operations. */
  private _resolveConstraintOps(constraint: string | ((q: QueryBuilder) => void)): Op[] {
    if (typeof constraint === "string") return [];
    const sub = new PostgresQueryBuilder("__sub__", this.dataSource);
    constraint(sub);
    return sub.operations;
  }

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  /**
   * Execute the query and return all matching rows.
   */
  public async get<TResult = T>(): Promise<TResult[]> {
    this.applyPendingScopes();
    this._processJoinWithOps();
    this.applyJoinRelations();

    if (this.fetchingCallback) {
      await this.fetchingCallback(this);
    }

    const parser = new PostgresQueryParser({
      table: this.table,
      operations: toParserOps(this.operations),
    });

    const { query = "", bindings = [] } = parser.parse();

    try {
      const result = await this.driver.query<TResult>(query, bindings);
      let records = result.rows;

      const joinedData = this.extractJoinedRelationData(records);

      if (this.hydratingCallback) {
        await this.hydratingCallback(records as unknown[], {});
      }

      if (this.hydrateCallback) {
        records = records.map((row, index) => this.hydrateCallback!(row, index)) as TResult[];
      }

      this.attachJoinedRelations(records, joinedData);

      if (this.fetchedCallback) {
        await this.fetchedCallback(records as unknown[], {});
      }

      this.operations = [];
      return records;
    } catch (error) {
      console.log("Error while executing:", query, bindings);
      console.log("Query Builder Error:", error);
      throw error;
    }
  }

  /** Get first result. */
  public async first<TResult = T>(): Promise<TResult | null> {
    const results = await this.limit(1).get<TResult>();
    return results[0] ?? null;
  }

  /** Get last result (by id desc). */
  public async last<TResult = T>(): Promise<TResult | null> {
    const results = await this.orderByDesc("id").limit(1).get<TResult>();
    return results[0] ?? null;
  }

  /** Get random results. */
  public async random<TResult = T>(limit?: number): Promise<TResult[]> {
    this.orderByRaw("RANDOM()");
    if (limit) this.limit(limit);
    return this.get<TResult>();
  }

  /** Get first or throw. */
  public async firstOrFail<TResult = T>(): Promise<TResult> {
    const result = await this.first<TResult>();
    if (!result) throw new Error("No records found");
    return result;
  }

  /** Get first or call callback. */
  public async firstOr<TResult = T>(callback: () => TResult | Promise<TResult>): Promise<TResult> {
    const result = await this.first<TResult>();
    return result ?? (await callback());
  }

  /** Get first or return null. */
  public async firstOrNull<TResult = T>(): Promise<TResult | null> {
    return this.first<TResult>();
  }

  /** Get first or return default. */
  public async firstOrNew<TResult = T>(defaults: GenericObject): Promise<TResult> {
    const result = await this.first<TResult>();
    return result ?? (defaults as unknown as TResult);
  }

  /** Find by primary key. */
  public async find<TResult = T>(id: number | string): Promise<TResult | null> {
    return this.where("id", id).first<TResult>();
  }

  /** Count matching rows. */
  public async count(): Promise<number> {
    this.applyPendingScopes();
    const countOps: PostgresParserOperation[] = toParserOps([
      ...this.operations.filter((op) => op.type.includes("where") || op.type.includes("join")),
      { type: "selectRaw", data: { expression: 'COUNT(*) AS "count"' } },
    ]);

    const parser = new PostgresQueryParser({ table: this.table, operations: countOps });
    const { query = "", bindings = [] } = parser.parse();
    const result = await this.driver.query<{ count: string }>(query, bindings);
    return parseInt(result.rows[0]?.count ?? "0", 10);
  }

  /** SUM a numeric field. */
  public async sum(field: string): Promise<number> {
    this.applyPendingScopes();
    const result = await this.selectRaw(`SUM(${field}) as sum`).first<{ sum: string }>();
    return parseFloat(result?.sum ?? "0");
  }

  /** AVG of a numeric field. */
  public async avg(field: string): Promise<number> {
    this.applyPendingScopes();
    const result = await this.selectRaw(`AVG(${field}) as avg`).first<{ avg: string }>();
    return parseFloat(result?.avg ?? "0");
  }

  /** MIN of a numeric field. */
  public async min(field: string): Promise<number> {
    this.applyPendingScopes();
    const result = await this.selectRaw(`MIN(${field}) as min`).first<{ min: string }>();
    return parseFloat(result?.min ?? "0");
  }

  /** MAX of a numeric field. */
  public async max(field: string): Promise<number> {
    this.applyPendingScopes();
    const result = await this.selectRaw(`MAX(${field}) as max`).first<{ max: string }>();
    return parseFloat(result?.max ?? "0");
  }

  /** Get distinct values for a field. */
  public async distinct<TResult = unknown>(field: string): Promise<TResult[]> {
    this.distinctValues(field);
    const results = await this.get<{ [key: string]: TResult }>();
    return results.map((row) => row[field]);
  }

  /** Get array of all values for a single field. */
  public async pluck(field: string): Promise<unknown[]> {
    const results = await this.select([field]).get<Record<string, unknown>>();
    return results.map((row) => row[field]);
  }

  /** Get a single scalar value. */
  public async value<TResult = unknown>(field: string): Promise<TResult | null> {
    const result = await this.select([field]).first<Record<string, TResult>>();
    return result?.[field] ?? null;
  }

  /** Check whether any matching rows exist. */
  public async exists(): Promise<boolean> {
    const count = await this.limit(1).count();
    return count > 0;
  }

  /** Check whether NO matching rows exist. */
  public async notExists(): Promise<boolean> {
    return !(await this.exists());
  }

  /** COUNT DISTINCT a field. */
  public async countDistinct(field: string): Promise<number> {
    const result = await this.selectRaw(`COUNT(DISTINCT ${field}) as count`).first<{
      count: string;
    }>();
    return parseInt(result?.count ?? "0", 10);
  }

  // ─── Aggregation shortcuts via latest/oldest ─────────────────

  /** Get latest records ordered by a column. */
  public async latest(column = "createdAt"): Promise<T[]> {
    return this.orderBy(column, "desc").get();
  }

  // ─── Increment / Decrement ───────────────────────────────────

  /** Increment a numeric field. Returns new value. */
  public async increment(field: string, amount = 1): Promise<number> {
    this.applyPendingScopes();
    const { sql: filterSql, params: filterParams } = this.buildFilter();
    const updateSql =
      `UPDATE ${this.driver.dialect.quoteIdentifier(this.table)} ` +
      `SET ${this.driver.dialect.quoteIdentifier(field)} = COALESCE(${this.driver.dialect.quoteIdentifier(field)}, 0) + $1 ` +
      (filterSql ? `WHERE ${filterSql.replace("WHERE ", "")} ` : "") +
      `RETURNING ${this.driver.dialect.quoteIdentifier(field)}`;
    const result = await this.driver.query<Record<string, number>>(updateSql, [
      amount,
      ...filterParams,
    ]);
    return result.rows[0]?.[field] ?? 0;
  }

  /** Decrement a numeric field. Returns new value. */
  public async decrement(field: string, amount = 1): Promise<number> {
    return this.increment(field, -amount);
  }

  /** Increment a field for all matching rows. Returns affected row count. */
  public async incrementMany(field: string, amount = 1): Promise<number> {
    this.applyPendingScopes();
    const { sql: filterSql, params: filterParams } = this.buildFilter();
    const updateSql =
      `UPDATE ${this.driver.dialect.quoteIdentifier(this.table)} ` +
      `SET ${this.driver.dialect.quoteIdentifier(field)} = COALESCE(${this.driver.dialect.quoteIdentifier(field)}, 0) + $1` +
      (filterSql ? ` WHERE ${filterSql.replace("WHERE ", "")}` : "");
    const result = await this.driver.query(updateSql, [amount, ...filterParams]);
    return result.rowCount ?? 0;
  }

  /** Decrement a field for all matching rows. Returns affected row count. */
  public async decrementMany(field: string, amount = 1): Promise<number> {
    return this.incrementMany(field, -amount);
  }

  // ─── Chunking / Pagination ───────────────────────────────────

  /**
   * Process results in memory-efficient chunks.
   *
   * @example
   * await User.query().chunk(100, async (rows, idx) => { ... })
   */
  public async chunk(size: number, callback: ChunkCallback<T>): Promise<void> {
    let chunkIndex = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await this.clone()
        .skip(chunkIndex * size)
        .limit(size)
        .get();
      if (chunk.length === 0) break;

      const shouldContinue = await callback(chunk, chunkIndex);
      if (shouldContinue === false) break;

      hasMore = chunk.length === size;
      chunkIndex++;
    }
  }

  /** Page-based pagination. */
  public async paginate(options?: PaginationOptions): Promise<PaginationResult<T>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.clone().skip(skip).limit(limit).get(),
      this.count(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Set cursor pagination hints fluently.
   * The recorded values are picked up by `cursorPaginate()` when no explicit
   * options are passed.
   *
   * @example
   * User.query().cursor(lastId).cursorPaginate({ limit: 20 })
   */
  public cursor(after?: unknown, before?: unknown): this {
    this.addOperation("cursor", { after, before });
    return this;
  }

  /** Cursor-based pagination. */
  public async cursorPaginate(
    options?: CursorPaginationOptions,
  ): Promise<CursorPaginationResult<T>> {
    // Fall back to fluently-recorded cursor op if options.cursor not provided
    const cursorOp = this.getOps("cursor")[0];
    const recordedCursor = cursorOp?.data.after;

    const {
      limit = 10,
      cursor = recordedCursor,
      column = "id",
      direction = "next",
    } = options ?? {};

    if (cursor) {
      this.where(column, direction === "next" ? ">" : "<", cursor);
    }

    this.orderBy(column, direction === "next" ? "asc" : "desc");
    const results = await this.limit(limit + 1).get();
    const hasMore = results.length > limit;
    let data = hasMore ? results.slice(0, limit) : results;
    if (direction === "prev") data = data.reverse();

    let nextCursor: unknown;
    let prevCursor: unknown;
    let hasPrev = false;

    if (data.length > 0) {
      const firstItem = (data[0] as Record<string, unknown>)[column];
      const lastItem = (data[data.length - 1] as Record<string, unknown>)[column];

      if (direction === "next") {
        nextCursor = hasMore ? lastItem : undefined;
        if (cursor) {
          hasPrev = true;
          prevCursor = firstItem;
        }
      } else {
        prevCursor = hasMore ? firstItem : undefined;
        hasPrev = hasMore;
        if (cursor) nextCursor = lastItem;
      }
    }

    return { data, pagination: { hasMore, hasPrev, nextCursor, prevCursor } };
  }

  // ─── Mutation methods ────────────────────────────────────────

  /** Delete matching rows. Returns deleted count. */
  public async delete(): Promise<number> {
    this.applyPendingScopes();
    const { sql, params } = this.buildFilter();
    const deleteSql = `DELETE FROM ${this.driver.dialect.quoteIdentifier(this.table)} ${sql}`;
    const result = await this.driver.query(deleteSql, params);
    return result.rowCount ?? 0;
  }

  /** Delete the first matching row. */
  public async deleteOne(): Promise<number> {
    return this.limit(1).delete();
  }

  /** Update matching rows. */
  public async update(fields: Record<string, unknown>): Promise<number> {
    this.applyPendingScopes();
    const result = await this.driver.updateMany(this.table, {}, { $set: fields });
    return result.modifiedCount;
  }

  /** Unset fields from matching rows. */
  public async unset(...fields: string[]): Promise<number> {
    this.applyPendingScopes();
    const updateObj: Record<string, 1> = {};
    for (const field of fields) updateObj[field] = 1;
    const result = await this.driver.updateMany(this.table, {}, { $unset: updateObj });
    return result.modifiedCount;
  }

  // ─── Inspection / Debugging ───────────────────────────────────

  /** Return the SQL + bindings without executing. */
  public parse(): DriverQuery {
    this.applyPendingScopes();
    const parser = new PostgresQueryParser({
      table: this.table,
      operations: toParserOps(this.operations),
    });
    return parser.parse();
  }

  /** Formatted SQL string (for logging/debugging). */
  public pretty(): string {
    const { query = "", bindings } = this.parse();
    return `${query}\n-- Bindings: ${JSON.stringify(bindings ?? [])}`;
  }

  /** Run EXPLAIN ANALYZE on the query. */
  public async explain(): Promise<unknown> {
    const { query = "", bindings = [] } = this.parse();
    const result = await this.driver.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`,
      bindings,
    );
    return result.rows;
  }

  // ─── Utility ──────────────────────────────────────────────────

  /** Extend the builder with a driver-specific extension. */
  public extend<R>(extension: string, ..._args: unknown[]): R {
    throw new Error(`Extension "${extension}" is not supported by PostgresQueryBuilder`);
  }

  /** Pluck scalar values for a single field (alias for pluck). */
  public async pluckOne<TResult = unknown>(field: string): Promise<TResult[]> {
    const results = await this.select([field]).get<Record<string, TResult>>();
    return results.map((row) => row[field]);
  }

  // ============================================================================
  // JOIN RELATIONS — INTERNAL PIPELINE
  // ============================================================================

  /**
   * Before `get()` runs the parser, consume any joinWith ops recorded by the base
   * class and expand them into the joinRelations Map.
   */
  private _processJoinWithOps(): void {
    const joinWithOps = this.operations.filter((op) => op.type === "joinWith");
    if (joinWithOps.length === 0) return;

    // Remove joinWith ops from main operations — they are consumed here
    this.operations = this.operations.filter((op) => op.type !== "joinWith");

    for (const op of joinWithOps) {
      const constraints = op.data.constraints as Record<
        string,
        string | ((q: QueryBuilder) => void)
      >;
      for (const [path, constraint] of Object.entries(constraints)) {
        // Re-delegate to the extended joinWith implementation
        if (!constraint || constraint === "") {
          this.joinWith(path);
        } else {
          this.joinWith({ [path]: constraint });
        }
      }
    }
  }

  /**
   * Translate each entry in `joinRelations` into actual JOIN + selectRelatedColumns operations.
   */
  private applyJoinRelations(): void {
    if (this.joinRelations.size === 0) return;

    for (const [path, config] of this.joinRelations) {
      const RelatedModel =
        typeof config.model === "string"
          ? getModelFromRegistry(config.model as string)
          : (config.model as { table: string } | undefined);

      if (!RelatedModel) {
        throw new Error(`Relation model not found for ${path}`);
      }

      const relatedTable = (RelatedModel as { table: string }).table;
      const alias = config.alias;
      const parentTable = config.parentPath
        ? this.joinRelations.get(config.parentPath)!.alias
        : this.table;

      const parentDefTable =
        (config.parentModel as { table?: string } | undefined)?.table ?? this.table;

      let localField: string;
      let foreignField: string;

      if (config.type === "belongsTo") {
        localField = config.foreignKey ?? `${config.relationName}Id`;
        foreignField = config.ownerKey ?? "id";
      } else {
        localField = config.localKey ?? "id";
        foreignField = config.foreignKey ?? `${parentDefTable.slice(0, -1)}Id`;
      }

      // hasMany uses a correlated subquery in SELECT (no JOIN) to avoid row explosion
      if (config.type !== "hasMany") {
        this.addOperation("leftJoin", {
          table: relatedTable,
          alias,
          localField: `${parentTable}.${localField}`,
          foreignField,
        });
      }

      this.addOperation("selectRelatedColumns", {
        alias,
        relationName: config.relationName,
        path,
        table: relatedTable,
        select: config.select,
        type: config.type,
        foreignKey: foreignField,
        localKey: localField,
        parentTable,
        constraintOps: config.constraintOps, // passed through to parser
      });
    }
  }

  /**
   * Extract per-relation data from raw DB rows (before hydration).
   * Returns a Map of row index → nested relation data tree.
   */
  private extractJoinedRelationData(records: unknown[]): Map<number, Record<string, unknown>> {
    const result = new Map<number, Record<string, unknown>>();
    if (this.joinRelations.size === 0) return result;

    (records as Record<string, unknown>[]).forEach((record, index) => {
      const relationData: Record<string, unknown> = {};

      // Process shallower paths first so parents exist before children
      const sortedPaths = Array.from(this.joinRelations.keys()).sort(
        (a, b) => a.split(".").length - b.split(".").length,
      );

      for (const path of sortedPaths) {
        const config = this.joinRelations.get(path)!;
        const columnName = config.alias;

        const relatedData = record[columnName];
        delete record[columnName];

        const parsedData =
          relatedData !== null &&
          !(
            typeof relatedData === "object" &&
            Object.values(relatedData as object).every((v) => v === null)
          )
            ? relatedData
            : null;

        const parts = path.split(".");
        const lastPart = parts.pop()!;
        let current = relationData;

        for (const part of parts) {
          if (!current[part]) current[part] = {};
          current = current[part] as Record<string, unknown>;
        }

        current[lastPart] = parsedData;
      }

      result.set(index, relationData);
    });

    return result;
  }

  /**
   * Attach extracted relation data to hydrated model instances.
   */
  private attachJoinedRelations(
    records: unknown[],
    joinedData: Map<number, Record<string, unknown>>,
  ): void {
    if (this.joinRelations.size === 0) return;

    const attachNested = (model: unknown, dataTree: unknown, currentPath = ""): void => {
      if (!dataTree || typeof dataTree !== "object") return;

      for (const [key, data] of Object.entries(dataTree as Record<string, unknown>)) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        const config = this.joinRelations.get(path);
        if (!config) continue;

        const m = model as Record<string, unknown> & {
          loadedRelations?: Map<string, unknown>;
        };

        if (data === null) {
          m[key] = null;
          m.loadedRelations?.set(key, null);
          continue;
        }

        const RelatedModel = resolveModelClass(config.model as string);
        if (!RelatedModel) continue;

        const childKeys = Array.from(this.joinRelations.keys())
          .filter((p) => p.startsWith(`${path}.`))
          .map((p) => p.split(".")[path.split(".").length]);

        if (config.type === "hasMany") {
          const rows = Array.isArray(data) ? data : [];
          const instances = rows.map((row: unknown) => {
            const rowData = { ...(row as object) } as Record<string, unknown>;
            for (const childKey of childKeys) delete rowData[childKey];
            return (RelatedModel as { hydrate: (d: unknown) => unknown }).hydrate(rowData);
          });

          m[key] = instances;
          m.loadedRelations?.set(key, instances);
        } else {
          const modelData = { ...(data as object) } as Record<string, unknown>;
          for (const childKey of childKeys) delete modelData[childKey];

          const relatedInstance = (RelatedModel as { hydrate: (d: unknown) => unknown }).hydrate(
            modelData,
          );
          attachNested(relatedInstance, data, path);

          m[key] = relatedInstance;
          m.loadedRelations?.set(key, relatedInstance);
        }
      }
    };

    records.forEach((model, index) => {
      const relationData = joinedData.get(index);
      if (relationData) attachNested(model, relationData);
    });
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  /**
   * Build a WHERE-only SQL fragment from `where*` operations on the current builder.
   * Used by DELETE / UPDATE / increment paths.
   */
  private buildFilter(): { sql: string; params: unknown[] } {
    const whereOps = this.operations.filter(
      (op) => op.type.includes("where") || op.type.includes("Where"),
    );

    if (whereOps.length === 0) return { sql: "", params: [] };

    const parser = new PostgresQueryParser({
      table: this.table,
      operations: toParserOps(whereOps),
    });

    const { query = "", bindings = [] } = parser.parse();
    const whereMatch = query.match(/WHERE .+$/);
    return { sql: whereMatch ? whereMatch[0] : "", params: bindings };
  }
}
