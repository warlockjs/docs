import type { Model } from "@warlock.js/cascade";
import type { BasicLogConfigurations } from "@warlock.js/logger";
import {
  LogChannel,
  type LogContract,
  type LogLevel,
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
  public async log(
    module: string,
    action: string,
    message: any,
    level: LogLevel,
  ) {
    const model = this.model;

    if (!model.database?.connection?.isConnected()) return;

    if (!this.shouldBeLogged({ module, action, level, message })) return;

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
