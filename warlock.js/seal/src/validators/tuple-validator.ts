import { setKeyPath } from "../helpers";
import { arrayRule } from "../rules";
import type { SchemaContext, ValidationResult } from "../types";
import { BaseValidator } from "./base-validator";
import { applyNullable } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Tuple validator class - validates fixed-length arrays with position-specific types
 *
 * @example
 * ```ts
 * // RGB color tuple
 * v.tuple([v.number(), v.number(), v.number()])
 * // Valid: [255, 128, 0]
 * // Invalid: [255, 128] (too short)
 *
 * // Mixed types
 * v.tuple([v.string(), v.int(), v.boolean()])
 * // Valid: ["John", 25, true]
 * ```
 */
export class TupleValidator extends BaseValidator {
  public constructor(
    public validators: BaseValidator[],
    errorMessage?: string,
  ) {
    super();
    this.addMutableRule(arrayRule, errorMessage);
  }

  /**
   * Check if value is an array type
   */
  public matchesType(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Clone the validator
   */
  public override clone(): this {
    const cloned = super.clone();
    cloned.validators = this.validators.map((v) => v.clone());
    return cloned;
  }

  /**
   * Validate tuple - check length then validate each position
   */
  public async validate(data: any, context: SchemaContext): Promise<ValidationResult> {
    const mutatedData = (await this.mutate(data, context)) || [];
    const result = await super.validate(data, context);

    if (result.isValid === false) return result;

    const errors: ValidationResult["errors"] = [];

    // Tuple-specific: length validation
    if (mutatedData.length !== this.validators.length) {
      errors.push({
        type: "tuple",
        input: context.key || "value",
        error: `Expected exactly ${this.validators.length} items, but got ${mutatedData.length}`,
      });
      return { isValid: false, errors, data: mutatedData };
    }

    // Validate each position with its specific validator in parallel
    const validationPromises = this.validators.map(async (validator, index) => {
      const childContext: SchemaContext = {
        ...context,
        parent: mutatedData,
        value: mutatedData[index],
        key: index.toString(),
        path: setKeyPath(context.path, index.toString()),
      };

      const childResult = await validator.validate(mutatedData[index], childContext);

      // Update mutated data with validated result
      mutatedData[index] = childResult.data;

      // Collect errors from this element
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
   * Tuple keyword diverges between targets:
   * - `draft-2020-12` → `prefixItems` + `items: false` (exact length enforced)
   * - `draft-07`      → `items` as array + `additionalItems: false`
   * - `openapi-3.0`   → same as draft-07 (OpenAPI 3.0 is based on draft-07)
   *
   * @example
   * ```ts
   * v.tuple([v.string(), v.int(), v.boolean()]).toJsonSchema("draft-2020-12")
   * // → {
   * //   type: "array",
   * //   prefixItems: [{ type: "string" }, { type: "integer" }, { type: "boolean" }],
   * //   items: false,
   * //   minItems: 3,
   * //   maxItems: 3
   * // }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const itemSchemas = this.validators.map(v => v.toJsonSchema(target));
    const length = this.validators.length;

    const schema: JsonSchemaResult = {
      type: "array",
      minItems: length,
      maxItems: length,
    };

    if (target === "draft-2020-12") {
      // prefixItems is the draft-2020-12 keyword for positional tuple items
      schema.prefixItems = itemSchemas;
      schema.items = false; // no additional items beyond the tuple
    } else {
      // draft-07 and openapi-3.0: items as array + additionalItems: false
      schema.items = itemSchemas;
      schema.additionalItems = false;
    }

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
