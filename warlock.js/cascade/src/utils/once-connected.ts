import type { DataSource } from "../data-source/data-source";
import { dataSourceRegistry } from "../data-source/data-source-registry";

/**
 * Execute a callback once the driver is connected.
 *
 * If the driver is already connected, the callback is executed immediately.
 * Otherwise, it waits for the "connected" event.
 *
 * **Use Case:**
 * Useful for ensuring database-dependent operations only run after connection
 * is established, especially in small to medium projects with a single data source.
 *
 * @param dataSourceOrNameOrCallback - Data source instance, name, or callback function
 * @param callback - Function to execute once connected (optional if first param is callback)
 *
 * @example
 * ```typescript
 * // With default data source (just callback)
 * await connectToDatabase({ database: "myapp" });
 *
 * onceConnected((ds) => {
 *   console.log("Database is ready!");
 *   console.log("Connected to:", ds.name);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With data source name
 * onceConnected("primary", (ds) => {
 *   console.log("Primary database is ready!");
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With data source instance
 * const dataSource = await connectToDatabase({ database: "myapp" });
 *
 * onceConnected(dataSource, (ds) => {
 *   console.log("Database is ready!");
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With driver instance
 * const driver = new MongoDbDriver(config);
 * const dataSource = new DataSource({ name: "primary", driver });
 *
 * onceConnected(dataSource, () => {
 *   // Start application server
 *   app.listen(3000);
 * });
 *
 * // Connect after setting up the callback
 * await driver.connect();
 * ```
 *
 * @example
 * ```typescript
 * // Chaining operations
 * onceConnected(async (ds) => {
 *   // Seed database
 *   await seedDatabase();
 *
 *   // Run migrations
 *   await runMigrations();
 *
 *   console.log("Database ready!");
 * });
 * ```
 */
export function onceConnected(
  dataSourceOrNameOrCallback: DataSource | string | ((dataSource: DataSource) => void),
  callback?: (dataSource: DataSource) => void,
): void {
  // Determine if first parameter is a callback
  let targetDataSource: DataSource | string;
  let actualCallback: (dataSource: DataSource) => void;

  if (typeof dataSourceOrNameOrCallback === "function") {
    // First param is callback, use default data source
    actualCallback = dataSourceOrNameOrCallback;
    targetDataSource = "default";
  } else {
    // First param is data source name or instance
    if (!callback) {
      throw new Error("Callback is required when providing a data source name or instance.");
    }
    actualCallback = callback;
    targetDataSource = dataSourceOrNameOrCallback;
  }

  // Try to get the data source if it's a string
  let resolvedDataSource: DataSource | undefined;
  if (typeof targetDataSource === "string") {
    try {
      resolvedDataSource =
        targetDataSource === "default"
          ? dataSourceRegistry.get()
          : dataSourceRegistry.get(targetDataSource);
    } catch {
      // Data source not registered yet, will wait for event
    }
  } else {
    resolvedDataSource = targetDataSource;
  }

  // If data source is resolved and already connected, fire immediately
  if (resolvedDataSource && resolvedDataSource.driver.isConnected) {
    actualCallback(resolvedDataSource);
    return;
  }

  // Otherwise, wait for the connected event
  const listener = (ds: DataSource) => {
    const matches =
      typeof targetDataSource === "string"
        ? targetDataSource === "default"
          ? ds.isDefault
          : ds.name === targetDataSource
        : ds === targetDataSource;

    if (matches) {
      // Remove the listener once our condition is met
      dataSourceRegistry.off("connected", listener);
      actualCallback(ds);
    }
    // If it doesn't match, we do nothing and just wait for the next "connected" event targeting our DB
  };

  dataSourceRegistry.on("connected", listener);
}

/**
 * Execute a callback once the driver is disconnected.
 *
 * If the driver is already disconnected, the callback is executed immediately.
 * Otherwise, it waits for the "disconnected" event.
 *
 * **Use Case:**
 * Useful for cleanup operations, graceful shutdown, or reconnection logic.
 *
 * @param dataSourceOrNameOrCallback - Data source instance, name, or callback function
 * @param callback - Function to execute once disconnected (optional if first param is callback)
 *
 * @example
 * ```typescript
 * // With default data source (just callback)
 * await connectToDatabase({ database: "myapp" });
 *
 * onceDisconnected((ds) => {
 *   console.log("Database disconnected!");
 *   console.log("Attempting reconnection...");
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With data source name
 * onceDisconnected("primary", (ds) => {
 *   console.log("Primary database disconnected!");
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With data source instance
 * const dataSource = await connectToDatabase({ database: "myapp" });
 *
 * onceDisconnected(dataSource, (ds) => {
 *   console.log("Database disconnected!");
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Graceful shutdown with default data source
 * process.on("SIGTERM", async () => {
 *   console.log("Shutting down...");
 *
 *   onceDisconnected(() => {
 *     console.log("Database closed, exiting process");
 *     process.exit(0);
 *   });
 *
 *   const dataSource = DataSourceRegistry.getDefault();
 *   await dataSource?.driver.disconnect();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Cleanup resources on disconnect
 * onceDisconnected(async (ds) => {
 *   // Close file handles
 *   await closeFileHandles();
 *
 *   // Clear caches
 *   clearCaches();
 *
 *   console.log("Cleanup complete");
 * });
 * ```
 */
export function onceDisconnected(
  dataSourceOrNameOrCallback: DataSource | string | ((dataSource: DataSource) => void),
  callback?: (dataSource: DataSource) => void,
): void {
  // Determine if first parameter is a callback
  let targetDataSource: DataSource | string;
  let actualCallback: (dataSource: DataSource) => void;

  if (typeof dataSourceOrNameOrCallback === "function") {
    // First param is callback, use default data source
    actualCallback = dataSourceOrNameOrCallback;
    targetDataSource = "default";
  } else {
    // First param is data source name or instance
    if (!callback) {
      throw new Error("Callback is required when providing a data source name or instance.");
    }
    actualCallback = callback;
    targetDataSource = dataSourceOrNameOrCallback;
  }

  // Try to get the data source if it's a string
  let resolvedDataSource: DataSource | undefined;
  if (typeof targetDataSource === "string") {
    try {
      resolvedDataSource =
        targetDataSource === "default"
          ? dataSourceRegistry.get()
          : dataSourceRegistry.get(targetDataSource);
    } catch {
      // Data source not registered yet, will wait for event
    }
  } else {
    resolvedDataSource = targetDataSource;
  }

  // If data source is resolved and already disconnected, fire immediately
  if (resolvedDataSource && !resolvedDataSource.driver.isConnected) {
    actualCallback(resolvedDataSource);
    return;
  }

  // Otherwise, wait for the disconnected event
  const listener = (ds: DataSource) => {
    const matches =
      typeof targetDataSource === "string"
        ? targetDataSource === "default"
          ? ds.isDefault
          : ds.name === targetDataSource
        : ds === targetDataSource;

    if (matches) {
      actualCallback(ds);
    } else {
      // Not the one we're looking for, keep listening
      dataSourceRegistry.once("disconnected", listener);
    }
  };

  dataSourceRegistry.once("disconnected", listener);
}
