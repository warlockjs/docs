import { createDatabaseAction } from "../../database/create-database-action";
import { command } from "../cli-command";

export const createDatabaseCommand = command({
  name: "create-database <name>",
  alias: "cdb",
  description: "Create a new database",
  action: createDatabaseAction,
  preload: {
    config: ["database", "log"],
    env: true,
    connectors: ["database"],
  },
  options: [
    {
      text: "--connection, -c",
      description: "Database connection name",
      defaultValue: "default",
    },
  ],
});
