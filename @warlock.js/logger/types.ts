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
  filter: (options: {
    level: LogLevel;
    module: string;
    action: string;
    message: any;
  }) => boolean;
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
  log(
    module: string,
    action: string,
    message: any,
    level: LogLevel,
  ): void | Promise<void>;
}
