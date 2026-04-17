import { round } from "@mongez/reinforcements";
import { isNumeric } from "@mongez/supportive-is";
import type { Mutator } from "../types";

/** Convert value to number */
export const numberMutator: Mutator = async (value) => {
  if (!value) return value;
  return Number(value);
};

/** Round number to specified decimals */
export const roundNumberMutator: Mutator = async (value, context) => {
  return round(value, context?.options?.decimals ?? 2);
};

/** Convert to boolean */
export const booleanMutator: Mutator = async (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(value);
};

export const numericMutator: Mutator = async (value) => {
  if (!isNumeric(value)) return value;
  return Number(value);
};

/** Absolute value mutator */
export const absMutator: Mutator = async (value) => {
  return Math.abs(Number(value));
};

/** Ceil mutator */
export const ceilMutator: Mutator = async (value) => {
  return Math.ceil(Number(value));
};

/** Floor mutator */
export const floorMutator: Mutator = async (value) => {
  return Math.floor(Number(value));
};

/**
 * Round mutator
 * Supports decimal precision via options.decimals
 */
export const roundMutator: Mutator = async (value, context) => {
  const decimals = context?.options?.decimals ?? 0;
  // If decimals is 0, use standard Math.round for integers
  if (decimals === 0) {
    return Math.round(Number(value));
  }
  // Otherwise use reinforcements round helper for precision
  return round(Number(value), decimals);
};

/** To fixed mutator */
export const toFixedMutator: Mutator = async (value, context) => {
  const decimals = context?.options?.decimals ?? 2;
  return Number(value).toFixed(decimals);
};
