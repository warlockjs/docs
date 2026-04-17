import config from "@mongez/config";
import { logger } from "@warlock.js/logger";
import { createServer } from "http";
import { Server } from "socket.io";
import { container } from "../container";
import { BaseConnector } from "./base-connector";
import { ConnectorName, ConnectorPriority } from "./types";

/**
 * Socket Connector
 * Manages Socket server (Socket.IO) lifecycle
 */
export class SocketConnector extends BaseConnector {
  public readonly name: ConnectorName = "socket";
  public readonly priority = ConnectorPriority.SOCKET;

  /**
   * Files that trigger Socket server restart
   * Note: routes.ts changes will be handled by HMR with wildcard routing
   * Connectors receive config file paths directly (not .env) thanks to layer-executor
   */
  protected readonly watchedFiles = ["src/config/socket.ts"];

  /**
   * Initialize Socket server
   */
  public async start(): Promise<void> {
    const socketConfig = config.get("socket");

    if (!socketConfig) return;

    // now we have two cases
    // 1. http is used, then use it
    // 2. http is not used, then create a new server
    let server;
    if (container.has("http.server")) {
      const fastify = container.get("http.server");
      server = fastify.server;
    } else {
      server = createServer();
      server.listen(socketConfig.port);
      container.set("socket.rawServer", server);
    }

    logger.info("socket", "connection", "Starting Socket.IO server");
    const socket = new Server(server, socketConfig.options);

    container.set("socket", socket);

    logger.success("socket", "connection", "Established Socket.IO server");

    this.active = true;
  }

  /**
   * Shutdown HTTP server
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    if (container.has("socket")) {
      const socket = container.get("socket");
      socket.close();
    }

    if (container.has("socket.rawServer")) {
      const server = container.get("socket.rawServer");
      server.close();
    }

    this.active = false;
  }
}
