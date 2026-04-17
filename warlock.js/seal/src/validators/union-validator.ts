import { unionRule } from "../rules";
import { BaseValidator } from "./base-validator";
import { getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Union validator class - validates value against multiple validator types
 *
 * Tries each validator in order until one passes. If a validator's matchesType()
 * returns false, it's skipped for optimization. First validator that both matches
 * the type and passes validation wins.
 *
 * @example
 * ```ts
 * // Accept email or username
 * const identifier = v.union([
 *   v.string().email(),
 *   v.string().alphanumeric().min(3).max(20)
 * ]);
 *
 * // Accept different types
 * const customValue = v.union([
 *   v.string().required(),
 *   v.number().required(),
 *   v.boolean().required(),
 *   v.file().required()
 * ]);
 * ```
 */
export class UnionValidator extends BaseValidator {
  /**
   * Set the validators to try for union validation
   *
   * @param validators - Array of validators to try
   * @param errorMessage - Optional custom error message if all validators fail
   * @returns This validator for chaining
   *
   * @example
   * ```ts
   * new UnionValidator()
   *   .union([v.string(), v.number()], 'Must be string or number');
   * ```
   */
  public union(validators: BaseValidator[], errorMessage?: string) {
    return this.addRule(unionRule, errorMessage, { validators });
  }

  /**
   * @inheritdoc
   *
   * Generates `{ oneOf: [...] }` by mapping each sub-validator to its JSON Schema.
   *
   * @example
   * ```ts
   * v.union([v.string(), v.number()]).toJsonSchema("draft-2020-12")
   * // → { oneOf: [{ type: "string" }, { type: "number" }] }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const opts = getRuleOptions(this.rules, "union");
    const validators = (opts?.validators ?? []) as BaseValidator[];

    return {
      oneOf: validators.map(v => v.toJsonSchema(target)),
    };
  }
}
