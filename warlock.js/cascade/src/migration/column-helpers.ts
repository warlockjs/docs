import { ColumnBuilder } from "./column-builder";

/**
 * A no-op migration sink used by standalone column helpers.
 *
 * When column helpers are used in `Migration.create()` / `Migration.alter()`,
 * the builder is constructed without a real migration context. The actual
 * operations are dequeued from the ColumnBuilder's definition and replayed
 * onto the real migration instance at execution time.
 *
 * Index and FK operations queued on this sink are collected and transferred
 * to the real migration by the factory methods.
 */
class DetachedMigrationSink {
  /** Pending indexes registered via .unique() / .index() on a helper column. */
  public readonly pendingIndexes: { columns: string[]; unique?: boolean }[] = [];

  /** Pending FK definitions registered via .references() on a helper column. */
  public readonly pendingForeignKeys: object[] = [];

  /** Pending Vector index definitions registered via .vectorIndex() on a helper column. */
  public readonly pendingVectorIndexes: {
    column: string;
    options: import("../contracts/migration-driver.contract").VectorIndexOptions;
  }[] = [];

  public addPendingIndex(index: { columns: string[]; unique?: boolean }): void {
    this.pendingIndexes.push(index);
  }

  public addForeignKeyOperation(fk: object): void {
    this.pendingForeignKeys.push(fk);
  }

  public addPendingVectorIndex(
    column: string,
    options: Omit<import("../contracts/migration-driver.contract").VectorIndexOptions, "column">,
  ): void {
    this.pendingVectorIndexes.push({ column, options: options as any });
  }
}

/**
 * A `ColumnBuilder` that carries its own detached sink so it can be
 * constructed outside of a migration class and later merged in.
 */
export class DetachedColumnBuilder extends ColumnBuilder {
  public readonly sink: DetachedMigrationSink;

  public constructor(
    type: ConstructorParameters<typeof ColumnBuilder>[2],
    name: string,
    options: ConstructorParameters<typeof ColumnBuilder>[3] = {},
  ) {
    const sink = new DetachedMigrationSink();
    super(sink as any, name, type, options);
    this.sink = sink;
  }
}

// ============================================================================
// STRING HELPERS
// ============================================================================

/**
 * Standalone column helper: string / varchar.
 *
 * @example
 * ```typescript
 * import { Migration, string } from "@warlock.js/cascade";
 *
 * export default Migration.create(User, {
 *   username: string(50).unique(),
 * });
 * ```
 */
export function string(length = 255): DetachedColumnBuilder {
  return new DetachedColumnBuilder("string", "__placeholder__", { length });
}

/**
 * Standalone column helper: fixed-length CHAR.
 *
 * @example
 * ```typescript
 * code: char(3) // CHAR(3)
 * ```
 */
export function char(length: number): DetachedColumnBuilder {
  return new DetachedColumnBuilder("char", "__placeholder__", { length });
}

/**
 * Standalone column helper: TEXT (unlimited length).
 *
 * @example
 * ```typescript
 * import { Migration, text } from "@warlock.js/cascade";
 *
 * export default Migration.create(User, {
 *   bio: text().nullable(),
 * });
 * ```
 */
export function text(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("text", "__placeholder__");
}

/**
 * Standalone column helper: MEDIUMTEXT.
 */
export function mediumText(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("mediumText", "__placeholder__");
}

/**
 * Standalone column helper: LONGTEXT.
 */
export function longText(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("longText", "__placeholder__");
}

// ============================================================================
// NUMERIC HELPERS
// ============================================================================

/**
 * Standalone column helper: INTEGER.
 *
 * @example
 * ```typescript
 * age: integer().unsigned()
 * ```
 */
export function integer(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("integer", "__placeholder__");
}

/** Alias for `integer()`. */
export const int = integer;

/**
 * Standalone column helper: SMALLINT.
 */
export function smallInteger(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("smallInteger", "__placeholder__");
}

/** Alias for `smallInteger()`. */
export const smallInt = smallInteger;

/**
 * Standalone column helper: TINYINT.
 */
export function tinyInteger(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("tinyInteger", "__placeholder__");
}

/** Alias for `tinyInteger()`. */
export const tinyInt = tinyInteger;

/**
 * Standalone column helper: BIGINT.
 */
export function bigInteger(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("bigInteger", "__placeholder__");
}

/** Alias for `bigInteger()`. */
export const bigInt = bigInteger;

/**
 * Standalone column helper: FLOAT.
 */
export function float(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("float", "__placeholder__");
}

/**
 * Standalone column helper: DOUBLE.
 */
export function double(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("double", "__placeholder__");
}

/**
 * Standalone column helper: DECIMAL.
 *
 * @example
 * ```typescript
 * price: decimal(10, 2) // DECIMAL(10,2)
 * ```
 */
export function decimal(precision = 8, scale = 2): DetachedColumnBuilder {
  return new DetachedColumnBuilder("decimal", "__placeholder__", { precision, scale });
}

// ============================================================================
// BOOLEAN HELPERS
// ============================================================================

/**
 * Standalone column helper: BOOLEAN.
 *
 * Named `boolCol` to avoid collision with the TypeScript / JS `boolean` primitive.
 *
 * @example
 * ```typescript
 * is_active: boolCol().default(true)
 * ```
 */
export function boolCol(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("boolean", "__placeholder__");
}

/** Alias for `boolCol()`. */
export { boolCol as bool };

// ============================================================================
// DATE / TIME HELPERS
// ============================================================================

/**
 * Standalone column helper: DATE.
 */
export function date(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("date", "__placeholder__");
}

/**
 * Standalone column helper: DATETIME.
 */
export function dateTime(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("dateTime", "__placeholder__");
}

/**
 * Standalone column helper: TIMESTAMP.
 *
 * @example
 * ```typescript
 * started_at: timestamp().default("NOW()")
 * ```
 */
export function timestamp(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("timestamp", "__placeholder__");
}

/**
 * Standalone column helper: TIME.
 */
export function time(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("time", "__placeholder__");
}

/**
 * Standalone column helper: YEAR.
 */
export function year(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("year", "__placeholder__");
}

// ============================================================================
// JSON & BINARY HELPERS
// ============================================================================

/**
 * Standalone column helper: JSON.
 *
 * Named `jsonCol` to avoid collision with the TS/JSON built-in names.
 * Use `json()` is fine for most cases though — this alias exists for clarity.
 *
 * @example
 * ```typescript
 * metadata: json().nullable()
 * ```
 */
export function json(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("json", "__placeholder__");
}

/**
 * Alias for `json()`. Named `objectCol` to avoid collision with TS `object` type.
 */
export function objectCol(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("json", "__placeholder__");
}

/**
 * Standalone column helper: BINARY / BLOB.
 */
export function binary(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("binary", "__placeholder__");
}

/**
 * Alias for `binary()`. Named `blobCol` to avoid collision with the Web `Blob` API.
 */
export function blobCol(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("binary", "__placeholder__");
}

// ============================================================================
// IDENTIFIER HELPERS
// ============================================================================

/**
 * Standalone column helper: UUID.
 *
 * @example
 * ```typescript
 * import { Migration, uuid } from "@warlock.js/cascade";
 *
 * export default Migration.create(Chat, {
 *   organization_id: uuid().references(Organization).onDelete("cascade"),
 * });
 * ```
 */
export function uuid(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("uuid", "__placeholder__");
}

/**
 * Standalone column helper: ULID.
 */
export function ulid(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("ulid", "__placeholder__");
}

// ============================================================================
// NETWORK HELPERS
// ============================================================================

/**
 * Standalone column helper: IP address.
 */
export function ipAddress(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("ipAddress", "__placeholder__");
}

/**
 * Standalone column helper: MAC address.
 */
export function macAddress(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("macAddress", "__placeholder__");
}

// ============================================================================
// SPATIAL HELPERS
// ============================================================================

/**
 * Standalone column helper: geo point.
 */
export function point(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("point", "__placeholder__");
}

/**
 * Standalone column helper: polygon.
 */
export function polygon(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("polygon", "__placeholder__");
}

/**
 * Standalone column helper: line string.
 */
export function lineString(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("lineString", "__placeholder__");
}

/**
 * Standalone column helper: generic geometry.
 */
export function geometry(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("geometry", "__placeholder__");
}

// ============================================================================
// AI / ML HELPERS
// ============================================================================

/**
 * Standalone column helper: vector (for AI embeddings).
 *
 * @param dimensions - Embedding size (e.g. 1536 for text-embedding-3-small)
 *
 * @example
 * ```typescript
 * embedding: vector(1536)
 * ```
 */
export function vector(dimensions: number): DetachedColumnBuilder {
  return new DetachedColumnBuilder("vector", "__placeholder__", { dimensions });
}

// ============================================================================
// ENUM & SET HELPERS
// ============================================================================

/**
 * Standalone column helper: ENUM.
 *
 * @example
 * ```typescript
 * status: enumCol(["active", "inactive", "pending"])
 * ```
 */
export function enumCol(values: string[]): DetachedColumnBuilder {
  return new DetachedColumnBuilder("enum", "__placeholder__", { values });
}

/**
 * Standalone column helper: SET (multiple values).
 */
export function setCol(values: string[]): DetachedColumnBuilder {
  return new DetachedColumnBuilder("set", "__placeholder__", { values });
}

// ============================================================================
// POSTGRESQL ARRAY HELPERS
// ============================================================================

/** Standalone helper: INTEGER[] */
export function arrayInt(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayInt", "__placeholder__");
}

/** Standalone helper: BIGINT[] */
export function arrayBigInt(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayBigInt", "__placeholder__");
}

/** Standalone helper: REAL[] */
export function arrayFloat(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayFloat", "__placeholder__");
}

/** Standalone helper: DECIMAL[] */
export function arrayDecimal(precision?: number, scale?: number): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayDecimal", "__placeholder__", { precision, scale });
}

/** Standalone helper: BOOLEAN[] */
export function arrayBoolean(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayBoolean", "__placeholder__");
}

/** Standalone helper: TEXT[] */
export function arrayText(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayText", "__placeholder__");
}

/** Standalone helper: DATE[] */
export function arrayDate(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayDate", "__placeholder__");
}

/** Standalone helper: TIMESTAMPTZ[] */
export function arrayTimestamp(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayTimestamp", "__placeholder__");
}

/** Standalone helper: UUID[] */
export function arrayUuid(): DetachedColumnBuilder {
  return new DetachedColumnBuilder("arrayUuid", "__placeholder__");
}
