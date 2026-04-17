import { EventEmitter } from "node:events";
import { databaseDataSourceContext } from "../context/database-data-source-context";
import { MissingDataSourceError } from "../errors/missing-data-source.error";
import { DataSource, type DataSourceOptions } from "./data-source";

/**
 * Event types emitted by the DataSourceRegistry.
 *
 * - `registered`: Emitted when any data source is registered
 * - `default-registered`: Emitted when a default data source is registered
 * - `connected`: Emitted when a data source's driver connects
 * - `disconnected`: Emitted when a data source's driver disconnects
 */
export type DataSourceRegistryEvent =
  | "registered"
  | "default-registered"
  | "connected"
  | "disconnected";

/**
 * Callback signature for registry events.
 */
export type DataSourceRegistryListener = (dataSource: DataSource) => void;

/** Maintains registry of named data sources. */
class DataSourceRegistry {
  private readonly sources = new Map<string, DataSource>();
  private defaultSource?: DataSource;
  private readonly events = new EventEmitter();

  /**
   * Register a new data source definition.
   *
   * Sets up event forwarding from the driver to the registry, allowing
   * centralized listening for connection state changes.
   *
   * **Emits:**
   * - `registered` - When the data source is registered
   * - `default-registered` - If this becomes the default data source
   * - `connected` - When the driver connects (forwarded from driver)
   * - `disconnected` - When the driver disconnects (forwarded from driver)
   *
   * @param options - Data source configuration
   * @returns The registered data source instance
   */
  public register(options: DataSourceOptions): DataSource {
    const source = new DataSource(options);
    this.sources.set(source.name, source);

    const isNewDefault = source.isDefault || !this.defaultSource;

    if (isNewDefault) {
      this.defaultSource = source;
    }

    // Emit registration events
    this.events.emit("registered", source);

    if (isNewDefault) {
      this.events.emit("default-registered", source);
    }

    source.driver.on("connected", () => {
      this.events.emit("connected", source);
    });

    source.driver.on("disconnected", () => {
      this.events.emit("disconnected", source);
    });

    return source;
  }

  /**
   * Clean up all data sources and default one
   */
  public clear() {
    this.defaultSource = undefined;
    this.sources.clear();
  }

  /**
   * Listen for data source registry events.
   *
   * @param event - The event to listen for
   * @param listener - Callback to execute when event fires
   *
   * @example
   * ```typescript
   * // Listen for registration
   * dataSourceRegistry.on("registered", (ds) => {
   *   console.log(`Data source "${ds.name}" registered`);
   *   console.log(`Driver: ${ds.driver.name}`); // e.g., "mongodb"
   * });
   *
   * // Listen for default data source
   * dataSourceRegistry.on("default-registered", (ds) => {
   *   console.log(`Default data source set to "${ds.name}"`);
   * });
   *
   * // Listen for connection events (forwarded from drivers)
   * dataSourceRegistry.on("connected", (ds) => {
   *   console.log(`${ds.driver.name} data source "${ds.name}" connected`);
   * });
   *
   * dataSourceRegistry.on("disconnected", (ds) => {
   *   console.log(`${ds.driver.name} data source "${ds.name}" disconnected`);
   * });
   * ```
   */
  public on(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void {
    this.events.on(event, listener);
  }

  /**
   * Listen for a data source registration event once.
   *
   * The listener is automatically removed after being called once.
   *
   * @param event - The event to listen for
   * @param listener - Callback to execute when event fires
   */
  public once(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void {
    this.events.once(event, listener);
  }

  /**
   * Remove a listener for a data source registration event.
   *
   * @param event - The event to stop listening for
   * @param listener - The listener to remove
   */
  public off(event: DataSourceRegistryEvent, listener: DataSourceRegistryListener): void {
    this.events.off(event, listener);
  }

  /** Retrieve a data source either by name or the default one. */
  public get(name?: string): DataSource {
    const contextSource = name == null ? databaseDataSourceContext.getDataSource() : null;

    if (contextSource) {
      if (contextSource instanceof DataSource) {
        return contextSource;
      }

      const override = this.sources.get(contextSource);

      if (!override) {
        throw new MissingDataSourceError(
          `Data source "${contextSource}" is not registered (context override).`,
          contextSource,
        );
      }

      return override;
    }

    if (name != null) {
      const source = this.sources.get(name);
      if (!source) {
        throw new MissingDataSourceError(`Data source "${name}" is not registered.`, name);
      }
      return source;
    }

    if (!this.defaultSource) {
      throw new MissingDataSourceError("No default data source registered.");
    }

    return this.defaultSource;
  }

  /**
   * Get all registered data sources.
   *
   * Useful for operations that need to iterate over all sources,
   * such as shutting down all connections.
   *
   * @returns Array of all registered data sources
   *
   * @example
   * ```typescript
   * // Shutdown all data sources
   * for (const dataSource of dataSourceRegistry.getAllDataSources()) {
   *   await dataSource.driver.disconnect();
   * }
   * ```
   */
  public getAllDataSources(): DataSource[] {
    return Array.from(this.sources.values());
  }
}

export const dataSourceRegistry = new DataSourceRegistry();
