import { setKeyPath } from "../helpers";
import { flipArrayMutator, sortArrayMutator, uniqueArrayMutator } from "../mutators";
import {
  arrayRule,
  betweenLengthRule,
  lengthRule,
  maxLengthRule,
  minLengthRule,
  sortedArrayRule,
  uniqueArrayRule,
} from "../rules";
import type { SchemaContext, ValidationResult } from "../types";
import { BaseValidator } from "./base-validator";
import { applyNullable, getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Array validator class
 */
export class ArrayValidator extends BaseValidator {
  public constructor(
    public validator: BaseValidator,
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

    cloned.validator = this.validator.clone();

    return cloned;
  }

  /** Reverse array order */
  public flip() {
    return this.addMutator(flipArrayMutator);
  }

  /** Reverse array order (alias) */
  public reverse() {
    return this.addMutator(flipArrayMutator);
  }

  /** Make it has only unique values */
  public onlyUnique() {
    return this.addMutator(uniqueArrayMutator);
  }

  /** Sort array */
  public sort(direction: "asc" | "desc" = "asc", key?: string) {
    return this.addMutator(sortArrayMutator, { direction, key });
  }

  /** Array length must be greater than the given length */
  public minLength(length: number, errorMessage?: string) {
    return this.addRule(minLengthRule, errorMessage, { minLength: length });
  }

  /** Array length must be less than the given length */
  public maxLength(length: number, errorMessage?: string) {
    return this.addRule(maxLengthRule, errorMessage, { maxLength: length });
  }

  /** Array length must be of the given length */
  public length(length: number, errorMessage?: string) {
    return this.addRule(lengthRule, errorMessage, { length });
  }

  /**
   * Array length must be between min and max (inclusive)
   *
   * @param min - Minimum length (inclusive)
   * @param max - Maximum length (inclusive)
   *
   * @example
   * ```ts
   * v.array(v.string()).between(1, 10)  // Array must have 1 to 10 items
   * v.array(v.number()).lengthBetween(5, 20)  // Same using alias
   * ```
   *
   * @category Validation Rule
   */
  public between(min: number, max: number, errorMessage?: string) {
    return this.addRule(betweenLengthRule, errorMessage, {
      minLength: min,
      maxLength: max,
    });
  }

  /**
   * Alias for between() - array length between min and max
   */
  public lengthBetween(min: number, max: number, errorMessage?: string) {
    return this.between(min, max, errorMessage);
  }

  /** Array must have unique values */
  public unique(errorMessage?: string) {
    return this.addRule(uniqueArrayRule, errorMessage);
  }

  /** Array must be sorted */
  public sorted(direction: "asc" | "desc" = "asc", errorMessage?: string) {
    return this.addRule(sortedArrayRule, errorMessage, { direction });
  }

  /** Mutate the data */
  public mutate(data: any, context: SchemaContext) {
    if (!Array.isArray(data)) return data;
    return super.mutate([...data], context);
  }

  /** Validate array */
  public async validate(data: any, context: SchemaContext): Promise<ValidationResult> {
    const mutatedData = (await this.mutate(data, context)) || [];
    const result = await super.validate(data, context);

    if (result.isValid === false) return result;

    const errors: ValidationResult["errors"] = [];

    // Validate all items in parallel (consistent with ObjectValidator)
    const validationPromises = mutatedData.map(async (value: any, index: number) => {
      const childContext: SchemaContext = {
        ...context,
        parent: mutatedData,
        value,
        key: index.toString(),
        path: setKeyPath(context.path, index.toString()),
      };

      const childResult = await this.validator.validate(value, childContext);

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
   * Recursively generates JSON Schema for the array items.
   *
   * @example
   * ```ts
   * v.array(v.string().min(1)).minLength(1).toJsonSchema("draft-2020-12")
   * // → { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = {
      type: "array",
      items: this.validator.toJsonSchema(target),
    };

    const minOpts = getRuleOptions(this.rules, "minLength");
    if (minOpts?.minLength !== undefined) schema.minItems = minOpts.minLength;

    const maxOpts = getRuleOptions(this.rules, "maxLength");
    if (maxOpts?.maxLength !== undefined) schema.maxItems = maxOpts.maxLength;

    const betweenOpts = getRuleOptions(this.rules, "betweenLength");
    if (betweenOpts) {
      if (betweenOpts.minLength !== undefined) schema.minItems = betweenOpts.minLength;
      if (betweenOpts.maxLength !== undefined) schema.maxItems = betweenOpts.maxLength;
    }

    const lengthOpts = getRuleOptions(this.rules, "length");
    if (lengthOpts?.length !== undefined) {
      schema.minItems = lengthOpts.length;
      schema.maxItems = lengthOpts.length;
    }

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
