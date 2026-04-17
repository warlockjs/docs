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
import { booleanRule } from "../rules";
import { PrimitiveValidator } from "./primitive-validator";
import { applyNullable } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Boolean validator class
 *
 * Extends PrimitiveValidator — inherits enum/in/oneOf/allowsOnly/forbids/notIn.
 * Defines accepted/declined directly as real methods (not ScalarValidator field copies)
 * so they survive cloning correctly.
 */
export class BooleanValidator extends PrimitiveValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(booleanRule, errorMessage);
  }

  /**
   * Check if value is a boolean type
   */
  public matchesType(value: any): boolean {
    return typeof value === "boolean";
  }

  // ==================== Accepted ====================

  /** Value must be accepted (true, "yes", 1, "on", etc.) */
  public accepted(errorMessage?: string) {
    return this.addRule(acceptedRule, errorMessage);
  }

  /** Value must be accepted if another field equals a value */
  public acceptedIf(field: string, value: any, errorMessage?: string) {
    return this.addRule(acceptedIfRule, errorMessage, { field, value });
  }

  /** Value must be accepted unless another field equals a value */
  public acceptedUnless(field: string, value: any, errorMessage?: string) {
    return this.addRule(acceptedUnlessRule, errorMessage, { field, value });
  }

  /** Value must be accepted if another field is required */
  public acceptedIfRequired(field: string, errorMessage?: string) {
    return this.addRule(acceptedIfRequiredRule, errorMessage, { field });
  }

  /** Value must be accepted if another field is present */
  public acceptedIfPresent(field: string, errorMessage?: string) {
    return this.addRule(acceptedIfPresentRule, errorMessage, { field });
  }

  /** Value must be accepted if another field is missing */
  public acceptedWithout(field: string, errorMessage?: string) {
    return this.addRule(acceptedWithoutRule, errorMessage, { field });
  }

  // ==================== Declined ====================

  /** Value must be declined (false, "no", 0, "off", etc.) */
  public declined(errorMessage?: string) {
    return this.addRule(declinedRule, errorMessage);
  }

  /** Value must be declined if another field equals a value */
  public declinedIf(field: string, value: any, errorMessage?: string) {
    return this.addRule(declinedIfRule, errorMessage, { field, value });
  }

  /** Value must be declined unless another field equals a value */
  public declinedUnless(field: string, value: any, errorMessage?: string) {
    return this.addRule(declinedUnlessRule, errorMessage, { field, value });
  }

  /** Value must be declined if another field is required */
  public declinedIfRequired(field: string, errorMessage?: string) {
    return this.addRule(declinedIfRequiredRule, errorMessage, { field });
  }

  /** Value must be declined if another field is present */
  public declinedIfPresent(field: string, errorMessage?: string) {
    return this.addRule(declinedIfPresentRule, errorMessage, { field });
  }

  /** Value must be declined if another field is missing */
  public declinedWithout(field: string, errorMessage?: string) {
    return this.addRule(declinedWithoutRule, errorMessage, { field });
  }

  // ==================== Strict boolean checks ====================

  /**
   * Value must be strictly true (not "yes", "on", 1, etc.)
   * @alias accepted - strict version
   */
  public mustBeTrue(errorMessage?: string) {
    return this.equal(true, errorMessage);
  }

  /**
   * Value must be strictly false (not "no", "off", 0, etc.)
   * @alias declined - strict version
   */
  public mustBeFalse(errorMessage?: string) {
    return this.equal(false, errorMessage);
  }

  /**
   * @inheritdoc
   *
   * @note accepted/declined rules and all cross-field boolean rules
   * are not representable in JSON Schema and are silently omitted.
   *
   * @example
   * ```ts
   * v.boolean().toJsonSchema("draft-2020-12")
   * // → { type: "boolean" }
   *
   * v.boolean().nullable().toJsonSchema("openapi-3.0")
   * // → { type: "boolean", nullable: true }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = { type: "boolean" };
    if (this.isNullable) applyNullable(schema, target);
    return schema;
  }
}
