import config from "@mongez/config";
import { log } from "@warlock.js/logger";
import { setLogConfigurations } from "../logger";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Logger Connector
 * Manages logger lifecycle and ensures synchronous flushing on termination
 */
export class LoggerConnector extends BaseConnector {
  public readonly name = "logger";
  public readonly priority = ConnectorPriority.LOGGER;

  /**
   * Files that trigger logger restart
   */
  protected readonly watchedFiles = ["src/config/log.ts", "src/config/log.tsx"];

  /**
   * Initialize logger configurations
   */
  public async start(): Promise<void> {
    const logConfig = config.get("log");

    if (!logConfig) {
      return;
    }

    try {
      setLogConfigurations(logConfig);
      this.active = true;
    } catch (error) {
      console.error("Failed to initialize logger:", error);
      throw error;
    }
  }

  /**
   * Shutdown logger and flush messages synchronously
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    try {
      log.flushSync();
      this.active = false;
    } catch (error) {
      console.error("Failed to flush logger:", error);
      throw error;
    }
  }
}
