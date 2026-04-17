import { spawn } from "child_process";
import path from "path";
import { warlockConfigManager } from "../../warlock-config/warlock-config.manager";
import { command } from "../cli-command";
import { displayStartupBanner } from "../cli-commands.utils";

export const startProductionCommand = command({
  name: "start",
  description: "Start production server",
  persistent: true,
  preload: {
    warlockConfig: true,
  },
  preAction: async () => {
    displayStartupBanner({ environment: "production" });
  },
  action: async () => {
    const buildConfig = warlockConfigManager.get("build");

    const outDir = buildConfig?.outDirectory || "dist";
    const outFile = buildConfig?.outFile || "app.js";
    const entryPath = path.resolve(outDir, outFile);

    // Build node args
    const nodeArgs: string[] = [];

    // Enable source maps if configured
    if (buildConfig?.sourcemap !== false) {
      nodeArgs.push("--enable-source-maps");
    }

    // Add entry file
    nodeArgs.push(entryPath);

    // Pass through any additional flags after "start" command
    // process.argv = [node, cli.ts, start, ...extra]
    const startIndex = process.argv.findIndex((arg) => arg === "start");
    if (startIndex !== -1 && startIndex < process.argv.length - 1) {
      const extraArgs = process.argv.slice(startIndex + 1);
      nodeArgs.push(...extraArgs);
    }

    console.log(`🚀 Starting production server...\n`);

    // Spawn child process
    // On Windows, we need to be careful with signals - the console sends Ctrl+C
    // to all processes in the group, so we just need to not interfere
    const child = spawn("node", nodeArgs, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
      // Important: keep child in same process group for proper signal handling
      detached: false,
    });

    // Track if we're shutting down to prevent double-exit
    let isShuttingDown = false;

    // Forward signals to child (needed for SIGTERM, helpful for explicit forwarding)
    const forwardSignal = (signal: NodeJS.Signals) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      // Send signal to child
      child.kill(signal);
    };

    // On SIGTERM, forward it (SIGTERM doesn't auto-propagate like SIGINT on Windows)
    process.on("SIGTERM", () => forwardSignal("SIGTERM"));

    // On SIGINT (Ctrl+C), mark as shutting down but let child handle it naturally
    // On Windows, Ctrl+C is sent to both processes, so child already gets it
    process.on("SIGINT", () => {
      isShuttingDown = true;
      // Give child a chance to exit gracefully before we do anything
    });

    // Exit with child's exit code
    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  },
});
