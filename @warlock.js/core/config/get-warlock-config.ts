import { merge } from "@mongez/reinforcements";
import { defaultWarlockConfigurations } from "./default-configurations";
import type { ResolvedWarlockConfig } from "./types";

let configurations: ResolvedWarlockConfig = defaultWarlockConfigurations;

export function getWarlockConfig(): ResolvedWarlockConfig {
  return configurations!;
}

export function setWarlockConfig(config: ResolvedWarlockConfig) {
  configurations = merge(configurations, config);
}
