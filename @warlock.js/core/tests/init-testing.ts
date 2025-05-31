import { colors } from "@mongez/copper";
import {
  ensureDirectoryAsync,
  fileExists,
  fileExistsAsync,
  getJsonFileAsync,
  putFileAsync,
} from "@mongez/fs";
import { log } from "@warlock.js/logger";
import { execSync } from "child_process";
import { command } from "../console/command-builder";
import { rootPath, warlockPath } from "../utils";
import {
  createAppBuilder,
  createBootstrapFile,
  loadEventFiles,
  loadLocalesFiles,
  loadMainFiles,
  loadRoutesFiles,
} from "./../builder/app-builder";
import { createConfigLoader } from "./../builder/config-loader-builder";

export async function initTesting() {
  await ensureVitestIsInstalledAndReady();
  const { addImport, saveAs } = createAppBuilder();

  await ensureDirectoryAsync(warlockPath());

  const data = await Promise.all([
    createBootstrapFile(),
    createConfigLoader(),
    loadMainFiles(),
    loadRoutesFiles(),
    loadEventFiles(),
    loadLocalesFiles(),
  ]);

  addImport(...data);

  await saveAs("tests");
}

export function registerTestCommand() {
  return command(
    "test.init",
    "Initialize Unit Testing Before starting vitest",
  ).action(initTesting);
}

export async function ensureVitestIsInstalledAndReady() {
  const packageJson = await getJsonFileAsync(rootPath("package.json"));

  // check if vitest is installed in devDependencies

  if (packageJson.devDependencies?.vitest) return;

  log.info(
    "test",
    "init",
    colors.green("Vitest is not installed, installing it now..."),
  );

  const packageManager = detectPackageManager();

  const command = `${packageManager} add vitest vite @mongez/vite --dev`;

  log.debug("test", "init", `Running command ${colors.orange(command)}`);

  execSync(command, {
    stdio: "inherit",
  });

  log.success("test", "init", "Vitest is installed successfully");

  log.info("test", "init", "Creating vite.config.ts file...");

  await createViteConfigFile();

  log.success("test", "init", "vite.config.ts file is created successfully");
}

export function detectPackageManager() {
  // check for yarn
  if (fileExists(rootPath("yarn.lock"))) return "yarn";

  // check for pnpm
  if (fileExists(rootPath("pnpm-lock.yaml"))) return "pnpm";

  return "npm";
}

export async function createViteConfigFile() {
  const viteConfigPath = rootPath("vite.config.mts");

  if (await fileExistsAsync(viteConfigPath)) return;

  await putFileAsync(viteConfigPath, getViteConfigContentForTesting());
}

export function getViteConfigContentForTesting() {
  return `import mongezVite from "@mongez/vite";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  return {
    plugins: [mongezVite()],
    test: {
      // PLEASE DO NOT REMOVE THIS LINE, THE FILE IS AUTO GENERATED BEFORE RUNNING TESTS
      setupFiles: ["./.warlock/tests"],
      include: [
        "src/app/**/tests/*.unit.ts",
        "src/app/**/tests/*.unit.tsx",
        "src/app/**/tests/*.test.ts",
        "src/app/**/tests/*.test.tsx",
      ],
    },
  };
});
`;
}
