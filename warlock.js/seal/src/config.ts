/**
 * Seal Configuration
 *
 * Global configuration for the Seal validation library
 */

import type { AttributeTranslation, RuleTranslation } from "./types";

export type TranslateRuleCallback = (
  ruleTranslation: RuleTranslation,
) => string;

export type TranslateAttributeCallback = (
  attributeTranslation: AttributeTranslation,
) => string;

export type SealConfig = {
  /**
   * Translation function for error messages
   * Default: returns the key with attributes replaced
   */
  translateRule?: TranslateRuleCallback;
  /**
   * Translation function for attribute messages
   */
  translateAttribute?: TranslateAttributeCallback;

  /**
   * Default to first error only in validation
   * Default: true
   */
  firstErrorOnly?: boolean;
};

/**
 * Global Seal configuration
 */
const config: SealConfig = {
  firstErrorOnly: true,
};

/**
 * Configure Seal globally
 *
 * @example
 * ```ts
 * import { configureSeal } from "@warlock.js/seal";
 * import { trans } from "@mongez/localization";
 *
 * configureSeal({
 *   translateRule: (ruleTranslation) => trans(`validation.${ruleTranslation.rule.name}`, ruleTranslation.attributes),
 *   translateAttribute: (attributeTranslation) => trans(`validation.attributes.${attributeTranslation.rule.name}.${attributeTranslation.attribute}`, attributeTranslation.context.allValues),
 * });
 * ```
 */
export function configureSeal(options: Partial<SealConfig>): void {
  Object.assign(config, options);
}

/**
 * Get current Seal configuration
 */
export function getSealConfig(): SealConfig {
  return config;
}

/**
 * Reset configuration to defaults
 */
export function resetSealConfig(): void {
  delete config.translateRule;
  delete config.translateAttribute;

  config.firstErrorOnly = true;
}
