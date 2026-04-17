import { getSealConfig } from "../config";
import type { ContextualSchemaRule, RuleResult, RuleTranslation, SchemaContext } from "../types";

export const VALID_RULE: RuleResult = {
  isValid: true,
};
/**
 * Resolve a single attribute value through the full translation priority chain:
 * 1. attributesList[key]       — developer direct text override (highest priority)
 * 2. translatedAttributes[key] — developer explicit translation key
 * 3. translator(rawValue)      — auto-translate the raw value (fallback)
 *
 * Use this in rule bodies when you need per-item translation
 * (e.g. translating each enum value before joining them).
 *
 * @example
 * // Translate each enum value individually then join
 * const enumList = enumValues
 *   .map(v => resolveTranslation(String(v), String(v), this, context))
 *   .join(", ");
 * this.context.translationParams.enumList = enumList;
 */
export const resolveTranslation = ({
  key,
  rawValue,
  rule,
  context,
}: {
  key: string;
  rawValue: any;
  rule: ContextualSchemaRule;
  context: SchemaContext;
}): string => {
  const translator = getSealConfig().translateAttribute;

  // 1. Direct text override wins
  const direct = rule.context.attributesList?.[key];
  if (direct && typeof direct === "string") return direct;

  if (!translator) return String(rawValue ?? key);

  // 2. Explicit translation key
  const transKey = rule.context.translatedAttributes?.[key];
  if (transKey) return translator({ attribute: transKey, context, rule });

  // 3. Auto-translate the raw value (fallback)
  return translator({ attribute: String(rawValue ?? key), context, rule });
};

// Internal alias — invalidRule uses the same function without re-importing config
const resolveAttribute = resolveTranslation;

export const invalidRule = (rule: ContextualSchemaRule, context: SchemaContext): RuleResult => {
  // `input` is always translatable — rules may add more (e.g., field references in sameAs)
  // Rule-defined translatableParams override the default input if the key matches
  const translatableWithInput: Record<string, string> = {
    // Fall back to "schema" when validating at the root level (no key)
    input: context.key || "schema",
    ...rule.context.translatableParams,
  };

  // Resolve all translatable params through the full priority chain
  const resolvedParams = Object.fromEntries(
    Object.entries(translatableWithInput).map(([key, rawValue]) => [
      key,
      resolveAttribute({ key, rawValue, rule, context }),
    ]),
  );

  const attributes: RuleTranslation["attributes"] = {
    path: context.path,
    key: context.key,
    value: context.value,
    // Raw placeholders (:enumList, :min, :max, etc.) — no translation
    ...rule.context.translationParams,
    // Translated placeholders (:input, :field, etc.) — override raws if key collides
    ...resolvedParams,
    // Satisfy TypeScript's required field (always present via resolvedParams)
    input: resolvedParams.input,
  };

  const rawError =
    rule.context.errorMessage ||
    rule.errorMessage ||
    context.translateRule?.({ rule, context, attributes }) ||
    rule.defaultErrorMessage!;

  // Fallback interpolation: replace :placeholder patterns from attributes
  // This kicks in when translateRule is absent or returns "" (not configured)
  const error = rawError.replace(/:([a-zA-Z_]+)/g, (match, key) =>
    key in attributes ? String(attributes[key as keyof typeof attributes]) : match,
  );

  return {
    isValid: false,
    error,
    input: attributes.input, // use resolved input, not raw context.key (may be "")
    path: context.path,
  };
};
