import { ensureDirectoryAsync } from "@mongez/fs";
import { loadMigrationsFiles } from "../console/commands/database/migrate";
import { loadSeedsFiles } from "../console/commands/database/seeds";
import { warlockPath } from "../utils/paths";
import {
  createAppBuilder,
  createBootstrapFile,
  globModuleDirectory,
} from "./app-builder";
import { createConfigLoader } from "./config-loader-builder";

export async function buildCliApp() {
  const { addImport, saveAs } = createAppBuilder();

  await ensureDirectoryAsync(warlockPath());

  const command = process.argv[2];

  const initialImports = [
    createBootstrapFile(),
    createConfigLoader(),
    createWarlockConfigLoader(),
  ];

  const optionalImports: any[] = [];

  const lastImports = [];

  if (command.includes("migrate")) {
    optionalImports.push(loadMigrationsFiles());
  } else if (command.includes("seed")) {
    optionalImports.push(loadSeedsFiles());
  } else {
    lastImports.push(loadCommandFiles());
  }

  lastImports.push(createCliApplicationStarter());

  const list = [...initialImports, ...optionalImports, ...lastImports];

  const data = await Promise.all(list);

  addImport(...data);

  await saveAs("cli");

  return warlockPath("cli.ts");
}

async function createWarlockConfigLoader() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(
    `import warlockConfig from "warlock.config";`,
    `import { setWarlockConfig } from "@warlock.js/core";`,
  );

  addContent(`
    // Load warlock config
    setWarlockConfig(warlockConfig);
  `);

  await saveAs("warlock-config");

  return `import "./warlock-config";`;
}

export async function createCliApplicationStarter() {
  const { addImport, addContent, saveAs } = createAppBuilder();

  addImport(
    `import { startConsoleApplication, $registerBuiltInCommands } from "@warlock.js/core"`,
  );

  addContent(`
async function main() {
    await $registerBuiltInCommands();
    startConsoleApplication();
}

main();
`);

  await saveAs("start-console-application");

  return `import "./start-console-application"`;
}

export async function loadCommandFiles() {
  const { addImport, saveAs } = createAppBuilder();

  const paths = await globModuleDirectory("commands");

  const addCliImport = (path: string) => {
    return addImport(`import "${path}";`);
  };

  await Promise.all(paths.map(async path => await addCliImport(path)));

  await saveAs("commands");

  return `import "./commands"`;
}
