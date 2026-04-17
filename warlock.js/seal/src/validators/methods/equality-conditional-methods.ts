import { equalsFieldRule, notEqualsFieldRule } from "../../rules";
import { equalRule } from "../../rules/core/equal";
import { whenRule } from "../../rules/core/when";
import type { WhenRuleOptions } from "../../types";
import { BaseValidator } from "../base-validator";

declare module "../base-validator" {
  interface BaseValidator {
    /**
     * Value must be equal to the given value
     */
    equal(value: any, errorMessage?: string): this;

    /**
     * Value must be the same as another field's value
     */
    sameAs(field: string, errorMessage?: string): this;

    /**
     * Value must be the same as another sibling field's value
     */
    sameAsSibling(field: string, errorMessage?: string): this;

    /**
     * Value must be different from another field's value
     */
    differentFrom(field: string, errorMessage?: string): this;

    /**
     * Value must be different from another sibling field's value
     */
    differentFromSibling(field: string, errorMessage?: string): this;

    /**
     * Apply different validation rules based on another field's value (global scope)
     *
     * Use this when you need to apply completely different validators
     * based on another field's value (not just required/optional).
     *
     * @param field - Field name to check (can be nested with dot notation)
     * @param options - Validation options per field value
     *
     * @example
     * ```ts
     * // Different allowed values based on user type
     * v.object({
     *   userType: v.string().in(['admin', 'user']),
     *   role: v.string().when('userType', {
     *     is: {
     *       admin: v.string().in(['super', 'moderator']),
     *       user: v.string().in(['member', 'guest'])
     *     },
     *     otherwise: v.string().optional()
     *   })
     * })
     *
     * // Different validation rules based on type
     * v.object({
     *   contactType: v.string().in(['email', 'phone']),
     *   contact: v.string().when('contactType', {
     *     is: {
     *       email: v.string().email(),
     *       phone: v.string().pattern(/^\d{10}$/)
     *     }
     *   })
     * })
     * ```
     * @category Conditional Validation
     */
    when(field: string, options: Omit<WhenRuleOptions, "field" | "scope">): this;

    /**
     * Apply different validation rules based on sibling field's value
     *
     * Use this for nested objects where you need to check a field
     * within the same parent object.
     *
     * @param siblingField - Sibling field name to check
     * @param options - Validation options per field value
     *
     * @example
     * ```ts
     * // Array of users with role-based permissions
     * v.array(v.object({
     *   userType: v.string().in(['admin', 'user']),
     *   permissions: v.string().whenSibling('userType', {
     *     is: {
     *       admin: v.string().in(['read', 'write', 'delete']),
     *       user: v.string().in(['read'])
     *     }
     *   })
     * }))
     * ```
     * @category Conditional Validation
     */
    whenSibling(siblingField: string, options: Omit<WhenRuleOptions, "field" | "scope">): this;
  }
}

/**
 * Value must be equal to the given value
 */
BaseValidator.prototype.equal = function (value: any, errorMessage?: string) {
  return this.addRule(equalRule, errorMessage, { value });
};

/**
 * Value must be the same as another field's value
 */
BaseValidator.prototype.sameAs = function (field: string, errorMessage?: string) {
  return this.addRule(equalsFieldRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Value must be the same as another sibling field's value
 */
BaseValidator.prototype.sameAsSibling = function (field: string, errorMessage?: string) {
  return this.addRule(equalsFieldRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Value must be different from another field's value
 */
BaseValidator.prototype.differentFrom = function (field: string, errorMessage?: string) {
  return this.addRule(notEqualsFieldRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Value must be different from another sibling field's value
 */
BaseValidator.prototype.differentFromSibling = function (field: string, errorMessage?: string) {
  return this.addRule(notEqualsFieldRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Apply different validation rules based on another field's value (global scope)
 *
 * Use this when you need to apply completely different validators
 * based on another field's value (not just required/optional).
 *
 * @param field - Field name to check (can be nested with dot notation)
 * @param options - Validation options per field value
 *
 * @example
 * ```ts
 * // Different allowed values based on user type
 * v.object({
 *   userType: v.string().in(['admin', 'user']),
 *   role: v.string().when('userType', {
 *     is: {
 *       admin: v.string().in(['super', 'moderator']),
 *       user: v.string().in(['member', 'guest'])
 *     },
 *     otherwise: v.string().optional()
 *   })
 * })
 *
 * // Different validation rules based on type
 * v.object({
 *   contactType: v.string().in(['email', 'phone']),
 *   contact: v.string().when('contactType', {
 *     is: {
 *       email: v.string().email(),
 *       phone: v.string().pattern(/^\d{10}$/)
 *     }
 *   })
 * })
 * ```
 * @category Conditional Validation
 */
BaseValidator.prototype.when = function (
  field: string,
  options: Omit<WhenRuleOptions, "field" | "scope">,
) {
  return this.addRule(whenRule, undefined, {
    field,
    is: options.is,
    otherwise: options.otherwise,
    scope: "global",
  });
};

/**
 * Apply different validation rules based on sibling field's value
 *
 * Use this for nested objects where you need to check a field
 * within the same parent object.
 *
 * @param siblingField - Sibling field name to check
 * @param options - Validation options per field value
 *
 * @example
 * ```ts
 * // Array of users with role-based permissions
 * v.array(v.object({
 *   userType: v.string().in(['admin', 'user']),
 *   permissions: v.string().whenSibling('userType', {
 *     is: {
 *       admin: v.string().in(['read', 'write', 'delete']),
 *       user: v.string().in(['read'])
 *     }
 *   })
 * }))
 * ```
 * @category Conditional Validation
 */
BaseValidator.prototype.whenSibling = function (
  siblingField: string,
  options: Omit<WhenRuleOptions, "field" | "scope">,
) {
  return this.addRule(whenRule, undefined, {
    field: siblingField,
    is: options.is,
    otherwise: options.otherwise,
    scope: "sibling",
  });
};
