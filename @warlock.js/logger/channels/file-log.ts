import { ensureDirectoryAsync } from "@mongez/fs";
import dayjs from "dayjs";
import fs from "fs";
import { EOL } from "os";
import path from "path";
import { LogChannel } from "../log-channel";
import type {
  BasicLogConfigurations,
  LogContract,
  LoggingData,
  LogLevel,
  LogMessage,
} from "../types";

// TODO: Add max messages per file before rotation

export type FileLogConfig = BasicLogConfigurations & {
  storagePath?: string;
  /**
   * File name, without extension
   */
  name?: string;
  /**
   * chunk mode
   * If set to `single`, the logs will be created in a single file, unless the rotate is set to true
   * If set to `daily`, the logs will be created in a daily file, unless the rotate is set to true
   * If set to `hourly`, the logs will be created in an hourly file, unless the rotate is set to true
   * @default single
   */
  chunk?: "single" | "daily" | "hourly";
  /**
   * Whether to rotate the file
   *
   * @default true
   */
  rotate?: boolean;
  /**
   * File Extension
   *
   * @default log
   */
  extension?: string;
  /**
   * If rotate is set, the rotate name will be added to the file name suffixed with `-`
   *
   * @default DD-MM-YYYY
   */
  rotateFileName?: string;
  /**
   * Max file size before rotating the file
   *
   * @default 10MB
   */
  maxFileSize?: number;
  /**
   * Set the max messages that needs to be added before writing to the file
   *
   * @default 100
   */
  maxMessagesToWrite?: number;
  /**
   * Group logs by
   * Please note that the order matters here
   * For example, if you set `groupBy: ['level', 'module']`, the logs will be added in level name first, then by module
   *
   * @default none
   */
  groupBy?: ("level" | "module" | "action")[];
  /**
   * Define what levels should be logged
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
};

export class FileLog extends LogChannel<FileLogConfig> implements LogContract {
  /**
   * {@inheritdoc}
   */
  public name = "file";

  /**
   * Messages buffer
   */
  protected messages: LogMessage[] = [];

  /**
   * Grouped messages
   */
  protected groupedMessages: Record<string, LogMessage[]> = {};

  /**
   * Default channel configurations
   */
  protected defaultConfigurations: FileLogConfig = {
    storagePath: process.cwd() + "/storage/logs",
    rotate: true,
    name: "app",
    extension: "log",
    chunk: "single",
    maxMessagesToWrite: 100,
    filter: () => true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    get rotateFileName() {
      return dayjs().format("DD-MM-YYYY");
    },
    dateFormat: {
      date: "DD-MM-YYYY",
      time: "HH:mm:ss",
    },
  };

  /**
   * Last write time
   */
  protected lastWriteTime = Date.now();

  /**
   * A flag to determine if the file is being written
   */
  protected isWriting = false;

  /**
   * Check file size for file rotation
   */
  protected async checkAndRotateFile(filePath = this.filePath) {
    if (!this.config("rotate")) return;

    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size >= this.config("maxFileSize")!) {
        await this.rotateLogFile();
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, this can be normal if it's a new file
        console.log("Log file does not exist, will be created on first write.");
      } else {
        console.error("Error checking log file:", error);
      }
    }
  }

  /**
   * Rotate log file
   */
  protected async rotateLogFile() {
    const fileName = `${this.fileName}-${this.config(
      "rotateFileName",
    )}-${Date.now()}`;

    const extension = this.extension;

    const rotatedFilePath = path.join(
      this.storagePath,
      `${fileName}.${extension}`,
    );

    await fs.promises.rename(this.filePath, rotatedFilePath).catch(error => {
      console.error("Error rotating file:", error);
    });
  }

  /**
   * Flush messages
   */
  protected initMessageFlush() {
    setInterval(() => {
      if (
        this.messages.length > 0 &&
        (this.messages.length >= this.maxMessagesToWrite ||
          Date.now() - this.lastWriteTime > 5000)
      ) {
        this.writeMessagesToFile();
      }
    }, 5000); // Periodic check
  }

  /**
   * Get file path
   */
  public get filePath() {
    const fileName = this.fileName;

    const extension = this.extension;

    return path.join(this.storagePath, `${fileName}.${extension}`);
  }

  /**
   * Get max messages
   */
  protected get maxMessagesToWrite(): number {
    return this.config("maxMessagesToWrite")!;
  }

  /**
   * Get file name
   */
  public get fileName(): string {
    const debugLevel = this.config("chunk")!;

    switch (debugLevel) {
      case "single":
      default:
        return this.config("name")!;
      case "daily":
        return dayjs().format("DD-MM-YYYY");
      case "hourly":
        return dayjs().format("DD-MM-YYYY-HH");
    }
  }

  /**
   * Get file extension
   */
  public get extension(): string {
    return this.config("extension")!;
  }

  /**
   * Get content
   */
  protected get content() {
    return this.messages.map(message => message.content).join(EOL) + EOL;
  }

  /**
   * Get storage path
   */
  public get storagePath(): string {
    return this.config("storagePath")!;
  }

  /**
   * {@inheritdoc}
   */
  protected async init() {
    const logsDirectory = this.storagePath;

    await ensureDirectoryAsync(logsDirectory);

    this.initMessageFlush();
  }

  /**
   * {@inheritdoc}
   */
  public async log(data: LoggingData) {
    const { module, action, message, type: level } = data;

    if (!this.shouldBeLogged(data)) return;

    const { date: dateFormat, time } = this.getDateAndTimeFormat();

    const date = dayjs().format(dateFormat + " " + time);

    let content = `[${date}] [${level}] [${module}][${action}]: `;

    let stack: string | undefined;

    // check if message is an instance of Error
    if (message instanceof Error) {
      // in that case we need to store the error message and stack trace
      content += message.message + EOL;
      content += `[trace]` + EOL;
      content += message.stack;
      stack = message.stack;
    } else {
      content += message;
    }

    this.messages.push({
      content,
      level,
      date,
      module,
      action,
      stack,
    });

    await this.checkIfMessagesShouldBeWritten(); // Immediate check on buffer size
  }

  /**
   * Check if messages should be written
   */
  protected async checkIfMessagesShouldBeWritten() {
    if (
      this.messages.length >= this.maxMessagesToWrite ||
      Date.now() - this.lastWriteTime > 5000
    ) {
      await this.writeMessagesToFile();
    }
  }

  /**
   * Should be called after messages are saved
   */
  protected onSave() {
    this.messages = [];
    this.groupedMessages = {};
    this.isWriting = false;
    this.lastWriteTime = Date.now();
  }

  /**
   * Check if messages should be grouped
   */
  protected get messagedShouldBeGrouped(): boolean {
    return Number(this.config("groupBy")?.length) > 0;
  }

  /**
   * Write messages to the file
   */
  protected async writeMessagesToFile() {
    if (this.messages.length === 0 || this.isWriting || !this.isInitialized)
      return;

    this.isWriting = true;

    if (this.messagedShouldBeGrouped) {
      return await this.writeGroupedMessagesToFile();
    }

    await this.checkAndRotateFile(); // Ensure we check file size before writing

    try {
      await this.write(this.filePath, this.content);
      this.onSave();
    } catch (error) {
      console.error("Failed to write log:", error);
      // Implement fallback logic here
      this.isWriting = false;
    }
  }

  /**
   * Write grouped messages to the file
   */
  protected async writeGroupedMessagesToFile(): Promise<void> {
    // first step, is to group the messages
    this.prepareGroupedMessages();

    // now each key in the grouped messages, represents the directory path that should extend the storage path
    for (const key in this.groupedMessages) {
      const directoryPath = path.join(this.storagePath, key);

      await ensureDirectoryAsync(directoryPath);

      const filePath = path.join(
        directoryPath,
        `${this.fileName}.${this.extension}`,
      );

      await this.checkAndRotateFile(filePath); // Ensure we check file size before writing

      const content =
        this.groupedMessages[key].map(message => message.content).join(EOL) +
        EOL;

      try {
        await this.write(filePath, content);
      } catch (error) {
        console.error("Failed to write log:", error);
      }
    }

    this.onSave();
    this.isWriting = false;
  }

  /**
   * Prepare grouped messages
   */
  protected prepareGroupedMessages(): void {
    this.messages.forEach(message => {
      const key = this.config("groupBy")!
        .map(groupKey => encodeURIComponent(message[groupKey]))
        .join("/");

      this.groupedMessages[key] = this.groupedMessages[key] || [];
      this.groupedMessages[key].push(message);
    });
  }

  /**
   * Start writing to the file
   */
  protected async write(filePath: string, content: string) {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath, { flags: "a" });

      writer.write(content, error => {
        writer.end();
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }
}
