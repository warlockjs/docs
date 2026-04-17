import type { StandardJSONSchemaV1 } from "./types";

/**
 * Supported JSON Schema generation targets.
 */
export type JsonSchemaTarget = StandardJSONSchemaV1.Target;

/**
 * The result shape for a generated JSON Schema.
 */
export type JsonSchemaResult = Record<string, unknown>;

/**
 * Apply nullable to a JSON Schema object based on the target dialect.
 *
 * - draft-2020-12  : `type` becomes an array: `["string", "null"]`
 * - openai-strict  : same as draft-2020-12 (type array form)
 * - draft-07       : wraps in `oneOf: [{ ...schema }, { type: "null" }]`
 * - openapi-3.0    : adds `nullable: true` alongside the existing type
 *
 * Mutates the schema in-place.
 *
 * @example
 * ```ts
 * const schema = { type: "string" };
 * applyNullable(schema, "draft-2020-12");
 * // → { type: ["string", "null"] }
 * ```
 */
export function applyNullable(schema: JsonSchemaResult, target: JsonSchemaTarget): void {
  if (target === "openapi-3.0") {
    schema.nullable = true;
    return;
  }

  if (target === "draft-2020-12" || target === "openai-strict") {
    const baseType = schema.type as string | string[] | undefined;
    schema.type = Array.isArray(baseType)
      ? [...baseType, "null"]
      : [baseType as string, "null"];
    return;
  }

  // draft-07: oneOf wrapping
  const copy = { ...schema };
  for (const key of Object.keys(schema)) {
    delete schema[key];
  }
  schema.oneOf = [copy, { type: "null" }];
}

/**
 * Wrap a field schema as nullable for OpenAI strict mode.
 *
 * OpenAI strict requires optional fields to be expressed as a nullable type
 * rather than being omitted from the `required` array. This helper wraps a
 * given schema into its nullable equivalent using the type-array form.
 *
 * Unlike `applyNullable()` (which mutates in-place), this returns a new
 * schema object to avoid side effects when wrapping child schemas.
 *
 * @example
 * ```ts
 * wrapNullableStrict({ type: "string", minLength: 3 })
 * // → { type: ["string", "null"], minLength: 3 }
 *
 * wrapNullableStrict({ type: "object", properties: {...} })
 * // → { type: ["object", "null"], properties: {...} }
 *
 * wrapNullableStrict({ oneOf: [...] })
 * // → { oneOf: [..., { type: "null" }] }
 * ```
 */
export function wrapNullableStrict(schema: JsonSchemaResult): JsonSchemaResult {
  // If the schema uses oneOf/anyOf (e.g. union), append null to the list
  if (schema.oneOf) {
    return { ...schema, oneOf: [...(schema.oneOf as unknown[]), { type: "null" }] };
  }

  if (schema.anyOf) {
    return { ...schema, anyOf: [...(schema.anyOf as unknown[]), { type: "null" }] };
  }

  // If there's no type at all (permissive `{}`), stay permissive
  if (schema.type === undefined) {
    return schema;
  }

  // Standard case: wrap type into array with null
  const baseType = schema.type as string | string[];
  return {
    ...schema,
    type: Array.isArray(baseType) ? [...baseType, "null"] : [baseType, "null"],
  };
}

/**
 * Find the first rule matching the given name in a rules array,
 * and return its options bag.
 */
export function getRuleOptions(
  rules: Array<{ name: string; context: { options: Record<string, unknown> } }>,
  ruleName: string,
): Record<string, unknown> | undefined {
  const rule = rules.find(r => r.name === ruleName);
  return rule?.context?.options as Record<string, unknown> | undefined;
}
