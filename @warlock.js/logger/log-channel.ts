import type { BasicLogConfigurations, LogContract, LoggingData } from "./types";

export abstract class LogChannel<
  Options extends BasicLogConfigurations = BasicLogConfigurations,
> implements LogContract
{
  /**
   * Channel name
   */
  public name!: string;

  /**
   * Channel description
   */
  public description?: string;

  /**
   * Determine if channel is logging in terminal
   */
  public terminal = false;

  /**
   * Default Configurations
   */
  protected defaultConfigurations: Options = {} as Options;

  /**
   * Channel configurations
   */
  protected channelConfigurations: Options = {} as Options; //

  /**
   * Determine whether the channel is fully initialized
   */
  protected isInitialized = false;

  /**
   * Constructor
   */
  public constructor(configurations?: Options) {
    if (configurations) {
      this.setConfigurations(configurations);
    }

    setTimeout(async () => {
      if (this.init) {
        await this.init();
      }

      this.isInitialized = true;
    }, 0);
  }

  /**
   * Initialize the channel
   */
  protected init?(): void | Promise<void>;

  /**
   * Get config value
   */
  protected config<K extends keyof Options>(key: K): Options[K] {
    return (
      this.channelConfigurations[key] ?? (this.defaultConfigurations ?? {})[key]
    );
  }

  /**
   * Set configurations
   */
  protected setConfigurations(configurations: Options) {
    this.channelConfigurations = {
      ...this.channelConfigurations,
      ...configurations,
    };

    return this;
  }

  /**
   * Determine if the message should be logged
   */
  protected shouldBeLogged(data: LoggingData): boolean {
    // check for debug mode
    const allowedLevels = this.config("levels");

    if (allowedLevels?.length && !allowedLevels.includes(data.type))
      return false;

    const filter = this.config("filter");

    if (filter) {
      return filter(data);
    }

    return true;
  }

  /**
   * Log the given message
   */
  public abstract log(data: LoggingData): void | Promise<void>;

  /**
   * Get date and time formats
   */
  protected getDateAndTimeFormat() {
    const dateFormat = this.config("dateFormat");
    const date = dateFormat?.date ?? "DD-MM-YYYY";
    const time = dateFormat?.time ?? "HH:mm:ss";

    return { date, time };
  }

  /**
   * get basic configurations with the given ones
   */
  protected withBasicConfigurations(configurations: Partial<Options>): Options {
    return {
      filter: () => true,
      ...configurations,
    } as any as Options;
  }
}
