import type { LogChannel } from "./log-channel";
import type { Logger } from "./logger";

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export type DebugMode = "daily" | "monthly" | "yearly" | "hourly";

export type BasicLogConfigurations = {
  /**
   * Set what level of logs should be logged
   *
   * @default all
   */
  levels?: LogLevel[];
  /**
   * Date and time format
   */
  dateFormat?: {
    date?: string;
    time?: string;
  };
  /**
   * Advanced filter to determine if the message should be logged or not
   */
  filter: (data: LoggingData) => boolean;
};

export type LogMessage = {
  content: string;
  level: LogLevel;
  date: string;
  module: string;
  action: string;
  stack?: string;
};

export interface LogContract {
  /**
   * Channel name
   */
  name: string;

  /**
   * Channel description
   */
  description?: string;

  /**
   * Determine if channel is logging in terminal
   */
  terminal?: boolean;

  /**
   * Log the given message
   */
  log(data: LoggingData): void | Promise<void>;
}

export type LoggingData = {
  type: "info" | "debug" | "warn" | "error" | "success";
  module: string;
  action: string;
  message: any;
  context?: Record<string, any>;
};

export type OmittedLoggingData = Omit<LoggingData, "type">;

export interface Log {
  (data: LoggingData): Promise<Logger>;
  /**
   * Make info log
   */
  info(data: OmittedLoggingData): Promise<Logger>;
  info(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make debug log
   */
  debug(data: OmittedLoggingData): Promise<Logger>;
  debug(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make warn log
   */
  warn(data: OmittedLoggingData): Promise<Logger>;
  warn(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make error log
   */
  error(data: OmittedLoggingData): Promise<Logger>;
  error(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Make success log
   */
  success(data: OmittedLoggingData): Promise<Logger>;
  success(module: string, action: string, message: any): Promise<Logger>;
  /**
   * Get channel by name
   */
  channel(name: string): LogChannel | undefined;
}
