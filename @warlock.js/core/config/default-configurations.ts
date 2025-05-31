import type { WarlockConfig } from "./types";

export const defaultWarlockConfigurations: WarlockConfig = {
  build: {
    outDirectory: process.cwd() + "/dist",
    outFile: "app.js",
    bundle: true,
  },
  cli: {
    commands: [],
  },
};
