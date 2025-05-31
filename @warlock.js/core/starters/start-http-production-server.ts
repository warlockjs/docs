import { spawn } from "child_process";
import path from "path";
import { getWarlockConfig } from "../config/get-warlock-config";
import { command } from "../console/command-builder";

async function main() {
  const config = await getWarlockConfig();

  spawn(
    "node",
    [path.resolve(config.build.outDirectory, config.build.outFile)],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    },
  );
}

export function registerRunProductionServerCommand() {
  return command("start").action(main).preload("watch");
}
