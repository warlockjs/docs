import { registerProductionBuildCommand } from "../../starters/build-http-production";
import { registerRunProductionServerCommand } from "../../starters/start-http-production-server";
import { registerHttpDevelopmentServerCommand } from "../../starters/start-http-server";
import { registerCommands } from "../commander";
import { getWarlockConfig } from "./../../config/get-warlock-config";
import { registerTestCommand } from "./../../tests/init-testing";
import { registerMigrationCommand } from "./database/migrate";
import { registerDatabaseSeedsCommand } from "./database/seeds";
export * from "./database/seeder";

export async function $registerBuiltInCommands() {
  const config = getWarlockConfig();
  registerCommands([
    registerMigrationCommand(),
    registerDatabaseSeedsCommand(),
    registerHttpDevelopmentServerCommand(),
    registerRunProductionServerCommand(),
    registerProductionBuildCommand(),
    registerTestCommand(),
    ...(config?.cli?.commands || []),
  ]);
}
