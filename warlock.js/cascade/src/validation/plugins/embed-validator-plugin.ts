/**
 * File Validator Plugin
 *
 * Adds file validation to Seal v factory
 */

import type { SealPlugin } from "@warlock.js/seal";
import { v } from "@warlock.js/seal";
import type { ChildModel } from "../../model/model";
import { EmbedModelValidator } from "../validators/embed-validator";

type EmbedOptions = {
  errorMessage?: string;
  embed?: string | string[];
};

declare module "@warlock.js/seal" {
  interface ValidatorV {
    embed(model: ChildModel<any> | string, options?: EmbedOptions): EmbedModelValidator;
    embedMany(model: ChildModel<any> | string, options?: EmbedOptions): EmbedModelValidator;
  }
}

/**
 * File validation plugin for Seal
 */
export const embedValidator: SealPlugin = {
  name: "embed",
  version: "1.0.0",
  description: "Adds file upload validation (v.file())",

  install() {
    // Inject file() method into v factory
    v.embed = (model: ChildModel<any> | string, options?: EmbedOptions) =>
      new EmbedModelValidator().model(model).embed(options?.embed);
    v.embedMany = (model: ChildModel<any> | string, options?: EmbedOptions) =>
      new EmbedModelValidator().models(model).embed(options?.embed);
  },
};
