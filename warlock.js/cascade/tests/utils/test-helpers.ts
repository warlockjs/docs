/**
 * Shared test utilities for @warlock.js/cascade unit tests.
 *
 * Provides factories for creating mock drivers, data sources, and models
 * to ensure consistency across all test files.
 */
import { vi } from "vitest";
import type {
  DriverContract,
  InsertResult,
  UpdateResult,
} from "../../src/contracts/database-driver.contract";
import type { DataSource } from "../../src/data-source/data-source";
import { Model } from "../../src/model/model";

// ============================================================================
// MOCK DRIVER
// ============================================================================

/**
 * Options for creating a mock driver.
 */
export interface MockDriverOptions {
  /** Driver name (default: "mock") */
  name?: string;
  /** Whether driver is connected (default: true) */
  isConnected?: boolean;
  /** Custom insert result */
  insertResult?: InsertResult;
  /** Custom update result */
  updateResult?: UpdateResult;
  /** Custom delete result (number of deleted records) */
  deleteResult?: number;
  /** Custom replace result */
  replaceResult?: Record<string, unknown> | null;
}

/**
 * Create a mock driver with all required methods stubbed.
 *
 * @param options - Customization options
 * @returns A mock DriverContract instance
 *
 * @example
 * ```typescript
 * const driver = createMockDriver();
 * expect(driver.insert).toBeDefined();
 *
 * // With custom results
 * const driver = createMockDriver({
 *   insertResult: { document: { id: 42, _id: "abc" } },
 * });
 * ```
 */
export function createMockDriver(options: MockDriverOptions = {}): DriverContract {
  const {
    name = "mock",
    isConnected = true,
    insertResult = { document: { id: 1, _id: "mock_id_123" } },
    updateResult = { modifiedCount: 1 },
    deleteResult = 1,
    replaceResult = { id: 1 },
  } = options;

  return {
    name,
    isConnected,
    blueprint: {},

    // CRUD operations
    insert: vi.fn().mockResolvedValue(insertResult),
    insertMany: vi.fn().mockResolvedValue({ documents: [], insertedCount: 0 }),
    update: vi.fn().mockResolvedValue(updateResult),
    updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
    replace: vi.fn().mockResolvedValue(replaceResult),
    delete: vi.fn().mockResolvedValue(deleteResult),
    deleteMany: vi.fn().mockResolvedValue(0),
    truncateTable: vi.fn().mockResolvedValue(undefined),

    // Query builder
    queryBuilder: vi.fn().mockReturnValue({}),

    // Transactions
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    atomic: vi.fn().mockImplementation(async (callback: () => Promise<unknown>) => callback()),

    // Connection
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),

    // Serialization
    serialize: (data: unknown) => data,
    deserialize: (data: unknown) => data,

    // Adapters
    syncAdapter: vi.fn().mockReturnValue(undefined),
    migrationDriver: vi.fn().mockReturnValue(undefined),

    // Database management
    createDatabase: vi.fn().mockResolvedValue(undefined),
    dropDatabase: vi.fn().mockResolvedValue(undefined),
    databaseExists: vi.fn().mockResolvedValue(true),
    listDatabases: vi.fn().mockResolvedValue([]),

    // Table management
    dropTable: vi.fn().mockResolvedValue(undefined),
    dropTableIfExists: vi.fn().mockResolvedValue(undefined),
    dropAllTables: vi.fn().mockResolvedValue(undefined),
  } as unknown as DriverContract;
}

// ============================================================================
// MOCK DATA SOURCE
// ============================================================================

/**
 * Options for creating a mock data source.
 */
export interface MockDataSourceOptions {
  /** Data source name (default: "test") */
  name?: string;
  /** Whether this is the default data source (default: true) */
  isDefault?: boolean;
  /** Custom driver instance */
  driver?: DriverContract;
  /** Default delete strategy */
  defaultDeleteStrategy?: "trash" | "permanent" | "soft";
  /** Default trash table name */
  defaultTrashTable?: string;
  /** ID generator instance */
  idGenerator?: unknown;
  /** Model default configuration */
  modelDefaults?: Record<string, unknown>;
}

/**
 * Create a mock data source.
 *
 * @param options - Customization options
 * @returns A mock DataSource instance
 *
 * @example
 * ```typescript
 * const dataSource = createMockDataSource();
 *
 * // With custom driver
 * const driver = createMockDriver({ name: "postgres" });
 * const dataSource = createMockDataSource({ driver });
 * ```
 */
export function createMockDataSource(options: MockDataSourceOptions = {}): DataSource {
  const {
    name = "test",
    isDefault = true,
    driver = createMockDriver(),
    defaultDeleteStrategy,
    defaultTrashTable,
    idGenerator,
    modelDefaults,
  } = options;

  return {
    name,
    driver,
    isDefault,
    defaultDeleteStrategy,
    defaultTrashTable,
    idGenerator,
    modelDefaults,
  } as unknown as DataSource;
}

// ============================================================================
// MOCK MODEL
// ============================================================================

/**
 * Options for creating a test model class.
 */
export interface TestModelOptions {
  /** Table/collection name (default: "test_models") */
  table?: string;
  /** Primary key field (default: "id") */
  primaryKey?: string;
  /** Whether to auto-generate IDs (default: false) */
  autoGenerateId?: boolean;
  /** Created at column name (default: "createdAt") */
  createdAtColumn?: string | false;
  /** Updated at column name (default: "updatedAt") */
  updatedAtColumn?: string | false;
  /** Deleted at column name for soft deletes (default: "deletedAt") */
  deletedAtColumn?: string | false;
  /** Delete strategy */
  deleteStrategy?: "trash" | "permanent" | "soft";
  /** Trash table name */
  trashTable?: string;
}

/**
 * Create a test model class with customizable static properties.
 *
 * @param name - Class name for the model
 * @param options - Model configuration options
 * @param dataSource - Data source to use (creates mock if not provided)
 * @returns A Model subclass configured for testing
 *
 * @example
 * ```typescript
 * const UserModel = createTestModelClass("User", {
 *   table: "users",
 *   primaryKey: "id",
 * });
 *
 * const user = new UserModel({ name: "Alice" });
 * ```
 */
export function createTestModelClass(
  name: string,
  options: TestModelOptions = {},
  dataSource?: DataSource,
): typeof Model {
  const {
    table = "test_models",
    primaryKey = "id",
    autoGenerateId = false,
    createdAtColumn = "createdAt",
    updatedAtColumn = "updatedAt",
    deletedAtColumn = "deletedAt",
    deleteStrategy,
    trashTable,
  } = options;

  const mockDataSource = dataSource ?? createMockDataSource();

  // Create a dynamic class with the given name
  const TestModel = class extends Model {
    static table = table;
    static primaryKey = primaryKey;
    static autoGenerateId = autoGenerateId;
    static createdAtColumn = createdAtColumn as string;
    static updatedAtColumn = updatedAtColumn as string;
    static deletedAtColumn = deletedAtColumn as string;
    static deleteStrategy = deleteStrategy;
    static trashTable = trashTable;
  };

  // Set the class name
  Object.defineProperty(TestModel, "name", { value: name });

  // Mock getDataSource
  vi.spyOn(TestModel, "getDataSource").mockReturnValue(mockDataSource);

  return TestModel;
}

/**
 * Create a simple test model instance.
 *
 * @param data - Initial model data
 * @param options - Model class options
 * @returns A model instance
 *
 * @example
 * ```typescript
 * const user = createTestModel({ id: 1, name: "Alice" });
 * user.isNew = false;
 * ```
 */
export function createTestModel(
  data: Record<string, unknown> = {},
  options: TestModelOptions = {},
): Model {
  const TestModelClass = createTestModelClass("TestModel", options);
  return new (TestModelClass as any)(data);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Get all calls to a mock function.
 *
 * @param mockFn - The mock function
 * @returns Array of call arguments
 */
export function getMockCalls(mockFn: unknown): unknown[][] {
  return (mockFn as ReturnType<typeof vi.fn>).mock.calls;
}

/**
 * Get the last call to a mock function.
 *
 * @param mockFn - The mock function
 * @returns Arguments of the last call, or undefined
 */
export function getLastMockCall(mockFn: unknown): unknown[] | undefined {
  const calls = getMockCalls(mockFn);
  return calls[calls.length - 1];
}

/**
 * Reset all mock functions on a driver.
 *
 * @param driver - The mock driver
 */
export function resetDriverMocks(driver: DriverContract): void {
  const mockFunctions = [
    "insert",
    "insertMany",
    "update",
    "updateMany",
    "replace",
    "delete",
    "deleteMany",
    "truncateTable",
    "queryBuilder",
    "beginTransaction",
    "atomic",
    "connect",
    "disconnect",
    "on",
    "createDatabase",
    "dropDatabase",
    "databaseExists",
    "listDatabases",
    "dropTable",
    "dropTableIfExists",
    "dropAllTables",
  ];

  for (const fn of mockFunctions) {
    const mockFn = (driver as unknown as Record<string, unknown>)[fn];
    if (mockFn && typeof (mockFn as ReturnType<typeof vi.fn>).mockClear === "function") {
      (mockFn as ReturnType<typeof vi.fn>).mockClear();
    }
  }
}

// ============================================================================
// EVENT TESTING HELPERS
// ============================================================================

/**
 * Create a listener spy for model events.
 *
 * @returns A vi.fn() spy
 */
export function createEventListener(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

/**
 * Register a listener on a model and return it for assertions.
 *
 * @param model - The model instance
 * @param event - Event name
 * @returns The listener spy
 *
 * @example
 * ```typescript
 * const listener = attachEventListener(user, "saving");
 * await writer.save();
 * expect(listener).toHaveBeenCalled();
 * ```
 */
export function attachEventListener(model: Model, event: string): ReturnType<typeof vi.fn> {
  const listener = createEventListener();
  model.on(event as any, listener);
  return listener;
}
