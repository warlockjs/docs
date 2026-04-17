/**
 * PostgreSQL Query Parser
 *
 * Translates Cascade query operations into PostgreSQL SQL queries.
 * Mirrors the MongoQueryParser pattern but generates SQL instead
 * of MongoDB aggregation pipelines.
 *
 * @module cascade/drivers/postgres
 */

import type {
  DriverQuery,
  JoinOptions,
  WhereOperator,
} from "../../contracts/query-builder.contract";
import type { SqlDialectContract } from "../sql/sql-dialect.contract";

import { PostgresDialect } from "./postgres-dialect";

/**
 * Operation types supported by the query parser.
 */
export type PostgresOperationType =
  // WHERE operations
  | "where"
  | "orWhere"
  | "whereRaw"
  | "orWhereRaw"
  | "whereIn"
  | "whereNotIn"
  | "whereNull"
  | "whereNotNull"
  | "whereBetween"
  | "whereNotBetween"
  | "whereLike"
  | "whereNotLike"
  | "whereColumn"
  | "orWhereColumn"
  | "whereExists"
  | "whereNotExists"
  | "whereDate"
  | "whereDateBefore"
  | "whereDateAfter"
  | "whereDateBetween"
  | "whereJsonContains"
  | "whereJsonDoesntContain"
  | "whereFullText"
  // SELECT operations
  | "select"
  | "selectRaw"
  | "deselect"
  // JOIN operations
  | "join"
  | "leftJoin"
  | "rightJoin"
  | "innerJoin"
  | "fullJoin"
  | "crossJoin"
  | "joinRaw"
  // ORDER operations
  | "orderBy"
  | "orderByRaw"
  // GROUP operations
  | "groupBy"
  | "having"
  | "havingRaw"
  // LIMIT operations
  | "limit"
  | "offset"
  // RELATION operations
  | "has"
  | "whereHas"
  | "doesntHave"
  | "whereDoesntHave"
  // joinWith operations
  | "selectRelatedColumns"
  // Other
  | "distinct";

/**
 * Internal operation representation.
 */
export type PostgresParserOperation = {
  /** Operation type */
  readonly type: PostgresOperationType;
  /** Operation data/parameters */
  readonly data: Record<string, unknown>;
};

/**
 * Parser configuration options.
 */
export type PostgresParserOptions = {
  /** Target table name */
  readonly table: string;
  /** Table alias (optional) */
  readonly alias?: string;
  /** Operations to parse */
  readonly operations: PostgresParserOperation[];
  /** SQL dialect for syntax generation */
  readonly dialect?: SqlDialectContract;
  /** Factory for creating sub-parsers (for nested queries) */
  readonly createSubParser?: (table: string) => PostgresQueryParser;
};

/**
 * PostgreSQL Query Parser.
 *
 * Converts a list of query operations into a SQL query string with parameters.
 * Handles SELECT, WHERE, JOIN, ORDER BY, GROUP BY, LIMIT/OFFSET clauses.
 *
 * @example
 * ```typescript
 * const parser = new PostgresQueryParser({
 *   table: 'users',
 *   operations: [
 *     { type: 'where', data: { field: 'name', operator: '=', value: 'Alice' } },
 *     { type: 'orderBy', data: { field: 'createdAt', direction: 'desc' } },
 *     { type: 'limit', data: { value: 10 } }
 *   ]
 * });
 *
 * const { sql, params } = parser.parse();
 * // sql: 'SELECT * FROM "users" WHERE "name" = $1 ORDER BY "createdAt" DESC LIMIT 10'
 * // params: ['Alice']
 * ```
 */
export class PostgresQueryParser {
  /**
   * Target table name.
   */
  private readonly table: string;

  /**
   * Table alias.
   */
  private readonly alias?: string;

  /**
   * Operations to process.
   */
  private readonly operations: PostgresParserOperation[];

  /**
   * SQL dialect for syntax.
   */
  private readonly dialect: SqlDialectContract;

  /**
   * Current parameter index (1-based for PostgreSQL).
   */
  private paramIndex = 1;

  /**
   * Collected parameters.
   */
  private readonly params: unknown[] = [];

  /**
   * SELECT columns.
   */
  public selectColumns: string[] = [];

  /**
   * Deselected (excluded) columns.
   */
  private deselectColumns: string[] = [];

  /**
   * Raw SELECT expressions.
   */
  private selectRaw: string[] = [];

  /**
   * WHERE clauses.
   */
  public whereClauses: string[] = [];

  /**
   * JOIN clauses.
   */
  private joinClauses: string[] = [];

  /**
   * ORDER BY clauses.
   */
  public orderClauses: string[] = [];

  /**
   * GROUP BY columns.
   */
  private groupColumns: string[] = [];

  /**
   * HAVING clauses.
   */
  private havingClauses: string[] = [];

  /**
   * LIMIT value.
   */
  public limitValue?: number;

  /**
   * OFFSET value.
   */
  public offsetValue?: number;

  /**
   * DISTINCT flag.
   */
  private isDistinct = false;

  /**
   * Whether the query has any JOIN operations (pre-scanned before processing).
   * Used by qualifyColumn() to decide whether to prefix columns with the main table.
   */
  private hasJoins = false;

  /**
   * Tracked joined tables (for table reference detection).
   */
  private readonly joinedTables = new Set<string>();

  /**
   * Create a new query parser.
   *
   * @param options - Parser configuration
   */
  public constructor(options: PostgresParserOptions) {
    this.table = options.table;
    this.alias = options.alias;
    this.operations = options.operations;
    this.dialect = options.dialect ?? new PostgresDialect();
  }

  /**
   * Parse all operations and build the SQL query.
   *
   * @returns DriverQuery with `query` (SQL string) and `bindings` (parameter values)
   */
  public parse(): DriverQuery {
    // Pre-scan for any join operations so qualifyColumn() can prefix columns
    // correctly even when WHERE clauses appear before JOINs in the operations list.
    const JOIN_TYPES = new Set([
      "join",
      "leftJoin",
      "rightJoin",
      "innerJoin",
      "fullJoin",
      "crossJoin",
      "joinRaw",
    ]);

    this.hasJoins = false;

    // First pass: locate all joins and populate joinedTables for accurate JSON path detection
    for (const operation of this.operations) {
      if (JOIN_TYPES.has(operation.type)) {
        this.hasJoins = true;
        const data = operation.data as any;
        const joinTable = data.table as string;
        const alias = data.alias as string;

        if (joinTable) this.joinedTables.add(joinTable);
        if (alias) this.joinedTables.add(alias);
      }
    }

    // Process each operation
    for (const operation of this.operations) {
      this.processOperation(operation);
    }

    // Build the final SQL query
    const query = this.buildSql();

    return { query, bindings: this.params };
  }

  /**
   * Get a formatted string representation of the query.
   *
   * @returns Formatted SQL with bindings
   */
  public toPrettyString(): string {
    const { query = "", bindings } = this.parse();
    return `${query}\n-- Bindings: ${JSON.stringify(bindings ?? [])}`;
  }

  /**
   * Process a single operation.
   *
   * @param operation - The operation to process
   */
  private processOperation(operation: PostgresParserOperation): void {
    const { type, data } = operation;

    switch (type) {
      // WHERE operations
      case "where":
        this.processWhere(data, "AND");
        break;
      case "orWhere":
        this.processWhere(data, "OR");
        break;
      case "whereRaw":
        this.processWhereRaw(data, "AND");
        break;
      case "orWhereRaw":
        this.processWhereRaw(data, "OR");
        break;
      case "whereIn":
        this.processWhereIn(data, false);
        break;
      case "whereNotIn":
        this.processWhereIn(data, true);
        break;
      case "whereNull":
        this.processWhereNull(data, false);
        break;
      case "whereNotNull":
        this.processWhereNull(data, true);
        break;
      case "whereBetween":
        this.processWhereBetween(data, false);
        break;
      case "whereNotBetween":
        this.processWhereBetween(data, true);
        break;
      case "whereLike":
        this.processWhereLike(data, false);
        break;
      case "whereNotLike":
        this.processWhereLike(data, true);
        break;
      case "whereColumn":
        this.processWhereColumn(data, "AND");
        break;
      case "orWhereColumn":
        this.processWhereColumn(data, "OR");
        break;
      case "whereJsonContains":
        this.processWhereJsonContains(data, false);
        break;
      case "whereJsonDoesntContain":
        this.processWhereJsonContains(data, true);
        break;
      case "whereFullText":
        this.processWhereFullText(data);
        break;

      // SELECT operations
      case "select":
        this.processSelect(data);
        break;
      case "selectRaw":
        this.processSelectRaw(data);
        break;
      case "deselect":
        this.processDeselect(data);
        break;

      // JOIN operations
      case "join":
      case "innerJoin":
        this.processJoin(data, "INNER");
        break;
      case "leftJoin":
        this.processJoin(data, "LEFT");
        break;
      case "rightJoin":
        this.processJoin(data, "RIGHT");
        break;
      case "fullJoin":
        this.processJoin(data, "FULL OUTER");
        break;
      case "crossJoin":
        this.processCrossJoin(data);
        break;
      case "joinRaw":
        this.processJoinRaw(data);
        break;

      // ORDER operations
      case "orderBy":
        this.processOrderBy(data);
        break;
      case "orderByRaw":
        this.processOrderByRaw(data);
        break;

      // GROUP operations
      case "groupBy":
        this.processGroupBy(data);
        break;
      case "having":
        this.processHaving(data);
        break;
      case "havingRaw":
        this.processHavingRaw(data);
        break;

      // LIMIT operations
      case "limit":
        this.limitValue = data.value as number;
        break;
      case "offset":
        this.offsetValue = data.value as number;
        break;

      // Other
      case "distinct":
        this.isDistinct = true;
        break;

      // joinWith select related columns
      case "selectRelatedColumns":
        this.processSelectRelatedColumns(data);
        break;

      default:
        // Unknown operation - ignore or throw
        break;
    }
  }

  /**
   * Build the final SQL query from collected clauses.
   *
   * @returns Complete SQL query string
   */
  private buildSql(): string {
    const parts: string[] = [];

    // SELECT clause
    parts.push(this.buildSelectClause());

    // FROM clause
    const quotedTable = this.dialect.quoteIdentifier(this.table);
    const fromClause = this.alias
      ? `FROM ${quotedTable} AS ${this.dialect.quoteIdentifier(this.alias)}`
      : `FROM ${quotedTable}`;
    parts.push(fromClause);

    // JOIN clauses
    if (this.joinClauses.length > 0) {
      parts.push(this.joinClauses.join(" "));
    }

    // WHERE clause
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(" ")}`);
    }

    // GROUP BY clause
    if (this.groupColumns.length > 0) {
      const quotedCols = this.groupColumns.map((c) => this.dialect.quoteIdentifier(c));
      parts.push(`GROUP BY ${quotedCols.join(", ")}`);
    }

    // HAVING clause
    if (this.havingClauses.length > 0) {
      parts.push(`HAVING ${this.havingClauses.join(" AND ")}`);
    }

    // ORDER BY clause
    if (this.orderClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderClauses.join(", ")}`);
    }

    // LIMIT/OFFSET
    const limitOffset = this.dialect.limitOffset(this.limitValue, this.offsetValue);
    if (limitOffset) {
      parts.push(limitOffset);
    }

    return parts.join(" ");
  }

  /**
   * Build the SELECT clause.
   *
   * @returns SELECT clause string
   */
  private buildSelectClause(): string {
    const distinct = this.isDistinct ? "DISTINCT " : "";

    // If no specific columns, select all — qualify with main table when joins present
    if (this.selectColumns.length === 0 && this.selectRaw.length === 0) {
      return this.hasJoins
        ? `SELECT ${distinct}${this.dialect.quoteIdentifier(this.table)}.*`
        : `SELECT ${distinct}*`;
    }

    const columns: string[] = [];

    // Add selected columns — prefix with main table when joins present to avoid ambiguity
    for (const col of this.selectColumns) {
      if (!this.deselectColumns.includes(col)) {
        columns.push(this.parseColumnIdentifier(col, this.table, this.alias));
      }
    }

    // Add raw expressions
    columns.push(...this.selectRaw);

    return `SELECT ${distinct}${columns.join(", ")}`;
  }

  /**
   * Add a placeholder and parameter.
   *
   * @param value - Parameter value
   * @returns Placeholder string ($1, $2, etc.)
   */
  private addParam(value: unknown): string {
    this.params.push(value);
    return this.dialect.placeholder(this.paramIndex++);
  }

  /**
   * Process a basic WHERE operation.
   *
   * Delegates to specialised processors for operators that require more than a
   * single placeholder (between, in, like-variants, exists, etc.).
   */
  private processWhere(data: Record<string, unknown>, boolean: "AND" | "OR"): void {
    const field = data.field as string;
    const operator = (data.operator as WhereOperator) ?? "=";
    const value = data.value;

    // Delegate to specialised processors for operators that need it
    switch (operator) {
      case "between":
        return this.processWhereBetween(
          { field, range: value as [unknown, unknown] },
          false,
        );
      case "notBetween":
        return this.processWhereBetween(
          { field, range: value as [unknown, unknown] },
          true,
        );
      case "in":
        return this.processWhereIn({ field, values: value as unknown[] }, false);
      case "notIn":
        return this.processWhereIn({ field, values: value as unknown[] }, true);
      case "like":
      case "ilike":
      case "startsWith":
      case "endsWith":
        return this.processWhereLike({ field, pattern: value as string }, false);
      case "notLike":
      case "notStartsWith":
      case "notEndsWith":
        return this.processWhereLike({ field, pattern: value as string }, true);
      case "exists":
        // EXISTS expects value to be a raw sub-query string
        return this.addWhereClause(`EXISTS (${value})`, boolean);
    }

    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);

    if (value === null) {
      const nullOperator = operator === "!=" ? "IS NOT NULL" : "IS NULL";
      return this.addWhereClause(`${quotedField} ${nullOperator}`, boolean);
    }

    // Simple single-value operator — fall through to generic path
    const placeholder = this.addParam(value);
    this.addWhereClause(`${quotedField} ${this.mapOperator(operator)} ${placeholder}`, boolean);
  }

  /**
   * Process a raw WHERE operation.
   */
  private processWhereRaw(data: Record<string, unknown>, boolean: "AND" | "OR"): void {
    const expression = data.expression as string;
    const bindings = (data.bindings as unknown[]) ?? [];

    // Replace ? placeholders with $n
    let processed = expression;
    for (const binding of bindings) {
      processed = processed.replace("?", this.addParam(binding));
    }

    this.addWhereClause(processed, boolean);
  }

  /**
   * Process WHERE IN / NOT IN.
   */
  private processWhereIn(data: Record<string, unknown>, negate: boolean): void {
    const field = data.field as string;
    const values = data.values as unknown[];

    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);
    const operator = negate ? "!= ALL" : "= ANY";
    const placeholder = this.addParam(values);

    this.addWhereClause(`${quotedField} ${operator}(${placeholder})`, "AND");
  }

  /**
   * Process WHERE NULL / NOT NULL.
   */
  private processWhereNull(data: Record<string, unknown>, negate: boolean): void {
    const field = data.field as string;
    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);
    const clause = negate ? `${quotedField} IS NOT NULL` : `${quotedField} IS NULL`;
    this.addWhereClause(clause, "AND");
  }

  /**
   * Process WHERE BETWEEN / NOT BETWEEN.
   */
  private processWhereBetween(data: Record<string, unknown>, negate: boolean): void {
    const field = data.field as string;
    const range = data.range as [unknown, unknown];

    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);
    const placeholder1 = this.addParam(range[0]);
    const placeholder2 = this.addParam(range[1]);
    const keyword = negate ? "NOT BETWEEN" : "BETWEEN";

    this.addWhereClause(`${quotedField} ${keyword} ${placeholder1} AND ${placeholder2}`, "AND");
  }

  /**
   * Process WHERE LIKE / NOT LIKE.
   */
  private processWhereLike(data: Record<string, unknown>, negate: boolean): void {
    const field = data.field as string;
    const pattern = data.pattern as string;

    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);
    const { operator } = this.dialect.likePattern(pattern, true);
    const placeholder = this.addParam(pattern);
    const keyword = negate ? `NOT ${operator}` : operator;

    this.addWhereClause(`${quotedField} ${keyword} ${placeholder}`, "AND");
  }

  /**
   * Process WHERE column comparison.
   */
  private processWhereColumn(data: Record<string, unknown>, boolean: "AND" | "OR"): void {
    const first = data.first as string;
    const operator = (data.operator as string) ?? "=";
    const second = data.second as string;

    // Both sides may need qualification if unambiguous table is unclear
    const quotedFirst = this.parseColumnIdentifier(first, this.table, this.alias);
    const quotedSecond = this.parseColumnIdentifier(second, this.table, this.alias);

    this.addWhereClause(`${quotedFirst} ${operator} ${quotedSecond}`, boolean);
  }

  /**
   * Process WHERE JSON contains.
   */
  private processWhereJsonContains(data: Record<string, unknown>, negate: boolean): void {
    const path = data.path as string;
    const value = data.value;

    const quotedPath = this.parseColumnIdentifier(path, this.table, this.alias);
    const jsonValue = JSON.stringify(value);
    const operator = negate ? "NOT @>" : "@>";

    this.addWhereClause(`${quotedPath} ${operator} '${jsonValue}'::jsonb`, "AND");
  }

  /**
   * Process full-text search WHERE.
   */
  private processWhereFullText(data: Record<string, unknown>): void {
    const fields = data.fields as string[];
    const query = data.query as string;

    // Build tsvector from fields
    const tsVectors = fields
      .map((f) => `to_tsvector('english', ${this.dialect.quoteIdentifier(f)})`)
      .join(" || ");

    const placeholder = this.addParam(query);
    this.addWhereClause(`(${tsVectors}) @@ plainto_tsquery('english', ${placeholder})`, "AND");
  }

  /**
   * Process SELECT operation.
   */
  private processSelect(data: Record<string, unknown>): void {
    const fields = data.fields as string[] | Record<string, string>;

    if (Array.isArray(fields)) {
      this.selectColumns.push(...fields);
    } else {
      // Handle aliases: { field: 'alias' }
      for (const [field, alias] of Object.entries(fields)) {
        const quotedField = this.dialect.quoteIdentifier(field);
        const quotedAlias = this.dialect.quoteIdentifier(alias);
        this.selectRaw.push(`${quotedField} AS ${quotedAlias}`);
      }
    }
  }

  /**
   * Process raw SELECT expression.
   */
  private processSelectRaw(data: Record<string, unknown>): void {
    const expression = data.expression as string | Record<string, unknown>;
    const bindings = (data.bindings as unknown[]) ?? [];

    if (typeof expression === "string") {
      // Replace ? placeholders with $n positional params (same as processWhereRaw)
      let processed = expression;
      for (const binding of bindings) {
        processed = processed.replace("?", this.addParam(binding));
      }
      this.selectRaw.push(processed);
    } else {
      // Handle object expressions (for compatibility)
      for (const [alias, expr] of Object.entries(expression)) {
        this.selectRaw.push(`${expr} AS ${this.dialect.quoteIdentifier(alias)}`);
      }
    }
  }

  /**
   * Process DESELECT operation.
   */
  private processDeselect(data: Record<string, unknown>): void {
    const fields = data.fields as string[];
    this.deselectColumns.push(...fields);
  }

  /**
   * Process SELECT for related columns (joinWith).
   *
   * - hasOne / belongsTo  → LEFT JOIN + row_to_json  (single object)
   * - hasMany             → correlated subquery with json_agg (array, no row explosion)
   *
   * @example hasMany correlated subquery:
   *   (SELECT json_agg(row_to_json(a.*))
   *    FROM "chat_message_actions" a
   *    WHERE a."chat_message_id" = "chat_messages"."id") AS "actions"
   *
   * @example hasOne/belongsTo row_to_json:
   *   row_to_json("organizationAiModel".*) AS "organizationAiModel"
   */
  private processSelectRelatedColumns(data: Record<string, unknown>): void {
    const alias = data.alias as string;
    const select = data.select as string[] | undefined;
    const relationType = data.type as string | undefined;
    const constraintOps = data.constraintOps as PostgresParserOperation[] | undefined;
    const quotedAlias = this.dialect.quoteIdentifier(alias);
    const quotedTable = this.dialect.quoteIdentifier(this.table);

    const hasExplicitSelect = this.selectColumns.length > 0;
    if (!hasExplicitSelect && !this.selectRaw.includes(`${quotedTable}.*`)) {
      this.selectRaw.unshift(`${quotedTable}.*`);
    }

    if (relationType === "hasMany") {
      // Correlated subquery — no JOIN, no row explosion, returns a JSON array.
      const relatedTable = data.table as string;
      const foreignKey = data.foreignKey as string;
      const localKey = data.localKey as string;
      const quotedRelatedTable = this.dialect.quoteIdentifier(relatedTable);
      const quotedForeignKey = this.dialect.quoteIdentifier(foreignKey);
      const quotedLocalKey = this.dialect.quoteIdentifier(localKey);
      const quotedMainTable = this.dialect.quoteIdentifier(this.table);

      let innerSelect: string;
      if (select && select.length > 0) {
        // Pick specific columns: json_agg(json_build_object('id', a."id", ...))
        const fields = select
          .map((col) => `'${col}', a.${this.dialect.quoteIdentifier(col)}`)
          .join(", ");
        innerSelect = `json_agg(json_build_object(${fields}))`;
      } else {
        innerSelect = `json_agg(row_to_json(a.*))`;
      }

      // Build the base FK condition
      const fkCondition = `a.${quotedForeignKey} = ${quotedMainTable}.${quotedLocalKey}`;

      // Merge constraint ops (where / order / limit) from a sub-parser
      let extraWhere = "";
      let orderBy = "";
      let limitClause = "";

      if (constraintOps && constraintOps.length > 0) {
        const subParser = new PostgresQueryParser({
          table: relatedTable,
          alias: "a",
          operations: constraintOps,
        });
        subParser.parse();

        if (subParser.whereClauses.length > 0) {
          extraWhere = ` AND ${subParser.whereClauses.join(" ")}`;
        }
        if (subParser.orderClauses.length > 0) {
          orderBy = ` ORDER BY ${subParser.orderClauses.join(", ")}`;
        }
        if (subParser.limitValue !== undefined) {
          limitClause = ` LIMIT ${subParser.limitValue}`;
        }
      }

      // Wrap with ORDER/LIMIT only when constraints are present (json_agg ignores ORDER)
      const innerQuery =
        orderBy || limitClause
          ? `SELECT row_to_json(sub.*) FROM (SELECT * FROM ${quotedRelatedTable} a WHERE ${fkCondition}${extraWhere}${orderBy}${limitClause}) sub`
          : `SELECT ${innerSelect.replace("json_agg(", "").replace(/\)$/, "")} FROM ${quotedRelatedTable} a WHERE ${fkCondition}${extraWhere}`;

      const aggregated =
        orderBy || limitClause
          ? `(SELECT json_agg(row_to_json(sub.*)) FROM (SELECT * FROM ${quotedRelatedTable} a WHERE ${fkCondition}${extraWhere}${orderBy}${limitClause}) sub) AS ${quotedAlias}`
          : `(SELECT ${innerSelect} FROM ${quotedRelatedTable} a WHERE ${fkCondition}${extraWhere}) AS ${quotedAlias}`;

      this.selectRaw.push(aggregated);
    } else {
      // hasOne / belongsTo — single object via LEFT JOIN + row_to_json.
      // If constraint provides an explicit select list, prefer it over data.select
      let effectiveSelect = select;
      if (constraintOps && constraintOps.length > 0) {
        const subParser = new PostgresQueryParser({
          table: (data.table as string) ?? alias,
          alias,
          operations: constraintOps,
        });
        subParser.parse();
        if (subParser.selectColumns.length > 0) {
          effectiveSelect = subParser.selectColumns;
        }
      }

      if (effectiveSelect && effectiveSelect.length > 0) {
        const selectedColumns = effectiveSelect
          .map((col) => `${quotedAlias}.${this.dialect.quoteIdentifier(col)}`)
          .join(", ");
        this.selectRaw.push(
          `row_to_json((SELECT d FROM (SELECT ${selectedColumns}) d)) AS ${quotedAlias}`,
        );
      } else {
        this.selectRaw.push(`row_to_json(${quotedAlias}.*) AS ${quotedAlias}`);
      }
    }
  }

  /**
   * Process JOIN operation with smart field detection.
   *
   * Handles both regular columns and JSONB nested paths:
   * - "id" → "table"."id" (auto-prefixed)
   * - "users.id" → "users"."id" (explicit table)
   * - "createdBy.id" → "table"."createdBy"->>'id' (JSONB path)
   * - "posts.createdBy.id" → "posts"."createdBy"->>'id' (JSONB with table)
   */
  private processJoin(data: Record<string, unknown>, type: string): void {
    const options = data as unknown as
      | JoinOptions
      | { table: string; localField: string; foreignField: string };

    const joinTable = "table" in options ? options.table : "";
    const localField = "localField" in options ? options.localField : "";
    const foreignField = "foreignField" in options ? options.foreignField : "";
    const alias = "alias" in options ? options.alias : undefined;

    const quotedTable = this.dialect.quoteIdentifier(joinTable);
    const tableRef = alias
      ? `${quotedTable} AS ${this.dialect.quoteIdentifier(alias)}`
      : quotedTable;
    const tableAlias = alias ?? joinTable;

    // Track the joined table for reference detection
    this.joinedTables.add(joinTable);
    if (alias) {
      this.joinedTables.add(alias);
    }

    // Parse local field (belongs to main table)
    const quotedLocal = this.parseColumnIdentifier(localField!, this.table, this.alias);

    // Parse foreign field (belongs to join table)
    const quotedForeign = this.parseColumnIdentifier(foreignField!, joinTable, tableAlias);

    this.joinClauses.push(`${type} JOIN ${tableRef} ON ${quotedLocal} = ${quotedForeign}`);
  }

  /**
   * Parse a column identifier with smart detection for table prefixes and JSONB paths.
   *
   * @param field - The field string (e.g., "id", "users.id", "createdBy.id")
   * @param defaultTable - Default table to use if no prefix
   * @param tableAlias - Table alias to use if provided
   * @returns Properly quoted SQL expression
   */
  private parseColumnIdentifier(field: string, defaultTable: string, tableAlias?: string): string {
    if (!field) return "";

    const effectiveTable = tableAlias ?? defaultTable;
    const parts = field.split(".");

    // Single part: just a column name, prefix with default table
    if (parts.length === 1) {
      return `${this.dialect.quoteIdentifier(effectiveTable)}.${this.dialect.quoteIdentifier(field)}`;
    }

    // Two parts: could be "table.column" or "jsonbColumn.key"
    if (parts.length === 2) {
      const [first, second] = parts;

      // Check if first part is a known table (main table, join table, or alias)
      if (this.isTableReference(first)) {
        // It's table.column - regular column reference
        return `${this.dialect.quoteIdentifier(first)}.${this.dialect.quoteIdentifier(second)}`;
      }

      // It's jsonbColumn.key - JSONB path
      return this.buildJsonbPath(effectiveTable, first, [second]);
    }

    // Three or more parts: "table.jsonbColumn.key..." or "jsonbColumn.key1.key2..."
    const [first, second, ...rest] = parts;

    if (this.isTableReference(first)) {
      // First part is table: "posts.createdBy.id" → table is "posts", JSONB is "createdBy.id"
      return this.buildJsonbPath(first, second, rest);
    }

    // No table prefix: "createdBy.address.city" → use default table
    return this.buildJsonbPath(effectiveTable, first, [second, ...rest]);
  }

  /**
   * Check if a string is a table reference (main table or join table).
   */
  private isTableReference(name: string): boolean {
    if (name === this.table || name === this.alias) {
      return true;
    }

    if (this.joinedTables.has(name)) {
      return true;
    }

    return false;
  }

  /**
   * Build a JSONB path expression.
   *
   * @param table - Table name
   * @param column - JSONB column name
   * @param path - Array of nested keys
   * @returns PostgreSQL JSONB path expression
   *
   * @example
   * buildJsonbPath("posts", "createdBy", ["id"])
   * // Returns: ("posts"."createdBy"->>'id')::integer
   *
   * buildJsonbPath("posts", "createdBy", ["address", "city"])
   * // Returns: "posts"."createdBy"->'address'->>'city'
   */
  private buildJsonbPath(table: string, column: string, path: string[]): string {
    const quotedTable = this.dialect.quoteIdentifier(table);
    const quotedColumn = this.dialect.quoteIdentifier(column);

    if (path.length === 0) {
      return `${quotedTable}.${quotedColumn}`;
    }

    // Build JSONB path: use -> for intermediate keys, ->> for final key (returns text)
    let expression = `${quotedTable}.${quotedColumn}`;

    for (let i = 0; i < path.length; i++) {
      const isLast = i === path.length - 1;
      const operator = isLast ? "->>" : "->";
      expression += `${operator}'${path[i]}'`;
    }

    // Cast to integer if the path ends with 'id' (common pattern for foreign keys)
    const lastKey = path[path.length - 1].toLowerCase();
    if (lastKey === "id" || lastKey.endsWith("id")) {
      expression = `(${expression})::integer`;
    }

    return expression;
  }

  /**
   * Process CROSS JOIN operation.
   */
  private processCrossJoin(data: Record<string, unknown>): void {
    const table = data.table as string;
    const quotedTable = this.dialect.quoteIdentifier(table);
    this.joinClauses.push(`CROSS JOIN ${quotedTable}`);
  }

  /**
   * Process raw JOIN expression.
   */
  private processJoinRaw(data: Record<string, unknown>): void {
    const expression = data.expression as string;
    const bindings = (data.bindings as unknown[]) ?? [];

    let processed = expression;
    for (const binding of bindings) {
      processed = processed.replace("?", this.addParam(binding));
    }

    this.joinClauses.push(processed);
  }

  /**
   * Process ORDER BY operation.
   */
  private processOrderBy(data: Record<string, unknown>): void {
    const field = data.field as string;
    const direction = ((data.direction as string) ?? "asc").toUpperCase();

    const quotedField = this.parseColumnIdentifier(field, this.table, this.alias);
    this.orderClauses.push(`${quotedField} ${direction}`);
  }

  /**
   * Process raw ORDER BY expression.
   */
  private processOrderByRaw(data: Record<string, unknown>): void {
    const expression = data.expression as string;
    const bindings = (data.bindings as unknown[]) ?? [];

    // Replace ? placeholders with $n positional params (same as processWhereRaw)
    let processed = expression;
    for (const binding of bindings) {
      processed = processed.replace("?", this.addParam(binding));
    }
    this.orderClauses.push(processed);
  }

  /**
   * Process GROUP BY operation.
   */
  private processGroupBy(data: Record<string, unknown>): void {
    const fields = data.fields as string | string[];
    const columns = Array.isArray(fields) ? fields : [fields];
    this.groupColumns.push(...columns);
  }

  /**
   * Process HAVING operation.
   */
  private processHaving(data: Record<string, unknown>): void {
    const field = data.field as string;
    const operator = (data.operator as string) ?? "=";
    const value = data.value;

    const quotedField = this.dialect.quoteIdentifier(field);
    const placeholder = this.addParam(value);

    this.havingClauses.push(`${quotedField} ${operator} ${placeholder}`);
  }

  /**
   * Process raw HAVING expression.
   */
  private processHavingRaw(data: Record<string, unknown>): void {
    const expression = data.expression as string;
    this.havingClauses.push(expression);
  }

  /**
   * Add a WHERE clause with boolean operator.
   */
  private addWhereClause(clause: string, boolean: "AND" | "OR"): void {
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(clause);
    } else {
      this.whereClauses.push(`${boolean} ${clause}`);
    }
  }

  /**
   * Map simple Cascade operators to their SQL equivalents.
   *
   * Complex operators (between, in, like-variants, exists) are handled by
   * dedicated processors and should never reach this method.
   */
  private mapOperator(operator: WhereOperator): string {
    const mapping: Record<string, string> = {
      "=": "=",
      "!=": "!=",
      "<>": "<>",
      ">": ">",
      ">=": ">=",
      "<": "<",
      "<=": "<=",
      like: "LIKE",
      notlike: "NOT LIKE",
      ilike: "ILIKE",
    };

    return mapping[operator.toLowerCase()] ?? operator;
  }
}
