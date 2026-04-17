import { isEmpty } from "@mongez/supportive-is";
import type {
  QueryBuilderContract as CascadeQueryBuilder,
  QueryBuilderContract,
} from "@warlock.js/cascade";
import type { FilterOptions, FilterRule, FilterRules } from "../../contracts";

/**
 * Applies repository filters to a Cascade-Next query builder
 * Translates repository filter rules into Cascade query builder method calls
 */
export class FilterApplicator {
  /**
   * Apply filters to a Cascade query builder
   *
   * @param query - Cascade query builder instance
   * @param filters - Filter structure defining how to filter
   * @param data - Data containing filter values
   * @param options - Additional filter options (date formats, etc.)
   */
  public apply(
    query: CascadeQueryBuilder<any>,
    filters: FilterRules,
    data: any,
    options: FilterOptions,
  ): void {
    for (const key in filters) {
      const value = data[key];
      if (value === undefined) continue;

      const rule = this.parseFilterRule(key, filters[key]);
      this.applyFilterRule(query, rule, value, data, options);
    }
  }

  /**
   * Parse a filter rule into a structured format
   */
  private parseFilterRule(key: string, rule: FilterRule) {
    // Handle custom function
    if (typeof rule === "function") {
      return { type: "function", fn: rule, column: key };
    }

    // Handle array format: ["operator"] or ["operator", "column"] or ["operator", ["col1", "col2"]]
    if (Array.isArray(rule)) {
      const [operator, target] = rule;

      if (target === undefined) {
        return { type: operator, column: key, columns: undefined };
      }

      if (Array.isArray(target)) {
        return { type: operator, column: undefined, columns: target };
      }

      return { type: operator, column: target, columns: undefined };
    }

    // Handle simple operator string
    return { type: rule, column: key, columns: undefined };
  }

  /**
   * Apply a single filter rule to the query
   */
  private applyFilterRule(
    query: CascadeQueryBuilder<any>,
    rule: any,
    value: any,
    data: any,
    options: FilterOptions,
  ): void {
    // 1. Custom function filter
    if (rule.type === "function") {
      rule.fn(value, query, data);
      return;
    }

    // 2. Predefined filter types
    const handler = this.getFilterHandler(rule.type);
    if (handler) {
      handler.call(this, query, rule.column, rule.columns, value, options);
      return;
    }

    // 3. Standard where operators
    this.applyWhereOperator(query, rule.type, rule.column, rule.columns, value);
  }

  /**
   * Get filter handler for predefined types
   */
  private getFilterHandler(type: string): Function | undefined {
    const handlers: Record<string, Function> = {
      // Boolean filters
      bool: this.handleBoolean,
      boolean: this.handleBoolean,

      // Numeric filters
      int: this.handleInt,
      integer: this.handleInt,
      "!int": this.handleNotInt,
      "int>": (q: any, col: any, cols: any, val: any) =>
        this.handleIntComparison(q, col, cols, val, ">"),
      "int>=": (q: any, col: any, cols: any, val: any) =>
        this.handleIntComparison(q, col, cols, val, ">="),
      "int<": (q: any, col: any, cols: any, val: any) =>
        this.handleIntComparison(q, col, cols, val, "<"),
      "int<=": (q: any, col: any, cols: any, val: any) =>
        this.handleIntComparison(q, col, cols, val, "<="),
      inInt: this.handleInInt,
      number: this.handleNumber,
      inNumber: this.handleInNumber,
      float: this.handleFloat,
      double: this.handleFloat,
      inFloat: this.handleInNumber,

      // Null filters
      null: this.handleNull,
      notNull: this.handleNotNull,
      "!null": this.handleNotNull,

      // Date filters
      date: this.handleDate,
      "date>": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateComparison(q, col, cols, val, opts, ">"),
      "date>=": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateComparison(q, col, cols, val, opts, ">="),
      "date<": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateComparison(q, col, cols, val, opts, "<"),
      "date<=": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateComparison(q, col, cols, val, opts, "<="),
      dateBetween: this.handleDateBetween,
      inDate: this.handleInDate,

      // DateTime filters
      dateTime: this.handleDateTime,
      "dateTime>": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateTimeComparison(q, col, cols, val, opts, ">"),
      "dateTime>=": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateTimeComparison(q, col, cols, val, opts, ">="),
      "dateTime<": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateTimeComparison(q, col, cols, val, opts, "<"),
      "dateTime<=": (q: any, col: any, cols: any, val: any, opts: any) =>
        this.handleDateTimeComparison(q, col, cols, val, opts, "<="),
      dateTimeBetween: this.handleDateTimeBetween,
      inDateTime: this.handleInDateTime,

      // Scope filter - applies local scope when value is truthy
      scope: this.handleScope,

      // With filter - eager-loads a relation when value is truthy
      with: this.handleWith,

      // JoinWith filter - eager-loads a relation via SQL JOIN when value is truthy
      joinWith: this.handleJoinWith,

      // Vector similarity search — calls similarTo(column, embedding[])
      similarTo: this.handleSimilarTo,
    };

    return handlers[type];
  }

  /**
   * Apply standard where operators
   */
  private applyWhereOperator(
    query: QueryBuilderContract,
    operator: string,
    column?: string,
    columns?: string[],
    value?: any,
  ): void {
    // Handle "in" prefix for array values
    if (operator.startsWith("in") && operator !== "int" && !Array.isArray(value)) {
      value = [value];
    }

    // Single column
    if (column) {
      switch (operator) {
        case "=":
          query.where(column, value);
          break;
        case "!=":
        case "<>":
          query.where(column, "!=", value);
          break;
        case ">":
        case ">=":
        case "<":
        case "<=":
          query.where(column, operator, value);
          break;
        case "in":
          query.whereIn(column, Array.isArray(value) ? value : [value]);
          break;
        case "not in":
          query.whereNotIn(column, Array.isArray(value) ? value : [value]);
          break;
        case "like":
          query.whereLike(column, value);
          break;
        case "not like":
          query.whereNotLike(column, value);
          break;
        case "between":
          query.whereBetween(column, value);
          break;
        case "not between":
          query.whereNotBetween(column, value);
          break;
      }
    }
    // Multiple columns (OR condition)
    else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = value;
      }
      query.orWhere(conditions);
    }
  }

  // ============================================================================
  // BOOLEAN FILTERS
  // ============================================================================

  private handleBoolean(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const boolValue =
      value === "true" || value === true || value === 1 || value === "1" || !isEmpty(value);
    if (column) {
      query.where(column, boolValue);
    } else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = boolValue;
      }

      query.orWhere(conditions);
    }
  }

  // ============================================================================
  // NUMERIC FILTERS
  // ============================================================================
  private handleInt(query: QueryBuilderContract, column?: string, columns?: string[], value?: any) {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, intValue);
    } else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = intValue;
      }

      query.orWhere(conditions);
    }
  }

  private handleNotInt(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, "!=", intValue);
    } else if (columns) {
      // Use multiple orWhere calls for OR logic across columns
      for (const col of columns) {
        query.orWhere(col, "!=", intValue);
      }
    }
  }

  private handleIntComparison(
    query: QueryBuilderContract,
    column: any,
    columns: any,
    value: any,
    operator: string,
  ) {
    const intValue = parseInt(value);
    if (column) {
      query.where(column, operator, intValue);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere(col, operator, intValue);
      }
    }
  }

  private handleInInt(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const values = (Array.isArray(value) ? value : [value]).map((v: any) => parseInt(v));
    if (column) {
      query.whereIn(column, values);
    } else if (columns) {
      // Use multiple orWhere calls with whereIn for each column
      for (const col of columns) {
        query.orWhere((q: any) => q.whereIn(col, values));
      }
    }
  }

  private handleNumber(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const numValue = Number(value);
    if (column) {
      query.where(column, numValue);
    } else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = numValue;
      }

      query.orWhere(conditions);
    }
  }

  private handleInNumber(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const values = (Array.isArray(value) ? value : [value]).map((v: any) => Number(v));
    if (column) {
      query.whereIn(column, values);
    } else if (columns) {
      // Use multiple orWhere calls with whereIn for each column
      for (const col of columns) {
        query.orWhere((q: any) => q.whereIn(col, values));
      }
    }
  }

  private handleFloat(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    const floatValue = parseFloat(value);
    if (column) {
      query.where(column, floatValue);
    } else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = floatValue;
      }

      query.orWhere(conditions);
    }
  }

  // ============================================================================
  // NULL FILTERS
  // ============================================================================

  private handleNull(query: QueryBuilderContract, column?: string, columns?: string[]) {
    if (column) {
      query.whereNull(column);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere({ [col]: null });
      }
    }
  }

  private handleNotNull(query: QueryBuilderContract, column?: string, columns?: string[]) {
    if (column) {
      query.whereNotNull(column);
    } else if (columns) {
      // Use whereNotNull for each column
      for (const col of columns) {
        query.orWhere((q: any) => q.whereNotNull(col));
      }
    }
  }

  // ============================================================================
  // SCOPE FILTER
  // ============================================================================

  /**
   * Handle scope filter - applies local scope and passes the filter value.
   *
   * Usage in filterBy:
   * ```typescript
   * filterBy: {
   *   active: "scope",           // Uses the filter key as scope name
   *   isAdmin: ["scope", "admin"] // Uses custom scope name
   * }
   * ```
   *
   * When list({ active: true }) is called, it will call query.scope("active", true)
   * When list({ status: "pending" }) is called, it will call query.scope("status", "pending")
   */
  private handleScope(
    query: QueryBuilderContract,
    column?: string,
    _columns?: string[],
    value?: any,
  ) {
    // column holds the scope name (either the filter key or custom name from array format)
    if (column) {
      query.scope(column, value);
    }
  }

  // ============================================================================
  // WITH (EAGER LOAD) FILTER
  // ============================================================================

  /**
   * Handle with filter - eager-loads a relation when the filter value is truthy.
   *
   * Usage in filterBy:
   * ```typescript
   * filterBy: {
   *   with_ai_model: ["with", "ai_model"],         // load single relation
   *   with_all:      ["with", ["ai_model", "unit"]] // load multiple relations
   * }
   * ```
   *
   * When list({ with_ai_model: true }) is called, it will call query.with("ai_model")
   */
  private handleWith(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    if (!value) return;

    // Load a single named relation
    if (column) {
      if (query.with) {
        query.with(column);
      }
      return;
    }

    // Load multiple relations from the columns array
    if (columns) {
      for (const relation of columns) {
        if (query.with) {
          query.with(relation);
        }
      }
    }
  }

  /**
   * Handle joinWith filter - eager-loads a relation via SQL JOIN when the filter value is truthy.
   *
   * Usage in filterBy:
   * ```typescript
   * filterBy: {
   *   with_ai_model: ["joinWith", "ai_model"],         // load single relation via join
   *   with_all:      ["joinWith", ["ai_model", "unit"]] // load multiple relations via join
   * }
   * ```
   *
   * When list({ with_ai_model: true }) is called, it will call query.joinWith("ai_model")
   */
  private handleJoinWith(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
  ) {
    if (!value) return;

    if (!query.joinWith) {
      console.warn(
        "[Repository] joinWith is not supported by the query builder. using with instead.",
      );
      return this.handleWith(query, column, columns, value);
    }

    // Load a single named relation
    if (column) {
      query.joinWith(column);
      return;
    }

    // Load multiple relations from the columns array
    if (columns) {
      query.joinWith(...columns);
    }
  }

  // ============================================================================
  // VECTOR FILTER
  // ============================================================================

  /**
   * Handle similarTo filter — performs vector similarity search.
   *
   * The filter value must be a `number[]` (pre-computed embedding).
   * Delegates to `query.similarTo(column, embedding)` which is handled
   * driver-specifically (pgvector or MongoDB Atlas $vectorSearch).
   *
   * Usage in filterBy:
   * ```typescript
   * filterBy: {
   *   organization_id: "=",
   *   embedding: "similarTo",
   * }
   * ```
   *
   * Then in the service:
   * ```typescript
   * await vectorsRepository.list({ embedding: queryEmbedding, organization_id: orgId });
   * ```
   */
  private handleSimilarTo(
    query: QueryBuilderContract,
    column?: string,
    _columns?: string[],
    value?: any,
  ) {
    if (!column || !Array.isArray(value)) return;

    // Cast to any: Cascade's internal QueryBuilderContract still uses nearestTo;
    // our wrapper (CascadeQueryBuilder.similarTo) delegates to it correctly.
    (query as any).similarTo(column, value);
  }

  // ============================================================================
  // DATE FILTERS
  // ============================================================================

  private handleDate(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    const dateValue = this.parseDate(value, options?.dateFormat);
    if (column) {
      query.whereDate(column, dateValue);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere((q: any) => q.whereDate(col, dateValue));
      }
    }
  }

  private handleDateComparison(
    query: QueryBuilderContract,
    column: any,
    columns: any,
    value: any,
    options: any,
    operator: string,
  ) {
    const dateValue = this.parseDate(value, options?.dateFormat);
    if (column) {
      if (operator === ">" || operator === ">=") {
        query.whereDateAfter(column, dateValue);
      } else {
        query.whereDateBefore(column, dateValue);
      }
    } else if (columns) {
      for (const col of columns) {
        if (operator === ">" || operator === ">=") {
          query.orWhere((q: any) => q.whereDateAfter(col, dateValue));
        } else {
          query.orWhere((q: any) => q.whereDateBefore(col, dateValue));
        }
      }
    }
  }

  private handleDateBetween(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    if (!Array.isArray(value) || value.length !== 2) return;
    const [start, end] = value.map((v: any) => this.parseDate(v, options?.dateFormat));
    if (column) {
      query.whereDateBetween(column, [start, end]);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere((q: any) => q.whereDateBetween(col, [start, end]));
      }
    }
  }

  private handleInDate(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    const dates = (Array.isArray(value) ? value : [value]).map((v: any) =>
      this.parseDate(v, options?.dateFormat),
    );
    if (column) {
      query.whereIn(column, dates);
    } else if (columns) {
      // Use multiple orWhere calls with whereIn for each column
      for (const col of columns) {
        query.orWhere((q: any) => q.whereIn(col, dates));
      }
    }
  }

  // ============================================================================
  // DATETIME FILTERS
  // ============================================================================

  private handleDateTime(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    const dateValue = this.parseDateTime(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, dateValue);
    } else if (columns) {
      const conditions: any = {};
      for (const col of columns) {
        conditions[col] = dateValue;
      }

      query.orWhere(conditions);
    }
  }

  private handleDateTimeComparison(
    query: QueryBuilderContract,
    column: any,
    columns: any,
    value: any,
    options: any,
    operator: string,
  ) {
    const dateValue = this.parseDateTime(value, options?.dateTimeFormat);
    if (column) {
      query.where(column, operator, dateValue);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere(col, operator, dateValue);
      }
    }
  }

  private handleDateTimeBetween(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    if (!Array.isArray(value) || value.length !== 2) return;
    const [start, end] = value.map((v: any) => this.parseDateTime(v, options?.dateTimeFormat));
    if (column) {
      query.whereBetween(column, [start, end]);
    } else if (columns) {
      for (const col of columns) {
        query.orWhere((q: any) => q.whereBetween(col, [start, end]));
      }
    }
  }

  private handleInDateTime(
    query: QueryBuilderContract,
    column?: string,
    columns?: string[],
    value?: any,
    options?: FilterOptions,
  ) {
    const dates = (Array.isArray(value) ? value : [value]).map((v: any) =>
      this.parseDateTime(v, options?.dateTimeFormat),
    );
    if (column) {
      query.whereIn(column, dates);
    } else if (columns) {
      // Use multiple orWhere calls with whereIn for each column
      for (const col of columns) {
        query.orWhere((q: any) => q.whereIn(col, dates));
      }
    }
  }

  // ============================================================================
  // DATE PARSING UTILITIES
  // ============================================================================

  /**
   * Parse date string to Date object
   * TODO: Implement proper date parsing with format support
   */
  private parseDate(value: any, format?: string): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  }

  /**
   * Parse datetime string to Date object
   * TODO: Implement proper datetime parsing with format support
   */
  private parseDateTime(value: any, format?: string): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  }
}
