import type { GenericObject } from "@mongez/reinforcements";
import type { Model } from "@warlock.js/cascade";
import type { Output } from "./output";

/**
 * Built in casts
 */
export type OutputCastType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "float"
  | "integer"
  | "int"
  | "double"
  | "date"
  | "dateFormat"
  | "dateIso"
  | "birthDate"
  | "url"
  | "any"
  | "location"
  | "mixed"
  | "localized"
  | "uploadsUrl"
  | "publicUrl"
  | "assetsUrl";

export type OutputValue =
  | OutputCastType
  | typeof Output
  | ((value: any) => Promise<any> | any);

export type OutputFormatter = {
  type?: OutputCastType;
  format?: (
    value: any,
    options: OutputFormatter,
    output: Output,
  ) => any | Promise<any>;
  options?: any;
  input?: string;
};

/**
 * final output
 */
export type FinalOutput = Record<
  string,
  OutputValue | [string, OutputValue] | OutputFormatter
>;

/**
 * Allowed output data resource
 */
export type OutputResource = GenericObject | typeof Model | typeof Output;
