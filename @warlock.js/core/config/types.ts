import type { CommandBuilder } from "../console/command-builder";
import type { CommandOptions } from "../console/types";

export type WarlockConfigServe = {
  /**
   * Whether to try another port if the default port is already in use.
   *
   * @todo Implement this feature
   */
  retryOtherPort?: boolean;
};

export type WarlockConfigBuild = {
  /**
   * The path to the output directory.
   *
   * @default "dist"
   */
  outDirectory?: string;
  /**
   * Output file name for the application entry point.
   *
   * @default "main.js"
   */
  outFile?: string;
  /**
   * Whether to bundle the dependencies or not.
   *
   * @default false
   */
  bundle?: boolean;
  /**
   * Enable or disable source maps for production builds.
   *
   * When enabled, creates a separate .map file with a reference comment,
   * allowing Node.js to show original source file locations in error stack traces.
   *
   * @default true
   */
  sourcemap?: boolean;
};

export type WarlockConfig = {
  /**
   * Development server options
   */
  server?: WarlockConfigServe;
  /**
   * Build Options
   */
  build?: WarlockConfigBuild;
  /**
   * Cli options
   */
  cli?: {
    commands?: (CommandBuilder | CommandOptions)[];
  };
};

export type ResolvedWarlockConfig = {
  /**
   * Development server options
   */
  server: Required<WarlockConfigServe>;
  /**
   * Build Options
   */
  build: Required<WarlockConfigBuild>;
  /**
   * Cli options
   */
  cli: {
    commands: (CommandBuilder | CommandOptions)[];
  };
};
