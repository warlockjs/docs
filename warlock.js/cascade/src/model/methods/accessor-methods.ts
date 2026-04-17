import { get, merge, only, set, unset } from "@mongez/reinforcements";
import type { Model } from "../model";

/**
 * Sentinel symbol to distinguish a genuinely missing field from a field
 * whose value is `undefined`. Encapsulated here — callers use `hasField()`.
 */
const MISSING_VALUE = Symbol("missing");

export function getFieldValue(model: Model, field: string, defaultValue?: unknown): any {
  return get(model.data, field, defaultValue);
}

export function setFieldValue(model: Model, field: string, value: unknown): Model {
  const path = String(field);
  set(model.data, path, value);

  const partial: Record<string, unknown> = {};
  set(partial, path, value);
  model.dirtyTracker.mergeChanges(partial);

  return model;
}

export function hasField(model: Model, field: string): boolean {
  return get(model.data, field, MISSING_VALUE as any) !== MISSING_VALUE;
}

export function incrementField(model: Model, field: string, amount?: number): Model {
  const value = getFieldValue(model, field, 0) as number;
  const incrementedValue = value + (amount ?? 1);
  return setFieldValue(model, field, incrementedValue);
}

export function decrementField(model: Model, field: string, amount?: number): Model {
  const value = getFieldValue(model, field, 0) as number;
  const decrementedValue = value - (amount ?? 1);
  return setFieldValue(model, field, decrementedValue);
}

export function unsetFields(model: Model, ...fields: string[]): Model {
  model.data = unset(model.data, fields);
  model.dirtyTracker.unset(fields);

  return model;
}

export function mergeFields(model: Model, values: Record<string, unknown>): Model {
  model.data = merge(model.data, values) as any;
  model.dirtyTracker.mergeChanges(values);
  return model;
}

export function getOnlyFields(model: Model, fields: string[]): Record<string, unknown> {
  return only(model.data, fields);
}

export function getStringField(model: Model, key: string, defaultValue?: string): string | undefined {
  return getFieldValue(model, key, defaultValue) as string | undefined;
}

export function getNumberField(model: Model, key: string, defaultValue?: number): number | undefined {
  return getFieldValue(model, key, defaultValue) as number | undefined;
}

export function getBooleanField(model: Model, key: string, defaultValue?: boolean): boolean | undefined {
  return getFieldValue(model, key, defaultValue) as boolean | undefined;
}
