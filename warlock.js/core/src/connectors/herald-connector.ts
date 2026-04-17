import config from "@mongez/config";
import { log } from "@warlock.js/logger";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Herald Connector
 * Manages message broker connection lifecycle using @warlock.js/herald
 */
export class HeraldConnector extends BaseConnector {
  public readonly name = "herald";
  public readonly priority = ConnectorPriority.COMMUNICATOR;

  /**
   * Files that trigger herald restart
   */
  protected readonly watchedFiles = ["src/config/herald.ts"];

  /**
   * Initialize broker connection
   */
  public async start(): Promise<void> {
    const heraldConfig = config.get("herald");

    if (!heraldConfig) {
      return;
    }

    try {
      const { connectToBroker } = await import("@warlock.js/herald");

      log.info(`herald.${heraldConfig.driver}`, "connection", "Connecting to message broker");
      await connectToBroker(heraldConfig);
      log.success(`herald.${heraldConfig.driver}`, "connection", "Connected to message broker");
      this.active = true;
    } catch (error) {
      log.error(
        `herald.${heraldConfig.driver}`,
        "connection",
        "Failed to connect to message broker",
      );
      throw error;
    }
  }

  /**
   * Shutdown broker connection
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    try {
      const { brokerRegistry } = await import("@warlock.js/herald");

      // Disconnect all registered brokers
      const brokers = brokerRegistry.getAll();

      for (const broker of brokers) {
        if (broker.driver.isConnected) {
          await broker.driver.disconnect();
        }
      }

      // Clear the registry for clean restart
      brokerRegistry.clear();

      this.active = false;
    } catch (error) {
      log.error("herald", "shutdown", "Failed to disconnect from message broker");
      throw error;
    }
  }
}
