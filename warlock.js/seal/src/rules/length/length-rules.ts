import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Min length rule - validates minimum length
 * Works for any value with a length property (strings, arrays, etc.)
 */
export const minLengthRule: SchemaRule<{ minLength: number }> = {
  name: "minLength",
  defaultErrorMessage: "The :input must be at least :minLength characters long",
  async validate(value: any, context) {
    const length = typeof value?.length === "number" ? value.length : String(value || "").length;

    if (length >= this.context.options.minLength) {
      return VALID_RULE;
    }

    this.context.translationParams.minLength = this.context.options.minLength;

    return invalidRule(this, context);
  },
};

/**
 * Max length rule - validates maximum length
 * Works for any value with a length property (strings, arrays, etc.)
 */
export const maxLengthRule: SchemaRule<{ maxLength: number }> = {
  name: "maxLength",
  defaultErrorMessage: "The :input must not exceed :maxLength characters",
  async validate(value: any, context) {
    const length = typeof value?.length === "number" ? value.length : String(value || "").length;

    if (length <= this.context.options.maxLength) {
      return VALID_RULE;
    }

    this.context.translationParams.maxLength = this.context.options.maxLength;

    return invalidRule(this, context);
  },
};

/**
 * Between length rule - validates length is between min and max (inclusive)
 * Works for any value with a length property (strings, arrays, etc.)
 */
export const betweenLengthRule: SchemaRule<{
  minLength: number;
  maxLength: number;
}> = {
  name: "betweenLength",
  defaultErrorMessage: "The :input must be between :minLength and :maxLength characters long",
  async validate(value: any, context) {
    const length = typeof value?.length === "number" ? value.length : String(value || "").length;

    if (length >= this.context.options.minLength && length <= this.context.options.maxLength) {
      return VALID_RULE;
    }

    this.context.translationParams.minLength = this.context.options.minLength;
    this.context.translationParams.maxLength = this.context.options.maxLength;

    return invalidRule(this, context);
  },
};

/**
 * Length rule - validates exact length
 * Works for any value with a length property (strings, arrays, etc.)
 */
export const lengthRule: SchemaRule<{ length: number }> = {
  name: "length",
  defaultErrorMessage: "The :input must be exactly :length characters long",
  async validate(value: any, context) {
    const length = typeof value?.length === "number" ? value.length : String(value || "").length;

    if (length === this.context.options.length) {
      return VALID_RULE;
    }

    this.context.translationParams.length = this.context.options.length;

    return invalidRule(this, context);
  },
};

/**
 * Min words rule - validates minimum word count
 */
export const minWordsRule: SchemaRule<{ minWords: number }> = {
  name: "minWords",
  defaultErrorMessage: "The :input must be at least :minWords words",
  async validate(value: any, context) {
    if (String(value || "").split(" ").length >= this.context.options.minWords) {
      return VALID_RULE;
    }

    this.context.translationParams.minWords = this.context.options.minWords;

    return invalidRule(this, context);
  },
};

/**
 * Max words rule - validates maximum word count
 */
export const maxWordsRule: SchemaRule<{ maxWords: number }> = {
  name: "maxWords",
  defaultErrorMessage: "The :input must be at most :maxWords words",
  async validate(value: any, context) {
    if (String(value || "").split(" ").length <= this.context.options.maxWords) {
      return VALID_RULE;
    }

    this.context.translationParams.maxWords = this.context.options.maxWords;

    return invalidRule(this, context);
  },
};

/**
 * Words rule - validates exact word count
 */
export const wordsRule: SchemaRule<{ words: number }> = {
  name: "words",
  defaultErrorMessage: "The :input must be exactly :words words",
  async validate(value: any, context) {
    if (String(value || "").split(" ").length === this.context.options.words) {
      return VALID_RULE;
    }

    this.context.translationParams.words = this.context.options.words;

    return invalidRule(this, context);
  },
};
