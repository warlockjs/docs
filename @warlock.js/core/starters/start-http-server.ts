import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";
import { debounce } from "@mongez/reinforcements";
import chokidar from "chokidar";
import esbuild from "esbuild";
import path from "path";
import { buildHttpApp, moduleBuilders } from "../builder/build-http-app";
import { command } from "../console/command-builder";
import { rootPath, srcPath, warlockPath } from "../utils";
import {
  injectImportPathPlugin,
  nativeNodeModulesPlugin,
  startHttpServerDev,
  startServerPlugin,
} from "./../esbuild";

export async function startHttpApp() {
  const httpPath = await buildHttpApp();

  const builder = await esbuild.context({
    platform: "node",
    entryPoints: [httpPath],
    bundle: true,
    minify: false,
    packages: "external",
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "esm",
    target: ["esnext"],
    outdir: path.resolve(warlockPath()),
    // Enable code splitting
    splitting: true,
    // Output chunks to a separate directory with meaningful names
    chunkNames: "chunks/[name]",
    // Ensure each entry point generates its own chunk
    outbase: warlockPath(),
    // Tree shaking for smaller bundles
    treeShaking: true,
    // Generate metafile for analysis
    metafile: true,
    // Deduplicate modules
    mainFields: ["module", "main"],
    conditions: ["import", "module"],
    // Preserve imports structure
    preserveSymlinks: true,
    plugins: [
      injectImportPathPlugin(),
      nativeNodeModulesPlugin,
      startServerPlugin,
      typecheckPlugin({
        watch: true,
      }),
    ],
  });

  // Set up chokidar to watch additional files (e.g., .env)
  const watcher = chokidar.watch(
    [
      rootPath(".env"),
      rootPath(".env.shared"),
      srcPath(),
      // Add other files or patterns as needed
    ],
    {
      persistent: true,
      ignoreInitial: false,
      ignored: ["node_modules/**", "dist/**"], // Ignore irrelevant paths
    },
  );

  const restartServer = debounce(async () => {
    await builder.rebuild();
    startHttpServerDev();
  }, 500);

  const rebuild = async (
    mode: "add" | "change" | "unlink" | "unlinkDir",
    filePath: string,
  ) => {
    if (["add", "unlink"].includes(mode)) {
      // check if it is a routes.ts file
      if (filePath.includes("routes.ts")) {
        await moduleBuilders.routes();
      } else if (filePath.endsWith("main.ts")) {
        await moduleBuilders.main();
      }
    }
    restartServer();
  };

  watcher.on("add", filePath => rebuild("add", filePath));
  watcher.on("change", filePath => rebuild("change", filePath));
  watcher.on("unlink", filePath => rebuild("unlink", filePath));
  watcher.on("unlinkDir", filePath => rebuild("unlinkDir", filePath));
}

export function registerHttpDevelopmentServerCommand() {
  return command("dev").action(startHttpApp).preload("watch");
}
