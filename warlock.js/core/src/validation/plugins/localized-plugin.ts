/**
 * Localized Validator Plugin
 *
 * Adds localized() method to Seal v factory
 */

import type { ArrayValidator, BaseValidator, SealPlugin } from "@warlock.js/seal";
import { v } from "@warlock.js/seal";

type LocalizedReturn = ArrayValidator & {
  validator: BaseValidator;
};

/**
 * Localized validation plugin for Seal
 */
export const localizedPlugin: SealPlugin = {
  name: "localized",
  version: "1.0.0",
  description: "Adds localized validation (v.localized())",
  install() {
    v.localized = (valueValidator?: BaseValidator, errorMessage?: string): LocalizedReturn =>
      v.array(
        v.object({
          localeCode: v.string().required(),
          value: valueValidator || v.scalar(),
        }),
        errorMessage,
      ) as LocalizedReturn;
  },
};
