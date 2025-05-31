import { Command, program, type Option } from "commander";
import {
  disconnectCache,
  disconnectDatabase,
  setupCache,
  setupDatabase,
} from "../bootstrap/setup";
import { createHttpApplication, stopHttpApplication } from "../http";
import type { CommandBuilder } from "./command-builder";
import type { CommandOptions } from "./types";

program.name("Warlock JS").description("Warlock JS CLI Tool");

export function registerCommands(
  commands: (CommandOptions | CommandBuilder)[],
) {
  commands.forEach(registerCommand);
}

export async function startConsoleApplication() {
  program.parse(process.argv);
}

/**
 * Register the given command to the commander
 */
export function registerCommand(
  incomingOptions: CommandOptions | CommandBuilder,
) {
  const options: CommandOptions = (incomingOptions as CommandBuilder).build
    ? (incomingOptions as CommandBuilder).build()
    : (incomingOptions as CommandOptions);

  const command = new Command(options.name);

  if (options.options) {
    for (const option of options.options) {
      if (typeof option === "string") {
        command.option(option);
      } else if (Array.isArray(option) && option.length === 2) {
        command.createOption(option[0], option[1]);
      } else if (typeof option === "object") {
        const optionObject = option as Option;
        if (optionObject.required) {
          command.requiredOption(optionObject.flags, optionObject.description);
        } else {
          command.option(
            optionObject.flags,
            optionObject.description,
            optionObject.defaultValue,
          );
        }
      }
    }
  }

  if (options.args) {
    for (const arg of options.args) {
      if (typeof arg === "string") {
        command.argument(arg);
      } else {
        command.argument(...arg);
      }
    }
  }

  if (options.description) {
    command.description(options.description);
  }

  command.action(async () => {
    // we need to get the args and options
    const args = command.args;
    const commandOptions = command.opts();

    await options.action({ args, options: commandOptions });
  });

  const preload = options.preload;

  if (preload !== undefined) {
    command.hook("preAction", async () => {
      if (preload.includes("database")) {
        await setupDatabase();
      }

      if (preload.includes("cache")) {
        await setupCache();
      }

      if (preload.includes("http")) {
        await createHttpApplication();
      }
    });

    command.hook("postAction", async () => {
      if (preload.includes("database")) {
        await disconnectDatabase();
      }

      if (preload.includes("cache")) {
        await disconnectCache();
      }

      if (preload.includes("http")) {
        await stopHttpApplication();
      }

      if (!preload.includes("watch")) {
        process.exit(0);
      }
    });
  } else {
    command.hook("postAction", () => {
      process.exit(0);
    });
  }

  program.addCommand(command);
}
