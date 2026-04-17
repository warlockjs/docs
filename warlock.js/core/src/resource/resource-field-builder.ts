import { isObject } from "@mongez/supportive-is";
import dayjs from "dayjs";
import { storage } from "../storage";
import { uploadsUrl, url } from "../utils/urls";
import { type LocalizedObject } from "./../utils/get-localized";
import { ResourceFieldBuilderDateOutputOptions, type ResourceOutputValueCastType } from "./types";

export class ResourceFieldBuilder {
  /**
   * Field value
   */
  protected fieldValue?: unknown;

  /**
   * Whether the value is nullable
   * If set to false and value is null, it will be returned as undefined
   */
  protected isNullable = false;

  /**
   * Whether this field is an array
   * When true, transform() maps over each element using the base type
   */
  protected isArrayField = false;

  /**
   * Default value
   */
  protected defaultValue?: unknown;

  /**
   * Date format
   */
  protected dateFormat = "DD-MM-YYYY hh:mm:ss A";

  /**
   * Input key
   */
  protected inputKeyToUse?: string;

  /**
   * Add a condition before transforming the value
   */
  protected condition?: () => boolean;

  /**
   * Define how date fields are returned
   * If type of the date options is string then it will be returned as a string
   * otherwise it will be returned as an object contains the date options
   */
  protected dateOptionsInput: ResourceFieldBuilderDateOutputOptions = {
    format: true,
    timestamp: true,
    timezone: false,
    locale: false,
    offset: false,
    humanTime: true,
    iso: true,
  };

  /**
   * Constructor
   */
  public constructor(protected readonly type: ResourceOutputValueCastType) {
    //
  }

  /**
   * Parse a cast type string (including suffixes) into a configured builder.
   * Suffix order: [] before ? (e.g. "string[]?")
   * Parsing strips right-to-left: ? first, then [].
   */
  public static fromCastType(castType: string): ResourceFieldBuilder {
    let baseType = castType;
    let nullable = false;
    let isArray = false;

    if (baseType.endsWith("?")) {
      nullable = true;
      baseType = baseType.slice(0, -1);
    }

    if (baseType.endsWith("[]")) {
      isArray = true;
      baseType = baseType.slice(0, -2);
    }

    const builder = new ResourceFieldBuilder(baseType as ResourceOutputValueCastType);
    if (nullable) builder.nullable();
    if (isArray) builder.array();
    return builder;
  }

  /**
   * Set input key
   * Will be used in transformation if provided
   */
  public setInputKey(key: string) {
    this.inputKeyToUse = key;

    return this;
  }

  /**
   * Add a condition before transforming the value
   */
  public when(condition: () => boolean) {
    this.condition = condition;
    return this;
  }

  /**
   * Set whether the value is nullable
   */
  public nullable() {
    this.isNullable = true;
    return this;
  }

  /**
   * Mark this field as an array
   * transform() will map over each element using the base type
   */
  public array() {
    this.isArrayField = true;
    return this;
  }

  /**
   * Get input key
   */
  public getInputKey() {
    return this.inputKeyToUse;
  }

  /**
   * Set default value
   */
  public default(value: unknown) {
    this.defaultValue = value;

    return this;
  }

  /**
   * Set field format
   */
  public format(format: string) {
    this.dateFormat = format;

    return this;
  }

  /**
   * Set date options
   * This will override current date options
   */
  public dateOptions(options: ResourceFieldBuilderDateOutputOptions) {
    this.dateOptionsInput = options;

    return this;
  }

  /**
   * Transform the value.
   * When isArrayField is true, maps over each element using transformSingleValue.
   */
  public transform(value: any, locale?: string) {
    if (this.isArrayField) {
      if (!Array.isArray(value)) {
        return this.isNullable ? null : [];
      }

      return value
        .map((item) => this.transformSingleValue(item, locale))
        .filter((v) => v !== undefined);
    }

    return this.transformSingleValue(value, locale);
  }

  /**
   * Transform a single value according to the base type.
   */
  protected transformSingleValue(value: any, locale?: string) {
    if (value === undefined || value === null) {
      return this.isNullable ? null : this.defaultValue;
    }

    if (this.condition && !this.condition()) {
      return this.isNullable ? null : this.defaultValue;
    }

    switch (this.type) {
      case "string":
        return String(value);
      case "number": {
        const num = Number(value);
        return isNaN(num) ? (this.isNullable ? null : undefined) : num;
      }
      case "boolean":
        return Boolean(value);
      case "float": {
        const float = parseFloat(value);
        return isNaN(float) ? (this.isNullable ? null : undefined) : float;
      }

      case "int": {
        const int = parseInt(value);
        return isNaN(int) ? (this.isNullable ? null : undefined) : int;
      }

      case "date":
        return this.transformDate(value as string | Date, locale);
      case "localized":
        return this.transformLocalized(value as LocalizedObject[], locale);
      case "url":
        return url(value as string);
      case "uploadsUrl":
        return uploadsUrl(value as string);
      case "storageUrl":
        return storage.url(value as string);
      case "object":
        return isObject(value) && !Array.isArray(value) && Object.keys(value).length > 0
          ? value
          : this.isNullable
            ? null
            : undefined;
      case "array":
        return Array.isArray(value) ? value : this.isNullable ? null : undefined;
    }
  }

  /**
   * Transform date value
   */
  protected transformDate(value: string | Date, locale?: string) {
    if (typeof this.dateOptionsInput === "string") {
      if (this.dateOptionsInput === "format") {
        return dayjs(value).format(this.dateFormat);
      }

      if (this.dateOptionsInput === "iso") {
        return dayjs(value).toISOString();
      }

      if (this.dateOptionsInput === "timestamp") {
        return dayjs(value).valueOf();
      }

      if (this.dateOptionsInput === "humanTime") {
        return (dayjs as any)(value).fromNow();
      }

      if (this.dateOptionsInput === "locale") {
        if (!locale) {
          return dayjs(value).format(this.dateFormat);
        }

        return dayjs(value).locale(locale).format(this.dateFormat);
      }
    }

    // now manage it as an object based on date options what's marked as true
    const output: {
      format?: string;
      timestamp?: number;
      humanTime?: string;
      locale?: string;
      iso?: string;
    } = {};

    let dayjsObject = dayjs((value as any)?.iso || value);

    if (locale) {
      dayjsObject = dayjsObject.locale(locale);
    }

    if (this.dateOptionsInput.iso) {
      output.iso = dayjsObject.toISOString();
    }

    if (this.dateOptionsInput.format) {
      output.format = dayjsObject.format(this.dateFormat);
    }

    if (this.dateOptionsInput.timestamp) {
      output.timestamp = dayjsObject.valueOf();
    }

    if (this.dateOptionsInput.humanTime) {
      output.humanTime = (dayjsObject as any).fromNow();
    }

    if (this.dateOptionsInput.locale) {
      output.locale = dayjsObject.format(this.dateFormat);
    }

    if (this.dateOptionsInput.iso) {
      output.iso = dayjsObject.toISOString();
    }

    return output;
  }

  /**
   * Transform localized value
   */
  protected transformLocalized(value: LocalizedObject[] | string, locale?: string) {
    if (typeof value === "string") {
      return value;
    }

    if (!locale) {
      return value[0]?.value || value;
    }

    return value.find((item) => item.localeCode === locale)?.value;
  }
}
