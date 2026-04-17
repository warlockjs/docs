import { absMutator, ceilMutator, floorMutator, roundMutator, toFixedMutator } from "../mutators";
import {
  betweenNumbersRule,
  evenRule,
  greaterThanRule,
  lengthRule,
  lessThanRule,
  maxLengthRule,
  maxRule,
  minLengthRule,
  minRule,
  moduloRule,
  negativeRule,
  numberRule,
  oddRule,
  positiveRule,
} from "../rules";
import { PrimitiveValidator } from "./primitive-validator";
import { applyNullable, getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Number validator class - base for Int and Float validators
 */
export class NumberValidator extends PrimitiveValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(numberRule, errorMessage);
  }

  /**
   * Check if value is a number type
   */
  public matchesType(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }

  /**
   * Value must be equal or higher than the given number or field
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public min(min: number | string, errorMessage?: string) {
    return this.addRule(minRule, errorMessage, { min, scope: "global" });
  }

  /**
   * Value must be equal or less than the given number or field
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public max(max: number | string, errorMessage?: string) {
    return this.addRule(maxRule, errorMessage, { max, scope: "global" });
  }

  /**
   * Value must be >= sibling field value
   * @category Validation Rule
   */
  public minSibling(field: string, errorMessage?: string) {
    return this.addRule(minRule, errorMessage, { min: field, scope: "sibling" });
  }

  /**
   * Value must be <= sibling field value
   * @category Validation Rule
   */
  public maxSibling(field: string, errorMessage?: string) {
    return this.addRule(maxRule, errorMessage, { max: field, scope: "sibling" });
  }

  /**
   * Value must be strictly greater than the given number or field (>)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public greaterThan(value: number | string, errorMessage?: string) {
    return this.addRule(greaterThanRule, errorMessage, {
      value,
      scope: "global",
    });
  }

  /**
   * Value must be strictly less than the given number or field (<)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public lessThan(value: number | string, errorMessage?: string) {
    return this.addRule(lessThanRule, errorMessage, {
      value,
      scope: "global",
    });
  }

  /**
   * Alias for greaterThan() - shorter syntax
   * @category Validation Rule
   */
  public gt(value: number | string, errorMessage?: string) {
    return this.greaterThan(value, errorMessage);
  }

  /**
   * Alias for lessThan() - shorter syntax
   * @category Validation Rule
   */
  public lt(value: number | string, errorMessage?: string) {
    return this.lessThan(value, errorMessage);
  }

  /**
   * Value must be > sibling field value
   * @category Validation Rule
   */
  public greaterThanSibling(field: string, errorMessage?: string) {
    return this.addRule(greaterThanRule, errorMessage, {
      value: field,
      scope: "sibling",
    });
  }

  /**
   * Alias for greaterThanSibling() - shorter syntax
   * @category Validation Rule
   */
  public gtSibling(field: string, errorMessage?: string) {
    return this.greaterThanSibling(field, errorMessage);
  }

  /**
   * Value must be < sibling field value
   * @category Validation Rule
   */
  public lessThanSibling(field: string, errorMessage?: string) {
    return this.addRule(lessThanRule, errorMessage, {
      value: field,
      scope: "sibling",
    });
  }

  /**
   * Alias for lessThanSibling() - shorter syntax
   * @category Validation Rule
   */
  public ltSibling(field: string, errorMessage?: string) {
    return this.lessThanSibling(field, errorMessage);
  }

  /** Value must be a modulo of the given number */
  public modulo(value: number, errorMessage?: string) {
    return this.addRule(moduloRule, errorMessage, { value });
  }

  /**
   * Alias for modulo() - Value must be divisible by the given number
   */
  public divisibleBy(value: number, errorMessage?: string) {
    return this.modulo(value, errorMessage);
  }

  /**
   * Alias for modulo() - Value must be a multiple of the given number
   */
  public multipleOf(value: number, errorMessage?: string) {
    return this.modulo(value, errorMessage);
  }

  /**
   * Alias for modulo() - Value must be a multiple of the given number
   */
  public modulusOf(value: number, errorMessage?: string) {
    return this.modulo(value, errorMessage);
  }

  /** Accept only numbers higher than 0 */
  public positive(errorMessage?: string) {
    return this.addRule(positiveRule, errorMessage);
  }

  /** Accept only negative numbers */
  public negative(errorMessage?: string) {
    return this.addRule(negativeRule, errorMessage);
  }

  /** Accept only odd numbers */
  public odd(errorMessage?: string) {
    return this.addRule(oddRule, errorMessage);
  }

  /** Accept only even numbers */
  public even(errorMessage?: string) {
    return this.addRule(evenRule, errorMessage);
  }

  /**
   * Accept only numbers between the given two numbers or fields (Inclusive)
   * Smart detection: number or field name
   *
   * @category Validation Rule
   */
  public between(min: number | string, max: number | string, errorMessage?: string) {
    return this.addRule(betweenNumbersRule, errorMessage, {
      min,
      max,
      scope: "global",
    });
  }

  /**
   * Value must be between sibling field values
   * @category Validation Rule
   */
  public betweenSibling(minField: string, maxField: string, errorMessage?: string) {
    return this.addRule(betweenNumbersRule, errorMessage, {
      min: minField,
      max: maxField,
      scope: "sibling",
    });
  }

  // Enum and value membership methods are inherited from PrimitiveValidator.

  /**
   * Value (as a string) must be exactly this many characters.
   * Useful for fixed-format numeric codes (e.g. 4-digit PIN).
   */
  public length(length: number, errorMessage?: string) {
    return this.addRule(lengthRule, errorMessage, { length });
  }

  /** Value (as string representation) length must be ≥ min */
  public minLength(length: number, errorMessage?: string) {
    return this.addRule(minLengthRule, errorMessage, { minLength: length });
  }

  /** Value (as string representation) length must be ≤ max */
  public maxLength(length: number, errorMessage?: string) {
    return this.addRule(maxLengthRule, errorMessage, { maxLength: length });
  }

  // Mutators

  /**
   * Convert value to its absolute value
   */
  public abs() {
    return this.addMutator(absMutator);
  }

  /**
   * Round value up to the nearest integer
   */
  public ceil() {
    return this.addMutator(ceilMutator);
  }

  /**
   * Round value down to the nearest integer
   */
  public floor() {
    return this.addMutator(floorMutator);
  }

  /**
   * Round value to the nearest integer or specified decimals
   */
  public round(decimals = 0) {
    return this.addMutator(roundMutator, { decimals });
  }

  /**
   * Format number using fixed-point notation
   */
  public toFixed(decimals = 2) {
    return this.addMutator(toFixedMutator, { decimals });
  }

  /**
   * @inheritdoc
   *
   * Returns `{ type: "number" }` with numeric constraint keywords.
   * IntValidator overrides `type` to `"integer"`.
   *
   * @note Sibling-scoped rules (minSibling, maxSibling, etc.) are not representable
   * in JSON Schema and are silently omitted.
   *
   * @example
   * ```ts
   * v.number().min(0).max(100).toJsonSchema("draft-2020-12")
   * // → { type: "number", minimum: 0, maximum: 100 }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    return this.buildNumberJsonSchema("number", target);
  }

  /**
   * Shared logic for number/integer JSON Schema generation.
   * Called by NumberValidator.toJsonSchema() (→ type: "number")
   * and IntValidator.toJsonSchema() (→ type: "integer").
   */
  protected buildNumberJsonSchema(
    type: "number" | "integer",
    target: JsonSchemaTarget,
  ): JsonSchemaResult {
    const schema: JsonSchemaResult = { type };

    // minimum (inclusive)
    const minOpts = getRuleOptions(this.rules, "min");
    if (minOpts?.min !== undefined && typeof minOpts.min === "number") {
      schema.minimum = minOpts.min;
    }

    // maximum (inclusive)
    const maxOpts = getRuleOptions(this.rules, "max");
    if (maxOpts?.max !== undefined && typeof maxOpts.max === "number") {
      schema.maximum = maxOpts.max;
    }

    // between (inclusive range)
    const betweenOpts = getRuleOptions(this.rules, "betweenNumbers");
    if (betweenOpts) {
      if (typeof betweenOpts.min === "number") schema.minimum = betweenOpts.min;
      if (typeof betweenOpts.max === "number") schema.maximum = betweenOpts.max;
    }

    // greaterThan (>) → exclusiveMinimum
    const gtOpts = getRuleOptions(this.rules, "greaterThan");
    if (gtOpts?.value !== undefined && typeof gtOpts.value === "number") {
      if (target === "draft-07") {
        schema.minimum = gtOpts.value;
        schema.exclusiveMinimum = true;
      } else {
        schema.exclusiveMinimum = gtOpts.value;
      }
    }

    // lessThan (<) → exclusiveMaximum
    const ltOpts = getRuleOptions(this.rules, "lessThan");
    if (ltOpts?.value !== undefined && typeof ltOpts.value === "number") {
      if (target === "draft-07") {
        schema.maximum = ltOpts.value;
        schema.exclusiveMaximum = true;
      } else {
        schema.exclusiveMaximum = ltOpts.value;
      }
    }

    // multipleOf / modulo
    const moduloOpts = getRuleOptions(this.rules, "modulo");
    if (moduloOpts?.value !== undefined && typeof moduloOpts.value === "number") {
      schema.multipleOf = moduloOpts.value;
    }

    // enum (from PrimitiveValidator.in / .enum)
    const inOpts = getRuleOptions(this.rules, "in");
    if (inOpts?.values && Array.isArray(inOpts.values)) {
      schema.enum = inOpts.values;
    }

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
