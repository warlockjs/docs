import { get } from "@mongez/reinforcements";
import { isEmptyValue } from "../helpers/is-empty-value";
import type { Mutator } from "../types";

/** Reverse array order */
export const flipArrayMutator: Mutator = async (value) => {
  return value.reverse();
};

/** Reverse array order (alias) */
export const reverseArrayMutator: Mutator = async (value) => {
  return value.reverse();
};

/** Sort array */
export const sortArrayMutator: Mutator = async (value, context) => {
  if (!Array.isArray(value)) return value;

  const sortDirection = context?.options.direction ?? "asc";
  const sortByKey = context?.options.key ?? null;

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

/** Make array have only unique values */
export const uniqueArrayMutator: Mutator = async (value) => {
  return [...new Set(value)];
};

/** Remove empty elements from array */
export const removeEmptyArrayElementsMutator: Mutator = async (value) => {
  return value.filter((item: any) => !isEmptyValue(item));
};
