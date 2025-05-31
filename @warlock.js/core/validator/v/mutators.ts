import { capitalize, get, round, trim } from "@mongez/reinforcements";
import { isEmpty, isPlainObject } from "@mongez/supportive-is";
import { type Mutator } from "./types";

export const dateMutator: Mutator = async date => {
  return new Date(date);
};

export const trimMutator: Mutator = async (value, context) => {
  return trim(value.toString(), context.options.needle ?? " ");
};

export const lowercaseMutator: Mutator = async value => {
  return value.toString().toLowerCase();
};

export const uppercaseMutator: Mutator = async value => {
  return value.toString().toUpperCase();
};

export const capitalizeMutator: Mutator = async value => {
  return capitalize(value);
};

export const numberMutator: Mutator = async value => {
  if (!value) return value;

  return Number(value);
};

export const booleanMutator: Mutator = async value => {
  if (value === "true") return true;
  if (value === "false") return false;

  return Boolean(value);
};

export const stringMutator: Mutator = async value => {
  if (!value) return "";
  return value.toString();
};

export const jsonMutator: Mutator = async value => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const trimMultipleWhitespaceMutator: Mutator = async value => {
  return value.toString().replace(/\s+/g, " ");
};

export const safeHtmlMutator: Mutator = async value => {
  return value.toString().replace(/<[^>]*>?/gm, "");
};

export const htmlEscapeMutator: Mutator = async value => {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const removeSpecialCharactersMutator: Mutator = async value => {
  return value.toString().replace(/[^a-zA-Z0-9]/g, "");
};

export const urlDecodeMutator: Mutator = async value => {
  return decodeURIComponent(value);
};

export const roundNumberMutator: Mutator = async (value, context) => {
  return round(value, context.options.decimals ?? 2);
};

export const flipArrayMutator: Mutator = async value => {
  return value.reverse();
};

export const reverseArrayMutator: Mutator = async value => {
  return value.reverse();
};

export const sortArrayMutator: Mutator = async (value, context) => {
  if (!Array.isArray(value)) return value;

  const sortDirection = context.options.direction ?? "asc";
  const sortByKey = context.options.key ?? null;

  return value.sort((a: any, b: any) => {
    if (sortByKey) {
      const aValue = get(a, sortByKey);
      const bValue = get(b, sortByKey);

      if (sortDirection === "asc") {
        return aValue - bValue;
      }

      return bValue - aValue;
    }

    if (sortDirection === "asc") {
      return a - b;
    }

    return b - a;
  });
};

export const uniqueArrayMutator: Mutator = async value => {
  return [...new Set(value)];
};

export const removeEmptyArrayElementsMutator: Mutator = async value => {
  return value.filter((item: any) => !isEmpty(item));
};

// Works only with objects
export const stripUnknownMutator: Mutator = async (value, context) => {
  const allowedKeys = [
    ...(context.ctx.schema ? Object.keys(context.ctx.schema) : []),
    ...(context.options.allowedKeys ?? []),
  ];

  const result: Record<string, any> = {};

  for (const key in value) {
    if (allowedKeys.includes(key)) {
      result[key] = value[key];
    }
  }

  return result;
};

export const objectTrimMutator: Mutator = async (value, context) => {
  if (!isPlainObject(value)) return value;

  const result: Record<string, any> = {};
  const recursive = context.options.recursive ?? false;

  for (const key in value) {
    const item = value[key];

    if (recursive) {
      if (Array.isArray(item)) {
        result[key] = await Promise.all(
          item.map(async (i: any) =>
            typeof i === "string"
              ? trim(i)
              : await objectTrimMutator(i, context),
          ),
        );
      } else if (isPlainObject(item)) {
        result[key] = await objectTrimMutator(item, context);
      } else {
        result[key] = typeof item === "string" ? trim(item) : item;
      }
    } else {
      result[key] = typeof item === "string" ? trim(item) : item;
    }
  }

  return result;
};
