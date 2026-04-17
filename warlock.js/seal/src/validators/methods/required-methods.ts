import {
  requiredIfAllEmptyRule,
  requiredIfAllNotEmptyRule,
  requiredIfAnyEmptyRule,
  requiredIfAnyNotEmptyRule,
  requiredIfEmptyRule,
  requiredIfInRule,
  requiredIfNotEmptyRule,
  requiredIfNotInRule,
  requiredIfRule,
} from "../../rules/conditional/required-if-rules";
import { requiredUnlessRule } from "../../rules/conditional/required-unless-rules";
import { requiredWhenRule } from "../../rules/conditional/required-when-rule";
import {
  requiredWithAllRule,
  requiredWithAnyRule,
  requiredWithRule,
} from "../../rules/conditional/required-with-rules";
import {
  requiredWithoutAllRule,
  requiredWithoutAnyRule,
  requiredWithoutRule,
} from "../../rules/conditional/required-without-rules";
import { presentRule, requiredRule } from "../../rules/core/required";
import type { SchemaContext } from "../../types";
import { BaseValidator } from "../base-validator";

declare module "../base-validator" {
  interface BaseValidator {
    /**
     * This value must be present and has a value
     */
    required(errorMessage?: string): this;

    /**
     * Value must be present but not necessarily has a value
     */
    present(errorMessage?: string): this;

    /**
     * Mark the field as optional, so pass it if it has no value or has a value
     * Because this is the default behavior, this method is just syntactic sugar
     */
    optional(): this & { isOptional: true };

    /**
     * Value is required if another field exists
     */
    requiredWith(field: string, errorMessage?: string): this;

    /**
     * Value is required if another sibling field exists
     */
    requiredWithSibling(field: string, errorMessage?: string): this;

    /**
     * Value is required if another field is missing
     */
    requiredWithout(field: string, errorMessage?: string): this;

    /**
     * Value is required if another sibling field is missing
     */
    requiredWithoutSibling(field: string, errorMessage?: string): this;

    /**
     * Value is required if another field equals a specific value
     */
    requiredIf(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is required if another sibling field equals a specific value
     */
    requiredIfSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is required unless another field equals a specific value
     */
    requiredUnless(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is required unless another sibling field equals a specific value
     */
    requiredUnlessSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is required if another field is empty
     */
    requiredIfEmpty(field: string, errorMessage?: string): this;

    /**
     * Value is required if another sibling field is empty
     */
    requiredIfEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Value is required if another field is not empty
     */
    requiredIfNotEmpty(field: string, errorMessage?: string): this;

    /**
     * Value is required if another sibling field is not empty
     */
    requiredIfNotEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Value is required if ALL specified fields are empty
     */
    requiredIfAllEmpty(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ALL specified sibling fields are empty
     */
    requiredIfAllEmptySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ANY of the specified fields is empty
     */
    requiredIfAnyEmpty(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ANY of the specified sibling fields is empty
     */
    requiredIfAnyEmptySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ALL specified fields are NOT empty
     */
    requiredIfAllNotEmpty(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ALL specified sibling fields are NOT empty
     */
    requiredIfAllNotEmptySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ANY of the specified fields is NOT empty
     */
    requiredIfAnyNotEmpty(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if ANY of the specified sibling fields is NOT empty
     */
    requiredIfAnyNotEmptySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if another field's value is in the given array
     */
    requiredIfIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is required if another sibling field's value is in the given array
     */
    requiredIfInSibling(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is required if another field's value is NOT in the given array
     */
    requiredIfNotIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is required if another sibling field's value is NOT in the given array
     */
    requiredIfNotInSibling(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is required if all specified fields exist
     */
    requiredWithAll(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if all specified sibling fields exist
     */
    requiredWithAllSiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if all specified fields are missing
     */
    requiredWithoutAll(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if all specified sibling fields are missing
     */
    requiredWithoutAllSiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if any of the specified fields exists
     */
    requiredWithAny(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if any of the specified sibling fields exists
     */
    requiredWithAnySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if any of the specified fields is missing
     */
    requiredWithoutAny(fields: string[], errorMessage?: string): this;

    /**
     * Value is required if any of the specified sibling fields is missing
     */
    requiredWithoutAnySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Make this field required based on a custom callback.
     *
     * The callback receives only the `SchemaContext` (not the value),
     * because "required" is about surrounding conditions, not the field itself.
     * Return `true` if the field should be required.
     *
     * @param callback - Receives SchemaContext, returns boolean
     * @param errorMessage - Optional custom error message
     *
     * @example
     * ```ts
     * // Required when email notification is enabled
     * v.string().requiredWhen((context) => {
     *   return context.allData.notificationMethod === 'email';
     * })
     *
     * // Required based on multiple conditions
     * v.string().requiredWhen((context) => {
     *   const { role, department } = context.allData;
     *   return role === 'manager' && department === 'finance';
     * })
     * ```
     */
    requiredWhen(
      callback: (context: SchemaContext) => boolean | Promise<boolean>,
      errorMessage?: string,
    ): this;
  }
}

// ==================== UNCONDITIONAL STATES ====================

/**
 * This value must be present and has a value
 */
BaseValidator.prototype.required = function (errorMessage?: string) {
  return this.setRequiredRule(requiredRule, errorMessage);
};

/**
 * Value must be present but not necessarily has a value
 */
BaseValidator.prototype.present = function (errorMessage?: string) {
  return this.setRequiredRule(presentRule, errorMessage);
};

/**
 * Mark the field as optional — it may be absent or empty without validation errors.
 * Clears any previously set required rule.
 *
 * The return type is branded with `{ isOptional: true }` so schema inference
 * can mark this key as optional in the inferred TypeScript type.
 */
BaseValidator.prototype.optional = function (): BaseValidator & { isOptional: true } {
  const instance = this.instance;
  instance.isOptional = true;
  instance.requiredRule = null;
  return instance as BaseValidator & { isOptional: true };
};

// ==================== REQUIRED: BASED ON FIELD PRESENCE ====================

/**
 * Value is required if another field exists
 */
BaseValidator.prototype.requiredWith = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredWithRule, errorMessage, { field, scope: "global" });
};

/**
 * Value is required if another sibling field exists
 */
BaseValidator.prototype.requiredWithSibling = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredWithRule, errorMessage, { field, scope: "sibling" });
};

/**
 * Value is required if another field is missing
 */
BaseValidator.prototype.requiredWithout = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredWithoutRule, errorMessage, { field, scope: "global" });
};

/**
 * Value is required if another sibling field is missing
 */
BaseValidator.prototype.requiredWithoutSibling = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredWithoutRule, errorMessage, { field, scope: "sibling" });
};

// ==================== REQUIRED: BASED ON FIELD VALUE ====================

/**
 * Value is required if another field equals a specific value
 */
BaseValidator.prototype.requiredIf = function (field: string, value: any, errorMessage?: string) {
  return this.setRequiredRule(requiredIfRule, errorMessage, { field, value, scope: "global" });
};

/**
 * Value is required if another sibling field equals a specific value
 */
BaseValidator.prototype.requiredIfSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfRule, errorMessage, { field, value, scope: "sibling" });
};

/**
 * Value is required unless another field equals a specific value
 */
BaseValidator.prototype.requiredUnless = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredUnlessRule, errorMessage, { field, value, scope: "global" });
};

/**
 * Value is required unless another sibling field equals a specific value
 */
BaseValidator.prototype.requiredUnlessSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredUnlessRule, errorMessage, { field, value, scope: "sibling" });
};

// ==================== REQUIRED: BASED ON FIELD EMPTY STATE ====================

/**
 * Value is required if another field is empty
 */
BaseValidator.prototype.requiredIfEmpty = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredIfEmptyRule, errorMessage, { field, scope: "global" });
};

/**
 * Value is required if another sibling field is empty
 */
BaseValidator.prototype.requiredIfEmptySibling = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredIfEmptyRule, errorMessage, { field, scope: "sibling" });
};

/**
 * Value is required if another field is not empty
 */
BaseValidator.prototype.requiredIfNotEmpty = function (field: string, errorMessage?: string) {
  return this.setRequiredRule(requiredIfNotEmptyRule, errorMessage, { field, scope: "global" });
};

/**
 * Value is required if another sibling field is not empty
 */
BaseValidator.prototype.requiredIfNotEmptySibling = function (
  field: string,
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfNotEmptyRule, errorMessage, { field, scope: "sibling" });
};

// ==================== REQUIRED: BASED ON MULTIPLE FIELDS EMPTY STATE ====================

/**
 * Value is required if ALL specified fields are empty
 */
BaseValidator.prototype.requiredIfAllEmpty = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredIfAllEmptyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if ALL specified sibling fields are empty
 */
BaseValidator.prototype.requiredIfAllEmptySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfAllEmptyRule, errorMessage, { fields, scope: "sibling" });
};

/**
 * Value is required if ANY of the specified fields is empty
 */
BaseValidator.prototype.requiredIfAnyEmpty = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredIfAnyEmptyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if ANY of the specified sibling fields is empty
 */
BaseValidator.prototype.requiredIfAnyEmptySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfAnyEmptyRule, errorMessage, { fields, scope: "sibling" });
};

/**
 * Value is required if ALL specified fields are NOT empty
 */
BaseValidator.prototype.requiredIfAllNotEmpty = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredIfAllNotEmptyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if ALL specified sibling fields are NOT empty
 */
BaseValidator.prototype.requiredIfAllNotEmptySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfAllNotEmptyRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};

/**
 * Value is required if ANY of the specified fields is NOT empty
 */
BaseValidator.prototype.requiredIfAnyNotEmpty = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredIfAnyNotEmptyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if ANY of the specified sibling fields is NOT empty
 */
BaseValidator.prototype.requiredIfAnyNotEmptySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfAnyNotEmptyRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};

/**
 * Value is required if another field's value is in the given array
 */
BaseValidator.prototype.requiredIfIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfInRule, errorMessage, { field, values, scope: "global" });
};

/**
 * Value is required if another sibling field's value is in the given array
 */
BaseValidator.prototype.requiredIfInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfInRule, errorMessage, { field, values, scope: "sibling" });
};

/**
 * Value is required if another field's value is NOT in the given array
 */
BaseValidator.prototype.requiredIfNotIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfNotInRule, errorMessage, {
    field,
    values,
    scope: "global",
  });
};

/**
 * Value is required if another sibling field's value is NOT in the given array
 */
BaseValidator.prototype.requiredIfNotInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredIfNotInRule, errorMessage, {
    field,
    values,
    scope: "sibling",
  });
};

// ==================== REQUIRED: BASED ON MULTIPLE FIELDS (ALL) ====================

/**
 * Value is required if all specified fields exist
 */
BaseValidator.prototype.requiredWithAll = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredWithAllRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if all specified sibling fields exist
 */
BaseValidator.prototype.requiredWithAllSiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredWithAllRule, errorMessage, { fields, scope: "sibling" });
};

/**
 * Value is required if all specified fields are missing
 */
BaseValidator.prototype.requiredWithoutAll = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredWithoutAllRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if all specified sibling fields are missing
 */
BaseValidator.prototype.requiredWithoutAllSiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredWithoutAllRule, errorMessage, { fields, scope: "sibling" });
};

// ==================== REQUIRED: BASED ON MULTIPLE FIELDS (ANY) ====================

/**
 * Value is required if any of the specified fields exists
 */
BaseValidator.prototype.requiredWithAny = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredWithAnyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if any of the specified sibling fields exists
 */
BaseValidator.prototype.requiredWithAnySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredWithAnyRule, errorMessage, { fields, scope: "sibling" });
};

/**
 * Value is required if any of the specified fields is missing
 */
BaseValidator.prototype.requiredWithoutAny = function (fields: string[], errorMessage?: string) {
  return this.setRequiredRule(requiredWithoutAnyRule, errorMessage, { fields, scope: "global" });
};

/**
 * Value is required if any of the specified sibling fields is missing
 */
BaseValidator.prototype.requiredWithoutAnySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredWithoutAnyRule, errorMessage, { fields, scope: "sibling" });
};

// ==================== REQUIRED: BASED ON CUSTOM CALLBACK ====================

/**
 * Make this field required based on a custom callback.
 * Callback receives only SchemaContext — the framework handles empty-value checking.
 */
BaseValidator.prototype.requiredWhen = function (
  callback: (context: SchemaContext) => boolean | Promise<boolean>,
  errorMessage?: string,
) {
  return this.setRequiredRule(requiredWhenRule, errorMessage, { callback });
};
