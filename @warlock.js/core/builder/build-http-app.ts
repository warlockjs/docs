import {
  ensureDirectoryAsync,
  fileExistsAsync,
  getFileAsync,
  getJsonFileAsync,
  putFileAsync,
} from "@mongez/fs";
import path from "path";
import { httpLog } from "../starters/serve-log";
import { globFiles } from "../utils/glob";
import { rootPath, srcPath, warlockPath } from "../utils/paths";
import {
  createAppBuilder,
  createBootstrapFile,
  createEnvironmentModeDisplayFile,
  loadEventFiles,
  loadLocalesFiles,
  loadMainFiles,
  loadRoutesFiles,
} from "./app-builder";
import { createConfigLoader } from "./config-loader-builder";
import { generateConfigTypes } from "./config-types-generator";

const mainfestFilePath = warlockPath("manifest.json");
const cacheBundlePath = warlockPath(".cache/cache-bundle.json");

export async function createManifestFile() {
  if (await fileExistsAsync(mainfestFilePath)) {
    return await buildMainfestFile();
  }

  // no need to await the build as we will just update the contents of the file
  buildMainfestFile();
}

async function buildMainfestFile() {
  // get all files within the src directory
  const [allFiles, aliases] = await Promise.all([
    globFiles(srcPath(), { extensions: [".ts", ".tsx"] }),
    loadAliases(),
  ]);

  // now normalize the paths and remove the root directory from it and replace any \ with /
  const normalizedPaths = allFiles.map(filePath => {
    // do initial code quality check

    const importPath = filePath
      .replace(srcPath(), "")
      .replace(/\\/g, "/")
      .replace(/^\//, "")
      // remove the .ts or .tsx extension
      .replace(/\.tsx?$/, "");

    const fullPath = filePath
      .replace(srcPath(), "")
      .replace(/\\/g, "/")
      .replace(/^\//, "");

    return {
      import: importPath,
      path: fullPath,
      fullPath: filePath.replace(/\\/g, "/"),
    };
  });

  // Create a lookup map for efficient path resolution
  const importLookup: Record<string, { path: string; fullPath: string }> = {};
  const directoryIndexLookup: Record<
    string,
    { path: string; fullPath: string }
  > = {};

  for (const file of normalizedPaths) {
    // Direct import lookup (e.g., "app/main" -> "app/main.ts")
    importLookup[file.import] = {
      path: file.path,
      fullPath: file.fullPath,
    };

    // Directory index lookup (e.g., "app" -> "app/index.ts")
    if (file.import.endsWith("/index")) {
      const dirPath = file.import.replace(/\/index$/, "");
      directoryIndexLookup[dirPath] = {
        path: file.path,
        fullPath: file.fullPath,
      };
    }
  }

  // now create the manifest file
  const manifest = {
    files: normalizedPaths,
    aliases,
    importLookup,
    directoryIndexLookup,
  };

  await putFileAsync(mainfestFilePath, JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Normalize Windows paths into forward slashes (for URL consistency)
 */
function normalizePath(p: string) {
  return p.replace(/\\/g, "/");
}

let aliases: Record<string, { path: string; type: "folder" | "file" }> = {};

/**
 * Parse tsconfig.json and update alias map.
 */
async function loadAliases(force = false) {
  if (!force && Object.keys(aliases).length) {
    return aliases;
  }

  try {
    const tsconfigRaw = await getJsonFileAsync(rootPath("tsconfig.json"));
    const paths = tsconfigRaw.compilerOptions?.paths ?? {};
    const baseUrl = tsconfigRaw.compilerOptions?.baseUrl ?? ".";
    const root = path.resolve(process.cwd(), baseUrl);
    const resolved: Record<
      string,
      {
        path: string;
        type: "folder" | "file";
      }
    > = {};

    for (const [alias, targets] of Object.entries(
      paths as Record<string, string[]>,
    )) {
      const cleanKey = alias.replace(/\*$/, "");
      const cleanTarget = (targets?.[0] ?? "").replace(/\*$/, "");
      resolved[cleanKey] = {
        path: normalizePath(
          path
            .resolve(root, cleanTarget)
            .replace(srcPath(), "")
            .replace(/\\/g, "/")
            .replace(/^\//, ""),
        ),
        type:
          cleanTarget.endsWith(".tsx") || cleanTarget.endsWith(".ts")
            ? "file"
            : "folder",
      };
    }

    aliases = resolved;
  } catch (err) {
    console.warn(
      "⚠️ Warlock loader: could not parse tsconfig.json — using empty aliases.",
    );
    aliases = {};
  }

  return aliases;
}

// Order matters: bootstrap and environment must be first
export const moduleBuilders = {
  mainfest: createManifestFile,
  configTypes: generateConfigTypes,
  bootstrap: createBootstrapFile,
  environment: createEnvironmentModeDisplayFile,
  config: createConfigLoader,
  main: loadMainFiles,
  locales: loadLocalesFiles,
  events: loadEventFiles,
  routes: loadRoutesFiles,
  starter: createHttpApplicationStarter,
};

const log = httpLog;

/**
 * Build consolidated cache bundle for faster startup
 */
export async function buildCacheBundle() {
  log.info("cache", "bundle", "Building consolidated cache bundle...");

  const cacheDir = warlockPath(".cache");
  const cacheFiles = await globFiles(cacheDir, {
    extensions: [".ts", ".tsx", ".js"],
  });

  const bundle: Record<string, string> = {};
  let filesProcessed = 0;

  for (const filePath of cacheFiles) {
    // Skip the bundle file itself
    if (filePath.includes("cache-bundle.json")) continue;

    const fileName = path.basename(filePath);
    const content = await getFileAsync(filePath);
    bundle[fileName] = content;
    filesProcessed++;
  }

  await putFileAsync(cacheBundlePath, JSON.stringify(bundle));

  log.success("cache", "bundle", `Bundle created with ${filesProcessed} files`);

  return bundle;
}

export async function buildHttpApp() {
  await ensureDirectoryAsync(warlockPath(".cache"));

  // Build all modules in parallel since they're written to separate files
  const buildPromises = Object.entries(moduleBuilders).map(
    async ([name, builder]) => {
      try {
        await builder();
      } catch (error) {
        log.error(
          "app",
          name,
          "failed to build module" +
            (error instanceof Error ? error.message : String(error)),
        );
        throw error;
      }
    },
  );

  await Promise.all(buildPromises);

  // Build cache bundle after all modules are built
  // await buildCacheBundle();
  const mainEntry = warlockPath("http.ts");

  if (await fileExistsAsync(mainEntry)) {
    return mainEntry;
  }
  // Create the main entry point that imports all modules in order
  const mainEntryContent = `
// Load environment first
import "./bootstrap";
import "./environment";

// Load config before other modules
import "./config-loader";

// Load core modules
import "./main";
import "./locales";
import "./events";
import "./routes";

// Start the application
import "./start-http-application";`;

  await putFileAsync(mainEntry, mainEntryContent);

  return mainEntry;
}

export async function createHttpApplicationStarter() {
  if (await fileExistsAsync(warlockPath("start-http-application.ts"))) {
    return "import './start-http-application'";
  }

  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(`import { startHttpApplication } from "@warlock.js/core"`);

  addContent(`startHttpApplication();`);

  await saveAs("start-http-application");

  return `import "./start-http-application"`;
}
