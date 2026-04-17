import { trim } from "@mongez/reinforcements";
import { isPlainObject } from "@mongez/supportive-is";
import type { Mutator } from "../types";

/** Strip unknown keys from object */
export const stripUnknownMutator: Mutator = async (value, context) => {
  const allowedKeys = [
    ...(context?.ctx.schema ? Object.keys(context.ctx.schema) : []),
    ...(context?.options.allowedKeys ?? []),
  ];

  const result: Record<string, any> = {};

  for (const key in value) {
    if (allowedKeys.includes(key)) {
      result[key] = value[key];
    }
  }

  return result;
};

/** Trim all string values in object */
export const objectTrimMutator: Mutator = async (value, context) => {
  if (!isPlainObject(value)) return value;

  const result: Record<string, any> = {};
  const recursive = context?.options.recursive ?? false;

  for (const key in value) {
    const item = value[key];

    if (recursive) {
      if (Array.isArray(item)) {
        result[key] = await Promise.all(
          item.map(async (i: any) =>
            typeof i === "string" ? trim(i) : await objectTrimMutator(i, context),
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

/** Parse JSON string */
export const jsonMutator: Mutator = async (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
