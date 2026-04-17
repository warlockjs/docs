import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";
import { applyNullable } from "../standard-schema/json-schema";
import { BaseValidator } from "./base-validator";

/**
 * Any validator - accepts any value
 */
export class AnyValidator extends BaseValidator {
  /**
   * Any validator means any value, so we disable the default required requirement.
   */
  public override requiredRule = null;

  /**
   * Set is optional to be true
   */
  public override isOptional = true;

  /**
   * @inheritdoc
   *
   * Any validator accepts anything. In JSON Schema, an empty object `{}`
   * is the permissive schema that accepts any valid JSON value.
   *
   * @example
   * ```ts
   * v.any().toJsonSchema("draft-2020-12")
   * // → {}
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = {};
    if (this.isNullable) applyNullable(schema, target);
    return schema;
  }
}
