import { SpecialConfigHandler } from "./config-loader";

export class ConfigSpecialHandlers {
  /**
   * Handlers
   */
  protected handlers: Map<string, SpecialConfigHandler> = new Map();

  /**
   * Register a new handler
   */
  public register(configName: string, handler: SpecialConfigHandler) {
    this.handlers.set(configName, handler);
  }

  /**
   * Execute handler for the given config name
   */
  public async execute(configName: string, config: any) {
    const handler = this.handlers.get(configName);
    if (!handler) {
      return; // do nothing
    }

    return handler(config);
  }
}

export const configSpecialHandlers = new ConfigSpecialHandlers();
