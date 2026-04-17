import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { logger } from "@warlock.js/logger";
import { Application } from "../application";
import { devLogError } from "../dev-server/dev-logger";
import { registerHttpPlugins } from "../http/plugins";
import { getHttpServer, startHttpServer } from "../http/server";
import { router } from "../router/router";
import { Environment } from "../utils";
import { setBaseUrl } from "../utils/urls";
import { container } from "./../container";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

function environmentColor(environment: Environment) {
  switch (environment) {
    case "development":
      return colors.magentaBright(environment);
    case "test":
      return colors.yellowBright(environment);
    case "production":
      return colors.greenBright(environment);
    default:
      return colors.white(environment);
  }
}

/**
 * HTTP Connector
 * Manages HTTP server (Fastify) lifecycle
 */
export class HttpConnector extends BaseConnector {
  public readonly name = "http";
  public readonly priority = ConnectorPriority.HTTP;

  /**
   * Files that trigger HTTP server restart
   * Note: routes.ts changes will be handled by HMR with wildcard routing
   * Connectors receive config file paths directly (not .env) thanks to layer-executor
   */
  protected readonly watchedFiles = ["src/config/http.ts", "src/config/http.tsx"];

  /**
   * Initialize HTTP server
   */
  public async start(): Promise<void> {
    const httpConfig = config.get("http");

    if (!httpConfig) return;

    const port = httpConfig.port;
    logger.info(
      `http`,
      "connection",
      `Starting http server on port ${port} in ${environmentColor(Application.environment)} mode`,
    );

    const server = startHttpServer(httpConfig.serverOptions);

    container.set("http.server", server);

    await registerHttpPlugins(server);

    if (Application.runtimeStrategy === "development") {
      router.scanDevServer(server);
    } else {
      router.scan(server);
    }

    try {
      // We can use the url of the server
      await server.listen({
        port,
        host: httpConfig.host || "localhost",
      });

      const baseUrl = config.get("app.baseUrl");

      container.set("http.baseUrl", baseUrl);

      // update base url
      setBaseUrl(baseUrl);

      logger.success(`http`, "connection", `Server ready at ${baseUrl}`);
    } catch (error) {
      devLogError("Error while starting http server", error);

      process.exit(1); // stop the process, exit with error
    }

    this.active = true;
  }

  /**
   * Shutdown HTTP server
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    const server = getHttpServer();

    server?.close();

    this.active = false;
  }

  /**
   * Override shouldRestart to handle routes.ts specially
   * routes.ts changes should NOT restart the server (use HMR instead)
   * Now receives config file paths directly from layer-executor
   */
  public shouldRestart(changedFiles: string[]): boolean {
    // Only restart for config changes, not routes
    return changedFiles.some((file) => {
      const relativePath = file.replace(/\\/g, "/");
      return this.watchedFiles.includes(relativePath);
    });
  }
}
