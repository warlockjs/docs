import { allowedValuesRule, enumRule, inRule, notAllowedValuesRule } from "../rules";
import { BaseValidator } from "./base-validator";

/**
 * Abstract base validator for primitive-typed fields (string, number, boolean).
 *
 * Provides value-membership rules that are meaningful for any single primitive value
 * but not for complex structures (object, array).
 *
 * Do NOT expose this on the `v` factory — it is an inheritance-only base class.
 *
 * Hierarchy:
 *   BaseValidator
 *     └── PrimitiveValidator    ← enum, in, oneOf, allowsOnly, forbids, notIn
 *           ├── StringValidator
 *           ├── NumberValidator
 *           │     └── FloatValidator
 *           ├── BooleanValidator
 *           └── ScalarValidator  (extends PrimitiveValidator, adds asNumber/asString/accepted/declined)
 *
 * @example
 * class MyValidator extends PrimitiveValidator {
 *   // inherits: in(), forbids(), enum(), oneOf(), allowsOnly(), notIn()
 * }
 */
export abstract class PrimitiveValidator extends BaseValidator {
  /**
   * Value must be one of the enum's values
   *
   * @example
   * v.string().enum(Direction) // Direction is a TS enum
   */
  public enum(values: any, errorMessage?: string) {
    return this.addRule(enumRule, errorMessage, { enum: Object.values(values) });
  }

  /**
   * Value must be one of the given values
   *
   * @example
   * v.string().in(["admin", "user", "guest"])
   * v.number().in([1, 2, 3])
   */
  public in(values: any[], errorMessage?: string) {
    return this.addRule(inRule, errorMessage, { values });
  }

  /**
   * Alias for `in()`
   *
   * @example
   * v.string().oneOf(["active", "inactive"])
   */
  public oneOf(values: any[], errorMessage?: string) {
    return this.in(values, errorMessage);
  }

  /**
   * Value must be one of the allowed values (stricter variant)
   *
   * @example
   * v.string().allowsOnly(["yes", "no"])
   */
  public allowsOnly(values: any[], errorMessage?: string) {
    return this.addRule(allowedValuesRule, errorMessage, { allowedValues: values });
  }

  /**
   * Value must NOT be one of the given values
   *
   * @example
   * v.string().forbids(["banned", "blacklisted"])
   * v.number().forbids([0, -1])
   */
  public forbids(values: any[], errorMessage?: string) {
    return this.addRule(notAllowedValuesRule, errorMessage, { notAllowedValues: values });
  }

  /**
   * Alias for `forbids()`
   *
   * @example
   * v.string().notIn(["OK", "NOT OK"])
   */
  public notIn(values: any[], errorMessage?: string) {
    return this.forbids(values, errorMessage);
  }
}
