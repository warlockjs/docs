import type { ResolvedWarlockConfig } from "./types";

let configurations: ResolvedWarlockConfig | null = null;

export function getWarlockConfig(): ResolvedWarlockConfig {
  return configurations!;
}

export function setWarlockConfig(config: ResolvedWarlockConfig) {
  configurations = config;
}
