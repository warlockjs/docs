import { intRule } from "../rules";
import { NumberValidator } from "./number-validator";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * Integer validator class
 */
export class IntValidator extends NumberValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(intRule, errorMessage);
  }

  /**
   * @inheritdoc — returns `{ type: "integer" }` instead of `{ type: "number" }`
   *
   * @example
   * ```ts
   * v.int().min(1).max(100).toJsonSchema("draft-2020-12")
   * // → { type: "integer", minimum: 1, maximum: 100 }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    return this.buildNumberJsonSchema("integer", target);
  }
}
