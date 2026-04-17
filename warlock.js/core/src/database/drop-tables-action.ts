import { colors } from "@mongez/copper";
import { dataSourceRegistry } from "@warlock.js/cascade";
import { log } from "@warlock.js/logger";
import { confirm } from "../cli/commands/generate/utils/prompt";
import { CommandActionData } from "../cli/types";

export async function dropTablesAction(command: CommandActionData) {
  const { force } = command.options;

  // For now we will support only the default connection
  const dataSource = dataSourceRegistry.get();

  const driver = dataSource.driver;

  if (force) {
    const tables = await driver.blueprint.listTables();
    await driver.dropAllTables();
    log.success(
      "database",
      "drop",
      `Dropped ${colors.yellowBright(tables.length)} tables successfully.`,
    );
    return;
  }

  const tables = await driver.blueprint.listTables();

  if (tables.length === 0) {
    log.warn("database", "drop", "No tables found in the database.");
    return;
  }

  log.info("database", "drop", `Found ${colors.yellowBright(tables.length)} tables:`);

  for (const table of tables) {
    const count = await driver.queryBuilder(table).count();
    console.log(`  - ${colors.cyan(table)}: ${colors.green(count)} rows`);
  }

  const confirmed = await confirm(
    `Are you sure you want to drop all ${colors.red(tables.length)} tables?`,
  );

  if (!confirmed) {
    log.info("database", "drop", "Operation cancelled.");
    return;
  }

  await driver.dropAllTables();

  log.success(
    "database",
    "drop",
    `Dropped ${colors.yellowBright(tables.length)} tables successfully.`,
  );
}
