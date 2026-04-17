import { except } from "@mongez/reinforcements";
import { isPlainObject } from "@mongez/supportive-is";
import { setKeyPath } from "../helpers";
import { objectTrimMutator, stripUnknownMutator } from "../mutators";
import { objectRule, unknownKeyRule } from "../rules";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";
import { applyNullable, wrapNullableStrict } from "../standard-schema/json-schema";
import type { Schema, SchemaContext, ValidationResult } from "../types";
import { BaseValidator } from "./base-validator";
import { ComputedValidator } from "./computed-validator";

/**
 * Object validator class with generic schema type for proper type inference
 */
export class ObjectValidator<TSchema extends Schema = Schema> extends BaseValidator {
  protected shouldAllowUnknown = false;
  protected allowedKeys: string[] = [];
  protected hasUnknownKeyRule = false;

  public constructor(
    public schema: TSchema,
    errorMessage?: string,
  ) {
    super();
    this.addMutableRule(objectRule, errorMessage);
  }

  /**
   * Check if value is an object type (plain object, not array or date)
   */
  public matchesType(value: any): boolean {
    return isPlainObject(value);
  }

  /** Strip unknown keys from the data */
  public stripUnknown() {
    const validator = this.instance;
    return validator.addMutator(stripUnknownMutator, {
      get allowedKeys() {
        return validator.allowedKeys;
      },
    });
  }

  /** Add list of allowed keys that could be in the data but not necessarily validated */
  public allow(...keys: string[]) {
    const validator = this.instance;
    validator.allowedKeys.push(...keys);
    return validator;
  }

  /** Trim values of the object properties */
  public trim(recursive = true) {
    const validator = this.instance;
    return validator.addMutator(objectTrimMutator, { recursive });
  }

  /** Whether to allow unknown properties
   * Please note it will allow only unknown direct children keys, not nested children keys
   */
  public allowUnknown(allow = true) {
    const validator = this.instance;
    validator.shouldAllowUnknown = allow;
    return validator;
  }

  /**
   * Create a copy of this object validator with the same configuration
   * Copies schema, rules, mutators, transformers, and object-specific settings
   *
   * @returns A new ObjectValidator instance with copied configuration
   *
   * @example
   * ```ts
   * const baseUser = v.object({ name: v.string() }).allowUnknown();
   * const userCopy = baseUser.clone();
   * // userCopy has the same schema and allowUnknown setting
   * ```
   */
  public override clone(keys?: string[]): this {
    // Get cloned instance with all BaseValidator properties
    const cloned = super.clone();

    // Clone schema with deep copy of validators
    const newSchema = {} as TSchema;
    for (const key in this.schema) {
      if (keys && !keys.includes(key)) continue;
      (newSchema as any)[key] = this.schema[key].clone();
    }

    cloned.schema = newSchema;

    // Add ObjectValidator-specific properties
    cloned.shouldAllowUnknown = this.shouldAllowUnknown;
    cloned.allowedKeys = [...this.allowedKeys];
    // NOTE: hasUnknownKeyRule is intentionally NOT copied.
    // Each clone must add its own unknownKeyRule on first validate()
    // so it holds references to its own schema/allowedKeys, not the original's.

    return cloned;
  }

  /**
   * Extend this schema with additional fields
   * Clones the current validator and adds new fields to the schema
   * **Keeps original configuration** (allowUnknown, stripUnknown, etc.)
   *
   * If an ObjectValidator is provided, only its schema is used - its configuration is ignored.
   * This is useful for creating reusable field collections that can be added to different schemas.
   *
   * @param schemaOrValidator - Plain schema object or ObjectValidator to extend with
   * @returns A new ObjectValidator with merged schema and original configuration
   *
   * @example
   * ```ts
   * // Extend with plain schema
   * const baseUser = v.object({
   *   name: v.string().required(),
   *   email: v.string().email().required()
   * }).allowUnknown();
   *
   * const adminUser = baseUser.extend({
   *   role: v.string().in(['admin', 'superadmin']).required()
   * });
   * // adminUser has: name, email, role
   * // adminUser keeps: allowUnknown() from base ✅
   *
   * // Extend with ObjectValidator (only schema is used)
   * const auditFields = v.object({
   *   createdAt: v.date().required(),
   *   updatedAt: v.date().required()
   * }).stripUnknown(); // This config is ignored!
   *
   * const fullUser = baseUser.extend(auditFields);
   * // fullUser has: name, email, createdAt, updatedAt
   * // fullUser keeps: allowUnknown() from base (NOT stripUnknown from auditFields) ✅
   *
   * // Chain multiple extends
   * const complexSchema = baseUser
   *   .extend(auditFields)
   *   .extend({ metadata: v.object({}) });
   * ```
   */
  public extend<TExtension extends Schema>(
    schemaOrValidator: TExtension | ObjectValidator<TExtension>,
  ): ObjectValidator<TSchema & TExtension> {
    // Clone current validator to preserve original
    const extended = this.clone() as any;

    // Extract schema from parameter
    const schemaToAdd =
      schemaOrValidator instanceof ObjectValidator ? schemaOrValidator.schema : schemaOrValidator;

    // Merge schemas with cloned validators (later fields override earlier ones)
    for (const key in schemaToAdd) {
      extended.schema[key] = schemaToAdd[key].clone();
    }

    return extended as ObjectValidator<TSchema & TExtension>;
  }

  /**
   * Merge with another ObjectValidator
   * Clones current validator, merges schemas, and **overrides configuration** with other validator's config
   *
   * Unlike extend(), merge() combines both schemas AND configurations.
   * The other validator's configuration (allowUnknown, stripUnknown, etc.) takes precedence.
   *
   * @param validator - Another ObjectValidator to merge with
   * @returns A new ObjectValidator with merged schema and configuration
   *
   * @example
   * ```ts
   * const baseUser = v.object({
   *   name: v.string().required()
   * }).allowUnknown();
   *
   * const timestamps = v.object({
   *   createdAt: v.date().required(),
   *   updatedAt: v.date().required()
   * }).stripUnknown();
   *
   * const merged = baseUser.merge(timestamps);
   * // merged has: name, createdAt, updatedAt
   * // merged config: stripUnknown() from timestamps (overrides allowUnknown) ✅
   *
   * // Chain multiple merges
   * const full = baseUser.merge(timestamps).merge(softDeleteSchema);
   * ```
   */
  public merge<TMerge extends Schema>(
    validator: ObjectValidator<TMerge>,
  ): ObjectValidator<TSchema & TMerge> {
    // Clone current validator
    const merged = this.clone() as any;

    // Merge schemas with cloned validators (later fields override earlier ones)
    for (const key in validator.schema) {
      merged.schema[key] = validator.schema[key].clone();
    }

    // Override configuration with other validator's config
    merged.shouldAllowUnknown = validator.shouldAllowUnknown;
    merged.allowedKeys = [...merged.allowedKeys, ...validator.allowedKeys];

    // Append rules, mutators, transformers from other validator
    merged.rules.push(...validator.rules);
    merged.mutators.push(...validator.mutators);
    merged.dataTransformers.push(...validator.dataTransformers);

    // Merge attributes text (later wins)
    merged.attributesText = {
      ...merged.attributesText,
      ...validator.attributesText,
    };

    merged.translatedAttributes = {
      ...merged.translatedAttributes,
      ...validator.translatedAttributes,
    };

    return merged as ObjectValidator<TSchema & TMerge>;
  }

  /**
   * Create a new schema with only the specified fields
   * Clones the current validator and keeps only the selected fields
   * **Preserves all configuration** (allowUnknown, stripUnknown, etc.)
   *
   * @param keys - Field names to keep in the schema
   * @returns A new ObjectValidator with only the picked fields
   *
   * @example
   * ```ts
   * const fullUser = v.object({
   *   id: v.int().required(),
   *   name: v.string().required(),
   *   email: v.string().email().required(),
   *   password: v.string().required(),
   *   role: v.string()
   * }).allowUnknown();
   *
   * // For login - only need email and password
   * const loginSchema = fullUser.pick('email', 'password');
   * // loginSchema has: { email, password }
   * // loginSchema keeps: allowUnknown() ✅
   *
   * // For public profile
   * const publicSchema = fullUser.pick('id', 'name', 'role');
   * // publicSchema has: { id, name, role }
   * ```
   */
  public pick<K extends keyof TSchema>(...keys: K[]): ObjectValidator<Pick<TSchema, K>> {
    // Clone current validator
    const picked = this.clone() as any;

    // Create new schema with only picked keys
    const newSchema = {} as Pick<TSchema, K>;
    for (const key of keys) {
      if (key in picked.schema) {
        (newSchema as any)[key] = picked.schema[key];
      }
    }

    picked.schema = newSchema;

    return picked as ObjectValidator<Pick<TSchema, K>>;
  }

  /**
   * Mark all or the given schema fields as optional
   */
  public partial<K extends keyof TSchema>(...keys: K[]) {
    const validationSchema = this.clone();

    if (keys.length === 0) {
      keys = Object.keys(validationSchema.schema) as K[];
    }

    for (const key of keys) {
      validationSchema.schema[key] = validationSchema.schema[key].optional();
    }

    return validationSchema;
  }

  /**
   * Make the all or the given fields as required
   */
  public requiredFields<K extends keyof TSchema>(...keys: K[]) {
    const validationSchema = this.clone();

    if (keys.length === 0) {
      keys = Object.keys(validationSchema.schema) as K[];
    }

    for (const key of keys) {
      validationSchema.schema[key] = validationSchema.schema[key].required();
    }

    return validationSchema;
  }

  /**
   * Create a new schema excluding the specified fields
   * Clones the current validator and removes the specified fields
   * **Preserves all configuration** (allowUnknown, stripUnknown, etc.)
   *
   * @param keys - Field names to exclude from the schema
   * @returns A new ObjectValidator without the excluded fields
   *
   * @example
   * ```ts
   * const fullUser = v.object({
   *   id: v.int().required(),
   *   name: v.string().required(),
   *   email: v.string().email().required(),
   *   password: v.string().required(),
   *   role: v.string()
   * }).allowUnknown();
   *
   * // For updates - exclude id
   * const updateSchema = fullUser.without('id');
   * // updateSchema has: { name, email, password, role }
   * // updateSchema keeps: allowUnknown() ✅
   *
   * // For public API - exclude sensitive fields
   * const publicSchema = fullUser.without('password', 'role');
   * // publicSchema has: { id, name, email }
   *
   * // Combine with other methods
   * const patchSchema = fullUser.without('id', 'password');
   * // patchSchema has: { name, email, role }
   * ```
   */
  public without<K extends keyof TSchema>(...keys: K[]): ObjectValidator<Omit<TSchema, K>> {
    // Clone current validator
    const filtered = this.clone() as any;

    // Create new schema excluding specified keys
    const newSchema = {} as Omit<TSchema, K>;
    for (const key in filtered.schema) {
      if (!keys.includes(key as any)) {
        (newSchema as any)[key] = filtered.schema[key];
      }
    }

    filtered.schema = newSchema;

    return filtered as ObjectValidator<Omit<TSchema, K>>;
  }

  /** Mutate the data */
  public mutate(data: any, context: SchemaContext) {
    if (!isPlainObject(data)) return data;
    return super.mutate({ ...data }, context);
  }

  /** Validate the data */
  public async validate(
    data: any,
    context: SchemaContext = { path: "" } as SchemaContext,
  ): Promise<ValidationResult> {
    context.schema = this.schema;
    const mutatedData = await this.mutate(data, context);

    // Check for unknown properties
    if (this.shouldAllowUnknown === false && !this.hasUnknownKeyRule) {
      this.hasUnknownKeyRule = true;
      const rule = this.addMutableRule(unknownKeyRule, undefined, {
        allowedKeys: this.allowedKeys,
        schema: this.schema,
      });

      this.setRuleAttributesList(rule);
    }

    const result = await super.validate(mutatedData, context);

    if (result.isValid === false) return result;
    if (data === undefined) return result;

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Validate user input fields (skip computed/managed)
    // ═══════════════════════════════════════════════════════════
    const errors: ValidationResult["errors"] = [];
    const validatedData: any = {};

    const userInputKeys = Object.keys(this.schema).filter(
      (key) => !this.isComputedValidator(this.schema[key]),
    );

    const validationPromises = userInputKeys.map(async (key) => {
      const validator = this.schema[key];
      const value =
        mutatedData?.[key] !== undefined ? mutatedData[key] : validator.getDefaultValue();

      const childContext: SchemaContext = {
        ...context,
        parent: mutatedData,
        value,
        key,
        path: setKeyPath(context.path, key),
      };

      const childResult = await validator.validate(value, childContext);

      // Only include in validated data if not omitted
      if (childResult.data !== undefined && !validator.isOmitted()) {
        validatedData[key] = childResult.data;
      }

      if (childResult.isValid === false) {
        errors.push(...childResult.errors);
      }
    });

    await Promise.all(validationPromises);

    // If Phase 1 failed, return early
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        data: undefined,
      };
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Execute computed/managed fields with validated data
    // ═══════════════════════════════════════════════════════════
    const computedFields = this.getComputedFields();

    const computedPromises = Object.keys(computedFields).map(async (key) => {
      const validator = computedFields[key];

      const childContext: SchemaContext = {
        ...context,
        parent: validatedData,
        value: undefined, // Computed fields don't have input value
      };

      // Execute computed callback with validated data
      const childResult = await validator.validate(validatedData, childContext);

      // Only include in final data if not omitted
      if (childResult.data !== undefined && !validator.isOmitted()) {
        validatedData[key] = childResult.data;
      }

      if (childResult.isValid === false) {
        errors.push(...childResult.errors);
      }
    });

    await Promise.all(computedPromises);

    // If Phase 2 failed, return early
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        data: undefined,
      };
    }

    // Remove undefined values
    const cleanedData = removeUndefinedValues(validatedData);

    const transformedData = await this.startTransformationPipeline(cleanedData, context);

    const output =
      this.shouldAllowUnknown === false
        ? transformedData
        : {
            ...transformedData,
            ...except(mutatedData, Object.keys(this.schema)),
          };

    return {
      isValid: true,
      errors: [],
      data: output,
    };
  }

  /**
   * Check if a validator is a computed or managed field
   * ManagedValidator extends ComputedValidator, so instanceof catches both
   */
  private isComputedValidator(validator: BaseValidator): boolean {
    return validator instanceof ComputedValidator;
  }

  /**
   * Get all computed/managed fields from the schema
   */
  private getComputedFields(): Record<string, ComputedValidator> {
    const computed: Record<string, any> = {};

    for (const [key, validator] of Object.entries(this.schema)) {
      if (validator instanceof ComputedValidator) {
        computed[key] = validator;
      }
    }

    return computed;
  }

  /**
   * @inheritdoc
   *
   * Recursively generates JSON Schema for all input fields in the schema.
   * Computed/managed fields are skipped — they have no input representation.
   *
   * **Standard targets** (`draft-2020-12`, `draft-07`, `openapi-3.0`):
   * - Fields marked `.optional()` are excluded from `required`.
   *
   * **`openai-strict` target** (OpenAI Structured Outputs):
   * - ALL fields appear in `required` — OpenAI rejects schemas with optional fields.
   * - Optional fields are instead expressed as nullable types:
   *   `{ type: ["string", "null"] }` so the model can output `null` for them.
   * - Recursively applies `openai-strict` to all nested objects.
   *
   * @example
   * ```ts
   * v.object({
   *   name: v.string().required(),
   *   age: v.int().optional(),
   * }).toJsonSchema("draft-2020-12")
   * // → { type: "object",
   * //     properties: { name: { type: "string" }, age: { type: "integer" } },
   * //     required: ["name"], additionalProperties: false }
   *
   * v.object({
   *   name: v.string().required(),
   *   age: v.int().optional(),
   * }).toJsonSchema("openai-strict")
   * // → { type: "object",
   * //     properties: { name: { type: "string" }, age: { type: ["integer", "null"] } },
   * //     required: ["name", "age"],   ← all fields
   * //     additionalProperties: false }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const properties: Record<string, JsonSchemaResult> = {};
    const required: string[] = [];
    const isOpenAIStrict = target === "openai-strict";

    for (const [key, validator] of Object.entries(this.schema)) {
      // Skip computed/managed — runtime-only, no input schema
      if (validator instanceof ComputedValidator) continue;

      let fieldSchema = validator.toJsonSchema(target);

      if (isOpenAIStrict) {
        // OpenAI strict: every field must be in required.
        // Optional fields are expressed as nullable rather than absent.
        if (validator.isOptional) {
          fieldSchema = wrapNullableStrict(fieldSchema);
        }
        required.push(key);
      } else {
        // Standard JSON Schema: only non-optional fields go in required
        if (!validator.isOptional) {
          required.push(key);
        }
      }

      properties[key] = fieldSchema;
    }

    const schema: JsonSchemaResult = { type: "object", properties };

    if (required.length > 0) schema.required = required;
    if (!this.shouldAllowUnknown) schema.additionalProperties = false;
    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}

/** Recursively remove undefined values from an object */
function removeUndefinedValues(obj: any, visited = new WeakMap<object, any>()): any {
  // Handle primitives and null
  if (obj === null) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedValues(item, visited));
  }

  // Skip non-plain objects (class instances, Dates, Buffers, etc.)
  if (!isPlainObject(obj)) {
    return obj;
  }

  // Handle circular references - return already processed result
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // Process plain objects
  const result: any = {};
  visited.set(obj, result); // Mark as processing BEFORE recursion

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = removeUndefinedValues(value, visited);
    }
  }

  return result;
}
