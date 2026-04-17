import {
  alphaOnlyMutator,
  alphanumericOnlyMutator,
  appendMutator,
  base64DecodeMutator,
  base64EncodeMutator,
  camelCaseMutator,
  capitalizeMutator,
  htmlEscapeMutator,
  kebabCaseMutator,
  lowercaseMutator,
  ltrimMutator,
  maskMutator,
  padEndMutator,
  padStartMutator,
  pascalCaseMutator,
  prependMutator,
  removeNumbersMutator,
  removeSpecialCharactersMutator,
  repeatMutator,
  replaceAllMutator,
  replaceMutator,
  reverseMutator,
  rtrimMutator,
  safeHtmlMutator,
  slugMutator,
  snakeCaseMutator,
  stringifyMutator,
  titleCaseMutator,
  trimMultipleWhitespaceMutator,
  trimMutator,
  truncateMutator,
  unescapeHtmlMutator,
  uppercaseMutator,
  urlDecodeMutator,
  urlEncodeMutator,
} from "../mutators";
import {
  alphaNumericRule,
  alphaRule,
  betweenLengthRule,
  colorRule,
  containsRule,
  darkColorRule,
  emailRule,
  endsWithRule,
  hexColorRule,
  hslColorRule,
  ip4Rule,
  ip6Rule,
  ipRule,
  isCreditCardRule,
  isNumericRule,
  lengthRule,
  lightColorRule,
  maxLengthRule,
  maxWordsRule,
  minLengthRule,
  minWordsRule,
  notContainsRule,
  patternRule,
  rgbColorRule,
  rgbaColorRule,
  startsWithRule,
  stringRule,
  strongPasswordRule,
  urlRule,
  withoutWhitespaceRule,
  wordsRule,
} from "../rules";
import { PrimitiveValidator } from "./primitive-validator";
import { applyNullable, getRuleOptions } from "../standard-schema/json-schema";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";

/**
 * String validator class
 */
export class StringValidator extends PrimitiveValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(stringRule, errorMessage);
  }

  /**
   * Check if value is a string type
   */
  public matchesType(value: any): boolean {
    return typeof value === "string";
  }

  // ==================== Mutators ====================

  /**
   * Stringify the value if not a string
   */
  public toString() {
    return this.addMutator(stringifyMutator);
  }

  /** Convert string to uppercase */
  public uppercase() {
    return this.addMutator(uppercaseMutator);
  }

  /** Convert string to lowercase */
  public lowercase() {
    return this.addMutator(lowercaseMutator);
  }

  /** Capitalize only the first letter of the string */
  public capitalize() {
    return this.addMutator(capitalizeMutator);
  }

  /** Capitalize the first letter of each word (Title Case) */
  public titleCase() {
    return this.addMutator(titleCaseMutator);
  }

  /** Convert to camelCase */
  public camelCase() {
    return this.addMutator(camelCaseMutator);
  }

  /** Convert to PascalCase */
  public pascalCase() {
    return this.addMutator(pascalCaseMutator);
  }

  /** Convert to snake_case */
  public snakeCase() {
    return this.addMutator(snakeCaseMutator);
  }

  /** Convert to kebab-case */
  public kebabCase() {
    return this.addMutator(kebabCaseMutator);
  }

  /**
   * Trim the given needle from the string
   * If no needle is provided, the default is a single space
   */
  public trim(needle?: string) {
    return this.addMutator(trimMutator, { needle });
  }

  /** Trim from the left/start */
  public ltrim(needle?: string) {
    return this.addMutator(ltrimMutator, { needle });
  }

  /** Trim from the right/end */
  public rtrim(needle?: string) {
    return this.addMutator(rtrimMutator, { needle });
  }

  /** Trim multiple whitespace into single space */
  public trimMultipleWhitespace() {
    return this.addMutator(trimMultipleWhitespaceMutator);
  }

  /** Pad string from the start to reach target length */
  public padStart(length: number, char = " ") {
    return this.addMutator(padStartMutator, { length, char });
  }

  /** Pad string from the end to reach target length */
  public padEnd(length: number, char = " ") {
    return this.addMutator(padEndMutator, { length, char });
  }

  /** Remove HTML tags (safe HTML) */
  public safeHtml() {
    return this.addMutator(safeHtmlMutator);
  }

  /** HTML escape special characters */
  public htmlEscape() {
    return this.addMutator(htmlEscapeMutator);
  }

  /** Unescape HTML entities */
  public unescapeHtml() {
    return this.addMutator(unescapeHtmlMutator);
  }

  /**
   * Remove special characters
   * This will remove all characters that are not alphanumeric or whitespace
   */
  public removeSpecialCharacters() {
    return this.addMutator(removeSpecialCharactersMutator);
  }

  /** Convert to only alphabetic characters */
  public toAlpha() {
    return this.addMutator(alphaOnlyMutator);
  }

  /** Convert to only alphanumeric characters */
  public toAlphanumeric() {
    return this.addMutator(alphanumericOnlyMutator);
  }

  /** Remove all numeric characters */
  public removeNumbers() {
    return this.addMutator(removeNumbersMutator);
  }

  /** URL decode */
  public urlDecode() {
    return this.addMutator(urlDecodeMutator);
  }

  /** URL encode */
  public urlEncode() {
    return this.addMutator(urlEncodeMutator);
  }

  /** Convert to URL-friendly slug */
  public slug() {
    return this.addMutator(slugMutator);
  }

  /** Base64 encode */
  public base64Encode() {
    return this.addMutator(base64EncodeMutator);
  }

  /** Base64 decode */
  public base64Decode() {
    return this.addMutator(base64DecodeMutator);
  }

  /** Replace substring or pattern */
  public replace(search: string | RegExp, replace: string) {
    return this.addMutator(replaceMutator, { search, replace });
  }

  /** Replace all occurrences of substring or pattern */
  public replaceAll(search: string | RegExp, replace: string) {
    return this.addMutator(replaceAllMutator, { search, replace });
  }

  /** Append/suffix text to the end */
  public append(suffix: string) {
    return this.addMutator(appendMutator, { suffix });
  }

  /** Prepend/prefix text to the beginning */
  public prepend(prefix: string) {
    return this.addMutator(prependMutator, { prefix });
  }

  /** Reverse the string */
  public reverse() {
    return this.addMutator(reverseMutator);
  }

  /** Truncate to a maximum length */
  public truncate(maxLength: number, suffix = "...") {
    return this.addMutator(truncateMutator, { maxLength, suffix });
  }

  /** Repeat string N times */
  public repeat(count: number) {
    return this.addMutator(repeatMutator, { count });
  }

  /** Mask part of string */
  public mask(start: number, end?: number, char = "*") {
    return this.addMutator(maskMutator, { start, end, char });
  }

  // ==================== Validation Rules ====================

  /** Value must be a valid email */
  public email(errorMessage?: string) {
    return this.addRule(emailRule, errorMessage);
  }

  /** Value must be a valid URL */
  public url(errorMessage?: string) {
    return this.addRule(urlRule, errorMessage);
  }

  /** Value can not have whitespace */
  public withoutWhitespace(errorMessage?: string) {
    return this.addRule(withoutWhitespaceRule, errorMessage);
  }

  /** Value must match the given pattern */
  public pattern(pattern: RegExp, errorMessage?: string) {
    return this.addRule(patternRule, errorMessage, { pattern });
  }

  /**
   * Value must be a strong password
   * Requirements:
   * - At least 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character
   */
  public strongPassword(minLength?: number, errorMessage?: string) {
    return this.addRule(strongPasswordRule, errorMessage, { minLength });
  }

  /** Value must be exactly the given number of words */
  public words(words: number, errorMessage?: string) {
    return this.addRule(wordsRule, errorMessage, { words });
  }

  /** Value must be at least the given number of words */
  public minWords(words: number, errorMessage?: string) {
    return this.addRule(minWordsRule, errorMessage, { minWords: words });
  }

  /** Value must be at most the given number of words */
  public maxWords(words: number, errorMessage?: string) {
    return this.addRule(maxWordsRule, errorMessage, { maxWords: words });
  }

  /** Value length must be greater than the given length */
  public minLength(length: number, errorMessage?: string) {
    return this.addRule(minLengthRule, errorMessage, { minLength: length });
  }

  /** @alias minLength */
  public min(min: number, errorMessage?: string) {
    return this.minLength(min, errorMessage);
  }

  /** Value length must be less than the given length */
  public maxLength(length: number, errorMessage?: string) {
    return this.addRule(maxLengthRule, errorMessage, { maxLength: length });
  }

  /** @alias maxLength */
  public max(max: number, errorMessage?: string) {
    return this.maxLength(max, errorMessage);
  }

  /** Value must be of the given length */
  public length(length: number, errorMessage?: string) {
    return this.addRule(lengthRule, errorMessage, { length });
  }

  /**
   * String length must be between min and max (inclusive)
   *
   * @param min - Minimum length (inclusive)
   * @param max - Maximum length (inclusive)
   *
   * @example
   * ```ts
   * v.string().between(5, 10)  // Length: 5 to 10 characters
   * v.string().lengthBetween(8, 20)  // Same using alias
   * ```
   *
   * @category Validation Rule
   */
  public lengthBetween(min: number, max: number, errorMessage?: string) {
    return this.addRule(betweenLengthRule, errorMessage, {
      minLength: min,
      maxLength: max,
    });
  }

  /** Allow only alphabetic characters */
  public alpha(errorMessage?: string) {
    return this.addRule(alphaRule, errorMessage);
  }

  /** Allow only alphanumeric characters */
  public alphanumeric(errorMessage?: string) {
    return this.addRule(alphaNumericRule, errorMessage);
  }

  /** Allow only numeric characters */
  public numeric(errorMessage?: string) {
    return this.addRule(isNumericRule, errorMessage);
  }

  /** Value must starts with the given string */
  public startsWith(value: string, errorMessage?: string) {
    return this.addRule(startsWithRule, errorMessage, { value });
  }

  /** Value must ends with the given string */
  public endsWith(value: string, errorMessage?: string) {
    return this.addRule(endsWithRule, errorMessage, { value });
  }

  /** Value must contain the given string */
  public contains(value: string, errorMessage?: string) {
    return this.addRule(containsRule, errorMessage, { value });
  }

  /** Value must not contain the given string */
  public notContains(value: string, errorMessage?: string) {
    return this.addRule(notContainsRule, errorMessage, { value });
  }

  /** Value must be a valid IP address */
  public ip(errorMessage?: string) {
    return this.addRule(ipRule, errorMessage);
  }

  /** Value must be a valid IPv4 address */
  public ip4(errorMessage?: string) {
    return this.addRule(ip4Rule, errorMessage);
  }

  /** Value must be a valid IPv6 address */
  public ip6(errorMessage?: string) {
    return this.addRule(ip6Rule, errorMessage);
  }

  /** Check if the string matches a credit card number */
  public creditCard(errorMessage?: string) {
    return this.addRule(isCreditCardRule, errorMessage);
  }

  /** Determine if the value is a valid color */
  public color(errorMessage?: string) {
    return this.addRule(colorRule, errorMessage);
  }

  /** Determine if the value is a valid hex color */
  public hexColor(errorMessage?: string) {
    return this.addRule(hexColorRule, errorMessage);
  }

  /** Determine if the value is a valid HSL color */
  public hslColor(errorMessage?: string) {
    return this.addRule(hslColorRule, errorMessage);
  }

  /** Determine if the value is a valid RGB color */
  public rgbColor(errorMessage?: string) {
    return this.addRule(rgbColorRule, errorMessage);
  }

  /** Determine if the value is a valid RGBA color */
  public rgbaColor(errorMessage?: string) {
    return this.addRule(rgbaColorRule, errorMessage);
  }

  /** Determine if the value is a valid light color */
  public lightColor(errorMessage?: string) {
    return this.addRule(lightColorRule, errorMessage);
  }

  /** Determine if the value is a valid dark color */
  public darkColor(errorMessage?: string) {
    return this.addRule(darkColorRule, errorMessage);
  }

  /**
   * @inheritdoc
   *
   * Maps String-specific rule options to JSON Schema keywords.
   * Non-representable rules (cross-field, refine, color rules, etc.) are silently omitted.
   *
   * @example
   * ```ts
   * v.string().min(2).max(100).email().toJsonSchema("draft-2020-12")
   * // → { type: "string", minLength: 2, maxLength: 100, format: "email" }
   * ```
   */
  public override toJsonSchema(target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    const schema: JsonSchemaResult = { type: "string" };

    // minLength / min
    const minOpts = getRuleOptions(this.rules, "minLength");
    if (minOpts?.minLength !== undefined) schema.minLength = minOpts.minLength;

    // maxLength / max
    const maxOpts = getRuleOptions(this.rules, "maxLength");
    if (maxOpts?.maxLength !== undefined) schema.maxLength = maxOpts.maxLength;

    // betweenLength covers both min and max in one rule
    const betweenOpts = getRuleOptions(this.rules, "betweenLength");
    if (betweenOpts) {
      if (betweenOpts.minLength !== undefined) schema.minLength = betweenOpts.minLength;
      if (betweenOpts.maxLength !== undefined) schema.maxLength = betweenOpts.maxLength;
    }

    // exact length
    const lengthOpts = getRuleOptions(this.rules, "length");
    if (lengthOpts?.length !== undefined) {
      schema.minLength = lengthOpts.length;
      schema.maxLength = lengthOpts.length;
    }

    // pattern (regex)
    const patternOpts = getRuleOptions(this.rules, "pattern");
    if (patternOpts?.pattern instanceof RegExp) {
      schema.pattern = patternOpts.pattern.source;
    }

    // format hints
    if (getRuleOptions(this.rules, "email") !== undefined ||
        this.rules.some(r => r.name === "email")) {
      schema.format = "email";
    } else if (this.rules.some(r => r.name === "url")) {
      schema.format = "uri";
    } else if (this.rules.some(r => r.name === "ip")) {
      schema.format = "ipv4";
    } else if (this.rules.some(r => r.name === "ip4")) {
      schema.format = "ipv4";
    } else if (this.rules.some(r => r.name === "ip6")) {
      schema.format = "ipv6";
    } else if (this.rules.some(r => r.name === "hexColor")) {
      schema.format = "color";
    }

    // enum (from PrimitiveValidator.in / .enum)
    const inOpts = getRuleOptions(this.rules, "in");
    if (inOpts?.values && Array.isArray(inOpts.values)) {
      schema.enum = inOpts.values;
    }

    if (this.isNullable) applyNullable(schema, target);

    return schema;
  }
}
