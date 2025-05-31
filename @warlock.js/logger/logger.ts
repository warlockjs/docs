import { Random } from "@mongez/reinforcements";
import type { LogChannel } from "./log-channel";
import type { LogLevel } from "./types";
import { clearMessage } from "./utils/clear-message";

export class Logger {
  /**
   * Current channel
   */
  public channels: LogChannel[] = [];

  public id = "logger-" + Random.string(32);

  /**
   * Add a new channel
   */
  public addChannel(channel: LogChannel) {
    this.channels.push(channel);

    return this;
  }

  /**
   * Set base configurations
   */
  public configure(config: { channels: LogChannel[] }) {
    this.channels = config.channels;

    return this;
  }

  /**
   * Set channels
   */
  public setChannels(channels: LogChannel[]) {
    this.channels = channels;

    return this;
  }

  /**
   * Make log
   */
  public async log(
    module: string,
    action: string,
    message: any,
    level: LogLevel = "info",
  ) {
    for (const channel of this.channels) {
      if (channel.terminal === false) {
        message = clearMessage(message);
      }

      channel.log(module, action, message, level);
    }

    return this;
  }

  /**
   * Make debug log
   */
  public debug(module: string, action: string, message: any = "") {
    return this.log(module, action, message, "debug");
  }

  /**
   * Make info log
   */
  public info(module: string, action: string, message: any = "") {
    return this.log(module, action, message, "info");
  }

  /**
   * Make warn log
   */
  public warn(module: string, action: string, message: any = "") {
    return this.log(module, action, message, "warn");
  }

  /**
   * Make error log
   */
  public error(module: string, action: string, message: any = "") {
    return this.log(module, action, message, "error");
  }

  /**
   * Make success log
   */
  public success(module: string, action: string, message: any = "") {
    return this.log(module, action, message, "success");
  }

  /**
   * Get channel by name
   */
  public channel(name: string) {
    return this.channels.find(channel => channel.name === name);
  }
}

export const logger = new Logger();

export interface Log {
  (
    module: string,
    action: string,
    message: any,
    level: LogLevel,
  ): Promise<Logger>;
  /**
   * Make info log
   */
  info(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make debug log
   */
  debug(module: string, action: string, message: any): Promise<Logger>;
  warn(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make error log
   */
  error(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make success log
   */
  success(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Get channel by name
   */
  channel(name: string): LogChannel | undefined;
}

export const log: Log = (
  module: string,
  action: string,
  message: any,
  level: LogLevel,
) => {
  return logger.log(module, action, message, level);
};

log.info = logger.info.bind(logger);
log.debug = logger.debug.bind(logger);
log.warn = logger.warn.bind(logger);
log.error = logger.error.bind(logger);
log.success = logger.success.bind(logger);

log.channel = logger.channel.bind(logger);
