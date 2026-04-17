import {
  ensureDirectoryAsync,
  fileExistsAsync,
  getJsonFileAsync,
  putJsonFileAsync,
} from "@mongez/fs";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import type { LogContract, LogMessage, LoggingData } from "../types";
import { FileLog } from "./file-log";

export class JSONFileLog extends FileLog implements LogContract {
  /**
   * {@inheritdoc}
   */
  public name = "fileJson";

  /**
   * Get file extension
   */
  public get extension(): string {
    return "json";
  }

  /**
   * Get initial file contents
   */
  protected get initialFileContents(): Record<string, any> {
    return {
      messages: this.messages,
    };
  }

  /**
   * Synchronously flush messages
   */
  public flushSync(): void {
    if (this.messages.length === 0 && Object.keys(this.groupedMessages).length === 0) return;

    if (this.messagedShouldBeGrouped) {
      this.prepareGroupedMessages();
      for (const key in this.groupedMessages) {
        const directoryPath = path.join(this.storagePath, key);
        fs.mkdirSync(directoryPath, { recursive: true });
        const filePath = path.join(directoryPath, `${this.fileName}.${this.extension}`);
        
        let fileContents = { messages: [] as any[] };
        if (fs.existsSync(filePath)) {
          try {
            fileContents = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (!Array.isArray(fileContents.messages)) fileContents.messages = [];
          } catch (e) {
            fileContents = { messages: [] };
          }
        }
        fileContents.messages.push(...this.groupedMessages[key]);
        fs.writeFileSync(filePath, JSON.stringify(fileContents, null, 2));
      }
    } else {
      fs.mkdirSync(this.storagePath, { recursive: true });
      let fileContents = { messages: [] as any[] };
      if (fs.existsSync(this.filePath)) {
        try {
          fileContents = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
          if (!Array.isArray(fileContents.messages)) fileContents.messages = [];
        } catch (e) {
          fileContents = { messages: [] };
        }
      }
      fileContents.messages.push(...this.messages);
      fs.writeFileSync(this.filePath, JSON.stringify(fileContents, null, 2));
    }

    this.onSave();
  }

  /**
   * {@inheritdoc}
   */
  public async log(data: LoggingData) {
    let stack: string[] | undefined;

    if (data.message instanceof Error) {
      stack = data.message.stack?.split("\n");
      data.message = data.message.message;
    }

    const { module, action, message, type: level, context } = data;

    if (!this.shouldBeLogged(data)) return;

    const { date: dateFormat, time } = this.getDateAndTimeFormat();

    const date = dayjs().format(dateFormat + " " + time);

    this.messages.push({
      content: message,
      level,
      date,
      module,
      action,
      stack,
      context,
      timestamp: new Date().toISOString(),
    } as LogMessage);

    await this.checkIfMessagesShouldBeWritten(); // Immediate check on buffer size
  }

  /**
   * Write messages to the file
   */
  protected async writeMessagesToFile(): Promise<void> {
    if (this.messages.length === 0 || this.isWriting) return;

    this.isWriting = true;

    if (this.messagedShouldBeGrouped) {
      return await this.writeGroupedMessagesToFile();
    }

    await this.checkAndRotateFile(); // Ensure file rotation is handled

    let fileContents;
    if (await fileExistsAsync(this.filePath)) {
      try {
        fileContents = await getJsonFileAsync(this.filePath);
      } catch (error) {
        console.error("Error reading log file, reinitializing:", error);
        fileContents = { messages: [] }; // Reinitialize the file if corrupted
      }
    } else {
      fileContents = { messages: [] }; // Reinitialize the file if corrupted
    }

    fileContents.messages.push(...this.messages);

    try {
      await putJsonFileAsync(this.filePath, fileContents, { spaces: 2 });

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

      const filePath = path.join(directoryPath, `${this.fileName}.${this.extension}`);

      await this.checkAndRotateFile(filePath); // Ensure we check file size before writing

      let fileContents;
      if (await fileExistsAsync(filePath)) {
        try {
          fileContents = await getJsonFileAsync(filePath);
          if (!Array.isArray(fileContents.messages)) fileContents.messages = [];
        } catch (error) {
          console.error("Error reading log file, reinitializing:", error);
          fileContents = { messages: [] };
        }
      } else {
        fileContents = { messages: [] };
      }

      fileContents.messages.push(...this.groupedMessages[key]);

      try {
        await putJsonFileAsync(filePath, fileContents, { spaces: 2 });
      } catch (error) {
        console.error("Failed to write log:", error);
        this.isWriting = false;
      }
    }

    this.onSave();
  }
}
