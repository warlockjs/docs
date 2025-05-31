import type { DatabaseConfigurations } from "./types";

let configurations: Partial<DatabaseConfigurations> = {};

export function setDatabaseConfigurations(
  databaseConfigurations: DatabaseConfigurations,
) {
  configurations = {
    ...configurations,
    ...databaseConfigurations,
  };
}

export function getDatabaseConfigurations() {
  return configurations as DatabaseConfigurations;
}

export function getDatabaseConfig<Key extends keyof DatabaseConfigurations>(
  key: Key,
): DatabaseConfigurations[Key] {
  return configurations[key];
}

export function getDatabaseDebugLevel(): DatabaseConfigurations["debugLevel"] {
  return configurations.debugLevel || "warn";
}
