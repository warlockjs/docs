import {
  forbiddenIfEmptyRule,
  forbiddenIfInRule,
  forbiddenIfNotEmptyRule,
  forbiddenIfNotInRule,
  forbiddenIfNotRule,
  forbiddenIfRule,
} from "../../rules/conditional/forbidden-if-rules";
import { forbiddenRule } from "../../rules/core/forbidden";
import { BaseValidator } from "../base-validator";

declare module "../base-validator" {
  interface BaseValidator {
    /**
     * Value is forbidden to be present
     */
    forbidden(errorMessage?: string): this;

    /**
     * Value is forbidden if another field equals a specific value (global scope)
     */
    forbiddenIf(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is forbidden if another field equals a specific value (sibling scope)
     */
    forbiddenIfSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is forbidden if another field does NOT equal a specific value (global scope)
     */
    forbiddenIfNot(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is forbidden if another field does NOT equal a specific value (sibling scope)
     */
    forbiddenIfNotSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Value is forbidden if another field is empty (global scope)
     */
    forbiddenIfEmpty(field: string, errorMessage?: string): this;

    /**
     * Value is forbidden if another field is empty (sibling scope)
     */
    forbiddenIfEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Value is forbidden if another field is not empty (global scope)
     */
    forbiddenIfNotEmpty(field: string, errorMessage?: string): this;

    /**
     * Value is forbidden if another field is not empty (sibling scope)
     */
    forbiddenIfNotEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Value is forbidden if another field's value is in the given array (global scope)
     */
    forbiddenIfIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is forbidden if another field's value is in the given array (sibling scope)
     */
    forbiddenIfInSibling(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is forbidden if another field's value is NOT in the given array (global scope)
     */
    forbiddenIfNotIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Value is forbidden if another field's value is NOT in the given array (sibling scope)
     */
    forbiddenIfNotInSibling(field: string, values: any[], errorMessage?: string): this;
  }
}

/**
 * Value is forbidden to be present
 */
BaseValidator.prototype.forbidden = function (errorMessage?: string) {
  return this.addRule(forbiddenRule, errorMessage);
};

/**
 * Value is forbidden if another field equals a specific value (global scope)
 */
BaseValidator.prototype.forbiddenIf = function (field: string, value: any, errorMessage?: string) {
  return this.addRule(forbiddenIfRule, errorMessage, {
    field,
    value,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field equals a specific value (sibling scope)
 */
BaseValidator.prototype.forbiddenIfSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfRule, errorMessage, {
    field,
    value,
    scope: "sibling",
  });
};

/**
 * Value is forbidden if another field does NOT equal a specific value (global scope)
 */
BaseValidator.prototype.forbiddenIfNot = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfNotRule, errorMessage, {
    field,
    value,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field does NOT equal a specific value (sibling scope)
 */
BaseValidator.prototype.forbiddenIfNotSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfNotRule, errorMessage, {
    field,
    value,
    scope: "sibling",
  });
};

/**
 * Value is forbidden if another field is empty (global scope)
 */
BaseValidator.prototype.forbiddenIfEmpty = function (field: string, errorMessage?: string) {
  return this.addRule(forbiddenIfEmptyRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field is empty (sibling scope)
 */
BaseValidator.prototype.forbiddenIfEmptySibling = function (field: string, errorMessage?: string) {
  return this.addRule(forbiddenIfEmptyRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Value is forbidden if another field is not empty (global scope)
 */
BaseValidator.prototype.forbiddenIfNotEmpty = function (field: string, errorMessage?: string) {
  return this.addRule(forbiddenIfNotEmptyRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field is not empty (sibling scope)
 */
BaseValidator.prototype.forbiddenIfNotEmptySibling = function (
  field: string,
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfNotEmptyRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Value is forbidden if another field's value is in the given array (global scope)
 */
BaseValidator.prototype.forbiddenIfIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfInRule, errorMessage, {
    field,
    values,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field's value is in the given array (sibling scope)
 */
BaseValidator.prototype.forbiddenIfInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfInRule, errorMessage, {
    field,
    values,
    scope: "sibling",
  });
};

/**
 * Value is forbidden if another field's value is NOT in the given array (global scope)
 */
BaseValidator.prototype.forbiddenIfNotIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfNotInRule, errorMessage, {
    field,
    values,
    scope: "global",
  });
};

/**
 * Value is forbidden if another field's value is NOT in the given array (sibling scope)
 */
BaseValidator.prototype.forbiddenIfNotInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(forbiddenIfNotInRule, errorMessage, {
    field,
    values,
    scope: "sibling",
  });
};
