import { filesOrchestrator } from "../dev-server/files-orchestrator";
import { Path } from "../dev-server/path";
import { getFilesFromDirectory } from "../dev-server/utils";
import { srcPath } from "../utils";
import { CLICommand } from "./cli-command";
import { isMatchingCommandName } from "./cli-commands.utils";

export class CLICommandsLoader {
  /**
   * Locate command by name
   */
  public async locate(commandName: string): Promise<CLICommand | undefined> {
    const files = await getFilesFromDirectory(srcPath("app"), "**/commands/*.{ts,tsx}");
    // now convert them into relative paths
    const relativeFiles = files.map((path) => Path.toRelative(path));

    for (const relativeFile of relativeFiles) {
      const command = await this.load(relativeFile);
      if (command) {
        command.$relativePath(relativeFile);
        if (isMatchingCommandName(command.name, commandName)) {
          return command;
        }
      }
    }

    return;
  }

  /**
   * Scan all project commands and return them
   * Used for warm cache functionality
   */
  public async scanAll(): Promise<CLICommand[]> {
    const files = await getFilesFromDirectory(srcPath("app"), "**/commands/*.{ts,tsx}");
    const relativeFiles = files.map((path) => Path.toRelative(path));
    const commands: CLICommand[] = [];

    for (const relativeFile of relativeFiles) {
      const command = await this.load(relativeFile);
      if (command) {
        command.$relativePath(relativeFile);
        commands.push(command);
      }
    }

    return commands;
  }

  /**
   * Load command from a relative path
   */
  public async load(relativePath: string): Promise<CLICommand | undefined> {
    const output = await filesOrchestrator.load<{ default: CLICommand }>(relativePath);

    return output?.default;
  }
}

export const cliCommandsLoader = new CLICommandsLoader();
