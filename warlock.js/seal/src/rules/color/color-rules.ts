import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Color validation regex patterns
 */
const colorValidationRegex = {
  hex: /^#([0-9a-f]{3}){1,2}$/i,
  rgb: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
  rgba: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0?\.\d+|1)\)$/,
  hsl: /^hsl\((\d{1,3}),\s*(\d{1,3})%?,\s*(\d{1,3})%?\)$/,
};

/**
 * Generic color rule - validates any color format
 */
export const colorRule: SchemaRule = {
  name: "color",
  defaultErrorMessage: "The :input must be a valid color",
  async validate(value: any, context) {
    const isValidColor =
      colorValidationRegex.hex.test(value) ||
      colorValidationRegex.rgb.test(value) ||
      colorValidationRegex.rgba.test(value) ||
      colorValidationRegex.hsl.test(value);

    if (isValidColor) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Hex color rule
 */
export const hexColorRule: SchemaRule = {
  name: "hexColor",
  defaultErrorMessage: "The :input must be a valid hex color",
  async validate(value: any, context) {
    if (colorValidationRegex.hex.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * RGB color rule
 */
export const rgbColorRule: SchemaRule = {
  name: "rgbColor",
  defaultErrorMessage: "The :input must be a valid RGB color",
  async validate(value: any, context) {
    if (colorValidationRegex.rgb.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * RGBA color rule
 */
export const rgbaColorRule: SchemaRule = {
  name: "rgbaColor",
  defaultErrorMessage: "The :input must be a valid RGBA color",
  async validate(value: any, context) {
    if (colorValidationRegex.rgba.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * HSL color rule
 */
export const hslColorRule: SchemaRule = {
  name: "hslColor",
  defaultErrorMessage: "The :input must be a valid HSL color",
  async validate(value: any, context) {
    if (colorValidationRegex.hsl.test(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * Light color rule
 */
export const lightColorRule: SchemaRule = {
  name: "lightColor",
  defaultErrorMessage: "The :input must be a light color",
  async validate(value: any, context) {
    if (!colorValidationRegex.hex.test(value)) {
      return invalidRule(this, context);
    }

    const hex = value.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 155) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Dark color rule
 */
export const darkColorRule: SchemaRule = {
  name: "darkColor",
  defaultErrorMessage: "The :input must be a dark color",
  async validate(value: any, context) {
    if (!colorValidationRegex.hex.test(value)) {
      return invalidRule(this, context);
    }

    const hex = value.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness <= 155) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
