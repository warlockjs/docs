import { Random } from "@mongez/reinforcements";
import type { LogChannel } from "./log-channel";
import type { Log, LoggingData, LogLevel, OmittedLoggingData } from "./types";
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
   * Normalize log data to a single object
   */
  private normalizeLogData(
    dataOrModule: LoggingData | OmittedLoggingData | string,
    action?: string,
    message: any = "",
    level?: LogLevel,
  ): LoggingData {
    if (typeof dataOrModule === "object") {
      // If level is provided, override type
      return {
        type: (level || (dataOrModule as any).type || "info") as LogLevel,
        module: dataOrModule.module,
        action: dataOrModule.action,
        message: dataOrModule.message,
        ...(dataOrModule.context ? { context: dataOrModule.context } : {}),
      };
    }
    return {
      type: (level || "info") as LogLevel,
      module: dataOrModule,
      action: action as string,
      message,
    };
  }

  /**
   * Make log
   */
  public async log(data: LoggingData) {
    for (const channel of this.channels) {
      if (channel.terminal === false) {
        data.message = clearMessage(data.message);
      }

      channel.log(data);
    }
    return this;
  }

  /**
   * Make debug log
   */
  public debug(
    dataOrModule: LoggingData | string,
    action?: string,
    message: any = "",
  ) {
    const data = this.normalizeLogData(dataOrModule, action, message, "debug");
    return this.log(data);
  }

  /**
   * Make info log
   */
  public info(
    dataOrModule: OmittedLoggingData | string,
    action?: string,
    message: any = "",
  ) {
    const data = this.normalizeLogData(dataOrModule, action, message, "info");
    return this.log(data);
  }

  /**
   * Make warn log
   */
  public warn(
    dataOrModule: LoggingData | string,
    action?: string,
    message: any = "",
  ) {
    const data = this.normalizeLogData(dataOrModule, action, message, "warn");
    return this.log(data);
  }

  /**
   * Make error log
   */
  public error(
    dataOrModule: LoggingData | string,
    action?: string,
    message: any = "",
  ) {
    const data = this.normalizeLogData(dataOrModule, action, message, "error");
    return this.log(data);
  }

  /**
   * Make success log
   */
  public success(
    dataOrModule: LoggingData | string,
    action?: string,
    message: any = "",
  ) {
    const data = this.normalizeLogData(
      dataOrModule,
      action,
      message,
      "success",
    );

    return this.log(data);
  }

  /**
   * Get channel by name
   */
  public channel(name: string) {
    return this.channels.find(channel => channel.name === name);
  }
}

export const logger = new Logger();

export const log: Log = (data: LoggingData) => {
  return logger.log(data);
};

log.info = logger.info.bind(logger) as Log["info"];
log.debug = logger.debug.bind(logger) as Log["debug"];
log.warn = logger.warn.bind(logger) as Log["warn"];
log.error = logger.error.bind(logger) as Log["error"];
log.success = logger.success.bind(logger) as Log["success"];

log.channel = logger.channel.bind(logger);
