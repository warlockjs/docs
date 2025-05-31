import type {
  CommandActionData,
  CommandOptions,
  CommandOptionsConfig,
  PreloadConsole,
} from "./types";

export class CommandBuilder {
  /**
   * Command data
   */
  protected data: CommandOptions = {} as CommandOptions;

  /**
   * Constructor
   */
  public constructor(name: string, description?: string) {
    this.data.name = name;
    this.data.description = description || "";
  }

  /**
   * Set the action
   */
  public action(action: (data: CommandActionData) => any | Promise<any>) {
    this.data.action = action;

    return this;
  }

  /**
   * Set the description
   */
  public description(description: string) {
    this.data.description = description;

    return this;
  }

  /**
   * Set engines that should be preloaded
   */
  public preload(...preload: PreloadConsole[]) {
    this.data.preload = preload;

    return this;
  }

  /**
   * Set the options
   */
  public options(options: CommandOptionsConfig[]) {
    this.data.options = options;

    return this;
  }

  /**
   * Add option
   */
  public option(flags: string, description?: string, defaultValue?: any) {
    if (!this.data.options) {
      this.data.options = [];
    }

    this.data.options.push({
      flags,
      description: description || "",
      defaultValue,
      required: false,
    });

    return this;
  }

  /**
   * Add argument
   */
  public argument(name: string, description?: string, defaultValue?: any) {
    if (!this.data.args) {
      this.data.args = [];
    }

    this.data.args.push([name, description || "", defaultValue]);

    return this;
  }

  /**
   * Add required option
   */
  public requiredOption(
    flags: string,
    description?: string,
    defaultValue?: any,
  ) {
    if (!this.data.options) {
      this.data.options = [];
    }

    this.data.options.push({
      flags,
      description: description || "",
      defaultValue,
      required: true,
    });

    return this;
  }

  /**
   * Build the command up
   */
  public build(): CommandOptions {
    if (!this.data.action) {
      throw new Error("You must provide an action for the command");
    }

    return this.data;
  }
}

export function command(name: string, description?: string) {
  return new CommandBuilder(name, description);
}
