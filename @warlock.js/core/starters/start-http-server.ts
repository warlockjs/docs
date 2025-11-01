import { colors } from "@mongez/copper";
import { getFileAsync, putFileAsync, removeDirectoryAsync } from "@mongez/fs";
import { debounce, type GenericObject } from "@mongez/reinforcements";
import chokidar from "chokidar";
import dayjs from "dayjs";
import { transform } from "esbuild";
import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { buildHttpApp, moduleBuilders } from "../builder/build-http-app";
import {
  checkSingleFile,
  configure as configureCodeQuality,
  scanProject,
} from "../code-quality";
import type { CommandActionData } from "../console";
import { command } from "../console/command-builder";
import { rootPath, srcPath, warlockPath } from "../utils";
import { restartServer } from "./http-server-starter";
import { httpLog } from "./serve-log";

// Configure code quality checker (you can change these settings)
configureCodeQuality({
  displayStrategy: "sequential", // Options: "sequential", "combined", "typescript-only", "eslint-only", "silent"
  showSuccessMessages: true,
  showWarnings: true,
  showErrors: true,
  showCodeSnippets: true,
  contextLines: 2,
  enableInitialScan: true, // Run full scan on startup
});

let tsconfigRaw: GenericObject = {};

async function loadTsconfig() {
  const configText = await fs.readFile(
    process.cwd() + "/tsconfig.json",
    "utf8",
  );

  const { config } = ts.parseConfigFileTextToJson(
    process.cwd() + "/tsconfig.json",
    configText,
  );

  tsconfigRaw = config;
}

export async function transformSingleFileAndCacheIt(filePath: string) {
  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/\\/g, "/");
  const cacheFileName = relativePath.replace(/^\./, "").replace(/\//g, "-");
  const cacheFilePath = path.resolve(
    process.cwd(),
    ".warlock/.cache",
    cacheFileName,
  );

  const content = await getFileAsync(filePath);

  // Check code quality (TypeScript + ESLint, async, non-blocking)
  checkSingleFile(filePath);

  const { code } = await transform(content, {
    loader: filePath.endsWith(".tsx") ? "tsx" : "ts",
    format: "esm",
    sourcemap: false,
    tsconfigRaw,
  });

  // if code length is zero, it means this was just an empty file or a types only file
  let finalCode = code;
  if (code.length === 0) {
    finalCode = "/*_EMPTY_FILE_*/";
  }

  // Write to individual cache file
  await putFileAsync(cacheFilePath, finalCode, "utf8");
}

const log = httpLog;

export async function startHttpApp(data: CommandActionData) {
  if (data?.options?.fresh) {
    await removeDirectoryAsync(warlockPath());
  }

  log.info("http", "server", "Starting development server...");
  await buildHttpApp();

  await restartServer();

  loadTsconfig();

  // Run initial code quality scan (async, background)
  scanProject(srcPath());

  const watcher = chokidar.watch(
    [`${srcPath()}/**/*.{ts,tsx}`, rootPath(".env")],
    {
      ignoreInitial: true,
      ignored: ["node_modules/**", "dist/**"],
    },
  );

  const rebuild = debounce(async (event, filePath) => {
    console.log(
      colors.yellowBright(
        `${dayjs().format("YYYY-MM-DD HH:mm:ss")} Restarting development server...`,
      ),
    );
    if (["add", "unlink"].includes(event)) {
      // Rebuild manifest when files are added or removed
      moduleBuilders.mainfest();
      if (filePath.includes("routes.ts")) await moduleBuilders.routes();
      if (filePath.endsWith("main.ts")) await moduleBuilders.main();
      // Regenerate config types when config files change
      if (
        filePath.includes("src/config/") ||
        filePath.includes("src\\config\\")
      ) {
        moduleBuilders.configTypes();
      }
    }

    if (["add", "change"].includes(event)) {
      // recache the file
      await transformSingleFileAndCacheIt(filePath);
    }

    await restartServer();
  }, 50);

  watcher
    .on("add", filePath => rebuild("add", filePath))
    .on("change", filePath => rebuild("change", filePath))
    .on("unlink", filePath => rebuild("unlink", filePath))
    .on("unlinkDir", filePath => rebuild("unlinkDir", filePath));
}

export function registerHttpDevelopmentServerCommand() {
  return command("dev")
    .action(startHttpApp)
    .preload("watch")
    .option("--fresh -f", "Clear the previous cache and run it again.");
}
