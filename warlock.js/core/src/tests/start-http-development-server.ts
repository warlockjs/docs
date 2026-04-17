/**
 * HTTP Test Server
 *
 * Starts a minimal HTTP server for testing.
 * Unlike the full DevelopmentServer, this:
 * - Does NOT watch files
 * - Does NOT do HMR
 * - Only starts connectors needed for HTTP requests
 *
 * Used in Vitest's globalSetup to start server once for all test workers.
 */
import { Application } from "../application";
import { bootstrap } from "../bootstrap";
import { loadConfigFiles } from "../config/load-config-files";
import { connectorsManager } from "../connectors/connectors-manager";
import { filesOrchestrator } from "../dev-server/files-orchestrator";
import { warlockConfigManager } from "../warlock-config/warlock-config.manager";

let isServerRunning = false;

/**
 * Start the HTTP test server (minimal - no file watching)
 * Call this in Vitest's globalSetup
 */
export async function startHttpTestServer(): Promise<void> {
  if (isServerRunning) {
    console.log("[test-server] Server already running, skipping start");
    return;
  }

  console.log("[test-server] Starting HTTP test server...");

  try {
    // Set environment
    Application.setRuntimeStrategy("development");
    Application.setEnvironment("test");

    // Bootstrap (env, etc.)
    await warlockConfigManager.load();
    await bootstrap();

    // Initialize file orchestrator (but don't watch)
    await filesOrchestrator.init();
    await filesOrchestrator.initiaizeAll();

    // Load config files
    await loadConfigFiles(true);

    // Load application modules
    await filesOrchestrator.moduleLoader.loadAll();

    // Start ALL connectors (including HTTP)
    await connectorsManager.start();

    isServerRunning = true;
  } catch (error) {
    throw error;
  }
}

/**
 * Stop the HTTP test server
 * Call this in Vitest's globalTeardown
 */
export async function stopHttpTestServer(): Promise<void> {
  if (!isServerRunning) {
    console.log("[test-server] No server to stop");
    return;
  }

  try {
    await connectorsManager.shutdown();
    isServerRunning = false;
    console.log("[test-server] HTTP test server stopped");
  } catch (error) {
    console.error("[test-server] Error stopping HTTP server:", error);
    throw error;
  }
}

/**
 * Check if test server is running
 */
export function isTestServerRunning(): boolean {
  return isServerRunning;
}
