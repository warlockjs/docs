import { migrateAction } from "../../database/migrate-action";
import { command } from "../cli-command";

export const migrateCommand = command({
  action: migrateAction,
  name: "migrate",
  description: "Run database migrations",
  preload: {
    config: ["database", "log"],
    env: true,
    connectors: ["database", "logger"],
  },
  options: [
    {
      text: "--fresh, -f",
      description: "Drop all tables and re-run migrations",
      type: "boolean",
    },
    {
      text: "--rollback, -r",
      description: "Rollback migrations, drop all tables",
      type: "boolean",
    },
    {
      text: "--path, -p",
      description: "Migration file path, if not provided, all migrations will be wroking",
      type: "string",
    },
    {
      text: "--list, -l",
      description: "List all executed migrations",
      type: "boolean",
    },
    {
      text: "--all, -a",
      description: "List all migrations files in the app",
      type: "boolean",
    },
    {
      text: "--sql, -s",
      description: "Export all migrations as phase-ordered SQL files instead of executing them",
      type: "boolean",
    },
    {
      text: "--pending-only",
      description: "When used with --sql, exports only pending migrations instead of all",
      type: "boolean",
    },
    {
      text: "--compact, -c",
      description:
        "When used with --sql, strips out generated comments and blank lines to reduce file size",
      type: "boolean",
    },
  ],
});
