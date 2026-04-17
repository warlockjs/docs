# column-helpers
source: migration/column-helpers.ts
description: Standalone column helper functions and DetachedColumnBuilder for use in Migration.create() / Migration.alter() schemas
complexity: moderate
first-mapped: 2026-04-17
last-mapped: 2026-04-17
created-by: claude-opus-4-7
last-updated-by: claude-opus-4-7

## Imports
- `ColumnBuilder` from `./column-builder`
- `VectorIndexOptions` (type-only) from `../contracts/migration-driver.contract`

## Exports
- `DetachedColumnBuilder` — ColumnBuilder subclass carrying its own detached sink for standalone use  [lines 47-59]
- `string` — VARCHAR column helper with configurable length  [lines 77-79]
- `char` — fixed-length CHAR column helper  [lines 89-91]
- `text` — TEXT column helper  [lines 105-107]
- `mediumText` — MEDIUMTEXT column helper  [lines 112-114]
- `longText` — LONGTEXT column helper  [lines 119-121]
- `integer` — INTEGER column helper  [lines 135-137]
- `int` — alias for `integer()`  [line 140]
- `smallInteger` — SMALLINT column helper  [lines 145-147]
- `smallInt` — alias for `smallInteger()`  [line 150]
- `tinyInteger` — TINYINT column helper  [lines 155-157]
- `tinyInt` — alias for `tinyInteger()`  [line 160]
- `bigInteger` — BIGINT column helper  [lines 165-167]
- `bigInt` — alias for `bigInteger()`  [line 170]
- `float` — FLOAT column helper  [lines 175-177]
- `double` — DOUBLE column helper  [lines 182-184]
- `decimal` — DECIMAL column helper with precision/scale  [lines 194-196]
- `boolCol` — BOOLEAN column helper (avoids `boolean` primitive collision)  [lines 212-214]
- `bool` — alias for `boolCol()`  [line 217]
- `date` — DATE column helper  [lines 226-228]
- `dateTime` — DATETIME column helper  [lines 233-235]
- `timestamp` — TIMESTAMP column helper  [lines 245-247]
- `time` — TIME column helper  [lines 252-254]
- `year` — YEAR column helper  [lines 259-261]
- `json` — JSON column helper  [lines 278-280]
- `objectCol` — alias for `json()` (avoids TS `object` collision)  [lines 285-287]
- `binary` — BINARY/BLOB column helper  [lines 292-294]
- `blobCol` — alias for `binary()` (avoids Web `Blob` API collision)  [lines 299-301]
- `uuid` — UUID column helper  [lines 319-321]
- `ulid` — ULID column helper  [lines 326-328]
- `ipAddress` — IP address column helper  [lines 337-339]
- `macAddress` — MAC address column helper  [lines 344-346]
- `point` — geo point column helper  [lines 355-357]
- `polygon` — polygon column helper  [lines 362-364]
- `lineString` — line string column helper  [lines 369-371]
- `geometry` — generic geometry column helper  [lines 376-378]
- `vector` — vector column helper for AI embeddings  [lines 394-396]
- `enumCol` — ENUM column helper  [lines 410-412]
- `setCol` — SET (multi-value) column helper  [lines 417-419]
- `arrayInt` — INTEGER[] PostgreSQL array helper  [lines 426-428]
- `arrayBigInt` — BIGINT[] PostgreSQL array helper  [lines 431-433]
- `arrayFloat` — REAL[] PostgreSQL array helper  [lines 436-438]
- `arrayDecimal` — DECIMAL[] PostgreSQL array helper  [lines 441-443]
- `arrayBoolean` — BOOLEAN[] PostgreSQL array helper  [lines 446-448]
- `arrayText` — TEXT[] PostgreSQL array helper  [lines 451-453]
- `arrayDate` — DATE[] PostgreSQL array helper  [lines 456-458]
- `arrayTimestamp` — TIMESTAMPTZ[] PostgreSQL array helper  [lines 461-463]
- `arrayUuid` — UUID[] PostgreSQL array helper  [lines 466-468]

## Classes / Functions / Types / Constants

### `DetachedColumnBuilder` [lines 47-59]
- `class DetachedColumnBuilder extends ColumnBuilder`
- Constructor: `constructor(type: ConstructorParameters<typeof ColumnBuilder>[2], name: string, options?: ConstructorParameters<typeof ColumnBuilder>[3])`
- Public readonly property: `sink: DetachedMigrationSink` — collects pending indexes, foreign keys, and vector indexes that are later merged into the real migration instance
- Constructs an internal `DetachedMigrationSink` (module-private) and passes it as the migration context to the parent `ColumnBuilder`

### `string` [lines 77-79]
- `function string(length = 255): DetachedColumnBuilder`
- Creates a VARCHAR column (default length 255)

### `char` [lines 89-91]
- `function char(length: number): DetachedColumnBuilder`
- Creates a fixed-length CHAR column

### `text` [lines 105-107]
- `function text(): DetachedColumnBuilder`
- Creates a TEXT column (unlimited length)

### `mediumText` [lines 112-114]
- `function mediumText(): DetachedColumnBuilder`
- Creates a MEDIUMTEXT column

### `longText` [lines 119-121]
- `function longText(): DetachedColumnBuilder`
- Creates a LONGTEXT column

### `integer` [lines 135-137]
- `function integer(): DetachedColumnBuilder`
- Creates an INTEGER column

### `int` [line 140]
- `const int = integer`
- Alias for `integer()`

### `smallInteger` [lines 145-147]
- `function smallInteger(): DetachedColumnBuilder`
- Creates a SMALLINT column

### `smallInt` [line 150]
- `const smallInt = smallInteger`
- Alias for `smallInteger()`

### `tinyInteger` [lines 155-157]
- `function tinyInteger(): DetachedColumnBuilder`
- Creates a TINYINT column

### `tinyInt` [line 160]
- `const tinyInt = tinyInteger`
- Alias for `tinyInteger()`

### `bigInteger` [lines 165-167]
- `function bigInteger(): DetachedColumnBuilder`
- Creates a BIGINT column

### `bigInt` [line 170]
- `const bigInt = bigInteger`
- Alias for `bigInteger()`

### `float` [lines 175-177]
- `function float(): DetachedColumnBuilder`
- Creates a FLOAT column

### `double` [lines 182-184]
- `function double(): DetachedColumnBuilder`
- Creates a DOUBLE column

### `decimal` [lines 194-196]
- `function decimal(precision = 8, scale = 2): DetachedColumnBuilder`
- Creates a DECIMAL column with configurable precision and scale

### `boolCol` [lines 212-214]
- `function boolCol(): DetachedColumnBuilder`
- Creates a BOOLEAN column. Named `boolCol` to avoid collision with TS/JS `boolean` primitive

### `bool` [line 217]
- `export { boolCol as bool }`
- Alias for `boolCol()`

### `date` [lines 226-228]
- `function date(): DetachedColumnBuilder`
- Creates a DATE column

### `dateTime` [lines 233-235]
- `function dateTime(): DetachedColumnBuilder`
- Creates a DATETIME column

### `timestamp` [lines 245-247]
- `function timestamp(): DetachedColumnBuilder`
- Creates a TIMESTAMP column

### `time` [lines 252-254]
- `function time(): DetachedColumnBuilder`
- Creates a TIME column

### `year` [lines 259-261]
- `function year(): DetachedColumnBuilder`
- Creates a YEAR column

### `json` [lines 278-280]
- `function json(): DetachedColumnBuilder`
- Creates a JSON column

### `objectCol` [lines 285-287]
- `function objectCol(): DetachedColumnBuilder`
- Alias for `json()`. Named `objectCol` to avoid collision with TS `object` type

### `binary` [lines 292-294]
- `function binary(): DetachedColumnBuilder`
- Creates a BINARY/BLOB column

### `blobCol` [lines 299-301]
- `function blobCol(): DetachedColumnBuilder`
- Alias for `binary()`. Named `blobCol` to avoid collision with Web `Blob` API

### `uuid` [lines 319-321]
- `function uuid(): DetachedColumnBuilder`
- Creates a UUID column

### `ulid` [lines 326-328]
- `function ulid(): DetachedColumnBuilder`
- Creates a ULID column

### `ipAddress` [lines 337-339]
- `function ipAddress(): DetachedColumnBuilder`
- Creates an IP address column

### `macAddress` [lines 344-346]
- `function macAddress(): DetachedColumnBuilder`
- Creates a MAC address column

### `point` [lines 355-357]
- `function point(): DetachedColumnBuilder`
- Creates a geo POINT column

### `polygon` [lines 362-364]
- `function polygon(): DetachedColumnBuilder`
- Creates a POLYGON column

### `lineString` [lines 369-371]
- `function lineString(): DetachedColumnBuilder`
- Creates a LINESTRING column

### `geometry` [lines 376-378]
- `function geometry(): DetachedColumnBuilder`
- Creates a generic GEOMETRY column

### `vector` [lines 394-396]
- `function vector(dimensions: number): DetachedColumnBuilder`
- Creates a VECTOR column for AI embeddings with the specified dimensions (e.g. 1536 for text-embedding-3-small)

### `enumCol` [lines 410-412]
- `function enumCol(values: string[]): DetachedColumnBuilder`
- Creates an ENUM column constrained to the given values

### `setCol` [lines 417-419]
- `function setCol(values: string[]): DetachedColumnBuilder`
- Creates a SET column (stores multiple values from a fixed list)

### `arrayInt` [lines 426-428]
- `function arrayInt(): DetachedColumnBuilder`
- Creates an INTEGER[] PostgreSQL array column

### `arrayBigInt` [lines 431-433]
- `function arrayBigInt(): DetachedColumnBuilder`
- Creates a BIGINT[] PostgreSQL array column

### `arrayFloat` [lines 436-438]
- `function arrayFloat(): DetachedColumnBuilder`
- Creates a REAL[] PostgreSQL array column

### `arrayDecimal` [lines 441-443]
- `function arrayDecimal(precision?: number, scale?: number): DetachedColumnBuilder`
- Creates a DECIMAL[] PostgreSQL array column with optional precision/scale

### `arrayBoolean` [lines 446-448]
- `function arrayBoolean(): DetachedColumnBuilder`
- Creates a BOOLEAN[] PostgreSQL array column

### `arrayText` [lines 451-453]
- `function arrayText(): DetachedColumnBuilder`
- Creates a TEXT[] PostgreSQL array column

### `arrayDate` [lines 456-458]
- `function arrayDate(): DetachedColumnBuilder`
- Creates a DATE[] PostgreSQL array column

### `arrayTimestamp` [lines 461-463]
- `function arrayTimestamp(): DetachedColumnBuilder`
- Creates a TIMESTAMPTZ[] PostgreSQL array column

### `arrayUuid` [lines 466-468]
- `function arrayUuid(): DetachedColumnBuilder`
- Creates a UUID[] PostgreSQL array column
