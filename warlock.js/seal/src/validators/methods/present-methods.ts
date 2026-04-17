import {
  presentIfEmptyRule,
  presentIfInRule,
  presentIfNotEmptyRule,
  presentIfNotInRule,
  presentIfRule,
} from "../../rules/conditional/present-if-rules";
import { presentUnlessRule } from "../../rules/conditional/present-unless-rules";
import {
  presentWithAllRule,
  presentWithAnyRule,
  presentWithRule,
} from "../../rules/conditional/present-with-rules";
import {
  presentWithoutAllRule,
  presentWithoutAnyRule,
  presentWithoutRule,
} from "../../rules/conditional/present-without-rules";
import { BaseValidator } from "../base-validator";

declare module "../base-validator" {
  interface BaseValidator {
    /**
     * Field must be present if another field exists
     */
    presentWith(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another sibling field exists
     */
    presentWithSibling(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another field is missing
     */
    presentWithout(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another sibling field is missing
     */
    presentWithoutSibling(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another field equals a specific value
     */
    presentIf(field: string, value: any, errorMessage?: string): this;

    /**
     * Field must be present if another sibling field equals a specific value
     */
    presentIfSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Field must be present unless another field equals a specific value
     */
    presentUnless(field: string, value: any, errorMessage?: string): this;

    /**
     * Field must be present unless another sibling field equals a specific value
     */
    presentUnlessSibling(field: string, value: any, errorMessage?: string): this;

    /**
     * Field must be present if another field is empty
     */
    presentIfEmpty(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another sibling field is empty
     */
    presentIfEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another field is not empty
     */
    presentIfNotEmpty(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another sibling field is not empty
     */
    presentIfNotEmptySibling(field: string, errorMessage?: string): this;

    /**
     * Field must be present if another field's value is in the given array
     */
    presentIfIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Field must be present if another sibling field's value is in the given array
     */
    presentIfInSibling(field: string, values: any[], errorMessage?: string): this;

    /**
     * Field must be present if another field's value is NOT in the given array
     */
    presentIfNotIn(field: string, values: any[], errorMessage?: string): this;

    /**
     * Field must be present if another sibling field's value is NOT in the given array
     */
    presentIfNotInSibling(field: string, values: any[], errorMessage?: string): this;

    /**
     * Field must be present if all specified fields exist
     */
    presentWithAll(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if all specified sibling fields exist
     */
    presentWithAllSiblings(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if all specified fields are missing
     */
    presentWithoutAll(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if all specified sibling fields are missing
     */
    presentWithoutAllSiblings(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if any of the specified fields exists
     */
    presentWithAny(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if any of the specified sibling fields exists
     */
    presentWithAnySiblings(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if any of the specified fields is missing
     */
    presentWithoutAny(fields: string[], errorMessage?: string): this;

    /**
     * Field must be present if any of the specified sibling fields is missing
     */
    presentWithoutAnySiblings(fields: string[], errorMessage?: string): this;
  }
}

// ==================== PRESENT: BASED ON FIELD PRESENCE ====================

/**
 * Field must be present if another field exists
 */
BaseValidator.prototype.presentWith = function (field: string, errorMessage?: string) {
  return this.addRule(presentWithRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field exists
 */
BaseValidator.prototype.presentWithSibling = function (field: string, errorMessage?: string) {
  return this.addRule(presentWithRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Field must be present if another field is missing
 */
BaseValidator.prototype.presentWithout = function (field: string, errorMessage?: string) {
  return this.addRule(presentWithoutRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field is missing
 */
BaseValidator.prototype.presentWithoutSibling = function (field: string, errorMessage?: string) {
  return this.addRule(presentWithoutRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

// ==================== PRESENT: BASED ON FIELD VALUE ====================

/**
 * Field must be present if another field equals a specific value
 */
BaseValidator.prototype.presentIf = function (field: string, value: any, errorMessage?: string) {
  return this.addRule(presentIfRule, errorMessage, {
    field,
    value,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field equals a specific value
 */
BaseValidator.prototype.presentIfSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(presentIfRule, errorMessage, {
    field,
    value,
    scope: "sibling",
  });
};

/**
 * Field must be present unless another field equals a specific value
 */
BaseValidator.prototype.presentUnless = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(presentUnlessRule, errorMessage, {
    field,
    value,
    scope: "global",
  });
};

/**
 * Field must be present unless another sibling field equals a specific value
 */
BaseValidator.prototype.presentUnlessSibling = function (
  field: string,
  value: any,
  errorMessage?: string,
) {
  return this.addRule(presentUnlessRule, errorMessage, {
    field,
    value,
    scope: "sibling",
  });
};

// ==================== PRESENT: BASED ON FIELD EMPTY STATE ====================

/**
 * Field must be present if another field is empty
 */
BaseValidator.prototype.presentIfEmpty = function (field: string, errorMessage?: string) {
  return this.addRule(presentIfEmptyRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field is empty
 */
BaseValidator.prototype.presentIfEmptySibling = function (field: string, errorMessage?: string) {
  return this.addRule(presentIfEmptyRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Field must be present if another field is not empty
 */
BaseValidator.prototype.presentIfNotEmpty = function (field: string, errorMessage?: string) {
  return this.addRule(presentIfNotEmptyRule, errorMessage, {
    field,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field is not empty
 */
BaseValidator.prototype.presentIfNotEmptySibling = function (field: string, errorMessage?: string) {
  return this.addRule(presentIfNotEmptyRule, errorMessage, {
    field,
    scope: "sibling",
  });
};

/**
 * Field must be present if another field's value is in the given array
 */
BaseValidator.prototype.presentIfIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(presentIfInRule, errorMessage, {
    field,
    values,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field's value is in the given array
 */
BaseValidator.prototype.presentIfInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(presentIfInRule, errorMessage, {
    field,
    values,
    scope: "sibling",
  });
};

/**
 * Field must be present if another field's value is NOT in the given array
 */
BaseValidator.prototype.presentIfNotIn = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(presentIfNotInRule, errorMessage, {
    field,
    values,
    scope: "global",
  });
};

/**
 * Field must be present if another sibling field's value is NOT in the given array
 */
BaseValidator.prototype.presentIfNotInSibling = function (
  field: string,
  values: any[],
  errorMessage?: string,
) {
  return this.addRule(presentIfNotInRule, errorMessage, {
    field,
    values,
    scope: "sibling",
  });
};

// ==================== PRESENT: BASED ON MULTIPLE FIELDS (ALL) ====================

/**
 * Field must be present if all specified fields exist
 */
BaseValidator.prototype.presentWithAll = function (fields: string[], errorMessage?: string) {
  return this.addRule(presentWithAllRule, errorMessage, {
    fields,
    scope: "global",
  });
};

/**
 * Field must be present if all specified sibling fields exist
 */
BaseValidator.prototype.presentWithAllSiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.addRule(presentWithAllRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};

/**
 * Field must be present if all specified fields are missing
 */
BaseValidator.prototype.presentWithoutAll = function (fields: string[], errorMessage?: string) {
  return this.addRule(presentWithoutAllRule, errorMessage, {
    fields,
    scope: "global",
  });
};

/**
 * Field must be present if all specified sibling fields are missing
 */
BaseValidator.prototype.presentWithoutAllSiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.addRule(presentWithoutAllRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};

// ==================== PRESENT: BASED ON MULTIPLE FIELDS (ANY) ====================

/**
 * Field must be present if any of the specified fields exists
 */
BaseValidator.prototype.presentWithAny = function (fields: string[], errorMessage?: string) {
  return this.addRule(presentWithAnyRule, errorMessage, {
    fields,
    scope: "global",
  });
};

/**
 * Field must be present if any of the specified sibling fields exists
 */
BaseValidator.prototype.presentWithAnySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.addRule(presentWithAnyRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};

/**
 * Field must be present if any of the specified fields is missing
 */
BaseValidator.prototype.presentWithoutAny = function (fields: string[], errorMessage?: string) {
  return this.addRule(presentWithoutAnyRule, errorMessage, {
    fields,
    scope: "global",
  });
};

/**
 * Field must be present if any of the specified sibling fields is missing
 */
BaseValidator.prototype.presentWithoutAnySiblings = function (
  fields: string[],
  errorMessage?: string,
) {
  return this.addRule(presentWithoutAnyRule, errorMessage, {
    fields,
    scope: "sibling",
  });
};
