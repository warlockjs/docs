import { colors } from "@mongez/copper";
import { devServeLog } from "../dev-server/dev-logger";
import { CacheConnector } from "./cache-connector";
import { HeraldConnector } from "./herald-connector";
import { DatabaseConnector } from "./database-connector";
import { HttpConnector } from "./http-connector";
import { LoggerConnector } from "./logger-connector";
import { MailerConnector } from "./mail-connector";
import { SocketConnector } from "./socket-connector";
import { StorageConnector } from "./storage.connector";
import type { Connector, ConnectorName } from "./types";

export class ConnectorsManager {
  /**
   * Connectors list
   */
  private readonly connectors: Connector[] = [];

  /**
   * Constructor
   */
  public constructor() {
    this.register(new LoggerConnector());
    this.register(new MailerConnector());
    this.register(new HttpConnector());
    this.register(new DatabaseConnector());
    this.register(new HeraldConnector());
    this.register(new CacheConnector());
    this.register(new StorageConnector());
    this.register(new SocketConnector());
  }

  /**
   * Register a connector
   */
  public register(...connectors: Connector[]): void {
    this.connectors.push(...connectors);
    // sort connectors by priority
    this.connectors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get all connectors
   */
  public list(): Connector[] {
    return this.connectors;
  }

  /**
   * start all connectors
   */
  public async start(connectorsNames?: ConnectorName[]): Promise<void> {
    for (const connector of this.connectors) {
      if (connectorsNames && !connectorsNames.includes(connector.name)) continue;

      await connector.start();
    }
  }

  /**
   * Start all connectors except the given ones
   */
  public async startWithout(excludedConnectors: ConnectorName[]): Promise<void> {
    await this.start(
      this.connectors
        .filter((connector) => !excludedConnectors.includes(connector.name))
        .map((connector) => connector.name),
    );
  }

  /**
   * Shutdown all connectors
   */
  public async shutdown(): Promise<void> {
    // shut down connectors in reverse order
    for (const connector of this.connectors.reverse()) {
      try {
        await connector.shutdown();
      } catch (error) {
        devServeLog(colors.redBright(`❌ Failed to shutdown ${connector.name}: ${error}`));
      }
    }
  }

  /**
   * Shutdown connectors on process kill
   *
   * Handles graceful shutdown for both Unix and Windows:
   * - SIGINT: Ctrl+C on Unix, also caught on Windows but unreliable in child processes
   * - SIGTERM: Termination signal (Unix primarily)
   * - beforeExit: Fires when Node.js empties its event loop (more reliable on Windows)
   */
  public shutdownOnProcessKill(): void {
    let isShuttingDown = false;

    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\nExiting...`);
      await this.shutdown();
      process.exit(0);
    };

    // Unix signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    // Windows-specific: handle when process is about to exit
    // This is more reliable on Windows for spawned child processes
    if (process.platform === "win32") {
      // Handle Ctrl+C on Windows specifically
      process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));
    }
  }
}

export const connectorsManager = new ConnectorsManager();
