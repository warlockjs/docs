import {
  capitalize,
  ltrim,
  readMoreChars,
  rtrim,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  toStudlyCase,
  trim,
} from "@mongez/reinforcements";
import type { Mutator } from "../types";

/** Convert string to lowercase */
export const lowercaseMutator: Mutator = async (value) => {
  return value?.toString().toLowerCase();
};

/** Convert string to uppercase */
export const uppercaseMutator: Mutator = async (value) => {
  return value?.toString().toUpperCase();
};

/** Capitalize only the first letter of the string */
export const capitalizeMutator: Mutator = async (value) => {
  const str = value?.toString();
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/** Capitalize the first letter of each word (Title Case) */
export const titleCaseMutator: Mutator = async (value) => {
  return capitalize(value?.toString());
};

/** Convert value to string */
export const stringifyMutator: Mutator = async (value) => {
  if (!value && value !== 0) return "";
  // only convert numbers, boolean and strings

  // Handle strings (pass through)
  if (typeof value === "string") return value;

  // Handle scalar types (number, boolean)
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
};

/** Trim whitespace */
export const trimMutator: Mutator = async (value, context) => {
  return trim(value?.toString(), context?.options?.needle ?? " ");
};

/** Remove HTML tags (safe HTML) */
export const safeHtmlMutator: Mutator = async (value) => {
  return value?.toString().replace(/<[^>]*>?/gm, "");
};

/** HTML escape */
export const htmlEscapeMutator: Mutator = async (value) => {
  return value
    ?.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/** Remove special characters */
export const removeSpecialCharactersMutator: Mutator = async (value) => {
  return value?.toString().replace(/[^a-zA-Z0-9]/g, "");
};

/** URL decode */
export const urlDecodeMutator: Mutator = async (value) => {
  return decodeURIComponent(value);
};

/** URL encode */
export const urlEncodeMutator: Mutator = async (value) => {
  return encodeURIComponent(value);
};

/** Convert to camelCase */
export const camelCaseMutator: Mutator = async (value) => {
  return toCamelCase(value?.toString());
};

/** Convert to PascalCase */
export const pascalCaseMutator: Mutator = async (value) => {
  return toStudlyCase(value?.toString());
};

/** Convert to snake_case */
export const snakeCaseMutator: Mutator = async (value) => {
  return toSnakeCase(value?.toString());
};

/** Convert to kebab-case */
export const kebabCaseMutator: Mutator = async (value) => {
  return toKebabCase(value?.toString());
};

/** Convert to URL-friendly slug */
export const slugMutator: Mutator = async (value) => {
  return value
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/** Trim from the left/start */
export const ltrimMutator: Mutator = async (value, context) => {
  return ltrim(value?.toString(), context?.options?.needle ?? " ");
};

/** Trim from the right/end */
export const rtrimMutator: Mutator = async (value, context) => {
  return rtrim(value?.toString(), context?.options?.needle ?? " ");
};

/** Base64 encode */
export const base64EncodeMutator: Mutator = async (value) => {
  return Buffer.from(value?.toString()).toString("base64");
};

/** Base64 decode */
export const base64DecodeMutator: Mutator = async (value) => {
  return Buffer.from(value?.toString(), "base64").toString("utf-8");
};

/** Replace substring or pattern */
export const replaceMutator: Mutator = async (value, context) => {
  const { search, replace } = context?.options;
  if (!search) return value?.toString();
  return value?.toString().replace(search, replace ?? "");
};

/** Replace all occurrences of substring or pattern */
export const replaceAllMutator: Mutator = async (value, context) => {
  const { search, replace } = context?.options;
  if (!search) return value?.toString();
  const searchValue = typeof search === "string" ? new RegExp(search, "g") : search;
  return value?.toString().replace(searchValue, replace ?? "");
};

/** Append/suffix text to the end */
export const appendMutator: Mutator = async (value, context) => {
  const suffix = context?.options?.suffix ?? "";
  return value?.toString() + suffix;
};

/** Prepend/prefix text to the beginning */
export const prependMutator: Mutator = async (value, context) => {
  const prefix = context?.options?.prefix ?? "";
  return prefix + value?.toString();
};

/** Reverse the string */
export const reverseMutator: Mutator = async (value) => {
  return value?.toString().split("").reverse().join("");
};

/** Truncate to a maximum length */
export const truncateMutator: Mutator = async (value, context) => {
  const str = value?.toString();
  const maxLength = context?.options?.maxLength ?? 100;
  const suffix = context?.options?.suffix ?? "...";
  return readMoreChars(str, maxLength, suffix);
};

/** Trim multiple whitespace into single space */
export const trimMultipleWhitespaceMutator: Mutator = async (value) => {
  return value?.toString().replace(/\s+/g, " ");
};

/** Pad string from the start to reach target length */
export const padStartMutator: Mutator = async (value, context) => {
  const length = context?.options?.length ?? 0;
  const char = context?.options?.char ?? " ";
  return value?.toString().padStart(length, char);
};

/** Pad string from the end to reach target length */
export const padEndMutator: Mutator = async (value, context) => {
  const length = context?.options?.length ?? 0;
  const char = context?.options?.char ?? " ";
  return value?.toString().padEnd(length, char);
};

/** Repeat string N times */
export const repeatMutator: Mutator = async (value, context) => {
  const count = context?.options?.count ?? 1;
  return value?.toString()?.repeat(count);
};

/** Mask part of string */
export const maskMutator: Mutator = async (value, context) => {
  const str = value?.toString();
  const maskChar = context?.options?.char ?? "*";
  const start = context?.options?.start ?? 0;
  const end = context?.options?.end ?? str?.length;
  const visibleStart = str?.substring(0, start);
  const visibleEnd = str?.substring(end);
  const maskedLength = end - start;
  return visibleStart + maskChar.repeat(maskedLength) + visibleEnd;
};

/** Unescape HTML entities */
export const unescapeHtmlMutator: Mutator = async (value) => {
  return value
    ?.toString()
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

/** Keep only alphabetic characters */
export const alphaOnlyMutator: Mutator = async (value) => {
  return value.toString().replace(/[^a-zA-Z]/g, "");
};

/** Keep only alphanumeric characters */
export const alphanumericOnlyMutator: Mutator = async (value) => {
  return value.toString().replace(/[^a-zA-Z0-9]/g, "");
};

/** Remove all numeric characters */
export const removeNumbersMutator: Mutator = async (value) => {
  return value.toString().replace(/[0-9]/g, "");
};
