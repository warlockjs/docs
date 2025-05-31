import { ensureDirectoryAsync, putFileAsync } from "@mongez/fs";
import { warlockPath } from "../utils/paths";
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

// Order matters: bootstrap and environment must be first
export const moduleBuilders = {
  bootstrap: createBootstrapFile,
  environment: createEnvironmentModeDisplayFile,
  config: createConfigLoader,
  main: loadMainFiles,
  locales: loadLocalesFiles,
  events: loadEventFiles,
  routes: loadRoutesFiles,
  starter: createHttpApplicationStarter,
};

export async function buildHttpApp() {
  await ensureDirectoryAsync(warlockPath());

  // First, build all modules and save their outputs
  for (const [name, builder] of Object.entries(moduleBuilders)) {
    try {
      await builder();
    } catch (error) {
      console.error(`Failed to build module ${name}:`, error);
      throw error;
    }
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

  const mainEntry = warlockPath("http.ts");
  await putFileAsync(mainEntry, mainEntryContent);

  return mainEntry;
}

export async function createHttpApplicationStarter() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(`import { startHttpApplication } from "@warlock.js/core"`);

  addContent(`startHttpApplication();`);

  await saveAs("start-http-application");

  return `import "./start-http-application"`;
}
