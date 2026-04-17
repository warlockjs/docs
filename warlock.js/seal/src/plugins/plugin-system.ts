/**
 * Seal Plugin System
 *
 * Allows extending validators with custom functionality via plugins
 */

export type PluginContext = {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version?: string;
};

export type SealPlugin = {
  /** Plugin metadata */
  name: string;
  version?: string;
  description?: string;

  /**
   * Install function - called when plugin is registered
   * This is where you inject methods into validators
   *
   * @example
   * ```ts
   * install() {
   *   Object.assign(StringValidator.prototype, {
   *     slug(this: StringValidator) {
   *       return this.pattern(/^[a-z0-9-]+$/);
   *     }
   *   });
   * }
   * ```
   */
  install: (context: PluginContext) => void | Promise<void>;

  /**
   * Uninstall the plugin (optional)
   * Clean up any injected methods
   */
  uninstall?: () => void | Promise<void>;
};

/**
 * Registry of installed plugins
 */
const installedPlugins = new Map<string, SealPlugin>();

/**
 * Register a plugin
 *
 * @example
 * ```ts
 * const slugPlugin: SealPlugin = {
 *   name: "slug",
 *   install() {
 *     Object.assign(StringValidator.prototype, {
 *       slug(this: StringValidator) {
 *         return this.pattern(/^[a-z0-9-]+$/);
 *       }
 *     });
 *   }
 * };
 *
 * registerPlugin(slugPlugin);
 * ```
 */
export async function registerPlugin(plugin: SealPlugin): Promise<void> {
  if (installedPlugins.has(plugin.name)) {
    console.warn(`[Seal] Plugin "${plugin.name}" is already installed`);
    return;
  }

  const context: PluginContext = {
    name: plugin.name,
    version: plugin.version,
  };

  // Call install function
  await plugin.install(context);

  installedPlugins.set(plugin.name, plugin);
}

/**
 * Unregister a plugin
 */
export async function unregisterPlugin(pluginName: string): Promise<void> {
  const plugin = installedPlugins.get(pluginName);

  if (!plugin) {
    console.warn(`[Seal] Plugin "${pluginName}" is not installed`);
    return;
  }

  if (plugin.uninstall) {
    await plugin.uninstall();
  }

  installedPlugins.delete(pluginName);
}

/**
 * Check if a plugin is installed
 */
export function hasPlugin(pluginName: string): boolean {
  return installedPlugins.has(pluginName);
}

/**
 * Get list of installed plugins
 */
export function getInstalledPlugins(): SealPlugin[] {
  return Array.from(installedPlugins.values());
}
