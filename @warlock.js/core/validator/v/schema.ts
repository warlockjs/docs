/* eslint-disable @typescript-eslint/no-this-alias */
import { trans } from "@mongez/localization";
import { clone } from "@mongez/reinforcements";
import { isObject, isPlainObject } from "@mongez/supportive-is";
import { type Model } from "@warlock.js/cascade";
import {
  capitalizeMutator,
  dateMutator,
  flipArrayMutator,
  lowercaseMutator,
  numberMutator,
  objectTrimMutator,
  sortArrayMutator,
  stringMutator,
  stripUnknownMutator,
  uniqueArrayMutator,
  uppercaseMutator,
} from "./mutators";
import {
  allowedValuesRule,
  alphaNumericRule,
  alphaRule,
  arrayRule,
  booleanRule,
  colorRule,
  containsRule,
  darkColorRule,
  dateRule,
  emailRule,
  endsWithRule,
  enumRule,
  equalRule,
  existsExceptCurrentIdRule,
  existsExceptCurrentUserRule,
  existsRule,
  fileExtensionRule,
  fileRule,
  fileTypeRule,
  floatRule,
  forbiddenRule,
  hexColorRule,
  hslColorRule,
  imageRule,
  inRule,
  intRule,
  ip4Rule,
  ip6Rule,
  ipRule,
  isCreditCardRule,
  isNumericRule,
  lengthRule,
  lightColorRule,
  matchesRule,
  maxDateRule,
  maxFileSizeRule,
  maxHeightRule,
  maxLengthRule,
  maxRule,
  maxWidthRule,
  maxWordsRule,
  minDateRule,
  minFileSizeRule,
  minHeightRule,
  minLengthRule,
  minRule,
  minWidthRule,
  minWordsRule,
  moduloRule,
  notAllowedValuesRule,
  notContainsRule,
  numberRule,
  objectRule,
  patternRule,
  positiveRule,
  requiredIfAbsentRule,
  requiredIfEmptyRule,
  requiredIfFieldRule,
  requiredIfSiblingFieldAllAbsentRule,
  requiredIfSiblingFieldEmptyRule,
  requiredIfSiblingFieldIsAbsentRule,
  requiredIfSiblingFieldRule,
  requiredRule,
  requiredUnlessSiblingFieldRule,
  requiredWithRule,
  rgbColorRule,
  rgbaColorRule,
  scalarRule,
  startsWithRule,
  stringRule,
  uniqueArrayRule,
  uniqueExceptCurrentIdRule,
  uniqueExceptCurrentUserRule,
  uniqueRule,
  unknownKeyRule,
  uploadableRule,
  urlRule,
  whenRule,
  withoutWhitespaceRule,
  wordsRule,
} from "./rules";
import type {
  ContextualSchemaRule,
  ContextualizedMutator,
  ExistsExceptCurrentIdRuleOptions,
  ExistsExceptCurrentUserRuleOptions,
  ExistsRuleOptions,
  Mutator,
  Schema,
  SchemaContext,
  SchemaRule,
  SchemaRuleOptions,
  UniqueExceptCurrentIdRuleOptions,
  UniqueExceptCurrentUserRuleOptions,
  UniqueRuleOptions,
  ValidationResult,
  WhenRuleOptions,
} from "./types";
import { VALID_RULE, invalidRule, setKeyPath } from "./utils";

// TODO: Allow developer to extend the validator with custom rules and custom validators

export class BaseValidator {
  public rules: ContextualSchemaRule[] = [];
  public mutators: ContextualizedMutator[] = [];
  protected defaultValue: any;

  protected description?: string;

  /**
   * Get the default value
   */
  public getDefaultValue(): any {
    return this.defaultValue;
  }

  /**
   * Add description to the validator
   */
  public describe(description: string) {
    this.description = description;

    return this;
  }

  /**
   * Value must be equal to the given value
   */
  public equal(value: any, errorMessage?: string) {
    const rule = this.addRule(equalRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Add rule to the schema
   */
  public addRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    errorMessage?: string,
  ): ContextualSchemaRule<T> {
    const newRule: ContextualSchemaRule<T> = {
      ...(clone(rule) as ContextualSchemaRule<T>),
      context: {
        errorMessage,
        options: {} as T,
      },
    };

    if (errorMessage) {
      newRule.errorMessage = errorMessage;
    }

    if (rule.sortOrder === undefined) {
      newRule.sortOrder = this.rules.length + 1;
    }

    this.rules.push(newRule);

    return newRule;
  }

  /**
   * Define custom rule
   */
  public refine(
    callback: (
      value: any,
      context: SchemaContext,
    ) => Promise<string | undefined> | string | undefined,
  ) {
    this.addRule({
      name: "custom",
      async validate(value, context) {
        const result = await callback(value, context);

        if (result) {
          this.context.errorMessage = result;
          return invalidRule(this, context);
        }

        return VALID_RULE;
      },
    });

    return this;
  }

  /**
   * Add custom rule to the schema
   * @alias refine
   */
  public custom(
    callback: (
      value: any,
      context: SchemaContext,
    ) => Promise<string | undefined> | string | undefined,
  ) {
    return this.refine(callback);
  }

  /**
   * Add mutator to the schema
   *
   * A mutator is a function that mutates the value of the field before validation
   */
  public addMutator(mutator: Mutator, options: any = {}) {
    this.mutators.push({
      mutate: mutator,
      context: {
        options,
        ctx: {} as any,
      },
    });

    return this;
  }

  /**
   * Set default value for the field
   */
  public default(value: any) {
    this.defaultValue = value;

    return this;
  }

  /**
   * Value must be present but not necessarily has a value
   */
  public present(errorMessage?: string) {
    this.addRule(requiredRule, errorMessage);

    return this;
  }

  /**
   * This value must be present and has a value
   */
  public required(errorMessage?: string) {
    this.addRule(requiredRule, errorMessage);

    return this;
  }

  /**
   * This value must be present if the given input is present
   */
  public requiredWith(input: string, errorMessage?: string) {
    const rule = this.addRule(requiredWithRule, errorMessage);

    rule.context.options.field = input;

    return this;
  }

  /**
   * Mark this field as required if the given input field is present
   */
  public requiredIfPresent(input: string, errorMessage?: string) {
    return this.requiredWith(input, errorMessage);
  }

  /**
   * Value is required if the given input field (global) is absent
   */
  public requiredIfAbsent(input: string, errorMessage?: string) {
    const rule = this.addRule(requiredIfAbsentRule, errorMessage);

    rule.context.options.field = input;

    return this;
  }

  /**
   * Value is required if given sibling field is absent
   */
  public requireIfSiblingIsAbsent(field: string, errorMessage?: string) {
    const rule = this.addRule(requiredIfSiblingFieldIsAbsentRule, errorMessage);

    rule.context.options.field = field;

    return this;
  }

  /**
   * Value is required if all given input fields in same parent context are absent
   */
  public requiredIfSiblingFieldAllAbsent(
    fields: string[],
    errorMessage?: string,
  ) {
    const rule = this.addRule(
      requiredIfSiblingFieldAllAbsentRule,
      errorMessage,
    );

    rule.context.options.fields = fields;

    return this;
  }

  /**
   * @alias requiredIfAbsent
   */
  public requiredIfMissing(input: string, errorMessage?: string) {
    return this.requiredIfAbsent(input, errorMessage);
  }

  /**
   * Value is required if and only if the given input field is empty
   */
  public requiredIfEmpty(input: string, errorMessage?: string) {
    const rule = this.addRule(requiredIfEmptyRule, errorMessage);

    rule.context.options.field = input;

    return this;
  }

  /**
   * Value is required if and only if the given input field in same parent context is empty
   */
  public requiredIfSiblingFieldEmpty(input: string, errorMessage?: string) {
    const rule = this.addRule(requiredIfSiblingFieldEmptyRule, errorMessage);

    rule.context.options.field = input;

    return this;
  }

  /**
   * Value is required if and only if the given input field has the given value
   */
  public requiredIfField(input: string, value: any, errorMessage?: string) {
    const rule = this.addRule(requiredIfFieldRule, errorMessage);

    rule.context.options.field = input;
    rule.context.options.value = value;

    return this;
  }

  /**
   * Value is required if and only if the given input field in same parent context has the given value
   */
  public requiredIfSiblingField(
    input: string,
    value: any,
    errorMessage?: string,
  ) {
    const rule = this.addRule(requiredIfSiblingFieldRule, errorMessage);

    rule.context.options.field = input;
    rule.context.options.value = value;

    return this;
  }

  /**
   * Value is required unless the given input field in same parent context has the given value
   */
  public requiredUnlessSiblingField(
    input: string,
    value: any,
    errorMessage?: string,
  ) {
    const rule = this.addRule(requiredUnlessSiblingFieldRule, errorMessage);

    rule.context.options.field = input;
    rule.context.options.value = value;

    return this;
  }

  /**
   * Mutate the data
   * Please note this method should not be called directly, as it is used internally by the `validate` method
   */
  public async mutate(data: any, context: SchemaContext) {
    let mutatedData = data;

    for (const mutator of this.mutators) {
      mutator.context.ctx = context;
      mutatedData = await mutator.mutate(mutatedData, mutator.context);
    }

    return mutatedData;
  }

  /**
   * Value is forbidden to be present
   */
  public forbidden(errorMessage?: string) {
    this.addRule(forbiddenRule, errorMessage);

    return this;
  }

  /**
   * Apply conditional validation rules based on another field value
   *
   * @example
   * ```ts
   * v.object({
   *   status: v.when("type", {
   *     is: {
   *       post: v.string().required().in(["active", "inactive"]),
   *       news: v.string().required().in(["published", "draft"]),
   *     },
   *     otherwise: v.forbidden(),
   *   }),
   * })
   * ```
   */
  public when(field: string, options: Omit<WhenRuleOptions, "field">) {
    const rule = this.addRule(whenRule);

    rule.context.options.field = field;
    rule.context.options.is = options.is;
    rule.context.options.otherwise = options.otherwise;

    return this;
  }

  /**
   * Validate the data
   */
  public async validate(
    data: any,
    context: SchemaContext,
  ): Promise<ValidationResult> {
    const mutatedData = await this.mutate(data ?? this.defaultValue, context);

    const errors: ValidationResult["errors"] = [];
    let isValid = true;

    const isFirstErrorOnly = context.configurations?.firstErrorOnly ?? true;

    for (const rule of this.rules) {
      if ((rule.requiresValue ?? true) && data === undefined) continue;

      const result = await rule.validate(mutatedData, context);

      if (result.isValid === false) {
        isValid = false;
        errors.push({
          type: rule.name,
          error: result.error,
          input: result.path ?? context.path,
        });

        if (isFirstErrorOnly) {
          break;
        }
      }
    }

    return {
      isValid,
      errors,
      data: mutatedData,
    };
  }
}

export class AnyValidator extends BaseValidator {}

/**
 * Recursively remove undefined values from an object
 */
function removeUndefinedValues(obj: any): any {
  if (isObject(obj) && !isPlainObject(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }

  if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = removeUndefinedValues(value);
      }
    }
    return result;
  }

  return obj;
}

export class ObjectValidator extends BaseValidator {
  /**
   * Whether to allow unknown properties
   *
   * @default false
   */
  protected shouldAllowUnknown = false;

  /**
   * Allowed keys that could be in the data but not necessarily validated
   */
  protected allowedKeys: string[] = [];

  public constructor(
    public schema: Schema,
    errorMessage?: string,
  ) {
    super();

    this.addRule(objectRule, errorMessage);
  }

  /**
   * Strip unknown keys from the data
   *
   * @mutate
   */
  public stripUnknown() {
    const validator = this;
    this.addMutator(stripUnknownMutator, {
      get allowedKeys() {
        return validator.allowedKeys;
      },
    });

    return this;
  }

  /**
   * Add list of allowed keys that could be in the data but not necessarily validated
   */
  public allow(...keys: string[]) {
    this.allowedKeys.push(...keys);

    return this;
  }

  /**
   * Trim values of the object properties
   */
  public trim(recursive = true) {
    this.addMutator(objectTrimMutator, { recursive });

    return this;
  }

  /**
   * Whether to allow unknown properties
   *
   * @default false
   */
  public allowUnknown(allow = true) {
    this.shouldAllowUnknown = allow;

    return this;
  }

  /**
   * Mutate the data
   *
   * Please note this method should not be called directly, as it is used internally by the `validate` method
   */
  public mutate(data: any, context: SchemaContext) {
    if (!isPlainObject(data)) return data;

    return super.mutate({ ...data }, context);
  }

  /**
   * Validate the data
   */
  public async validate(
    data: any,
    context: SchemaContext,
  ): Promise<ValidationResult> {
    context.schema = this.schema;

    const mutatedData = await this.mutate(data, context);

    // now we need to check if the object has unknown properties
    if (this.shouldAllowUnknown === false) {
      const rule = this.addRule(unknownKeyRule);
      rule.context.options.allowedKeys = this.allowedKeys;
      rule.context.options.schema = this.schema;
    }

    const result = await super.validate(mutatedData, context);

    if (result.isValid === false) return result;

    // if no data and the object is valid, then return it as-is, nothing to do
    if (data === undefined) return result;

    // now we need to validate the object properties
    const errors: ValidationResult["errors"] = [];
    const finalData: any = {};

    const validationPromises = Object.keys(this.schema).map(async key => {
      const value = mutatedData?.[key];
      const validator = this.schema[key];

      // Only process fields that were provided in the input or have explicit defaults
      if (key in data || validator.getDefaultValue() !== undefined) {
        const childContext: SchemaContext = {
          ...context,
          parent: mutatedData,
          value,
          key,
          path: setKeyPath(context.path, key),
        };

        const childResult = await validator.validate(value, childContext);

        if (childResult.data !== undefined) {
          finalData[key] = childResult.data;
        }

        if (childResult.isValid === false) {
          errors.push(...childResult.errors);
        }
      }
    });

    await Promise.all(validationPromises);

    // Remove undefined values from the final data
    const cleanedData = removeUndefinedValues(finalData);

    return {
      isValid: errors.length === 0,
      errors,
      data: cleanedData,
    };
  }
}

export class ArrayValidator extends BaseValidator {
  public constructor(
    public validator: BaseValidator,
    errorMessage?: string,
  ) {
    super();

    this.addRule(arrayRule, errorMessage);
  }

  /**
   * Reverse array order
   *
   * @mutate
   */
  public flip() {
    return this.addMutator(flipArrayMutator);
  }

  /**
   * Reverse array order
   *
   * @mutate
   */
  public reverse() {
    return this.addMutator(flipArrayMutator);
  }

  /**
   * Make it has only unique values
   *
   * @mutate
   */
  public onlyUnique() {
    return this.addMutator(uniqueArrayMutator);
  }

  /**
   * Sort array
   *
   * If key is passed, it will sort by the key value
   *
   * @mutate
   * @supports dot notation
   */
  public sort(direction: "asc" | "desc" = "asc", key?: string) {
    this.addMutator(sortArrayMutator, { direction, key });

    return this;
  }

  // End of mutators

  //   Start of rules

  /**
   * Array length must be greater than the given length
   */
  public minLength(length: number, errorMessage?: string) {
    const rule = this.addRule(minLengthRule, errorMessage);

    rule.context.options.minLength = length;

    return this;
  }

  /**
   * Array length must be less than the given length
   */
  public maxLength(length: number, errorMessage?: string) {
    const rule = this.addRule(maxLengthRule, errorMessage);

    rule.context.options.maxLength = length;

    return this;
  }

  /**
   * Array length must be of the given length
   */
  public length(length: number, errorMessage?: string) {
    const rule = this.addRule(lengthRule, errorMessage);

    rule.context.options.length = length;

    return this;
  }

  /**
   * Array must have unique values
   */
  public unique() {
    this.addRule(uniqueArrayRule);

    return this;
  }

  /**
   * Mutate the data
   *
   * Please note this method should not be called directly, as it is used internally by the `validate` method
   */
  public mutate(data: any, context: SchemaContext) {
    if (!Array.isArray(data)) return data;

    return super.mutate([...data], context);
  }

  /**
   * Validate array
   */
  public async validate(
    data: any,
    context: SchemaContext,
  ): Promise<ValidationResult> {
    const mutatedData = (await this.mutate(data, context)) || [];
    const result = await super.validate(data, context);

    if (result.isValid === false) return result;

    const errors: ValidationResult["errors"] = [];

    for (let index = 0; index < mutatedData.length; index++) {
      const value = mutatedData[index];

      const childContext: SchemaContext = {
        ...context,
        parent: mutatedData,
        value,
        key: index.toString(),
        path: setKeyPath(context.path, index.toString()),
      };

      const childResult = await this.validator.validate(value, childContext);

      mutatedData[index] = childResult.data;

      if (childResult.isValid === false) {
        errors.push(...childResult.errors);
      }

      if (context.configurations?.firstErrorOnly && errors.length) {
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: mutatedData,
    };
  }
}

export class StringValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(stringRule, errorMessage);

    this.addMutator(stringMutator);
  }

  /**
   * Convert string to lowercase
   *
   * @mutate
   */
  public lowercase() {
    this.addMutator(lowercaseMutator);

    return this;
  }

  /**
   * Convert string to uppercase
   *
   * @mutate
   */
  public uppercase() {
    this.addMutator(uppercaseMutator);

    return this;
  }

  /**
   * Capitalize the first letter of the string
   *
   * @mutate
   */
  public capitalize() {
    this.addMutator(capitalizeMutator);

    return this;
  }

  /**
   * Value must be a valid email
   */
  public email(errorMessage?: string) {
    this.addRule(emailRule, errorMessage);

    return this;
  }

  /**
   * Value must be a valid URL
   */
  public url(errorMessage?: string) {
    this.addRule(urlRule, errorMessage);

    return this;
  }

  /**
   * Value must match the value of the given field
   */
  public matches(field: string, errorMessage?: string) {
    const rule = this.addRule(matchesRule, errorMessage);

    rule.context.options.field = field;

    return this;
  }

  /**
   * Value can not have whitespace
   */
  public withoutWhitespace(errorMessage?: string) {
    this.addRule(withoutWhitespaceRule, errorMessage);

    return this;
  }

  /**
   * Value must match the given pattern
   */
  public pattern(pattern: RegExp, errorMessage?: string) {
    const rule = this.addRule(patternRule, errorMessage);

    rule.context.options.pattern = pattern;

    return this;
  }

  /**
   * Validate the current string as an uploadable hash id
   */
  public uploadable(errorMessage?: string) {
    this.addRule(uploadableRule, errorMessage);

    return this;
  }

  /**
   * Value must be exactly the given number of words
   */
  public words(words: number, errorMessage?: string) {
    const rule = this.addRule(wordsRule, errorMessage);

    rule.context.options.words = words;

    return this;
  }

  /**
   * Value must be at least the given number of words
   */
  public minWords(words: number, errorMessage?: string) {
    const rule = this.addRule(minWordsRule, errorMessage);

    rule.context.options.minWords = words;

    return this;
  }

  /**
   * Value must be at most the given number of words
   */
  public maxWords(words: number, errorMessage?: string) {
    const rule = this.addRule(maxWordsRule, errorMessage);

    rule.context.options.maxWords = words;

    return this;
  }

  /**
   * Value length must be greater than the given length
   */
  public minLength(length: number, errorMessage?: string) {
    const rule = this.addRule(minLengthRule, errorMessage);

    rule.context.options.minLength = length;

    return this;
  }

  /**
   * @alias minLength
   */
  public min(min: number, errorMessage?: string) {
    return this.minLength(min, errorMessage);
  }

  /**
   * Value length must be less than the given length
   */
  public maxLength(length: number, errorMessage?: string) {
    const rule = this.addRule(maxLengthRule, errorMessage);

    rule.context.options.maxLength = length;

    return this;
  }

  /**
   * @alias maxLength
   */
  public max(max: number, errorMessage?: string) {
    return this.maxLength(max, errorMessage);
  }

  /**
   * Value must be of the given length
   */
  public length(length: number, errorMessage?: string) {
    const rule = this.addRule(lengthRule, errorMessage);

    rule.context.options.length = length;

    return this;
  }

  /**
   * Allow only alphabetic characters
   */
  public alpha(errorMessage?: string) {
    this.addRule(alphaRule, errorMessage);

    return this;
  }

  /**
   * Allow only alphanumeric characters
   */
  public alphanumeric(errorMessage?: string) {
    this.addRule(alphaNumericRule, errorMessage);

    return this;
  }

  /**
   * Allow only numeric characters
   */
  public numeric(errorMessage?: string) {
    this.addRule(isNumericRule, errorMessage);

    return this;
  }

  /**
   * Value must starts with the given string
   */
  public startsWith(value: string, errorMessage?: string) {
    const rule = this.addRule(startsWithRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Value must ends with the given string
   */
  public endsWith(value: string, errorMessage?: string) {
    const rule = this.addRule(endsWithRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Value must contain the given string
   */
  public contains(value: string, errorMessage?: string) {
    const rule = this.addRule(containsRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Value must not contain the given string
   */
  public notContains(value: string, errorMessage?: string) {
    const rule = this.addRule(notContainsRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Value must be a valid IP address
   */
  public ip(errorMessage?: string) {
    this.addRule(ipRule, errorMessage);

    return this;
  }

  /**
   * Value must be a valid IPv4 address
   */
  public ip4(errorMessage?: string) {
    this.addRule(ip4Rule, errorMessage);

    return this;
  }

  /**
   * Value must be a valid IPv6 address
   */
  public ip6(errorMessage?: string) {
    this.addRule(ip6Rule, errorMessage);

    return this;
  }

  /**
   * Check if the string matches a credit card number
   */
  public creditCard(errorMessage?: string) {
    this.addRule(isCreditCardRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid color
   * This validation rule will check for hex, rgb, rgba, hsl colors
   */
  public color(errorMessage?: string) {
    this.addRule(colorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid hex color
   */
  public hexColor(errorMessage?: string) {
    this.addRule(hexColorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid HSL color
   */
  public hslColor(errorMessage?: string) {
    this.addRule(hslColorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid RGB color
   */
  public rgbColor(errorMessage?: string) {
    this.addRule(rgbColorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid RGBA color
   */
  public rgbaColor(errorMessage?: string) {
    this.addRule(rgbaColorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid light color
   */
  public lightColor(errorMessage?: string) {
    this.addRule(lightColorRule, errorMessage);

    return this;
  }

  /**
   * Determine if the value is a valid dark color
   */
  public darkColor(errorMessage?: string) {
    this.addRule(darkColorRule, errorMessage);

    return this;
  }

  /**
   * Value must be one of the given values
   */
  public enum: typeof ScalarValidator.prototype.enum =
    ScalarValidator.prototype.enum;

  /**
   * Value must be one of the given values
   */
  public in: typeof ScalarValidator.prototype.in = ScalarValidator.prototype.in;

  /**
   * @alias in
   */
  public oneOf: typeof ScalarValidator.prototype.in =
    ScalarValidator.prototype.in;

  /**
   * Value must be unique
   */
  public unique: typeof ScalarValidator.prototype.unique =
    ScalarValidator.prototype.unique;

  /**
   * Value must be unique except current user
   */
  public uniqueExceptCurrentUser: typeof ScalarValidator.prototype.uniqueExceptCurrentUser =
    ScalarValidator.prototype.uniqueExceptCurrentUser;

  /**
   * Value must be unique except current id
   */
  public uniqueExceptCurrentId: typeof ScalarValidator.prototype.uniqueExceptCurrentId =
    ScalarValidator.prototype.uniqueExceptCurrentId;

  /**
   * Value must exist
   */
  public exists: typeof ScalarValidator.prototype.exists =
    ScalarValidator.prototype.exists;

  /**
   * Value must exist except current user
   */
  public existsExceptCurrentUser: typeof ScalarValidator.prototype.existsExceptCurrentUser =
    ScalarValidator.prototype.existsExceptCurrentUser;

  /**
   * Value must exist except current id
   */
  public existsExceptCurrentId: typeof ScalarValidator.prototype.existsExceptCurrentId =
    ScalarValidator.prototype.existsExceptCurrentId;

  /**
   * Add rule to check if the value is one of the allowed values
   */
  public allowsOnly: typeof ScalarValidator.prototype.allowsOnly =
    ScalarValidator.prototype.allowsOnly;

  /**
   * Add rule to forbid the value from being one of the given values
   */
  public forbids: typeof ScalarValidator.prototype.forbids =
    ScalarValidator.prototype.forbids;

  /**
   * @alias forbids
   */
  public notIn: typeof ScalarValidator.prototype.forbids =
    ScalarValidator.prototype.forbids;
}

export class DateValidator extends BaseValidator {
  public constructor(format?: string, errorMessage?: string) {
    super();

    const rule = this.addRule(dateRule, errorMessage);

    if (format) {
      rule.context.options.format = format;
    }

    this.addMutator(dateMutator);
  }

  /**
   * Date must be before the given date
   */
  public before(date: Date, errorMessage?: string) {
    const rule = this.addRule(maxDateRule, errorMessage);

    rule.context.options.maxDate = date;

    return this;
  }

  /**
   * Date must be after the given date
   */
  public after(date: Date, errorMessage?: string) {
    const rule = this.addRule(minDateRule, errorMessage);

    rule.context.options.minDate = date;

    return this;
  }
}

class NumberValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(numberRule, errorMessage);

    this.addMutator(numberMutator);
  }

  /**
   * Value must be equal or higher than the given number
   */
  public min(min: number, errorMessage?: string) {
    const rule = this.addRule(minRule, errorMessage);

    rule.context.options.min = min;

    return this;
  }

  /**
   * Value must be equal or less than the given number
   */
  public max(max: number, errorMessage?: string) {
    const rule = this.addRule(maxRule, errorMessage);

    rule.context.options.max = max;

    return this;
  }

  /**
   * Value must be a modulo of the given number
   */
  public modulo(value: number, errorMessage?: string) {
    const rule = this.addRule(moduloRule, errorMessage);

    rule.context.options.value = value;

    return this;
  }

  /**
   * Accept only numbers higher than 0
   */
  public positive(errorMessage?: string) {
    this.addRule(positiveRule, errorMessage);

    return this;
  }

  /**
   * Value must be unique and not exist in database
   */
  public unique: typeof ScalarValidator.prototype.unique =
    ScalarValidator.prototype.unique;

  /**
   * Value must exist in database
   */
  public exists: typeof ScalarValidator.prototype.exists =
    ScalarValidator.prototype.exists;

  /**
   * Value must be one of the given values
   */
  public enum: typeof ScalarValidator.prototype.enum =
    ScalarValidator.prototype.enum;

  /**
   * Value must be one of the given values
   */
  public in: typeof ScalarValidator.prototype.in = ScalarValidator.prototype.in;

  /**
   * @alias in
   */
  public oneOf: typeof ScalarValidator.prototype.in =
    ScalarValidator.prototype.in;

  /**
   * Add rule to check if the value is one of the allowed values
   */
  public allowsOnly: typeof ScalarValidator.prototype.allowsOnly =
    ScalarValidator.prototype.allowsOnly;

  /**
   * Add rule to forbid the value from being one of the given values
   */
  public forbids: typeof ScalarValidator.prototype.forbids =
    ScalarValidator.prototype.forbids;

  /**
   * @alias forbids
   */
  public notIn: typeof ScalarValidator.prototype.forbids =
    ScalarValidator.prototype.forbids;

  /**
   * Validate number length
   */
  public length: typeof StringValidator.prototype.length =
    StringValidator.prototype.length;

  /**
   * Validate number min length
   */
  public minLength: typeof StringValidator.prototype.minLength =
    StringValidator.prototype.minLength;

  /**
   * Validate number max length
   */
  public maxLength: typeof StringValidator.prototype.maxLength =
    StringValidator.prototype.maxLength;
}

export class IntValidator extends NumberValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(intRule, errorMessage);
  }
}

export class FloatValidator extends NumberValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(floatRule, errorMessage);
  }
}

export class BooleanValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(booleanRule, errorMessage);
  }
}

export class ScalarValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(scalarRule, errorMessage);
  }

  /**
   * Value must be unique in database
   */
  public unique(
    model: typeof Model | string,
    optionsList?: Partial<UniqueRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};
    const rule = this.addRule(uniqueRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must be unique in database except current user
   */
  public uniqueExceptCurrentUser(
    model: typeof Model | string,
    optionsList?: Partial<UniqueExceptCurrentUserRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};
    const rule = this.addRule(uniqueExceptCurrentUserRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must be unique in database except current id
   */
  public uniqueExceptCurrentId(
    model: typeof Model | string,
    optionsList?: Partial<UniqueExceptCurrentIdRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};
    const rule = this.addRule(uniqueExceptCurrentIdRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must exist in database
   */
  public exists(
    model: typeof Model | string,
    optionsList?: Partial<ExistsRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};

    const rule = this.addRule(existsRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must exist in database except current user
   */
  public existsExceptCurrentUser(
    model: typeof Model | string,
    optionsList?: Partial<ExistsExceptCurrentUserRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};
    const rule = this.addRule(existsExceptCurrentUserRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must exists in database except current id
   */
  public existsExceptCurrentId(
    model: typeof Model | string,
    optionsList?: Partial<ExistsExceptCurrentIdRuleOptions> & {
      errorMessage?: string;
    },
  ) {
    const { errorMessage, ...options } = optionsList || {};
    const rule = this.addRule(existsExceptCurrentIdRule, errorMessage);

    rule.context.options = {
      ...options,
      Model: model,
    };

    return this;
  }

  /**
   * Value must be one of the given values
   */
  public enum(values: any, errorMessage?: string) {
    const rule = this.addRule(enumRule, errorMessage);

    rule.context.options.enum = values;

    return this;
  }

  /**
   * Value must be one of the given values
   */
  public in(values: any[], errorMessage?: string) {
    const rule = this.addRule(inRule, errorMessage);

    rule.context.options.values = values;

    return this;
  }

  /**
   * @alias in
   */
  public oneOf: typeof ScalarValidator.prototype.in =
    ScalarValidator.prototype.in;

  /**
   * Add rule to check if the value is one of the allowed values
   */
  public allowsOnly(values: any[], errorMessage?: string) {
    const rule = this.addRule(allowedValuesRule, errorMessage);

    rule.context.options.allowedValues = values;

    return this;
  }

  /**
   * Forbid the value from being one of the given values
   */
  public forbids(values: any[], errorMessage?: string) {
    const rule = this.addRule(notAllowedValuesRule, errorMessage);

    rule.context.options.notAllowedValues = values;

    return this;
  }
}

export class FileValidator extends BaseValidator {
  public constructor(errorMessage?: string) {
    super();

    this.addRule(fileRule, errorMessage);
  }

  public image(errorMessage?: string) {
    this.addRule(imageRule, errorMessage);

    return this;
  }

  public accept(extensions: string | string[], errorMessage?: string) {
    const rule = this.addRule(fileExtensionRule, errorMessage);

    rule.context.options.extensions = extensions;

    return this;
  }

  public mimeType(mimeTypes: string | string[], errorMessage?: string) {
    const rule = this.addRule(fileTypeRule, errorMessage);

    rule.context.options.mimeTypes = mimeTypes;

    return this;
  }

  /**
   * Allow only pdf files
   */
  public pdf(errorMessage?: string) {
    return this.mimeType("application/pdf", errorMessage);
  }

  /**
   * Allow only excel files
   */
  public excel(errorMessage?: string) {
    return this.mimeType(
      [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      errorMessage,
    );
  }

  /**
   * Allow only word files
   */
  public word(errorMessage?: string) {
    return this.mimeType(
      [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      errorMessage,
    );
  }

  public minSize(size: number, errorMessage?: string) {
    const rule = this.addRule(minFileSizeRule, errorMessage);

    rule.context.options.minFileSize = size;

    return this;
  }

  public min(size: number, errorMessage?: string) {
    return this.minSize(size, errorMessage);
  }

  public maxSize(size: number, errorMessage?: string) {
    const rule = this.addRule(maxFileSizeRule, errorMessage);

    rule.context.options.maxFileSize = size;

    return this;
  }

  public max(size: number, errorMessage?: string) {
    return this.maxSize(size, errorMessage);
  }

  public minWidth(width: number, errorMessage?: string) {
    const rule = this.addRule(minWidthRule, errorMessage);

    rule.context.options.minWidth = width;

    return this;
  }

  public maxWidth(width: number, errorMessage?: string) {
    const rule = this.addRule(maxWidthRule, errorMessage);

    rule.context.options.maxWidth = width;

    return this;
  }

  public minHeight(height: number, errorMessage?: string) {
    const rule = this.addRule(minHeightRule, errorMessage);

    rule.context.options.minHeight = height;

    return this;
  }

  public maxHeight(height: number, errorMessage?: string) {
    const rule = this.addRule(maxHeightRule, errorMessage);

    rule.context.options.maxHeight = height;

    return this;
  }
}

export const validate = async (schema: BaseValidator, data: any) => {
  const context: SchemaContext = {
    allValues: data,
    parent: null,
    value: data,
    key: "",
    path: "",
    translator(rule, attributes) {
      return trans(`validation.${rule}`, attributes);
    },
  };

  return await schema.validate(data, context);
};

export const v = {
  object: (schema: Schema, errorMessage?: string) =>
    new ObjectValidator(schema, errorMessage),
  any: () => new AnyValidator(),
  forbidden: () => v.any().forbidden(),
  array: (validator: BaseValidator, errorMessage?: string) =>
    new ArrayValidator(validator, errorMessage),
  date: (format?: string, errorMessage?: string) =>
    new DateValidator(format, errorMessage),
  string: (errorMessage?: string) => new StringValidator(errorMessage),
  enum: (values: any, errorMessage?: string) =>
    new StringValidator().enum(values, errorMessage),
  number: (errorMessage?: string) => new NumberValidator(errorMessage),
  int: (errorMessage?: string) => new IntValidator(errorMessage),
  float: (errorMessage?: string) => new FloatValidator(errorMessage),
  boolean: (errorMessage?: string) => new BooleanValidator(errorMessage),
  scalar: (errorMessage?: string) => new ScalarValidator(errorMessage),
  file: (errorMessage?: string) => new FileValidator(errorMessage),
  localized: (valueValidator?: BaseValidator, errorMessage?: string) =>
    v.array(
      v.object({
        localeCode: v.string().required(),
        value: (valueValidator || v.string()).required(),
      }),
      errorMessage,
    ),
  /**
   * TODO: Added validateCallback to declare a schema and the second argument is a callback that will be only executed if schema validation passes
   * This will return a new callback that will be executed with the validated data
   *
   * @example
   * ```ts
   * export const createNewUser = v.validateCallback(schema, (data) => {
   *  // Do something with the validated data
   * })
   * ```
   */
  // validateCallback: (
  //   schema: BaseValidator,
  //   callback: (data: InferType<BaseValidator>) => Promise<any> | any,
  // ) => v.validate(schema, callback),
  validate,
};
