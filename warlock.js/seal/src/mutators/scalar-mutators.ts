import type { Mutator } from "../types";

export const stringMutator: Mutator = async (value) => {
  if ([undefined, null].includes(value)) {
    return value;
  }

  return String(value);
};
