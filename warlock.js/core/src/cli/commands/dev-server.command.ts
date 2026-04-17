import { startDevelopmentServer } from "../../dev-server/start-development-server";
import { command } from "../cli-command";
import { displayStartupBanner } from "../cli-commands.utils";

export const devServerCommand = command({
  name: "dev",
  description: "Start development server",
  persistent: true,
  preload: {
    runtimeStrategy: "development",
    config: true, // load all config
    bootstrap: true,
    prestart: true, // load prestart file (if exists)
    connectors: true, // load all connectors
  },
  preAction: async () => {
    await displayStartupBanner({ environment: "development" });
  },
  action: async () => {
    await startDevelopmentServer();
  },
}).option("--fresh", "Start Fresh Development server");
