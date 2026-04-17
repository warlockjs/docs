import { get } from "@mongez/reinforcements";
import type { ContextualSchemaRule, SchemaContext } from "../types";

/**
 * Get field value based on scope from rule options
 *
 * This utility extracts a field value from either the global context or sibling context
 * based on the `scope` option in the rule's context.
 *
 * @param rule - The contextual schema rule containing options with:
 *   - `field` (or custom fieldKey): The field name to extract
 *   - `scope` (optional): Either "global" (default) or "sibling"
 * @param context - The schema validation context containing allValues and parent
 * @param fieldKey - The key in rule.context.options that contains the field name (defaults to "field")
 *
 * @returns The value of the specified field from the appropriate source
 *
 * @example
 * // In a validation rule with scope support:
 * async validate(value: any, context) {
 *   const otherFieldValue = getFieldValue(this, context);
 *   // Extracts from context.allValues if scope is "global"
 *   // Extracts from context.parent if scope is "sibling"
 * }
 *
 * @example
 * // Using a custom field key:
 * async validate(value: any, context) {
 *   const compareValue = getFieldValue(this, context, "compareField");
 *   // Looks for rule.context.options.compareField instead of .field
 * }
 *
 * @remarks
 * - **Global scope** (`scope: "global"`): Searches the entire input data (context.allValues)
 * - **Sibling scope** (`scope: "sibling"`): Searches only within the parent object (context.parent)
 * - Uses `@mongez/reinforcements.get()` to support nested paths (e.g., "user.email")
 */
export function getFieldValue(
  rule: ContextualSchemaRule,
  context: SchemaContext,
  fieldKey = "field",
) {
  const field = rule.context.options[fieldKey];
  const scope = rule.context.options.scope || "global";
  const source = scope === "sibling" ? context.parent : context.allValues;
  return get(source, field);
}
