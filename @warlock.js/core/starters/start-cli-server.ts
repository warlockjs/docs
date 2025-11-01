// import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { ensureDirectoryAsync } from "@mongez/fs";
import { spawn } from "child_process";
import esbuild from "esbuild";
import { type CommandActionData } from "../console";
import { srcPath, storagePath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin } from "./../esbuild";
import { startHttpApp } from "./start-http-server";

export async function startCliServer() {
  const command = process.argv[2];

  await ensureDirectoryAsync(warlockPath());

  ensureDirectoryAsync(storagePath("cache/images"));

  // make a special check for the development command
  if (command === "dev") {
    // check if the command receives --fresh
    const data = {
      options: {
        fresh: false,
      },
    };
    if (process.argv.includes("--fresh")) {
      data.options.fresh = true;
    }

    return startHttpApp(data as unknown as CommandActionData);
  }

  const outputCliPath = warlockPath("cli.js");

  const { buildCliApp } = await import("../builder/build-cli-app");

  const cliPath = await buildCliApp();

  await esbuild.build({
    platform: "node",
    entryPoints: [cliPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "esm",
    target: ["esnext"],
    outfile: outputCliPath,
    plugins: [nativeNodeModulesPlugin],
  });

  const args = process.argv.slice(2);

  const processChild = spawn("node", [outputCliPath, ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  processChild.on("exit", code => {
    if (code !== null) {
      process.exit(code);
    }
  });
}
