import { ResponseStatus } from "../http";
import { type ResourceConstructor, type ResourceContract } from "./resource";
import { type ResourceFieldBuilder } from "./resource-field-builder";

export type ResourceOutputValueCastType =
  | "string"
  | "number"
  | "date"
  | "localized"
  | "boolean"
  | "url"
  | "float"
  | "int"
  | "object"
  | "array"
  | "uploadsUrl"
  /**
   * Storage url means the value will be generated using current storage.url method
   */
  | "storageUrl";

/**
 * Self-referencing type — resolves the field using the same resource class.
 * - `"self"` for a single nested self-reference
 * - `"self[]"` for an array of self-references
 */
export type ResourceSelfReference = "self" | "self[]";

/**
 * Cast type with modifier suffixes for use in resource schemas.
 * - `[]` suffix declares the field as an array (e.g. "string[]")
 * - `?` suffix declares the field as nullable — always present in output, value or null (e.g. "number?")
 * - Combined: `[]` must come before `?` (e.g. "string[]?")
 */
export type ResourceCastType =
  | ResourceOutputValueCastType
  | `${ResourceOutputValueCastType}[]`
  | `${ResourceOutputValueCastType}?`
  | `${ResourceOutputValueCastType}[]?`;

export type ResourceArraySchema = {
  __type: "arrayOf";
  schema: Record<string, ResourceFieldConfig>;
};

export type ResourceFieldConfig =
  | ResourceCastType
  | ResourceConstructor
  | ResourceSelfReference
  | [string, ResourceCastType]
  | ResourceFieldBuilder
  | ResourceArraySchema
  | ((value: any, resource: ResourceContract) => any); // Resolver function for computed/static values

export type ResourceSchema = Record<string, ResourceFieldConfig>;

export type ResourceFieldBuilderDateOutputOptions =
  | {
      /**
       * If set to true, then it will be returned as a formatted date
       */
      format?: boolean;
      /**
       * Return unix timestamp (Milliseconds)
       */
      timestamp?: boolean;
      /**
       * Return human readable date
       */
      humanTime?: boolean;
      /**
       * Return timezone
       */
      timezone?: boolean;
      /**
       * Return timezone offset
       */
      offset?: boolean;
      /**
       * Return date in current locale
       */
      locale?: boolean;
      /**
       * Return date in iso format
       */
      iso?: boolean;
    }
  | "format"
  | "timestamp"
  | "humanTime"
  | "locale"
  | "iso";

/**
 * Allowed value types in a response schema body.
 * - Cast type string for primitive fields (e.g. "string", "number")
 * - ResourceConstructor for a single nested resource object
 * - [ResourceConstructor] (tuple) for an array of a nested resource
 */
export type ResponseBodyValue =
  | ResourceOutputValueCastType
  | ResourceConstructor
  | [ResourceConstructor];

/**
 * Response schema for a controller — used for documentation / OpenAPI generation.
 * Keyed by HTTP status code, each entry declares the expected response body shape.
 */
export type ResponseSchema = {
  [statusCode in ResponseStatus]?: {
    body: Record<string, ResponseBodyValue>;
  };
};
