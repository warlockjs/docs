import { colors } from "@mongez/copper";
import { Migration, migrationRunner } from "@warlock.js/cascade";
import dayjs from "dayjs";
import path from "path";
import { CommandActionData } from "../cli/types";
import { filesOrchestrator } from "../dev-server/files-orchestrator";
import { Path } from "../dev-server/path";
import { getFilesFromDirectory } from "../dev-server/utils";
import { srcPath } from "../utils";
import { warlockConfigManager } from "../warlock-config/warlock-config.manager";

async function listMigrationsAction() {
  const createdMigrations = await migrationRunner.getExecutedMigrations();

  console.log(`\nTotal Executed Migrations: ${colors.green(createdMigrations.length)}\n`);

  if (createdMigrations.length === 0) {
    console.log(colors.gray("  No migrations have been executed yet.\n"));
    return;
  }

  // Display each migration as a block
  for (const migration of createdMigrations) {
    const executedAt = dayjs(migration.executedAt).format("DD-MM-YYYY hh:mm:ss A");
    const createdAt = migration.createdAt
      ? dayjs(migration.createdAt).format("DD-MM-YYYY hh:mm:ss A")
      : null;

    // Migration name with checkmark icon
    console.log(`  ${colors.green("✔")} ${colors.cyanBright(migration.name)}`);

    // Executed date
    console.log(`    ${colors.gray("Executed:")} ${colors.white(executedAt)}`);

    // Created date (if available)
    if (createdAt) {
      console.log(`    ${colors.gray("Created:")}  ${colors.yellow(createdAt)}`);
    }

    console.log(""); // Empty line between migrations
  }
}

async function allMigrationsFilesAction() {
  // get all available migration files in the project
  const files = (await migrationFiles()).map((path) => Path.toRelative(path));
  console.log(`Total Migration Files: ${colors.green(files.length)}`);

  for (const file of files) {
    console.log(colors.yellowBright(file));
  }
}

/**
 * If path is provided, then run the migration runner against that file only
 * If fresh is provided, then rollback all migrations and run all migrations
 * If rollback is provided, then run the migration runner against all files in reverse order
 */
export async function migrateAction(options: CommandActionData) {
  const { fresh, path, rollback, all, list, sql, pendingOnly, compact } = options.options;

  if (list) {
    return await listMigrationsAction();
  }

  if (all) {
    return await allMigrationsFilesAction();
  }

  if (path) {
    await loadMigrationFile(Path.toAbsolute(path as string));
  } else {
    await loadAllMigrations();
  }

  if (fresh && rollback) {
    console.log(colors.redBright("You can't use --fresh and --rollback together"));
    process.exit(1);
  }

  if (rollback || fresh) {
    await migrationRunner.rollbackAll();
  }

  if (rollback) return;

  if (sql) {
    await migrationRunner.exportSQL({ pendingOnly: pendingOnly as boolean, compact: compact as boolean });
  } else {
    await migrationRunner.runAll();
  }
}

async function loadMigrationFile(absPath: string) {
  const relativePath = Path.toRelative(absPath);

  const loadedModule = await filesOrchestrator.load<{ default: typeof Migration }>(relativePath);

  if (!loadedModule?.default) {
    throw new Error(`${Path.toRelative(absPath)} must have a default export`);
  }

  const MigrationClass = loadedModule.default;

  if (!MigrationClass.migrationName) {
    MigrationClass.migrationName = path
      .basename(absPath)
      .split(".")[0]
      .replace("-migration", "")
      .replace("_migration", "");
  }

  // Extract createdAt timestamp from filename if not already set
  // Expected format: MM-DD-YYYY_HH-MM-SS-name.migration.ts
  if (!MigrationClass.createdAt) {
    const filename = path.basename(absPath);
    const timestampMatch = filename.match(/^(\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2})/);
    if (timestampMatch) {
      MigrationClass.createdAt = timestampMatch[1];
    }
  }

  migrationRunner.register(MigrationClass);
}

/**
 *
 * @returns List of absolute paths to migration files
 */
async function migrationFiles() {
  const migrationFiles = await getFilesFromDirectory(srcPath("app"), "*/models/*/migrations/*");
  const separateMigrationsFolderFIles = await getFilesFromDirectory(
    srcPath("app"),
    "*/migrations/*",
  );

  const migrations = [...migrationFiles, ...separateMigrationsFolderFIles];

  return migrations;
}

async function loadAllMigrations() {
  // Load config-registered migrations (from packages like @warlock.js/auth)
  const configMigrations = warlockConfigManager.get("database")?.migrations || [];

  for (const MigrationClass of configMigrations) {
    // Use class name as migration name if not set
    if (!MigrationClass.migrationName) {
      MigrationClass.migrationName = MigrationClass.name;
    }
    migrationRunner.register(MigrationClass);
  }

  // Always load file-based migrations from src/app, regardless of config
  const migrations = await migrationFiles();
  for (const migrationFile of migrations) {
    await loadMigrationFile(migrationFile);
  }
}
