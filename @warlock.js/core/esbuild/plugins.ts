import type { ChildProcess } from "child_process";
import { spawn } from "child_process";
import type { Plugin, PluginBuild } from "esbuild";
import { warlockPath } from "./../utils";

// Keep track of the active server process
let serverProcess: ChildProcess | null = null;

// This plugin manages the build process and server
export const startServerPlugin: Plugin = {
  name: "start-server",
  setup(build: PluginBuild) {
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.error("Build failed:", result.errors);
        return;
      }

      if (!result.metafile) return;

      if (serverProcess) return;

      startHttpServerDev();
    });
  },
};

export function startHttpServerDev() {
  if (serverProcess) {
    serverProcess.kill();
  }

  serverProcess = spawn(
    "node",
    ["--enable-source-maps", warlockPath("http.js")],
    {
      stdio: "inherit",
      cwd: process.cwd(),
    },
  );

  serverProcess.on("error", err => {
    console.error("Server process error:", err);
  });

  serverProcess.on("exit", state => {
    if (state !== null) {
      process.exit(state);
    }
  });

  return serverProcess;
}
