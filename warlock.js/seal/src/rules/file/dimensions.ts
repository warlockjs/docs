import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * Min width rule - image width validation
 */
export const minWidthRule: SchemaRule<{ minWidth: number }> = {
  name: "minWidth",
  defaultErrorMessage: "The :input must be at least :minWidth pixels wide",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.width >= this.context.options.minWidth) {
      return VALID_RULE;
    }

    this.context.translationParams.minWidth = this.context.options.minWidth;

    return invalidRule(this, context);
  },
};

/**
 * Max width rule - image width validation
 */
export const maxWidthRule: SchemaRule<{ maxWidth: number }> = {
  name: "maxWidth",
  defaultErrorMessage: "The :input must be at most :maxWidth pixels wide",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.width <= this.context.options.maxWidth) {
      return VALID_RULE;
    }

    this.context.translationParams.maxWidth = this.context.options.maxWidth;

    return invalidRule(this, context);
  },
};

/**
 * Min height rule - image height validation
 */
export const minHeightRule: SchemaRule<{ minHeight: number }> = {
  name: "minHeight",
  defaultErrorMessage: "The :input must be at least :minHeight pixels tall",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.height >= this.context.options.minHeight) {
      return VALID_RULE;
    }

    this.context.translationParams.minHeight = this.context.options.minHeight;

    return invalidRule(this, context);
  },
};

/**
 * Max height rule - image height validation
 */
export const maxHeightRule: SchemaRule<{ maxHeight: number }> = {
  name: "maxHeight",
  defaultErrorMessage: "The :input must be at most :maxHeight pixels tall",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.height <= this.context.options.maxHeight) {
      return VALID_RULE;
    }

    this.context.translationParams.maxHeight = this.context.options.maxHeight;

    return invalidRule(this, context);
  },
};
