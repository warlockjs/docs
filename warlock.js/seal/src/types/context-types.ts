import type { SchemaRule } from "./rule-types";
import type { Schema } from "./schema-types";

export type RuleTranslation = {
  rule: SchemaRule;
  context: SchemaContext;
  attributes: {
    input: string;
    path: string;
    key: string;
    value: any;
    [key: string]: any;
  };
};

export type AttributeTranslation = {
  attribute: string;
  context: SchemaContext;
  rule: SchemaRule;
};

/**
 * Validation context passed to validators and rules
 */
export type SchemaContext = {
  /** All input values */
  allValues: any;
  /** Parent object if nested */
  parent: any;
  /** Current value being validated */
  value: any;
  /** Current key */
  key: string;
  /** Full path to the current value */
  path: string;
  /** Schema definition if object validator */
  schema?: Schema;
  /** Additional context */
  context?: Record<string, any>;
  /** Root context */
  rootContext?: Record<string, any>;
  /** Translation function for error messages */
  translateRule: (ruleTranslation: RuleTranslation) => string;
  translateAttribute: (attributeTranslation: AttributeTranslation) => string;
  /** Validation configurations */
  configurations?: {
    firstErrorOnly?: boolean;
  };
};
