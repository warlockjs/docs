import { DevelopmentServer } from "./development-server";

/**
 * Start the development server
 * Main entry point for the dev server
 */
export async function startDevelopmentServer() {
  const devServer = new DevelopmentServer();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n📡 Received SIGINT signal");
    await devServer.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n\n📡 Received SIGTERM signal");
    await devServer.shutdown();
    process.exit(0);
  });

  // Start the server
  await devServer.start();

  return devServer;
}
