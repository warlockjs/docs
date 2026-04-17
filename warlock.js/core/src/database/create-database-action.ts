import { colors } from "@mongez/copper";
import { dataSourceRegistry } from "@warlock.js/cascade";
import { log } from "@warlock.js/logger";
import { CommandActionData } from "../cli/types";
import { config } from "../config";

export async function createDatabaseAction(command: CommandActionData) {
  const name = command.args[0];
  const { connection = "default" } = command.options;

  const dataSource = dataSourceRegistry.get(
    connection === "default" || connection === true ? undefined : String(connection),
  );

  let databaseName = name;

  if (!databaseName) {
    if (connection === "default") {
      databaseName = config.get("database")?.database;
    }
  }

  if (!databaseName) {
    log.error(
      "database",
      "create",
      "Database name is required. Please provide a name or configure it in the database config.",
    );
    return;
  }

  log.info("database", "create", `Creating database ${colors.cyan(databaseName)}...`);

  try {
    const created = await dataSource.driver.createDatabase(databaseName);

    if (created) {
      log.success(
        "database",
        "create",
        `Database ${colors.green(databaseName)} created successfully.`,
      );
    } else {
      log.warn("database", "create", `Database ${colors.yellow(databaseName)} already exists.`);
    }
  } catch (error: any) {
    log.error(
      "database",
      "create",
      `Failed to create database ${colors.red(databaseName)}: ${error.message}`,
    );
  }
}
