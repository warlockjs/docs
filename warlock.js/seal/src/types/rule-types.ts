import type { SchemaContext } from "./context-types";

/**
 * Rule validation result
 */
export type RuleResult =
  | {
      isValid: false;
      error: string;
      input: string;
      path: string;
    }
  | {
      isValid: true;
    };

type AttributeValue = string | number;

export type ValidationAttributesList = Record<
  string,
  AttributeValue | Record<string, AttributeValue>
>;

/**
 * Rule options - generic options passed to rules
 */
export type SchemaRuleOptions<T = any> = Record<string, T>;

/**
 * Schema rule definition
 */
export type SchemaRule<Options extends SchemaRuleOptions = SchemaRuleOptions> = {
  /** Rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Whether the rule requires a non-undefined value */
  requiresValue?: boolean;
  /** Validation function */
  validate: (
    this: ContextualSchemaRule<Options>,
    value: any,
    context: SchemaContext,
  ) => Promise<RuleResult>;
  /** Default error message */
  defaultErrorMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Sort order for rule execution */
  sortOrder?: number;
};

/**
 * Contextualized schema rule - rule with runtime context
 */
export type ContextualSchemaRule<Options extends SchemaRuleOptions = SchemaRuleOptions> =
  SchemaRule & {
    /**
     * The context object is used to pass additional information to the rule
     * This will be always overridden when the rule is injected into a validator
     */
    context: {
      errorMessage?: string;
      options: Options;
      attributesList: ValidationAttributesList;
      translatedAttributes: Record<string, string>;
      /** Raw placeholder values — substituted as-is (enums, numbers, computed strings) */
      translationParams: Record<string, any>;
      /** Field-key placeholder values — passed through the attribute translator before substitution */
      translatableParams: Record<string, string>;
    };
  };
