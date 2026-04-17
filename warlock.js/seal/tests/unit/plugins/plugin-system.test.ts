import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInstalledPlugins,
  hasPlugin,
  registerPlugin,
  unregisterPlugin,
} from "../../../src/plugins/plugin-system";

describe("Plugin System", () => {
  const pluginName = "test-plugin";
  const installReference = {
    installed: false,
  };

  const testPlugin = {
    name: pluginName,
    install: () => {
      installReference.installed = true;
    },
    uninstall: () => {
      installReference.installed = false;
    },
  };

  beforeEach(async () => {
    // Ensure clean state
    if (hasPlugin(pluginName)) {
      await unregisterPlugin(pluginName);
    }
    installReference.installed = false;
  });

  afterEach(async () => {
    if (hasPlugin(pluginName)) {
      await unregisterPlugin(pluginName);
    }
    installReference.installed = false;
  });

  it("should register a plugin", async () => {
    await registerPlugin(testPlugin);
    expect(hasPlugin(pluginName)).toBe(true);
    expect(installReference.installed).toBe(true);
  });

  it("should unregister a plugin", async () => {
    await registerPlugin(testPlugin);
    await unregisterPlugin(pluginName);
    expect(hasPlugin(pluginName)).toBe(false);
    expect(installReference.installed).toBe(false);
  });

  it("should not register the same plugin twice", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await registerPlugin(testPlugin);
    await registerPlugin(testPlugin);

    expect(hasPlugin(pluginName)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(`[Seal] Plugin "${pluginName}" is already installed`);

    consoleSpy.mockRestore();
  });

  it("should get installed plugins", async () => {
    await registerPlugin(testPlugin);
    const plugins = getInstalledPlugins();
    expect(plugins).toContain(testPlugin);
  });
});
