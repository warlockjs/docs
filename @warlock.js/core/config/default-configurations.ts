import type { ResolvedWarlockConfig } from "./types";

export const defaultWarlockConfigurations: ResolvedWarlockConfig = {
  server: {
    retryOtherPort: false,
  },
  build: {
    outDirectory: process.cwd() + "/dist",
    outFile: "app.js",
    bundle: true,
    sourcemap: true,
  },
  cli: {
    commands: [],
  },
};
