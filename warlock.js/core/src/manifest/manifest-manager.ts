import { getJsonFileAsync, putJsonFileAsync, unlinkAsync } from "@mongez/fs";
import { warlockPath } from "../utils";

/**
 * Stored option metadata in manifest
 */
export type ManifestCommandOption = {
  name: string;
  text: string;
  alias?: string;
  description?: string;
  type?: "string" | "boolean" | "number";
  required?: boolean;
  defaultValue?: string | boolean | number;
};

/**
 * Command metadata stored in commands.json
 */
export type ManifestCommandData = {
  relativePath?: string;
  source: "framework" | "plugin" | "project";
  description?: string;
  alias?: string;
  options?: ManifestCommandOption[];
};

type ManifestCommandsJson = {
  commands: Record<string, ManifestCommandData>;
};

export class ManifestManager {
  /**
   * commands json
   */
  protected _commandsJson?: ManifestCommandsJson;

  /**
   * Check if commands json is changed
   */
  protected _hasChanges = false;

  /**
   * Whether commands json is loaded
   */
  protected _isLoaded = false;

  /**
   * Get if commands json has changes
   */
  public get hasChanges() {
    return this._hasChanges;
  }

  /**
   * Check if commands json is loaded
   */
  public get isCommandLoaded() {
    return this._isLoaded;
  }

  /**
   * Load commands.json file
   */
  public async loadCommands(): Promise<ManifestCommandsJson | undefined> {
    // now try to locate it in .warlock folder
    if (this._isLoaded) return this._commandsJson;

    try {
      this._commandsJson = await getJsonFileAsync(warlockPath("commands.json"));

      this._isLoaded = true;

      return this._commandsJson;
    } catch {
      return;
    }
  }

  /**
   * Get commands json content
   */
  public get commandsJson() {
    return this._commandsJson;
  }

  /**
   * Save commands in commands.json file
   */
  public async saveCommands() {
    await putJsonFileAsync(warlockPath("commands.json"), this._commandsJson);

    this._isLoaded = true;
    this._hasChanges = false;
  }

  /**
   * Add command info to commands list (But do not save commands)
   */
  public addCommandToList(name: string, command: ManifestCommandsJson["commands"][string]) {
    if (!this._commandsJson) {
      this._commandsJson = {
        commands: {},
      };
    }

    this._commandsJson.commands[name] = command;

    this._hasChanges = true;
  }

  /**
   * Clear commands cache
   */
  public clearCommandsCache() {
    this._commandsJson = undefined;
    this._hasChanges = false;
    this._isLoaded = false;
  }

  /**
   * Remove commands.json file
   */
  public async removeCommandsFile() {
    try {
      await unlinkAsync(warlockPath("commands.json"));
    } catch {
      // do nothing
    }
  }
}

export const manifestManager = new ManifestManager();
