import { isObject, isPlainObject } from "@mongez/supportive-is";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * String rule - validates string type
 */
export const stringRule: SchemaRule = {
  name: "string",
  defaultErrorMessage: "The :input must be a string",
  async validate(value: any, context) {
    if (typeof value === "string") {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Number rule - validates number type
 */
export const numberRule: SchemaRule = {
  name: "number",
  defaultErrorMessage: "The :input must be a number",
  async validate(value: any, context) {
    if (typeof value === "number") {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Boolean rule - validates boolean type
 */
export const booleanRule: SchemaRule = {
  name: "boolean",
  defaultErrorMessage: "The :input must be a boolean",
  async validate(value: any, context) {
    if (typeof value === "boolean") {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Int rule - validates integer type
 */
export const intRule: SchemaRule = {
  name: "int",
  defaultErrorMessage: "The :input must be an integer",
  async validate(value: any, context) {
    if (Number.isInteger(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Float rule - validates float type
 */
export const floatRule: SchemaRule = {
  name: "float",
  defaultErrorMessage: "The :input must be a float",
  async validate(value: any, context) {
    if (Number.isFinite(value) && !Number.isInteger(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Scalar rule - validates scalar value (string, number, or boolean)
 */
export const scalarRule: SchemaRule = {
  name: "scalar",
  defaultErrorMessage: "The :input must be a scalar value",
  async validate(value: any, context) {
    if (["string", "number", "boolean"].includes(typeof value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Object rule - validates object type
 */
export const objectRule: SchemaRule = {
  name: "object",
  defaultErrorMessage: "The :input must be an object",
  async validate(value: any, context) {
    if (!!isObject(value) && value !== null) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Object rule - validates object type
 */
export const plainObjectRule: SchemaRule = {
  name: "plainObject",
  defaultErrorMessage: "The :input must be an object",
  async validate(value: any, context) {
    if (!!isPlainObject(value) && value !== null) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Array rule - validates array type
 */
export const arrayRule: SchemaRule = {
  name: "array",
  defaultErrorMessage: "The :input must be an array",
  async validate(value: any, context) {
    if (Array.isArray(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
