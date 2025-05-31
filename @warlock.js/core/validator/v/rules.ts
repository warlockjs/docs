import { get } from "@mongez/reinforcements";
import {
  isEmail,
  isEmpty,
  isNumeric,
  isPlainObject,
} from "@mongez/supportive-is";
import dayjs from "dayjs";
import { isIP } from "net";
import { UploadedFile } from "./../../http/UploadedFile";
import { Upload } from "./../../modules/uploads/models/upload";
import { type BaseValidator } from "./schema";
import type { SchemaContext, SchemaRule } from "./types";
import { VALID_RULE, invalidRule, setKeyPath } from "./utils";
export * from "./database";

export const requiredRule: SchemaRule = {
  name: "required",
  defaultErrorMessage: "The :input is required",
  requiresValue: false,
  sortOrder: -2, // make sure this rule is executed first
  async validate(value: any, context) {
    if (isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredWithRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredWith",
  description: "The field is required if another field is present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const fieldValue = get(context.allValues, otherField);

    if ([undefined, null].includes(fieldValue)) {
      return VALID_RULE;
    }

    if (isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredWithAllRule: SchemaRule<{
  fields: string[];
}> = {
  name: "requiredWithAll",
  description: "The field is required if all other fields are present",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fields = this.context.options.fields;

    for (const field of fields) {
      const fieldValue = get(context.allValues, field);

      if ([undefined, null].includes(fieldValue)) {
        return VALID_RULE;
      }
    }

    if (isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfAbsentRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredIfAbsent",
  description: "The field is required if another field is absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const fieldValue = get(context.allValues || {}, otherField);
    const isPresent = ![undefined, null].includes(fieldValue);

    if (!isPresent && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldIsAbsentRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredIfSiblingFieldIsAbsent",
  description: "The :input is required",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: ":input field is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const otherFieldValue = get(context.parent, otherField);
    const isPresent = ![undefined, null].includes(otherFieldValue);

    if (!isPresent && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldAbsentRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredIfSiblingFieldAbsent",
  description:
    "The field is required if another field in same parent context is absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const fieldValue = get(context.parent, otherField);
    const isPresent = ![undefined, null].includes(fieldValue);

    if (!isPresent && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldIsOneOf: SchemaRule<{
  field: string;
  values: any[];
}> = {
  name: "requiredIfSiblingFieldIsOneOf",
  description:
    "The field is required if another field in same parent context is one of the following values",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = get(context.parent, otherField);

    if (
      this.context.options.values.includes(otherFieldValue) &&
      isEmpty(value)
    ) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldIsNotOneOf: SchemaRule<{
  field: string;
  values: any[];
}> = {
  name: "requiredIfSiblingFieldIsNotOneOf",
  description:
    "The field is required if another field in same parent context is not one of the following values",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = get(context.parent, otherField);

    if (
      !this.context.options.values.includes(otherFieldValue) &&
      isEmpty(value)
    ) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldIsOneOfAbsentRule: SchemaRule<{
  field: string;
  values: any[];
}> = {
  name: "requiredIfSiblingFieldIsOneOfAbsent",
  description:
    "The field is required if another field in same parent context is one of the following values and is absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = get(context.parent, otherField);

    if (
      this.context.options.values.includes(otherFieldValue) &&
      isEmpty(value)
    ) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldIsNotOneOfAbsentRule: SchemaRule<{
  field: string;
  values: any[];
}> = {
  name: "requiredIfSiblingFieldIsNotOneOfAbsent",
  description:
    "The field is required if another field in same parent context is not one of the following values and is absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = get(context.parent, otherField);

    if (
      !this.context.options.values.includes(otherFieldValue) &&
      isEmpty(value)
    ) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfAllAbsentRule: SchemaRule<{
  fields: string[];
}> = {
  name: "requiredIfAllAbsent",
  description: "The field is required if all other fields are absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fields = this.context.options.fields;

    let isPresent = false;

    for (const field of fields) {
      const fieldValue = get(context.allValues, field);

      if (![undefined, null].includes(fieldValue)) {
        isPresent = true;
        break;
      }
    }

    if (!isPresent && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};
export const requiredIfSiblingFieldAllAbsentRule: SchemaRule<{
  fields: string[];
}> = {
  name: "requiredIfSiblingFieldAllAbsent",
  description: "The field is required if all other fields are absent",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fields = this.context.options.fields;

    let isPresent = false;

    for (const field of fields) {
      const fieldValue = get(context.parent, field);

      if (![undefined, null].includes(fieldValue)) {
        isPresent = true;
        break;
      }
    }

    if (!isPresent && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfEmptyRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredIfEmpty",
  description: "The field is required if another field is empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const fieldValue = get(context.allValues, otherField);

    if (isEmpty(fieldValue) && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

// required if sibling field is empty
export const requiredIfSiblingFieldEmptyRule: SchemaRule<{
  field: string;
}> = {
  name: "requiredIfSiblingFieldEmpty",
  description:
    "The field is required if another field in same parent context is empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    const fieldValue = get(context.parent, otherField);

    if (isEmpty(fieldValue) && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfAllEmptyRule: SchemaRule<{
  fields: string[];
}> = {
  name: "requiredIfAllEmpty",
  description: "The field is required if all other fields are empty",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const fields = this.context.options.fields;

    let allEmpty = true;

    for (const field of fields) {
      const fieldValue = get(context.allValues, field);

      if (!isEmpty(fieldValue)) {
        allEmpty = false;
        break;
      }
    }

    if (allEmpty && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfFieldRule: SchemaRule<{
  field: string;
  value: any;
}> = {
  name: "requiredIfField",
  description: "The field is required if another field has a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = this.context.options.value;

    if (otherField === undefined) {
      throw new Error("The field option is required for requiredIfField rule");
    }

    const fieldValue = get(context.allValues, otherField);

    if (fieldValue === otherFieldValue && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredIfSiblingFieldRule: SchemaRule<{
  field: string;
  value: any;
}> = {
  name: "requiredIfSiblingField",
  description:
    "The field is required if another field in same parent context has a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = this.context.options.value;

    const parentValues = context.parent;

    const fieldValue = get(parentValues, otherField);

    if (fieldValue === otherFieldValue && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredUnlessFieldRule: SchemaRule<{
  field: string;
  value: any;
}> = {
  name: "requiredUnlessField",
  description:
    "The field is required unless another field has a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = this.context.options.value;

    const fieldValue = get(context.allValues, otherField);

    if (fieldValue !== otherFieldValue && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const requiredUnlessSiblingFieldRule: SchemaRule<{
  field: string;
  value: any;
}> = {
  name: "requiredUnlessSiblingField",
  description:
    "The field is required unless another field in same parent context has a specific value",
  sortOrder: -2,
  requiresValue: false,
  defaultErrorMessage: "The :input is required",
  async validate(value: any, context) {
    const otherField = this.context.options.field;
    const otherFieldValue = this.context.options.value;

    const parentValues = context.parent;

    const fieldValue = get(parentValues, otherField);

    if (fieldValue !== otherFieldValue && isEmpty(value)) {
      return invalidRule(this, context);
    }

    return VALID_RULE;
  },
};

export const objectRule: SchemaRule = {
  name: "object",
  defaultErrorMessage: "The :input must be an object",
  async validate(value: any, context) {
    if (isPlainObject(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

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

export const inRule: SchemaRule<{
  values: any[];
}> = {
  name: "in",
  defaultErrorMessage:
    "The :input must be one of the following values: :options",
  async validate(value: any[], context) {
    if (this.context.options.values.includes(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const enumRule: SchemaRule<{
  enum: any;
}> = {
  name: "enum",
  defaultErrorMessage:
    "The :input must be one of the following values: :options",
  async validate(value: any, context) {
    const enumObject = this.context.options.enum;
    const enumValues = Object.values(enumObject);

    if (enumValues.includes(value)) {
      return VALID_RULE;
    }

    this.context.options.enum = enumValues.join(", ");

    return invalidRule(this, context);
  },
};

export const notInRule: SchemaRule<{
  values: any[];
}> = {
  name: "notIn",
  defaultErrorMessage:
    "The :input must not be one of the following values: :options",
  async validate(value: any, context) {
    if (!this.context.options.values.includes(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const withoutWhitespaceRule: SchemaRule = {
  name: "withoutWhitespace",
  defaultErrorMessage: "The :input must not contain whitespace",
  async validate(value: any, context) {
    if (!/\s/.test(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minWordsRule: SchemaRule<{
  minWords: number;
}> = {
  name: "minWords",
  defaultErrorMessage: `The :input must be at least :minWords words`,
  async validate(value: any, context) {
    if (
      String(value || "").split(" ").length >= this.context.options.minWords
    ) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxWordsRule: SchemaRule<{
  maxWords: number;
}> = {
  name: "maxWords",
  defaultErrorMessage: `The :input must be at most :maxWords words`,
  async validate(value: any, context) {
    if (
      String(value || "").split(" ").length <= this.context.options.maxWords
    ) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const wordsRule: SchemaRule<{
  words: number;
}> = {
  name: "words",
  defaultErrorMessage: `The :input must be exactly :words words`,
  async validate(value: any, context) {
    if (String(value || "").split(" ").length === this.context.options.words) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minLengthRule: SchemaRule<{
  minLength: number;
}> = {
  name: "minLength",
  defaultErrorMessage: `The :input must be at least :minLength characters long`,
  async validate(value: any, context) {
    if (String(value || "").length >= this.context.options.minLength) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxLengthRule: SchemaRule<{
  maxLength: number;
}> = {
  name: "maxLength",
  defaultErrorMessage: `The :input must not exceed :maxLength characters`,
  async validate(value: any, context) {
    if (String(value || "").length <= this.context.options.maxLength) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const lengthRule: SchemaRule<{
  length: number;
}> = {
  name: "length",
  defaultErrorMessage: `The :input must be exactly :length characters long`,
  async validate(value: any, context) {
    if (String(value || "").length === this.context.options.length) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minRule: SchemaRule<{
  min: number;
}> = {
  name: "min",
  defaultErrorMessage: `The :input must be at least :min`,
  async validate(value: any, context) {
    if (value >= this.context.options.min) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxRule: SchemaRule<{
  max: number;
}> = {
  name: "max",
  defaultErrorMessage: `The :input must equal to or less than :max`,
  async validate(value: any, context) {
    if (value <= this.context.options.max) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const betweenRule: SchemaRule<{
  min: number;
  max: number;
}> = {
  name: "between",
  defaultErrorMessage: `The :input must be between :min and :max`,
  async validate(value: any, context) {
    if (
      value >= this.context.options.min &&
      value <= this.context.options.max
    ) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const presentRule: SchemaRule = {
  name: "present",
  defaultErrorMessage: "The :input must be present",
  async validate(value: any, context) {
    if (value !== undefined) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const equalRule: SchemaRule<{
  value: any;
}> = {
  name: "equal",
  defaultErrorMessage: `The :input must be equal to :value`,
  async validate(input: any, context) {
    if (input === this.context.options.value) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const emailRule: SchemaRule = {
  name: "email",
  defaultErrorMessage: "The :input must be a valid email address",
  async validate(value: any, context) {
    if (isEmail(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const scalarRule: SchemaRule = {
  name: "scalar",
  defaultErrorMessage: "The :input must be a scalar value",
  async validate(value: any, context) {
    // a valid value considered to beb either a string, number, or boolean
    if (["string", "number", "boolean"].includes(typeof value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const unknownKeyRule: SchemaRule<{
  schema: Record<string, any>;
  allowedKeys?: string[];
  key?: string;
}> = {
  name: "unknownKey",
  sortOrder: -1,
  defaultErrorMessage: "The :input contains unknown properties",
  async validate(value: any, context) {
    const schema = this.context.options.schema;
    const allowedKeys = this.context.options.allowedKeys || [];

    for (const key in value) {
      if (!schema[key] && !allowedKeys.includes(key)) {
        this.context.options.key = setKeyPath(context.path, key);
        const newContext = {
          ...context,
          key,
          path: setKeyPath(context.path, key),
        };

        return invalidRule(this, newContext);
      }
    }

    return VALID_RULE;
  },
};

export const matchesRule: SchemaRule<{
  field: string;
}> = {
  name: "matches",
  defaultErrorMessage: "The :input must match the :field",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    if (value === get(context.allValues, otherField)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const confirmedRule: SchemaRule<{
  field: string;
}> = {
  name: "confirmed",
  defaultErrorMessage: "The :input must be confirmed",
  async validate(value: any, context) {
    const otherField = `${this.context.options.field}_confirmation`;

    if (value === get(context.allValues, otherField)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const differentRule: SchemaRule<{
  field: string;
}> = {
  name: "different",
  defaultErrorMessage: "The :input must be different from :field",
  async validate(value: any, context) {
    const otherField = this.context.options.field;

    if (value !== get(context.allValues, otherField)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const dateRule: SchemaRule<{
  format?: string;
}> = {
  name: "date",
  defaultErrorMessage: "The :input must be a valid date",
  async validate(value: any, context) {
    const format = this.context.options.format;

    // use dayjs for date validation
    if (format) {
      const date = dayjs(value, format);

      if (date.isValid()) {
        return VALID_RULE;
      }

      return invalidRule(this, context);
    }

    if (new Date(value).toString() !== "Invalid Date") {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

// Must be used with Date mutator
export const minDateRule: SchemaRule<{
  minDate: Date;
}> = {
  name: "minDate",
  description: "The field must be at least the given date",
  defaultErrorMessage: `The :input must be at least :minDate`,
  async validate(value: Date, context) {
    if (value >= this.context.options.minDate) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

// Must be used with Date mutator
export const maxDateRule: SchemaRule<{
  maxDate: Date;
}> = {
  name: "maxDate",
  defaultErrorMessage: `The :input must be at most :maxDate`,
  async validate(value: Date, context) {
    if (value <= this.context.options.maxDate) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const urlRule: SchemaRule = {
  name: "url",
  defaultErrorMessage: "The :input must be a valid URL",
  async validate(value: any, context) {
    try {
      new URL(value);
      return VALID_RULE;
    } catch (error) {
      return invalidRule(this, context);
    }
  },
};

export const ipRule: SchemaRule = {
  name: "ip",
  defaultErrorMessage: "The :input must be a valid IP address",
  async validate(value: any, context) {
    const result = isIP(value);

    if (result !== 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const ip4Rule: SchemaRule = {
  name: "ip4",
  defaultErrorMessage: "The :input must be a valid IPv4 address",
  async validate(value: any, context) {
    const result = isIP(value);

    if (result === 4) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const ip6Rule: SchemaRule = {
  name: "ip6",
  defaultErrorMessage: "The :input must be a valid IPv6 address",
  async validate(value: any, context) {
    const result = isIP(value);

    if (result === 6) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const isNumericRule: SchemaRule = {
  name: "isNumeric",
  defaultErrorMessage: "The :input must be a numeric value",
  async validate(value: any, context) {
    if (isNumeric(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const startsWithRule: SchemaRule<{
  value: string;
}> = {
  name: "startsWith",
  defaultErrorMessage: "The :input must start with :value",
  async validate(value: any, context) {
    if (value.startsWith(this.context.options.value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const endsWithRule: SchemaRule<{
  value: string;
}> = {
  name: "endsWith",
  defaultErrorMessage: "The :input must end with :value",
  async validate(value: any, context) {
    if (value.endsWith(this.context.options.value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const containsRule: SchemaRule<{
  value: string;
}> = {
  name: "contains",
  defaultErrorMessage: "The :input must contain :value",
  async validate(value: any, context) {
    if (value.includes(this.context.options.value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const notContainsRule: SchemaRule<{
  value: string;
}> = {
  name: "notContains",
  defaultErrorMessage: "The :input must not contain :value",
  async validate(value: any, context) {
    if (!value.includes(this.context.options.value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const alphaRule: SchemaRule = {
  name: "alpha",
  defaultErrorMessage: "The :input must contain only alphabetic characters",
  async validate(value: any, context) {
    if (/^[a-zA-Z]+$/.test(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const alphaNumericRule: SchemaRule = {
  name: "alphaNumeric",
  errorMessage:
    "The :input must contain only alphabetic and numeric characters",
  async validate(value: any, context) {
    if (/^[a-zA-Z0-9]+$/.test(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const jsonRule: SchemaRule = {
  name: "json",
  defaultErrorMessage: "The :input must be a valid JSON string",
  async validate(value: string, context) {
    try {
      JSON.parse(value);
      return VALID_RULE;
    } catch (error) {
      return invalidRule(this, context);
    }
  },
};

export const patternRule: SchemaRule<{
  pattern: RegExp;
}> = {
  name: "pattern",
  defaultErrorMessage: "The :input does not match the pattern",
  async validate(value: any, context) {
    if (this.context.options.pattern.test(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const sumOfRule: SchemaRule<{
  fields: string[];
}> = {
  name: "sumOf",
  description: "The sum of the fields must be equal to the given value",
  defaultErrorMessage: "The sum of the fields must be equal to :value",
  async validate(value: any, context) {
    const fields = this.context.options.fields;

    let sum = 0;

    for (const field of fields) {
      sum += get(context.allValues, field);
    }

    if (sum === value) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const unionRule: SchemaRule<{
  types: BaseValidator[];
}> = {
  name: "union",
  defaultErrorMessage: "The :input must match one of the specified types",
  async validate(value: any, context) {
    for (const type of this.context.options.types) {
      const result = await type.validate(value, context);
      if (result.isValid) {
        return VALID_RULE;
      }
    }

    return invalidRule(this, context);
  },
};

export const intersectionRule: SchemaRule<{
  types: BaseValidator[];
}> = {
  name: "intersection",
  defaultErrorMessage: "The :input must match all of the specified types",
  async validate(value: any, context) {
    for (const type of this.context.options.types) {
      const result = await type.validate(value, context);

      if (!result.isValid) {
        return invalidRule(this, context);
      }
    }

    return VALID_RULE;
  },
};

export const moduloRule: SchemaRule<{
  value: number;
}> = {
  name: "modulo",
  defaultErrorMessage: "The :input must be a multiple of :value",
  async validate(value: any, context) {
    if (value % this.context.options.value === 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const isCreditCardRule: SchemaRule = {
  name: "isCreditCard",
  description: "The field must be a valid credit card number",
  defaultErrorMessage: "The :input must be a valid credit card number",
  async validate(value: any, context) {
    // Luhn algorithm
    const cardNumber = value.toString().replace(/\D/g, "");

    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 === 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const positiveRule: SchemaRule = {
  name: "positive",
  defaultErrorMessage: "The :input must be a positive number",
  async validate(value: any, context) {
    if (value > 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const negativeRule: SchemaRule = {
  name: "negative",
  defaultErrorMessage: "The :input must be a negative number",
  async validate(value: any, context) {
    if (value < 0) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

// unique for array
export const uniqueArrayRule: SchemaRule = {
  name: "uniqueArray",
  description: "The array must contain unique values",
  defaultErrorMessage: "The :input must contain unique values",
  async validate(value: any, context) {
    const uniqueValues = new Set(value);

    if (uniqueValues.size === value.length) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const domainUrl: SchemaRule = {
  name: "domainUrl",
  description: "The input must be a valid domain not a full URL",
  defaultErrorMessage: "The :input must be a valid domain",
  async validate(value: any, context) {
    if (value.match(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const uploadableRule: SchemaRule = {
  name: "uploadable",
  defaultErrorMessage: "The :input must be a valid uploadable hash id",
  async validate(value: any, context) {
    const hashExists = await Upload.aggregate().where("hash", value).exists();

    if (hashExists) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const fileRule: SchemaRule = {
  name: "file",
  defaultErrorMessage: "The :input must be a file",
  async validate(value: any, context) {
    if (value instanceof UploadedFile) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const fileTypeRule: SchemaRule<{
  mimeTypes: string | string[];
}> = {
  name: "fileType",
  defaultErrorMessage: "The :input must be a :types file",
  async validate(value: any, context) {
    let mimeTypes = this.context.options.mimeTypes;

    if (typeof mimeTypes === "string") {
      mimeTypes = [mimeTypes];
    }

    if (mimeTypes.includes(value.mimeType)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const fileExtensionRule: SchemaRule<{
  extensions: string | string[];
}> = {
  name: "fileExtension",
  errorMessage:
    "The :input must have one of the following extensions: :extensions",
  async validate(value: any, context) {
    let extensions = this.context.options.extensions;

    if (typeof extensions === "string") {
      extensions = [extensions];
    }

    if (extensions.includes(value.extension)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxFileSizeRule: SchemaRule<{
  maxFileSize: number;
}> = {
  name: "maxFileSize",
  defaultErrorMessage: "The :input must not exceed :maxFileSize",
  async validate(value: any, context) {
    if (value.size <= this.context.options.maxFileSize) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minFileSizeRule: SchemaRule<{
  minFileSize: number;
}> = {
  name: "minFileSize",
  defaultErrorMessage: "The :input must be at least :minFileSize",
  async validate(value: any, context) {
    if (value.size >= this.context.options.minFileSize) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const imageRule: SchemaRule = {
  name: "image",
  defaultErrorMessage: "The :input must be an image",
  async validate(value: any, context) {
    if (value instanceof UploadedFile && value.isImage) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minWidthRule: SchemaRule = {
  name: "minWidth",
  defaultErrorMessage: "The :input must be at least :minWidth pixels wide",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.width >= this.context.options.minWidth) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxWidthRule: SchemaRule<{
  maxWidth: number;
}> = {
  name: "maxWidth",
  defaultErrorMessage: "The :input must be at most :maxWidth pixels wide",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.width <= this.context.options.maxWidth) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const minHeightRule: SchemaRule<{
  minHeight: number;
}> = {
  name: "minHeight",
  defaultErrorMessage: "The :input must be at least :minHeight pixels tall",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.height >= this.context.options.minHeight) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const maxHeightRule: SchemaRule<{
  maxHeight: number;
}> = {
  name: "maxHeight",
  defaultErrorMessage: "The :input must be at most :maxHeight pixels tall",
  async validate(value: any, context) {
    const dimensions = await value.dimensions();

    if (dimensions.height <= this.context.options.maxHeight) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Check if the value is one of the allowed values
 */
export const allowedValuesRule: SchemaRule<{
  allowedValues: any[];
}> = {
  name: "arrayOfValues",
  errorMessage:
    "The :input must be an array containing only the allowed values: :allowedValues",
  async validate(value: any, context) {
    const allowedValues = this.context.options.allowedValues;

    // Check if the value is an array
    if (!Array.isArray(value)) {
      return invalidRule(this, context);
    }

    // Check if all elements in the array are allowed values
    const isValid = value.every(item => allowedValues.includes(item));

    if (isValid) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

/**
 * Value must not be any of the given values
 */
export const notAllowedValuesRule: SchemaRule<{
  notAllowedValues: any[];
}> = {
  name: "notAllowedValues",
  errorMessage:
    "The :input must not be any of the following values: :notAllowedValues",
  async validate(value: any, context) {
    const notAllowedValues = this.context.options.notAllowedValues;

    if (!notAllowedValues.includes(value)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

// Array rules

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

export const containsAllRule: SchemaRule<{
  values: any[];
}> = {
  name: "containsAll",
  defaultErrorMessage:
    "The :input must contain all of the following values: :values",
  async validate(value: any, context) {
    const values = this.context.options.values;

    const isValid = values.every(item => value.includes(item));

    if (isValid) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const containsAnyRule: SchemaRule<{
  values: any[];
}> = {
  name: "containsAny",
  errorMessage:
    "The :input must contain at least one of the following values: :values",
  async validate(value: any, context) {
    const values = this.context.options.values;

    const isValid = values.some(item => value.includes(item));

    if (isValid) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

// End of Array rules

// Color rules
const colorValidationRegex = {
  hex: /^#([0-9a-f]{3}){1,2}$/i,
  rgb: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
  rgba: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0?\.\d+)\)$/,
  hsl: /^hsl\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
  light: /^#([0-9a-f]{3}){1,2}$/i,
  dark: /^#([0-9a-f]{3}){1,2}$/i,
};

export const rgbColorRule: SchemaRule = {
  name: "rgbColor",
  defaultErrorMessage: "The :input must be a valid RGB color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.rgb)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const rgbaColorRule: SchemaRule = {
  name: "rgbaColor",
  defaultErrorMessage: "The :input must be a valid RGBA color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.rgba)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const hexColorRule: SchemaRule = {
  name: "hexColor",
  defaultErrorMessage: "The :input must be a valid hex color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.hex)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const hslColorRule: SchemaRule = {
  name: "hslColor",
  defaultErrorMessage: "The :input must be a valid HSL color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.hsl)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const lightColorRule: SchemaRule = {
  name: "lightColor",
  defaultErrorMessage: "The :input must be a light color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.light)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const darkColorRule: SchemaRule = {
  name: "darkColor",
  defaultErrorMessage: "The :input must be a dark color",
  async validate(value: any, context) {
    if (value.match(colorValidationRegex.dark)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const colorRule: SchemaRule = {
  name: "color",
  defaultErrorMessage: "The :input must be a valid color",
  async validate(value: any, context) {
    if (
      value.match(colorValidationRegex.hex) ||
      value.match(colorValidationRegex.rgb) ||
      value.match(colorValidationRegex.rgba) ||
      value.match(colorValidationRegex.hsl)
    ) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const forbiddenRule: SchemaRule = {
  name: "forbidden",
  defaultErrorMessage: "The :input is forbidden",
  async validate(_value: any, context) {
    return invalidRule(this, context);
  },
};

/**
 * When rule applies a condition validation rule based on another field value
 */
export const whenRule: SchemaRule<{
  field: string;
  is: Record<string, BaseValidator>;
  otherwise?: BaseValidator;
  local?: boolean;
}> = {
  name: "when",
  description:
    "Apply conditional validation rules based on another field value",
  async validate(value: any, context) {
    const { field, is, otherwise, local } = this.context.options;

    const parent = local ? context.parent : context.allValues;
    const fieldValue = get(parent, field);

    const condition = is[fieldValue] || otherwise;

    if (condition) {
      const result = await condition.validate(value, context);
      if (!result.isValid) {
        return {
          isValid: false,
          error: result.errors[0].error,
          input: result.errors[0].input,
          path: context.path,
        };
      }
    }

    return VALID_RULE;
  },
};

const compare = (
  value: any,
  expectedValue: any,
  comparisonType: "gt" | "lt" | "gte" | "lte",
  type: "number" | "date",
) => {
  if (type === "number") {
    if (comparisonType === "gt") {
      return value > expectedValue;
    } else if (comparisonType === "lt") {
      return value < expectedValue;
    } else if (comparisonType === "gte") {
      return value >= expectedValue;
    } else if (comparisonType === "lte") {
      return value <= expectedValue;
    }
  } else if (type === "date") {
    if (comparisonType === "gt") {
      return value > expectedValue;
    } else if (comparisonType === "lt") {
      return value < expectedValue;
    } else if (comparisonType === "gte") {
      return value >= expectedValue;
    } else if (comparisonType === "lte") {
      return value <= expectedValue;
    }
  }

  return false;
};

const getComparedValueFrom = (
  expectedValue: any,
  context: SchemaContext,
  compareTo: "value" | "siblingField" | "globalField",
  field?: string,
): any => {
  if (compareTo === "siblingField") {
    return get(context.parent, field!);
  } else if (compareTo === "globalField") {
    return get(context.allValues, field!);
  }

  return expectedValue;
};

// Now let's add less than | greater than | less than or equal to | greater than or equal to rules
// also we need to declare them with compared to sibling fields and global fields, so each one of them will have three rules

export const lessThanRule: SchemaRule<{
  expectedValue?: number | Date;
  compareTo: "value" | "siblingField" | "globalField";
  field?: string;
  type: "number" | "date";
}> = {
  name: "lessThan",
  defaultErrorMessage: "The :input must be less than :number",
  async validate(value: any, context) {
    const { expectedValue, compareTo, field, type } = this.context.options;

    const comparedToValue = getComparedValueFrom(
      expectedValue,
      context,
      compareTo,
      field,
    );

    if (compare(value, comparedToValue, "lt", type)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const greaterThanRule: SchemaRule<{
  expectedValue?: number | Date;
  compareTo: "value" | "siblingField" | "globalField";
  field?: string;
  type: "number" | "date";
}> = {
  name: "greaterThan",
  defaultErrorMessage: "The :input must be greater than :number",
  async validate(value: any, context) {
    const { expectedValue, compareTo, field, type } = this.context.options;

    const comparedToValue = getComparedValueFrom(
      expectedValue,
      context,
      compareTo,
      field,
    );

    if (compare(value, comparedToValue, "gt", type)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const lessThanOrEqualRule: SchemaRule<{
  expectedValue?: number | Date;
  compareTo: "value" | "siblingField" | "globalField";
  field?: string;
  type: "number" | "date";
}> = {
  name: "lessThanOrEqual",
  defaultErrorMessage: "The :input must be less than or equal to :number",
  async validate(value: any, context) {
    const { expectedValue, compareTo, field, type } = this.context.options;

    const comparedToValue = getComparedValueFrom(
      expectedValue,
      context,
      compareTo,
      field,
    );

    if (compare(value, comparedToValue, "lte", type)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};

export const greaterThanOrEqualRule: SchemaRule<{
  expectedValue?: number | Date;
  compareTo: "value" | "siblingField" | "globalField";
  field?: string;
  type: "number" | "date";
}> = {
  name: "greaterThanOrEqual",
  defaultErrorMessage: "The :input must be greater than or equal to :number",
  async validate(value: any, context) {
    const { expectedValue, compareTo, field, type } = this.context.options;

    const comparedToValue = getComparedValueFrom(
      expectedValue,
      context,
      compareTo,
      field,
    );

    if (compare(value, comparedToValue, "gte", type)) {
      return VALID_RULE;
    }

    return invalidRule(this, context);
  },
};
