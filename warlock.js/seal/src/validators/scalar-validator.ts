import { invalidRule, VALID_RULE } from "../helpers";
import { numberMutator, stringMutator } from "../mutators";
import {
  acceptedIfPresentRule,
  acceptedIfRequiredRule,
  acceptedIfRule,
  acceptedRule,
  acceptedUnlessRule,
  acceptedWithoutRule,
  declinedIfPresentRule,
  declinedIfRequiredRule,
  declinedIfRule,
  declinedRule,
  declinedUnlessRule,
  declinedWithoutRule,
} from "../rules/scalar";
import { PrimitiveValidator } from "./primitive-validator";
import { getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Scalar validator class
 *
 * Core validator for scalar values (string, number, boolean).
 * Extends PrimitiveValidator (inherits enum/in/oneOf/allowsOnly/forbids/notIn)
 * and additionally provides type-coercion mutators and accepted/declined rules.
 *
 * Database methods (unique, exists, etc.) are injected by the framework
 */
export class ScalarValidator extends PrimitiveValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(
      {
        name: "scalar",
        defaultErrorMessage: "The :input must be a scalar value",
        async validate(value, context) {
          if (["string", "number", "boolean"].includes(typeof value)) {
            return VALID_RULE;
          }
          return invalidRule(this, context);
        },
      },
      errorMessage,
    );
  }

  /**
   * Add matches type
   */
  public matchesType(value: any) {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  }

  /**
   * Mutate the scalar value to be number
   */
  public asNumber() {
    return this.addMutator(numberMutator);
  }

  /**
   * Mutate the scalar value to be string
   */
  public asString() {
    return this.addMutator(stringMutator);
  }

  /**
   * Accepted value
   * The value will be valid if it equals 1 | "1" | true | "true" | "yes" | "y" | "on"
   */
  public accepted(errorMessage?: string) {
    return this.addRule(acceptedRule, errorMessage);
  }

  /**
   * Accepted value if another field's value equals to a specific value
   */
  public acceptedIf(field: string, value: any, errorMessage?: string) {
    return this.addRule(acceptedIfRule, errorMessage, { field, value });
  }

  /**
   * Accepted value if another field's value is not equal to the given value
   */
  public acceptedUnless(field: string, value: any, errorMessage?: string) {
    return this.addRule(acceptedUnlessRule, errorMessage, { field, value });
  }

  /**
   * Accepted value if another field is required
   */
  public acceptedIfRequired(field: string, errorMessage?: string) {
    return this.addRule(acceptedIfRequiredRule, errorMessage, { field });
  }

  /**
   * Accepted value if another field is present
   */
  public acceptedIfPresent(field: string, errorMessage?: string) {
    return this.addRule(acceptedIfPresentRule, errorMessage, { field });
  }

  /**
   * Accepted value if another field is missing
   */
  public acceptedWithout(field: string, errorMessage?: string) {
    return this.addRule(acceptedWithoutRule, errorMessage, { field });
  }

  /**
   * Declined value
   * The value will be valid if it equals 0 | "0" | false | "false" | "no" | "n" | "off"
   */
  public declined(errorMessage?: string) {
    return this.addRule(declinedRule, errorMessage);
  }

  /**
   * Declined value if another field's value equals to a specific value
   */
  public declinedIf(field: string, value: any, errorMessage?: string) {
    return this.addRule(declinedIfRule, errorMessage, { field, value });
  }

  /**
   * Declined value if another field's value is not equal to the given value
   */
  public declinedUnless(field: string, value: any, errorMessage?: string) {
    return this.addRule(declinedUnlessRule, errorMessage, { field, value });
  }

  /**
   * Declined value if another field is required
   */
  public declinedIfRequired(field: string, errorMessage?: string) {
    return this.addRule(declinedIfRequiredRule, errorMessage, { field });
  }

  /**
   * Declined value if another field is present
   */
  public declinedIfPresent(field: string, errorMessage?: string) {
    return this.addRule(declinedIfPresentRule, errorMessage, { field });
  }

  /**
   * Declined value if another field is missing
   */
  public declinedWithout(field: string, errorMessage?: string) {
    return this.addRule(declinedWithoutRule, errorMessage, { field });
  }

  /**
   * @inheritdoc
   *
   * A scalar accepts string | number | boolean. If `.in()` / `.enum()` is used,
   * output collapses to a simple `enum` list instead.
   *
   * @example
   * ```ts
   * v.scalar().toJsonSchema("draft-2020-12")
   * // → { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] }
   *
   * v.scalar().in(["active", "inactive"]).toJsonSchema("draft-2020-12")
   * // → { enum: ["active", "inactive"] }
   * ```
   */
  public override toJsonSchema(_target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    // If a value set is constrained, collapse to enum
    const inOpts = getRuleOptions(this.rules, "in");
    if (inOpts?.values && Array.isArray(inOpts.values)) {
      return { enum: inOpts.values };
    }

    const enumOpts = getRuleOptions(this.rules, "enum");
    if (enumOpts?.enum && Array.isArray(enumOpts.enum)) {
      return { enum: enumOpts.enum };
    }

    return {
      oneOf: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
      ],
    };
  }
}
