import { Context, contextManager } from "@warlock.js/context";
import type { DataSource } from "../data-source/data-source";

type DataSourceContextValue = string | DataSource;

type DataSourceContextStore = {
  dataSource?: DataSourceContextValue;
};

/**
 * Database DataSource Context
 *
 * Manages the active database connection/data source using AsyncLocalStorage.
 * Extends the base Context class for consistent API.
 */
class DatabaseDataSourceContext extends Context<DataSourceContextStore> {
  /**
   * Get the current data source
   */
  public getDataSource(): DataSourceContextValue | undefined {
    return this.get("dataSource");
  }

  /**
   * Set the data source in context
   */
  public setDataSource(dataSource: DataSourceContextValue): void {
    this.set("dataSource", dataSource);
  }

  /**
   * Build the initial data source store with defaults
   */
  public buildStore(): DataSourceContextStore {
    return { dataSource: undefined };
  }
}

export const databaseDataSourceContext = new DatabaseDataSourceContext();

contextManager.register("db.datasource", databaseDataSourceContext);
