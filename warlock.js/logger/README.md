# Warlock Logger

A powerful yet simple logger for Node.js

## Features

- Fully async and non-blocking which doesn't affect the performance of your application.
- Easy to use and configure.
- Has multiple channels to log the messages to.
- You can add your own custom channels for logging.

## Installation

`yarn add @warlock.js/logger`

Or

`npm i @warlock.js/logger`

## Usage

At an early point of the application, you need to initialize the logger:

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [new FileLog(), new ConsoleLog()],
});
```

Here we declared our logger configurations to use the `FileLog` and `ConsoleLog` channels, the file log channel will log all the logs to a file, and the console log channel will log all the logs to the console.

## Logging Strategy

To go any value simple use `log` function, it mainly receives 4 parameters:

- `module`: the module name, it's used to group the logs, for example, if you have a module called `request`, all the logs related to the request module will be grouped under the `request` module.
- `action`: the action name, it's used to group the logs, for example, if you have an action called `create`, all the logs related to the `create` action will be grouped under the `create` action.
- `message`: the message to log.
- `level`: there are 4 types of logging `warn`, `info`, `error`, `debug`, the default is `info`.

## Examples

```ts
import { log } from "@warlock.js/logger";

log("request", "create", "user created successfully", "info");
```

You can also use `log.info` `log.warn` `log.error` `log.debug` `log.success` functions to log the message.

```ts
import { log } from "@warlock.js/logger";

log.info("request", "create", "user created successfully");

if (somethingWentWrong) {
  log.error("request", "create", "something went wrong");
}

database.on("connection", () => {
  log.success("database", "connection", "database connected successfully");
});
```

## Console Log Channel

The console log channel will log all the logs to the console, the message appears in the console will be colored based on the log level using [copper](https://www.npmjs.com/package/@mongez/copper).

```ts
import logger, { ConsoleLog } from "@warlock.js/logger";

logger.configure({
  channels: [new ConsoleLog()],
});
```

## File Log Channel

The file log channel will log all the logs to a **single file**, the file will be created in the `logs` directory in `/storage` directory with name `app` by default, and extension is set to `log` however, you can change the file name and the directory path.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      storageDirectory: process.cwd() + "/logs",
      fileName: "app",
      extension: "log",
    }),
  ],
});
```

The message time is stored by default prefixed with current date/time in this format `YYYY-MM-DD HH:mm:ss`, however, you can change the format by passing the `dateFormat` option.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      dateFormat: {
        date: "DD-MM-YYYY",
        time: "HH:mm:ss",
      },
    }),
  ],
});
```

> You can see the available date/time formats in [dayjs](https://day.js.org/docs/en/display/format) documentation.

This could be useful with small projects, but it's not recommended to use it if the application is large, because the file will be very large and it will affect the performance of the application, you can use the following channels to solve this problem.

## Chunk mode Log Channel

In the file log channel, there are three types of chunk modes:

1. `single`: this is the default mode, all the logs will be stored in a single file.
2. `daily`: the logs will be stored in a file based on the date, for example, if the date is `2021-01-01`, the file name will be `2021-01-01.log`.
3. `hourly`: the logs will be stored in a file based on the date and hour, for example, if the hour is `14`, the file name will be `2021-01-01-14.log`.

> Please note the hourly mode is set to 24 hours mode.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      chunk: "daily", // default is single
    }),
  ],
});
```

For better performance, the file will be created in the `logs` directory in `/storage`, each file will be named based on the date, for example, if the date is `2021-01-01`, the file name will be `2021-01-01.log`, and the message time is stored by default prefixed with current date/time in this format `YYYY-MM-DD HH:mm:ss`, however, you can change the format by passing the `dateFormat` option.

## Allow certain levels

You can allow certain levels to be logged, for example, if you want to log only the `info` and `error` messages, you can use the `levels` option.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      levels: ["info", "error"],
    }),
  ],
});
```

This allows only the `info` and `error` messages to be logged.

## Advanced Filter messages

Another way to filter the messages is to use the `filter` option, the filter function will receive the message info and you can return `true` to log the message or `false` to ignore it.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      filter: ({ level, module, action }) => level !== "debug",
    }),
  ],
});
```

This will log all the messages except the `debug` messages.

## JSON File Log Channel

Works exactly in the same sense of [File Log Channel](#file-log-channel), but the difference is that the logs will be stored in JSON format.

```ts
import logger, { JSONFileLog } from "@warlock.js/logger";

logger.configure({
  channels: [new JSONFileLog()],
});
```

Example of output log file

`/storage/logs/app.json`

```json
{
  "messages": [
    {
      "module": "request",
      "action": "create",
      "message": "user created successfully",
      "level": "info",
      "date": "01-04-2023",
      "time": "12:00:00"
    }
  ]
}
```

If the log is an `error` log, the trace will also be included:

`/storage/logs/01-04-2023.json`

```json
{
  "date": "01-04-2023",
  "logs": [
    {
      "module": "request",
      "action": "create",
      "message": "user created successfully",
      "level": "error",
      "date": "01-04-2023",
      "time": "12:00:00",
      "trace": "Error: something went wrong...."
    }
  ]
}
```

## Group Log Channel by level, module or action

Another way to reduce file sizes is to group the logs by level, module, or action, you can use the `groupBy` option to group the logs.

The files in this case will be added in folders with the grouped names, for example, if the group is `level`, the files will be added in folders with the names `info`, `warn`, `error`, and `debug`.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      groupBy: ["level"],
    }),
  ],
});
```

This will create the following structure:

```
logs
├── info
│   └── app.log
├── warn
│   └── app.log
├── error
│   └── app.log
├── debug
│   └── app.log
├── success
│   └── app.log
```

If the group is `module`, the files will be added in folders with the module names.

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      groupBy: ["module"],
    }),
  ],
});
```

This will create the following structure:

```
logs
├── request
│   └── app.log
├── database
│   └── app.log
```

### Group by multiple options

You can group the logs by multiple options, for example, if you want to group the logs by `level` and `module`, you can pass the options

```ts
import logger, { FileLog } from "@warlock.js/logger";

logger.configure({
  channels: [
    new FileLog({
      groupBy: ["level", "module"],
    }),
  ],
});
```

This will create the following structure:

```
logs
├── info
│   ├── request
│   │   └── app.log
...
```

> The order you set in the groupBy array will be the order of the folders.

## Create Custom Log Channel

You can create your own log channel by extending the `LogChannel` class

```ts
import {
  LogChannel,
  type LogContract,
  type LogLevel,
  type BasicLogConfigurations,
} from "@warlock.js/logger";

export type CustomLogOptions = BasicLogConfigurations & {
  // your custom options
};

export default class CustomLogChannel
  extends LogChannel<CustomLogOptions>
  implements LogContract
{
  /**
   * Channel name
   */
  public name = "custom";

  /**
   * Log the message
   *
   * @param module
   * @param action
   * @param message
   * @param level
   */
  public async log(
    module: string,
    action: string,
    message: string,
    level: LogLevel
  ) {
    // first check if the message should be logged or not
    if (!this.shouldBeLogged({ module, action, level })) return;

    // log the message
  }
}
```

The `CustomLogChannel` class extends the `LogChannel` class and implements the `LogContract` interface, you can add your custom options by extending the `BasicLogConfigurations` interface.

The `BasicLogConfigurations` interface has the following options:

- `levels`: an array of levels to log, the default is `["info", "warn", "error", "debug"]`.
- `filter`: a function to filter the messages, the default is `() => true`.

These options are used in `shouldBeLogged` method to check if the message should be logged or not.

If the log channel will output something in the terminal, mark the `terminal` property as `true`.

```ts
import { type LogContract, LogChannel, LogLevel } from "@warlock.js/logger";

export default class CustomLogChannel
  extends LogChannel
  implements LogContract
{
  /**
   * Whether the log channel will output something in the terminal
   */
  public terminal = true;

  /**
   * Channel name
   */
  public name = "custom";
  // ...
}
```

This will automatically parse and remove the ANSI color codes from the message.

Now you can use the custom log channel in your application.

```ts
import logger, { CustomLogChannel } from "@warlock.js/logger";

logger.configure({
  channels: [new CustomLogChannel()],
});
```

## Capture Uncaught Errors

If you want automatically capture any unhandled errors, you can import `captureAnyUnhandledRejection` helper function and call it in your application entry point.

```ts
import { captureAnyUnhandledRejection } from "@warlock.js/logger";

captureAnyUnhandledRejection();
```

## Tests

To run the tests, you need to run the following command:

```bash
yarn test
```
