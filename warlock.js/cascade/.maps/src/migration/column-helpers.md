# column-helpers
source: migration/column-helpers.ts
description: Standalone column helper functions and DetachedColumnBuilder for use outside a migration class context.
complexity: medium
first-mapped: 2026-04-17 03:34:41 PM
last-mapped: 2026-04-17 03:34:41 PM

## Imports
- `ColumnBuilder` from `./column-builder`

## Exports
- `DetachedColumnBuilder` — ColumnBuilder with own detached migration sink  [lines 47-59]
- `string` — standalone varchar column helper  [lines 77-79]
- `char` — standalone fixed-length CHAR helper  [lines 89-91]
- `text` — standalone TEXT column helper  [lines 105-107]
- `mediumText` — standalone MEDIUMTEXT column helper  [lines 112-114]
- `longText` — standalone LONGTEXT column helper  [lines 119-121]
- `integer` — standalone INTEGER column helper  [lines 135-137]
- `int` — alias for integer  [line 140]
- `smallInteger` — standalone SMALLINT column helper  [lines 145-147]
- `smallInt` — alias for smallInteger  [line 150]
- `tinyInteger` — standalone TINYINT column helper  [lines 155-157]
- `tinyInt` — alias for tinyInteger  [line 160]
- `bigInteger` — standalone BIGINT column helper  [lines 165-167]
- `bigInt` — alias for bigInteger  [line 170]
- `float` — standalone FLOAT column helper  [lines 175-177]
- `double` — standalone DOUBLE column helper  [lines 182-184]
- `decimal` — standalone DECIMAL with precision/scale  [lines 194-196]
- `boolCol` — standalone BOOLEAN column helper  [lines 212-214]
- `bool` — alias for boolCol  [line 217]
- `date` — standalone DATE column helper  [lines 226-228]
- `dateTime` — standalone DATETIME column helper  [lines 233-235]
- `timestamp` — standalone TIMESTAMP column helper  [lines 245-247]
- `time` — standalone TIME column helper  [lines 252-254]
- `year` — standalone YEAR column helper  [lines 259-261]
- `json` — standalone JSON column helper  [lines 278-280]
- `objectCol` — alias for json column  [lines 285-287]
- `binary` — standalone BINARY/BLOB column helper  [lines 292-294]
- `blobCol` — alias for binary column  [lines 299-301]
- `uuid` — standalone UUID column helper  [lines 319-321]
- `ulid` — standalone ULID column helper  [lines 326-328]
- `ipAddress` — standalone IP address column helper  [lines 337-339]
- `macAddress` — standalone MAC address column helper  [lines 344-346]
- `point` — standalone geo point column helper  [lines 355-357]
- `polygon` — standalone polygon column helper  [lines 362-364]
- `lineString` — standalone line string column helper  [lines 369-371]
- `geometry` — standalone geometry column helper  [lines 376-378]
- `vector` — standalone vector column for AI embeddings  [lines 394-396]
- `enumCol` — standalone ENUM column helper  [lines 410-412]
- `setCol` — standalone SET column helper  [lines 417-419]
- `arrayInt` — standalone INTEGER[] column helper  [lines 426-428]
- `arrayBigInt` — standalone BIGINT[] column helper  [lines 431-433]
- `arrayFloat` — standalone REAL[] column helper  [lines 436-438]
- `arrayDecimal` — standalone DECIMAL[] column helper  [lines 441-443]
- `arrayBoolean` — standalone BOOLEAN[] column helper  [lines 446-448]
- `arrayText` — standalone TEXT[] column helper  [lines 451-453]
- `arrayDate` — standalone DATE[] column helper  [lines 456-458]
- `arrayTimestamp` — standalone TIMESTAMPTZ[] column helper  [lines 461-463]
- `arrayUuid` — standalone UUID[] column helper  [lines 466-468]

## Classes / Functions / Types / Constants

### `DetachedColumnBuilder` [lines 47-59]
- Extends `ColumnBuilder` with a self-contained `DetachedMigrationSink`.
- side-effects: collects pending indexes, foreign keys, vector indexes on sink

### `string` [lines 77-79]
- Returns DetachedColumnBuilder of type "string" with optional length.

### `decimal` [lines 194-196]
- Returns DetachedColumnBuilder with precision and scale options.

### `vector` [lines 394-396]
- Returns DetachedColumnBuilder typed "vector" with dimensions option.

### `enumCol` [lines 410-412]
- Returns DetachedColumnBuilder typed "enum" with allowed values array.
