import { listMigrations, migrate } from "@warlock.js/cascade";
import {
  createAppBuilder,
  globModuleDirectoryPattern,
} from "../../../builder/app-builder";
import { command } from "./../../command-builder";

export async function loadMigrationsFiles() {
  const { addImport, saveAs } = createAppBuilder();

  const migrationsList = await globModuleDirectoryPattern(
    "models/**/migration.ts",
  );

  const setupList = await globModuleDirectoryPattern("models/**/setup.ts");

  const migrationFilesInMigrationsDirectory = await globModuleDirectoryPattern(
    "models/**/migrations/*.ts",
  );

  migrationsList.push(...setupList, ...migrationFilesInMigrationsDirectory);

  for (const path of migrationsList) {
    addImport(`import "${path}"`);
  }

  await saveAs("migrations");

  return `import "./migrations"`;
}

export function registerMigrationCommand() {
  return command("migrate", "Generate Database Migrations")
    .preload("database")
    .option(
      "-r, --refresh",
      "Drop all migrations and generate fresh migrations",
    )
    .option("-l, --list", "List all migrations")
    .action(async ({ options }) => {
      if (options.list) {
        await listMigrations();
      } else {
        await migrate(options.refresh);
      }
    });
}
