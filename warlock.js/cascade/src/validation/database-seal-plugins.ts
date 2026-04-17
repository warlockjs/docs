import { registerPlugin } from "@warlock.js/seal";
import { embedValidator } from "./plugins/embed-validator-plugin";

registerPlugin(embedValidator);

/**
 * This file registers database seal plugins as a side effect.
 * Import this file to ensure the plugins are registered.
 *
 * @example
 * ```ts
 * import "./validation/database-seal-plugins";
 * ```
 */
export type DatabaseSealPlugins = typeof embedValidator;
