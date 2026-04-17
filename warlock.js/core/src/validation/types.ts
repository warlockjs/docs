/**
 * Framework Validator Type Augmentations
 *
 * Augments core validators with framework-specific methods
 */

import type { ChildModel, Model } from "@warlock.js/cascade";
import type {
  ArrayValidator,
  BaseValidator,
  TranslateAttributeCallback,
  TranslateRuleCallback,
} from "@warlock.js/seal";
import type {
  ExistsExceptCurrentIdRuleOptions,
  ExistsExceptCurrentUserRuleOptions,
  ExistsRuleOptions,
  UniqueExceptCurrentIdRuleOptions,
  UniqueExceptCurrentUserRuleOptions,
  UniqueRuleOptions,
} from "./database";
import type { FileValidator } from "./validators";

// Type augmentation for v factory and validators
declare module "@warlock.js/seal" {
  // Augment the v factory with file() method
  export interface ValidatorV {
    file: (errorMessage?: string) => FileValidator;
    localized: (
      valueValidator?: BaseValidator,
      errorMessage?: string,
    ) => ArrayValidator & {
      validator: BaseValidator;
    };
  }

  interface ScalarValidator {
    /** Value must be unique in database */
    unique(
      model: ChildModel<Model> | string,
      optionsList?: Partial<UniqueRuleOptions> & {
        errorMessage?: string;
      },
    ): this;

    /** Value must be unique in database except current user */
    uniqueExceptCurrentUser(
      model: ChildModel<Model> | string,
      optionsList?: Partial<UniqueExceptCurrentUserRuleOptions> & {
        errorMessage?: string;
      },
    ): this;

    /** Value must be unique in database except current id */
    uniqueExceptCurrentId(
      model: ChildModel<Model> | string,
      optionsList?: Partial<UniqueExceptCurrentIdRuleOptions> & {
        errorMessage?: string;
      },
    ): this;

    /** Value must exist in database */
    exists(
      model: ChildModel<Model> | string,
      optionsList?: Partial<ExistsRuleOptions> & {
        errorMessage?: string;
      },
    ): this;

    /** Value must exist in database except current user */
    existsExceptCurrentUser(
      model: ChildModel<Model> | string,
      optionsList?: Partial<ExistsExceptCurrentUserRuleOptions> & {
        errorMessage?: string;
      },
    ): this;

    /** Value must exists in database except current id */
    existsExceptCurrentId(
      model: ChildModel<Model> | string,
      optionsList?: Partial<ExistsExceptCurrentIdRuleOptions> & {
        errorMessage?: string;
      },
    ): this;
  }

  // StringValidator gets same database methods
  interface StringValidator {
    unique: ScalarValidator["unique"];
    uniqueExceptCurrentUser: ScalarValidator["uniqueExceptCurrentUser"];
    uniqueExceptCurrentId: ScalarValidator["uniqueExceptCurrentId"];
    exists: ScalarValidator["exists"];
    existsExceptCurrentUser: ScalarValidator["existsExceptCurrentUser"];
    existsExceptCurrentId: ScalarValidator["existsExceptCurrentId"];
  }

  // NumberValidator gets unique and exists only
  interface NumberValidator {
    unique: ScalarValidator["unique"];
    exists: ScalarValidator["exists"];
  }
}

// Export database types for use in validators
export type {
  ExistsExceptCurrentIdRuleOptions,
  ExistsExceptCurrentUserRuleOptions,
  ExistsRuleOptions,
  UniqueExceptCurrentIdRuleOptions,
  UniqueExceptCurrentUserRuleOptions,
  UniqueRuleOptions,
} from "./database";

export type ValidationConfiguration = {
  // TODO: Map error messages and inputs keys through configurations.
  /**
   * Translation group that will be prefixed the rules
   * For example required rule translation will be taken from validation.required
   * To remove group keep the key as empty string
   * @default validation
   */
  translationGroup?: string;
  /**
   * Attribute group that will be prefixed the attributes
   * For example name attribute translation will be taken from attributes.name
   * To remove group keep the key as empty string
   * @default attributes
   */
  attributeGroup?: string;
  /**
   * Whether to show only the first error or all errors
   * @default true
   */
  firstErrorOnly?: boolean;
  /**
   * Function to translate the rule
   * Could be useful for handling translation in another way than Warlcok.js framework handles it
   */
  translateRule?: TranslateRuleCallback;
  /**
   * Function to translate the attribute
   */
  translateAttribute?: TranslateAttributeCallback;
};
