import { colors } from "@mongez/copper";
import { LogChannel } from "../log-channel";
import type { BasicLogConfigurations, LoggingData } from "../types";

export class ConsoleLog extends LogChannel<BasicLogConfigurations> {
  /**
   * {@inheritdoc}
   */
  public name = "console";

  /**
   * Determine if channel is logging in terminal
   */
  public terminal = true;

  /**
   * {@inheritdoc}
   */
  public log(data: LoggingData) {
    const { module, action, message, type: level } = data;

    if (!this.shouldBeLogged(data)) return;

    // display date and time with milliseconds
    const date = new Date().toISOString(); // i.e 2021-01-01T00:00:00.000Z
    switch (level) {
      case "debug":
        // add a debug icon
        console.log(
          colors.magentaBright("⚙"),
          colors.yellow(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          colors.magentaBright(message),
        );
        break;
      case "info":
        // add an info icon
        console.log(
          colors.blueBright("ℹ"),
          colors.yellow(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          colors.blueBright(message),
        );
        break;
      case "warn":
        // add a warning icon
        console.log(
          colors.yellow("⚠"),
          colors.green(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          colors.yellowBright(message),
        );
        break;
      case "error":
        // add an error icon
        console.log(
          colors.red("✗"),
          colors.yellow(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          colors.redBright(message),
        );
        break;

      case "success":
        // add a success icon
        console.log(
          colors.green("✓"),
          colors.yellow(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          colors.greenBright(message),
        );
        break;

      default:
        console.log(
          "[log]",
          colors.yellow(`(${date})`),
          colors.cyan(`[${module}]`),
          colors.magenta(`[${action}]`),
          message,
        );
    }

    if (typeof message === "object") {
      console.log(message);
    }
  }
}
