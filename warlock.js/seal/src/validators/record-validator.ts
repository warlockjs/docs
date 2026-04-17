import { isPlainObject } from "@mongez/supportive-is";
import { setKeyPath } from "../helpers";
import { objectRule, plainObjectRule } from "../rules";
import type { SchemaContext, ValidationResult } from "../types";
import { BaseValidator } from "./base-validator";
import { applyNullable } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Record validator class - validates objects with dynamic keys and consistent value types
 *
 * @example
 * ```ts
 * // Translations object
 * v.record(v.string())
 * // Valid: { en: "Hello", ar: "مرحبا", fr: "Bonjour" }
 *
 * // User preferences
 * v.record(v.union([v.string(), v.number(), v.boolean()]))
 * // Valid: { theme: "dark", fontSize: 16, notifications: true }
 * ```
 */
export class RecordValidator extends BaseValidator {
  public constructor(
    public valueValidator: BaseValidator,
    errorMessage?: string,
  ) {
    super();
    this.addMutableRule(objectRule, errorMessage);
  }

  /**
   * Validate it as plain object
   */
  public plainObject(errorMessage?: string) {
    return this.addRule(plainObjectRule, errorMessage);
  }

  /**
   * Check if value is a plain object type
   */
  public matchesType(value: any): boolean {
    return isPlainObject(value);
  }

  /**
   * Clone the validator
   */
  public override clone(): this {
    const cloned = super.clone();
    cloned.valueValidator = this.valueValidator.clone();
    return cloned;
  }

  /**
   * Validate record - iterate all keys and validate each value
   */
  public async validate(data: any, context: SchemaContext): Promise<ValidationResult> {
    const mutatedData = (await this.mutate(data, context)) || {};
    const result = await super.validate(data, context);

    if (result.isValid === false) return result;

    const errors: ValidationResult["errors"] = [];
    const keys = Object.keys(mutatedData);

    // Validate all values in parallel
    const validationPromises = keys.map(async (key) => {
      const childContext: SchemaContext = {
        ...context,
        parent: mutatedData,
        value: mutatedData[key],
        key,
        path: setKeyPath(context.path, key),
      };

      const childResult = await this.valueValidator.validate(mutatedData[key], childContext);

      // Update mutated data with validated result
      mutatedData[key] = childResult.data;

      // Collect errors from this value
      if (childResult.isValid === false) {
        errors.push(...childResult.errors);
      }
    });

    await Promise.all(validationPromises);

    return {
      isValid: errors.length === 0,
      errors,
      data: await this.startTransformationPipeline(mutatedData, context),
    };
  }

  /**
   * @inheritdoc
   *
   * Generates `{ type: "object", additionalProperties: <valueSchema> }` —
   * the standard JSON Schema for a dictionary/map with homogeneous values.
   *
   * @example
   * ```ts
   * v.record(v.string()).toJsonSchema("draft-2020-12")
   * // → { type: "object", additionalProperties: { type: "string" } }
   *
   * v.record(v.union([v.string(), v.number()])).toJsonSchema("draft-2020-12")
   * // → { type: "object", additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }] } }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = {
      type: "object",
      additionalProperties: this.valueValidator.toJsonSchema(target),
    };

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
