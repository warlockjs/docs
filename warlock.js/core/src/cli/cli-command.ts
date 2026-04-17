import type {
  CLICommandAction,
  CLICommandOption,
  CLICommandOptions,
  CLICommandPreload,
  CLICommandSource,
  CommandActionData,
  ResolvedCLICommandOption,
} from "./types";

export class CLICommand {
  /**
   * Command source
   */
  public commandSource?: CLICommandSource;

  /**
   * Command action
   */
  public commandAction?: CLICommandAction;

  /**
   * Command pre action
   * This will be executed before loading preloaders
   */
  public commandPreAction?: CLICommandAction;

  /**
   *    Command preload
   */
  public commandPreload?: CLICommandPreload;

  /**
   * Command description
   */
  public commandDescription?: string;

  /**
   * Command options
   */
  public commandOptions: ResolvedCLICommandOption[] = [];

  /**
   * Command relative path
   * Available only for project commands
   * Auto injected by the framework itself
   */
  public commandRelativePath?: string;

  /**
   * Determine if the command is persistent
   */
  public isPersistent: boolean = false;

  /**
   * Command alias (short name)
   */
  public commandAlias?: string;

  /**
   * Constructor
   */
  public constructor(
    public name: string,
    description?: string,
  ) {
    if (description) {
      this.commandDescription = description;
    }

    return this;
  }

  /**
   * Add command source
   */
  public source(source: CLICommandSource): this {
    this.commandSource = source;
    return this;
  }

  /**
   * Set command description
   */
  public description(description: string): this {
    this.commandDescription = description;
    return this;
  }

  /**
   * Determine if the command is persistent
   */
  public persistent(isPersistent = true): this {
    this.isPersistent = isPersistent;
    return this;
  }

  /**
   * Set command alias (short name)
   * @example .alias("m") for "migrate"
   */
  public alias(alias: string): this {
    this.commandAlias = alias;
    return this;
  }

  /**
   * Command action
   */
  public action(action: CLICommandAction): this {
    this.commandAction = action;
    return this;
  }

  /**
   * Command pre action
   * This will be executed before loading preloaders
   */
  public preAction(action: CLICommandAction): this {
    this.commandPreAction = action;
    return this;
  }

  /**
   * Add command options
   */
  public options(options: CLICommandOption[]): this {
    options.map((option) => this.option(option));

    return this;
  }

  /**
   * Add command relative path
   */
  public $relativePath(relativePath: string) {
    this.commandRelativePath = relativePath;
    return this;
  }

  /**
   * Add command option
   */
  public option(option: CLICommandOption): this;
  public option(name: string, description?: string, options?: Omit<CLICommandOption, "name">): this;
  public option(
    ...args: [CLICommandOption] | [string, string?, Omit<CLICommandOption, "name">?]
  ): this {
    let option: CLICommandOption;
    if (args.length === 1) {
      option = args[0] as CLICommandOption;
    } else {
      option = {
        text: args[0],
        description: args[1],
        ...args[2],
        name: "",
      };
    }

    this.commandOptions.push(this.parseOption(option));

    return this;
  }

  /**
   * Parse option name and alias if exists
   *
   * Supports formats:
   * - "--port, -p" → name: "port", alias: "p"
   * - "-p, --port" → name: "port", alias: "p"
   * - "--port" → name: "port", alias: undefined
   * - "-p" → name: "p", alias: undefined
   */
  protected parseOption(option: CLICommandOption): ResolvedCLICommandOption {
    const text = option.text.trim();

    // Split by comma to check for alias
    const parts = text.split(",").map((part) => part.trim());

    let name = "";
    let alias = "";

    if (parts.length === 1) {
      // Single option: "--port" or "-p"
      name = this.extractOptionName(parts[0]);
    } else if (parts.length === 2) {
      // Two options: "--port, -p" or "-p, --port"
      const first = parts[0];
      const second = parts[1];

      // Determine which is the long form (name) and which is short (alias)
      if (first.startsWith("--")) {
        name = this.extractOptionName(first);
        alias = this.extractOptionName(second);
      } else {
        name = this.extractOptionName(second);
        alias = this.extractOptionName(first);
      }
    }

    if (alias === "h" || name === "help") {
      throw new Error("Help option is not allowed, it's reserved for displaying command help");
    }

    return {
      ...option,
      name,
      alias,
    };
  }

  /**
   * Extract option name from text (removes -- or -)
   *
   * @example
   * extractOptionName("--port") → "port"
   * extractOptionName("-p") → "p"
   * extractOptionName("--port=3000") → "port"
   */
  private extractOptionName(text: string): string {
    // Remove leading dashes
    let name = text.replace(/^-+/, "");

    // Remove value assignment if exists (e.g., "--port=3000" → "port")
    const equalIndex = name.indexOf("=");
    if (equalIndex !== -1) {
      name = name.slice(0, equalIndex);
    }

    // Remove angle brackets if exists (e.g., "--port <number>" → "port")
    const spaceIndex = name.indexOf(" ");
    if (spaceIndex !== -1) {
      name = name.slice(0, spaceIndex);
    }

    return name.trim();
  }

  /**
   * Command preload
   */
  public preload(options: CLICommandPreload) {
    this.commandPreload = options;
    return this;
  }

  /**
   * Execute the command
   */
  public async execute(data: CommandActionData) {
    if (!this.commandAction) {
      throw new Error(`Command "${this.name}" has no action defined`);
    }

    await this.commandAction(data);
  }
}

export function command(options: CLICommandOptions) {
  const commandInstnace = new CLICommand(options.name, options.description);

  if (options.preload) {
    commandInstnace.preload(options.preload);
  }

  if (options.persistent) {
    commandInstnace.persistent(options.persistent);
  }

  if (options.alias) {
    commandInstnace.alias(options.alias);
  }

  commandInstnace.action(options.action);

  if (options.options) {
    commandInstnace.options(options.options);
  }

  if (options.preAction) {
    commandInstnace.preAction(options.preAction);
  }

  return commandInstnace;
}
