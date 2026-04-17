import config from "@mongez/config";
import { connectToDatabase, dataSourceRegistry } from "@warlock.js/cascade";
import { container } from "../container";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Database Connector
 * Manages database connection lifecycle using @warlock.js/cascade
 */
export class DatabaseConnector extends BaseConnector {
  public readonly name = "database";
  public readonly priority = ConnectorPriority.DATABASE;

  /**
   * Files that trigger database restart
   */
  protected readonly watchedFiles = ["src/config/database.ts", "src/config/database.tsx"];

  /**
   * Initialize database connection
   */
  public async start(): Promise<void> {
    const databaseConfig = config.get("database");

    if (!databaseConfig) {
      return;
    }

    try {
      const source = await connectToDatabase(databaseConfig);
      container.set("database.source", source);
      this.active = true;
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  /**
   * Shutdown database connection
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    try {
      // Disconnect all registered data sources
      const dataSources = dataSourceRegistry.getAllDataSources();

      for (const dataSource of dataSources) {
        if (dataSource.driver.isConnected) {
          await dataSource.driver.disconnect();
        }
      }

      this.active = false;
    } catch (error) {
      console.error("Failed to disconnect from database:", error);
      throw error;
    }
  }
}
