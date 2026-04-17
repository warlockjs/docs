import { CLICommandsManager } from "./cli-commands.manager";

const commandsManager = new CLICommandsManager();
await commandsManager.start();
