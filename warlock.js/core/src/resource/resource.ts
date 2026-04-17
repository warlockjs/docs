import { get, set, type GenericObject } from "@mongez/reinforcements";
import { Model } from "@warlock.js/cascade";
import { useRequestStore } from "../http/context/request-context";
import { ResourceFieldBuilder } from "./resource-field-builder";
import {
  ResourceArraySchema,
  ResourceFieldConfig,
  ResourceOutputValueCastType,
  ResourceSchema,
} from "./types";

/**
 * Maximum recursion depth for self-referencing fields.
 * Prevents runaway serialization on deep trees or circular data.
 */
const MAX_SELF_DEPTH = 10;

/**
 * Resource contract
 */
export interface ResourceContract {
  /**
   * Resource data
   */
  resource: GenericObject;

  /**
   * Resource final output
   */
  data: GenericObject;

  /**
   * Original data
   */
  originalData: GenericObject;

  /**
   * Convert resource to JSON
   */
  toJSON(): GenericObject;

  /**
   * Transform the given value with given type
   */
  transform(value: any, type: ResourceOutputValueCastType, locale?: string): any;

  /**
   * Get a input value for the given key
   */
  get(key: string, defaultValue?: any): any;

  /**
   * Set the given value for the given field
   */
  set(key: string, value: any): ResourceContract;

  /**
   * Create an array schema for transforming array items
   */
  arrayOf(schema: Record<string, ResourceFieldConfig>): ResourceArraySchema;

  /**
   * Get a string field builder
   */
  string(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a date field builder
   */
  date(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a localized field builder
   */
  localized(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a url field builder
   */
  url(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a uploadsUrl field builder
   */
  uploadsUrl(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a number field builder
   */
  number(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a boolean field builder
   */
  boolean(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a float field builder
   */
  float(inputKey?: string): ResourceFieldBuilder;

  /**
   * Get a int field builder
   */
  int(inputKey?: string): ResourceFieldBuilder;
}

/**
 * Resource constructor
 */
export interface ResourceConstructor {
  new (originalData: GenericObject | Resource | Model): ResourceContract;
}

export class Resource implements ResourceContract {
  /**
   * Resource data
   */
  public resource: GenericObject = {};

  /**
   * Resource final output
   */
  public data: GenericObject = {};

  /**
   * Tracks visited object identities during self-reference recursion.
   * Prevents infinite loops on circular data (e.g. A.parent → B, B.parent → A).
   */
  protected _selfSeen?: Set<unknown>;

  /**
   * Raw resource schema — field declarations as written by the developer.
   * Used by doc generators for introspection.
   */
  public static schema: ResourceSchema = {};

  /**
   * Normalized schema — all string cast types and tuples converted to
   * ResourceFieldBuilder instances at definition time. Used by transformOutput at runtime.
   */
  public static parsedSchema: Record<string, ResourceFieldConfig> = {};

  /**
   * Normalize a raw schema into parsedSchema.
   * Converts string cast types (including suffixes) and tuples into pre-built builders.
   * Other entry types (ResourceConstructor, resolver functions, ResourceArraySchema) are kept as-is.
   */
  public static normalizeSchema(schema: ResourceSchema): Record<string, ResourceFieldConfig> {
    const parsed: Record<string, ResourceFieldConfig> = {};

    for (const [key, value] of Object.entries(schema)) {
      if (value === "self" || value === "self[]") {
        // Keep self-references as-is — resolved lazily in transformValue
        parsed[key] = value;
      } else if (typeof value === "string") {
        parsed[key] = ResourceFieldBuilder.fromCastType(value);
      } else if (Array.isArray(value) && value.length === 2 && typeof value[0] === "string") {
        const builder = ResourceFieldBuilder.fromCastType(value[1] as string);
        builder.setInputKey(value[0]);
        parsed[key] = builder;
      } else {
        parsed[key] = value;
      }
    }

    return parsed;
  }

  /**
   * Constructor
   */
  public constructor(public originalData: GenericObject | Resource | Model) {
    if (this.originalData instanceof Model) {
      this.resource = this.originalData.data;
    } else if (this.originalData instanceof Resource) {
      this.resource = this.originalData.data;
    } else {
      this.resource = this.originalData;
    }
  }

  /**
   * Convert resource to JSON
   */
  public toJSON() {
    this.boot();
    this.transformOutput();
    this.extend();

    return this.data;
  }

  /**
   * Boot method
   * Called before transforming the resource
   */
  protected boot() {
    //
  }

  /**
   * Transform resource to output using the pre-normalized parsedSchema.
   * Builders handle their own array/nullable logic internally.
   * ResourceConstructor and ResourceArraySchema handle arrays in transformValue.
   */
  protected transformOutput() {
    const localeCode = useRequestStore()?.request?.locale;
    const parsedSchema = (this.constructor as typeof Resource).parsedSchema;

    for (const [outputKey, outputSettings] of Object.entries(parsedSchema)) {
      const inputValue = this.get(outputKey);
      const outputValue = this.transformValue(inputValue, outputSettings, localeCode);

      if (outputValue !== undefined) {
        this.set(outputKey, outputValue);
      }
    }
  }

  /**
   * Transform the given value with given type
   */
  public transform(value: any, type: ResourceOutputValueCastType, locale?: string) {
    return new ResourceFieldBuilder(type).transform(value, locale);
  }

  /**
   * Transform the given value for the given output setting.
   * After normalization, string cast types no longer reach here — they are pre-converted to builders.
   */
  protected transformValue(value: any, outputSettings: ResourceFieldConfig, locale?: string) {
    let outputValue: any;

    if (outputSettings === "self" || outputSettings === "self[]") {
      // Self-reference — resolve using the same resource class with cycle detection
      outputValue = this.transformSelfReference(value, outputSettings === "self[]");
    } else if (
      typeof outputSettings === "function" &&
      outputSettings.prototype instanceof Resource
    ) {
      if (!value) return;
      // Nested resource — handle both single and array values
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        outputValue = value
          .map((item) => new (outputSettings as typeof Resource)(item).toJSON())
          .filter((v) => v !== undefined);
      } else {
        outputValue = new (outputSettings as typeof Resource)(value).toJSON();
      }
    } else if (typeof outputSettings === "function") {
      // Resolver function - bind to Resource instance for access to this.get(), etc.
      outputValue = (outputSettings as Function).call(this, value, this);
    } else if (outputSettings instanceof ResourceFieldBuilder) {
      // Builder — handles array mapping and nullable internally via isArrayField
      const inputKey = outputSettings.getInputKey();
      outputValue = outputSettings.transform(inputKey ? this.get(inputKey) : value, locale);
    } else if (
      typeof outputSettings === "object" &&
      outputSettings !== null &&
      "__type" in outputSettings &&
      outputSettings.__type === "arrayOf"
    ) {
      // ResourceArraySchema — structured array items with their own sub-schema
      if (Array.isArray(value)) {
        outputValue = value
          .map((item) => this.transformArrayItem(item, outputSettings.schema, locale))
          .filter((v) => v !== undefined);
      } else {
        outputValue = this.transformArrayItem(value, outputSettings.schema, locale);
      }
    }

    return outputValue;
  }

  /**
   * Extend the resource output
   */
  protected extend() {
    //
  }

  /**
   * Transform a self-referencing field value.
   *
   * @example
   * // Single: parent: "self"
   * // Array:  children: "self[]"
   */
  protected transformSelfReference(value: any, isArray: boolean): any {
    if (isArray) {
      return Array.isArray(value)
        ? value.map((item) => this.resolveSelf(item)).filter((v) => v !== undefined)
        : undefined;
    }

    return this.resolveSelf(value);
  }

  /**
   * Resolve a single self-reference value.
   * Uses identity-based cycle detection (id/_id) and a max depth guard.
   */
  protected resolveSelf(value: any): any {
    if (!value) return undefined;

    const identity = value.id ?? value._id ?? value;
    const seen = this._selfSeen ?? new Set();

    // Circular reference or depth limit reached — stop recursion
    if (seen.has(identity) || seen.size >= MAX_SELF_DEPTH) {
      return undefined;
    }

    seen.add(identity);

    const SelfConstructor = this.constructor as typeof Resource;
    const child = new SelfConstructor(value);
    child._selfSeen = seen;

    return child.toJSON();
  }

  /**
   * Transform a single array item according to the given schema
   */
  protected transformArrayItem(
    item: any,
    schema: Record<string, ResourceFieldConfig>,
    locale?: string,
  ) {
    const transformedItem: GenericObject = {};

    for (const [outputKey, outputSettings] of Object.entries(schema)) {
      let fieldKey = outputKey;
      let valueTransformType = outputSettings as ResourceFieldConfig;

      if (Array.isArray(outputSettings)) {
        fieldKey = outputSettings[0];
        valueTransformType = outputSettings[1];
      }

      const inputValue = get(item, fieldKey);
      const outputValue = this.transformValue(inputValue, valueTransformType, locale);

      if (outputValue !== undefined) {
        set(transformedItem, outputKey, outputValue);
      }
    }

    return transformedItem;
  }

  /**
   * Get a input value for the given key
   */
  public get(key: string, defaultValue?: any) {
    return get(this.resource, key, defaultValue);
  }

  /**
   * Set the given value for the given field
   */
  public set(key: string, value: any): ResourceContract {
    set(this.data, key, value);

    return this;
  }

  /**
   * Create an array schema for transforming array items
   */
  public arrayOf(schema: Record<string, ResourceFieldConfig>): ResourceArraySchema {
    return {
      __type: "arrayOf",
      schema,
    };
  }

  /**
   * Get a string field builder
   */
  public string(inputKey?: string) {
    return this.fieldBuilder("string", inputKey);
  }

  /**
   * Get a date field builder
   */
  public date(inputKey?: string) {
    return this.fieldBuilder("date", inputKey);
  }

  /**
   * Get a localized field builder
   */
  public localized(inputKey?: string) {
    return this.fieldBuilder("localized", inputKey);
  }

  /**
   * Get a url field builder
   */
  public url(inputKey?: string) {
    return this.fieldBuilder("url", inputKey);
  }

  /**
   * Get a uploadsUrl field builder
   */
  public uploadsUrl(inputKey?: string) {
    return this.fieldBuilder("uploadsUrl", inputKey);
  }

  /**
   * Get a number field builder
   */
  public number(inputKey?: string) {
    return this.fieldBuilder("number", inputKey);
  }

  /**
   * Get a boolean field builder
   */
  public boolean(inputKey?: string) {
    return this.fieldBuilder("boolean", inputKey);
  }

  /**
   * Get a float field builder
   */
  public float(inputKey?: string) {
    return this.fieldBuilder("float", inputKey);
  }

  /**
   * Get a int field builder
   */
  public int(inputKey?: string) {
    return this.fieldBuilder("int", inputKey);
  }

  /**
   * New field builder
   */
  protected fieldBuilder(type: ResourceOutputValueCastType, inputKey?: string) {
    const builder = new ResourceFieldBuilder(type);

    if (inputKey) {
      builder.setInputKey(inputKey);
    }

    return builder;
  }
}
