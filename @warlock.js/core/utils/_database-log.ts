import type { Model } from "@warlock.js/cascade";
import type { BasicLogConfigurations, LoggingData } from "@warlock.js/logger";
import {
  LogChannel,
  type LogContract,
  type LogMessage,
} from "@warlock.js/logger";
import { DatabaseLogModel } from "../database/models/database-log";

export type DatabaseLogOptions = BasicLogConfigurations & {
  /**
   * Model to use for logging
   */
  model?: typeof DatabaseLogModel;
};

export class DatabaseLog
  extends LogChannel<DatabaseLogOptions>
  implements LogContract
{
  /**
   * {@inheritdoc}
   */
  public name = "database";

  /**
   * Database model
   */
  public get model(): typeof Model {
    return this.config("model") ?? DatabaseLogModel;
  }

  /**
   * {@inheritdoc}
   */
  public async log(log: LoggingData) {
    const { module, action, message, type: level } = log;
    const model = this.model;

    if (!model.database?.connection?.isConnected()) return;

    if (!this.shouldBeLogged(log)) return;

    const data: LogMessage = {
      module,
      action,
      content: message,
      level,
      date: new Date().toISOString(),
    };

    if (message instanceof Error) {
      data.stack = message.stack;
      data.content = message.message;
    } else {
      data.content = message;
      data.stack = new Error().stack;
    }

    try {
      await model.create(data);
    } catch (error) {
      console.log("Error", error);
    }
  }
}
