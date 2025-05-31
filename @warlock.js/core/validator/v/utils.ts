import { plainConverter } from "@mongez/localization";
import type { ContextualSchemaRule, RuleResult, SchemaContext } from "./types";

export const VALID_RULE: RuleResult = {
  isValid: true,
};

export const invalidRule = (
  rule: ContextualSchemaRule,
  context: SchemaContext,
): RuleResult => {
  const attributes = { ...rule.context.options, ...context.allValues };

  // attributes.input = context.key;
  attributes.input = context.path;
  attributes.path = context.path;
  attributes.key = context.key;
  attributes.field = context.key;
  attributes.value = context.value;

  const error =
    rule.context.errorMessage ||
    rule.errorMessage ||
    context.translator?.(rule.name, attributes) ||
    rule.defaultErrorMessage!;

  return {
    isValid: false,
    error:
      error === `validation.${rule.name}` && rule.defaultErrorMessage
        ? plainConverter(rule.defaultErrorMessage, attributes)
        : error,
    input: context.key,
    path: context.path,
  };
};

export const setKeyPath = (path: string, key: string) => {
  if (!path) return key;

  return `${path}.${key}`;
};
