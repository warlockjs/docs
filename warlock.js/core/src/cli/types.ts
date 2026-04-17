/**
 * @fileoverview CLI2 Type Definitions
 * @description Core type definitions for the Warlock.js CLI v2 system.
 * These types define the structure for commands, options, preloading, and actions.
 */

import { ConnectorName } from "../connectors";

/**
 * Indicates the origin/source of a CLI command.
 *
 * - `"framework"` - Built-in commands provided by Warlock.js (e.g., `dev`, `help`)
 * - `"plugin"` - Commands from installed Warlock.js plugins
 * - `"project"` - Custom commands defined in the project's source code
 */
export type CLICommandSource = "framework" | "plugin" | "project";

/**
 * Data passed to command action and preAction functions.
 *
 * @example
 * // For command: warlock migrate users --fresh --limit=10
 * {
 *   args: ["users"],
 *   options: { fresh: true, limit: "10" }
 * }
 */
export type CommandActionData = {
  /**
   * Positional arguments passed after the command name.
   * @example `warlock migrate users posts` → args: ["users", "posts"]
   */
  args: string[];

  /**
   * Named options/flags parsed from CLI arguments.
   * Kebab-case options are converted to camelCase.
   * @example `--no-cache --port=3000` → { noCache: true, port: "3000" }
   */
  options: Record<string, string | boolean | number>;
};

/**
 * Configuration for lazy-loading resources before command execution.
 * Only specified resources are loaded, optimizing startup time.
 *
 * @example
 * // Load only database config and connector
 * preload: {
 *   config: ["database"],
 *   connectors: ["database"]
 * }
 *
 * @example
 * // Load everything (full bootstrap)
 * preload: {
 *   bootstrap: true,
 *   config: true,
 *   connectors: true
 * }
 */
export type CLICommandPreload = {
  /**
   * Configuration files to load.
   * - `true` - Load all config files
   * - `string[]` - Load only specified config modules (e.g., `["database", "cache"]`)
   */
  config?: true | string[];

  /**
   * Load prestart file after (bootstrap and configurations are loaded).
   */
  prestart?: boolean;

  /**
   * Load warlock config
   */
  warlockConfig?: boolean;

  /**
   * Set runtime strategy
   */
  runtimeStrategy?: "production" | "development";

  /**
   * Override current detect environment
   */
  environemnt?: "production" | "development" | "test";

  /**
   * Whether to load environment variables from .env files.
   * Note: If `bootstrap` is true, env is loaded automatically.
   */
  env?: boolean;

  /**
   * Whether to run the full bootstrap process.
   * This includes loading env and initializing the application.
   */
  bootstrap?: boolean;

  /**
   * Connectors to initialize before command execution.
   * - `true` - Initialize all connectors (http, database, cache)
   * - `string[]` - Initialize only specified connectors
   *
   * Available connectors: `"http"`, `"database"`, `"cache"`, `"storage"`
   */
  connectors?: ConnectorName[] | true;
};

/**
 * Definition for a CLI command option/flag.
 *
 * @example
 * {
 *   name: "port",
 *   text: "--port, -p",
 *   alias: "p",
 *   description: "Server port number",
 *   type: "number",
 *   required: false
 * }
 */
export type CLICommandOption = {
  /**
   * The raw option text as it appears in help output.
   * Supports formats: `"--port"`, `"-p"`, `"--port, -p"`, `"-p, --port"`
   */
  text: string;

  /**
   * The camelCase name of the option (auto-extracted from `text`).
   * This is the key used in `CommandActionData.options`.
   */
  name?: string;

  /**
   * Short alias for the option (auto-extracted from `text`).
   * @example For `"--port, -p"` → alias: "p"
   */
  alias?: string;

  /**
   * Human-readable description shown in help output.
   */
  description?: string;

  /**
   * Expected value type for validation and parsing.
   * @default "string"
   */
  type?: "string" | "boolean" | "number";

  /**
   * Default value if option is not provided.
   */
  defaultValue?: string | boolean | number;

  /**
   * Whether this option is required.
   * If true and not provided, command will fail with an error.
   */
  required?: boolean;
};

export type ResolvedCLICommandOption = Omit<CLICommandOption, "alias" | "name"> & {
  name: string;
  alias: string;
};

/**
 * Command action function signature.
 * Receives parsed CLI data and can be sync or async.
 */
export type CLICommandAction = (data: CommandActionData) => void | Promise<void>;

/**
 * Configuration object for creating a CLI command using the `command()` factory.
 *
 * @example
 * command({
 *   name: "migrate",
 *   description: "Run database migrations",
 *   preload: {
 *     bootstrap: true,
 *     connectors: ["database"]
 *   },
 *   options: [
 *     { text: "--fresh, -f", description: "Drop all tables first" }
 *   ],
 *   action: async ({ options }) => {
 *     if (options.fresh) await dropTables();
 *     await runMigrations();
 *   }
 * })
 */
export type CLICommandOptions = {
  /**
   * The command name. Use dot notation for namespaced commands.
   * @example "migrate", "db.seed", "jwt.generate"
   */
  name: string;

  /**
   * Short alias for the command.
   * @example "m" for "migrate", "g" for "generate"
   */
  alias?: string;

  /**
   * Human-readable description shown in help output.
   */
  description?: string;

  /**
   * Resources to preload before command execution.
   * @see CLICommandPreload
   */
  preload?: CLICommandPreload;

  /**
   * Whether the command keeps the process alive (e.g., dev server, watchers).
   * If false, process exits after action completes.
   * @default false
   */
  persistent?: boolean;

  /**
   * Function to run BEFORE preloading resources.
   * Useful for displaying banners, validating input, etc.
   */
  preAction?: CLICommandAction;

  /**
   * The main command action function.
   * Executed after preloading resources.
   */
  action: CLICommandAction;

  /**
   * Command-specific options/flags.
   * @see CLICommandOption
   */
  options?: CLICommandOption[];
};
