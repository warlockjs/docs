import type { BaseValidator } from "../validators/base-validator";

/**
 * Options for conditional when rule
 */
export type WhenRuleOptions = {
  /** Field name to check */
  field: string;
  /** Map of field values to validators */
  is: Record<string, BaseValidator>;
  /** Fallback validator if no condition matches */
  otherwise?: BaseValidator;
  /** Whether to check in global context or sibling context (default: "global") */
  scope?: "global" | "sibling";
};
