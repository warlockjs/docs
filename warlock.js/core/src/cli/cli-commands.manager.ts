import { colors } from "@mongez/copper";
import { loadEnv } from "@mongez/dotenv";
import { ensureDirectoryAsync, fileExistsAsync } from "@mongez/fs";
import { Application } from "../application";
import { bootstrap } from "../bootstrap";
import { loadConfigFiles } from "../config/load-config-files";
import { connectorsManager } from "../connectors/connectors-manager";
import { filesOrchestrator } from "../dev-server/files-orchestrator";
import { manifestManager } from "../manifest/manifest-manager";
import { appPath, warlockPath } from "../utils";
import { warlockConfigManager } from "../warlock-config/warlock-config.manager";
import { CLICommand } from "./cli-command";
import {
  displayCommandError,
  displayCommandHelp,
  displayCommandNotFound,
  displayCommandSuccess,
  displayExecutingCommand,
  displayHelp,
  displayMissingCommand,
  displayMissingOptions,
  displayWarlockVersionInTerminal,
  type HelpCommandInfo,
  isMatchingCommandName,
} from "./cli-commands.utils";
import { cliCommandsLoader } from "./commands-loader";
import { frameworkCommands } from "./framework-cli-commands";
import { parseCliArgs } from "./parse-cli-args";
import { findSimilar } from "./string-similarity";
import { CommandActionData, ResolvedCLICommandOption } from "./types";

export class CLICommandsManager {
  /**
   * List of commands
   */
  public commands: CLICommand[] = [];

  /**
   * Commands map (name -> command)
   */
  public commandsMap: Map<string, CLICommand> = new Map();

  /**
   * Alias map (alias -> command name)
   */
  public aliasMap: Map<string, string> = new Map();

  /**
   * Register the given commands
   */
  public register(...commands: CLICommand[]): this {
    this.commands.push(...commands);

    commands.forEach((command) => {
      const commandKey = command.name.split(" ")[0];

      manifestManager.addCommandToList(command.name, {
        relativePath: command.commandRelativePath,
        source: command.commandSource || "project",
        description: command.commandDescription,
        alias: command.commandAlias,
        options: command.commandOptions.length > 0 ? command.commandOptions : undefined,
      });

      this.commandsMap.set(commandKey, command);

      // Register alias if exists
      if (command.commandAlias) {
        this.aliasMap.set(command.commandAlias, commandKey);
      }
    });

    return this;
  }

  /**
   * Get command by name or alias
   */
  public getCommand(name: string): CLICommand | undefined {
    // First try direct lookup
    let command = this.commandsMap.get(name);
    if (command) return command;

    // Try alias lookup
    const realName = this.aliasMap.get(name);
    if (realName) {
      return this.commandsMap.get(realName);
    }

    return;
  }

  /**
   * Get all command names and aliases
   * Used for fuzzy matching suggestions
   */
  public getAllCommandNames(): string[] {
    const names: string[] = [];

    // Add all command names
    for (const name of this.commandsMap.keys()) {
      names.push(name);
    }

    // Add all aliases
    for (const alias of this.aliasMap.keys()) {
      names.push(alias);
    }

    // Also include cached commands from manifest
    const manifestCommands = manifestManager.commandsJson?.commands || {};
    for (const name of Object.keys(manifestCommands)) {
      const baseName = name.split(" ")[0];
      if (!names.includes(baseName)) {
        names.push(baseName);
      }
      const alias = manifestCommands[name].alias;
      if (alias && !names.includes(alias)) {
        names.push(alias);
      }
    }

    return names;
  }

  /**
   * Start the cli manager
   */
  public async start() {
    const { name, options, args } = parseCliArgs(process.argv);

    if (options.noCache) {
      manifestManager.clearCommandsCache();
      // remove the commands.json file as wel
      await manifestManager.removeCommandsFile();
    }

    if (options.version || options.v) {
      await displayWarlockVersionInTerminal();
      process.exit(0);
    }

    // Try to load from manifest first (fastest path)
    await manifestManager.loadCommands();

    // Register framework commands first (needed for help)
    this.register(
      ...frameworkCommands.map((command) => {
        if (!command.commandSource) {
          command.commandSource = "framework";
        }
        return command;
      }),
    );

    await ensureDirectoryAsync(warlockPath("cache"));

    const isHelpCommand = options.help || options.h;

    // Handle global help (no command)
    if (!name && isHelpCommand) {
      await this.showGlobalHelp();
      process.exit(0);
    }

    // Handle warm cache
    if (options.warmCache) {
      await this.warmCache();
      process.exit(0);
    }

    if (!name) {
      displayMissingCommand();
      process.exit(1);
    }

    const command = await this.lazyGetCommand(name);

    if (manifestManager.hasChanges) {
      await manifestManager.saveCommands();
    }

    if (!command) {
      // Find similar commands for suggestions
      const allCommandNames = this.getAllCommandNames();
      const suggestions = findSimilar(name, allCommandNames).map((s) => s.value);

      displayCommandNotFound(name, suggestions);
      process.exit(1);
    }

    // Handle command-specific help
    if (isHelpCommand) {
      displayCommandHelp({
        name: command.name,
        alias: command.commandAlias,
        description: command.commandDescription,
        options: command.commandOptions,
      });
      process.exit(0);
    }

    await this.execute(command, {
      options,
      args,
    });
  }

  /**
   * Show global help with all commands
   * Uses manifest if available for fast display
   */
  protected async showGlobalHelp() {
    if (
      manifestManager.isCommandLoaded &&
      Object.keys(manifestManager.commandsJson?.commands || {}).length > 0
    ) {
      // Use manifest directly - no need to load command files
      const helpCommands: HelpCommandInfo[] = Object.entries(
        manifestManager.commandsJson?.commands || {},
      ).map(([name, cmd]) => ({
        name,
        alias: cmd.alias,
        description: cmd.description,
        source: cmd.source,
      }));

      await displayHelp(helpCommands);
      return;
    }

    // Fallback: No manifest, build from registered commands
    // This happens on first run before warm-cache
    await this.loadPluginsCommands();

    const projectCommands = await cliCommandsLoader.scanAll();

    this.register(...projectCommands);

    await manifestManager.saveCommands();

    // Build help info from registered commands
    const helpCommands: HelpCommandInfo[] = this.commands.map((cmd) => ({
      name: cmd.name,
      alias: cmd.commandAlias,
      description: cmd.commandDescription,
      source: cmd.commandSource || "project",
    }));

    await displayHelp(helpCommands);
  }

  /**
   * Warm cache - scan all project commands and save to manifest
   */
  protected async warmCache() {
    console.log();
    console.log(`  ${colors.cyan("›")} Scanning project commands...`);

    const projectCommands = await cliCommandsLoader.scanAll();

    this.register(...projectCommands);

    await manifestManager.saveCommands();

    console.log(
      `  ${colors.green("✔")} Cached ${colors.bold(String(projectCommands.length))} project commands`,
    );
    console.log();
  }

  /**
   * Load plugins commands
   */
  protected async loadPluginsCommands() {
    await warlockConfigManager.load();

    if (warlockConfigManager.isLoaded) {
      this.register(
        ...(warlockConfigManager.get("cli")?.commands || []).map((command) => {
          if (!command.commandSource) {
            command.commandSource = "plugin";
          }
          return command;
        }),
      );
    }
  }

  /**
   * Try to find the command based on the given command name or alias
   */
  protected async lazyGetCommand(name: string) {
    // first step, try to find it directly through current commands
    let command = this.getCommand(name);
    if (command) {
      return command;
    }

    // second step, try to find it through warlock config commands
    await this.loadPluginsCommands();

    command = this.getCommand(name);

    if (command) {
      return command;
    }

    // third step, try to find it through project commands
    await this.loadProjectCommands(name);

    command = this.getCommand(name);
    if (command) {
      return command;
    }

    return null;
  }

  /**
   * Load project commands
   */
  protected async loadProjectCommands(name: string) {
    // first get the commands.json contents as an object
    const jsonCommandsFile = await manifestManager.loadCommands();

    if (jsonCommandsFile) {
      // Check by name or alias
      for (const fullCommandName in jsonCommandsFile.commands) {
        const cmdMeta = jsonCommandsFile.commands[fullCommandName];

        // Match by name or alias
        if (isMatchingCommandName(fullCommandName, name) || cmdMeta.alias === name) {
          const commandPath = cmdMeta.relativePath;
          if (commandPath) {
            const executedCommand = await cliCommandsLoader.load(commandPath);

            if (executedCommand) {
              executedCommand.$relativePath(commandPath);
              this.register(executedCommand);
              return;
            }
          }
        }
      }
    }

    const command = await cliCommandsLoader.locate(name);

    if (command) {
      this.register(command);
      return;
    }
  }

  /**
   * Validate required options
   */
  protected validateOptions(
    command: CLICommand,
    options: Record<string, string | boolean | number>,
  ): ResolvedCLICommandOption[] {
    const missing: ResolvedCLICommandOption[] = [];

    command.commandOptions.forEach((opt) => {
      if (opt.required) {
        // Check if option is provided by name or alias
        const hasOption =
          options[opt.name] !== undefined || (opt.alias && options[opt.alias] !== undefined);
        if (!hasOption) {
          missing.push(opt);
        }
      }
    });

    return missing;
  }

  /**
   * Apply default values to options
   */
  protected applyDefaultOptions(
    command: CLICommand,
    options: Record<string, string | boolean | number>,
  ): Record<string, string | boolean | number> {
    const result = { ...options };

    command.commandOptions.forEach((opt) => {
      if (opt.defaultValue !== undefined) {
        const hasOption =
          result[opt.name] !== undefined || (opt.alias && result[opt.alias] !== undefined);
        if (!hasOption) {
          result[opt.name] = opt.defaultValue;
        }
      }

      if (opt.alias !== undefined && result[opt.alias] && result[opt.name] === undefined) {
        result[opt.name] = result[opt.alias];
      }
    });

    return result;
  }

  /**
   * Execute the given command
   */
  public async execute(command: CLICommand, data: CommandActionData) {
    const startTime = Date.now();

    // Validate required options
    const missingOptions = this.validateOptions(command, data.options);
    if (missingOptions.length > 0) {
      displayMissingOptions(missingOptions);
      process.exit(1);
    }

    // Apply default values
    data.options = this.applyDefaultOptions(command, data.options);

    displayExecutingCommand(command.name);

    if (command.commandPreAction) {
      await command.commandPreAction(data);
    }

    // load preloaders
    if (command.commandPreload) {
      await this.loadPreloaders(command);
    }

    try {
      await command.execute(data);

      if (!command.isPersistent) {
        displayCommandSuccess(command.name, Date.now() - startTime);

        process.exit(0);
      }
    } catch (error) {
      displayCommandError(command.name, error as Error);
      if (!command.isPersistent) {
        process.exit(1);
      }
    }
  }

  /**
   * Load preloaders
   */
  protected async loadPreloaders(command: CLICommand) {
    const preloaders = command.commandPreload || {};

    if (preloaders.runtimeStrategy) {
      Application.setRuntimeStrategy(preloaders.runtimeStrategy);
    }

    if (preloaders.environemnt) {
      Application.setEnvironment(preloaders.environemnt);
    }

    await warlockConfigManager.load();

    if (preloaders.config || preloaders.bootstrap || preloaders.prestart) {
      await filesOrchestrator.init();
    }

    if (preloaders.env && !preloaders.bootstrap) {
      await loadEnv();
    } else if (preloaders.bootstrap) {
      await bootstrap();

      if (await fileExistsAsync(appPath("bootstrap.ts"))) {
        await filesOrchestrator.load("src/app/bootstrap.ts");
      }
    }

    // Load configuration files
    if (preloaders.config) {
      await loadConfigFiles(preloaders.config);
    }

    if (preloaders.prestart) {
      if (await fileExistsAsync(appPath("prestart.ts"))) {
        await filesOrchestrator.load("src/app/prestart.ts");
      }
    }

    // Initialize connectors
    if (preloaders.connectors) {
      await connectorsManager.start(
        preloaders.connectors === true ? undefined : preloaders.connectors,
      );
    }
  }
}
