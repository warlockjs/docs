# Utils
created: 2026-04-17 03:34:41 PM
updated: 2026-04-17 03:34:41 PM

> Shared utility functions and types that wire together database connections, model definition, pre-save transformation, date validation, and connection lifecycle hooks for the Cascade ORM.

## What lives here
- `connect-to-database.ts` — high-level factory that instantiates a driver, creates a DataSource, registers it, and opens the connection
- `database-writer.utils.ts` — factory wrapping a model-aware callback into a seal `TransformerCallback` for pre-save value transformation
- `define-model.ts` — declarative factory for creating typed `Model` subclasses with schema, strategies, and custom properties or statics
- `is-valid-date-value.ts` — pure guard function that validates numeric timestamps and strict ISO 8601 date strings, rejecting JS auto-corrected dates
- `once-connected.ts` — helpers that fire a callback immediately or on the matching DataSource connection/disconnection event

## Public API
- `DatabaseDriver` — union `"mongodb" | "postgres" | "mysql"`
- `ModelDefaultConfig` — alias for `Partial<ModelDefaults>` used in connection config
- `ConnectionOptions<TDriverOptions, TClientOptions>` — generic connection configuration shape
- `connectToDatabase(options: ConnectionOptions): Promise<DataSource>` — creates, registers, and connects a DataSource
- `getDatabaseDriver<T>(): T` — returns typed driver from the default DataSource
- `transaction<T>(fn, options?): Promise<T>` — shorthand wrapper for driver transaction method
- `ModelTransformCallback` — function type for model-aware value transformer callbacks
- `useModelTransformer(callback: ModelTransformCallback): TransformerCallback` — adapts callback to seal's transformer shape
- `DefineModelOptions<TSchema>` — options bag: table, name, schema, deleteStrategy, strictMode, ID config, properties, statics
- `defineModel(options: DefineModelOptions): typeof Model` — factory returning a typed Model subclass
- `ModelType<T>` — type helper to extract schema type from a `defineModel` return value
- `isValidDateValue(value: unknown): boolean` — validates numeric timestamps and strict ISO strings; rejects JS-corrected dates
- `onceConnected(dataSourceOrNameOrCallback, callback?)` — fires callback when target DataSource connects
- `onceDisconnected(dataSourceOrNameOrCallback, callback?)` — fires callback when target DataSource disconnects

## How it fits together
`connectToDatabase` is the entry point: it instantiates the appropriate driver (`MongoDbDriver` or `PostgresDriver`), wraps it in a `DataSource`, and registers it with `dataSourceRegistry`. Once registered, `onceConnected` and `onceDisconnected` listen to registry events so downstream code can react to connection lifecycle without polling. `defineModel` builds typed `Model` subclasses that are bound to a DataSource at query time, while `useModelTransformer` adapts model-context callbacks into the seal transformer pipeline that runs during pre-save validation. `isValidDateValue` is a standalone guard with no dependencies, used by date-type columns to reject invalid or auto-corrected inputs before they reach the driver.

## Working examples
```typescript
import {
  connectToDatabase,
  getDatabaseDriver,
  transaction,
  defineModel,
  ModelType,
  useModelTransformer,
  isValidDateValue,
  onceConnected,
  onceDisconnected,
} from "@warlock.js/cascade";
import { v } from "@warlock.js/seal";

// 1. Connect to MongoDB
const dataSource = await connectToDatabase({
  driver: "mongodb",
  database: "myapp",
  host: "localhost",
  port: 27017,
  driverOptions: { autoGenerateId: true },
  modelOptions: { randomIncrement: true, initialId: 1000 },
});

// 2. React to connection lifecycle
onceConnected((ds) => {
  console.log("Connected to:", ds.name);
});

onceDisconnected((ds) => {
  console.log("Disconnected from:", ds.name);
});

// 3. Define a typed model
export const User = defineModel({
  table: "users",
  name: "User",
  schema: v.object({
    name: v.string().required().trim(),
    email: v.string().email().required().lowercase(),
    role: v.string().default("user"),
  }),
  deleteStrategy: "soft",
  statics: {
    async findByEmail(email: string) {
      return this.first({ email });
    },
  },
});

type UserSchema = ModelType<typeof User>;

// 4. Run a transaction
await transaction(async (ctx) => {
  const user = await User.create({ name: "Jane", email: "jane@example.com" });
  return user;
});

// 5. Guard a date field before persistence
const valid = isValidDateValue("2024-02-29"); // false — 2024 is leap year, but validate carefully
const validTs = isValidDateValue(Date.now());  // true

// 6. Pre-save transformer
const uppercaseRole = useModelTransformer(({ value }) => String(value).toUpperCase());
```

## DO NOT
- Do NOT pass `"mysql"` as `driver` to `connectToDatabase` — MySQL is not yet implemented and will throw immediately.
- Do NOT call `onceConnected` or `onceDisconnected` with a data source name or instance without providing the `callback` argument — it will throw `Error: Callback is required when providing a data source name or instance.`
- Do NOT pass non-ISO strings or JS auto-corrected dates (e.g. `"2023-02-31"`) to `isValidDateValue` expecting `true` — the function explicitly rejects them by comparing reconstructed UTC date parts.
- Do NOT use `getDatabaseDriver` or `transaction` before `connectToDatabase` has completed — the default DataSource will not yet be registered and the call will throw.
- Do NOT invent properties on `DefineModelOptions` beyond those declared (`table`, `name`, `schema`, `deleteStrategy`, `strictMode`, `autoGenerateId`, `randomIncrement`, `initialId`, `properties`, `statics`) — extra keys are not applied to the generated class.
