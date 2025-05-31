import type { Option } from "commander";
import type { Preload } from "../utils/types";

export type PreloadConsole = Preload;

export type CommandOptionsConfig = string | string[] | Partial<Option>;

export type CommandActionData = {
  options: Record<string, any>;
  args: string[];
};

export type CommandOptions = {
  name: string;
  description?: string;
  args?: (string | [string, string, any])[];
  preload?: PreloadConsole[];
  options?: CommandOptionsConfig[];
  action: (data: CommandActionData) => any | Promise<any>;
};
