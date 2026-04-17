import type { Model } from "../model";

export function checkHasChanges(model: Model): boolean {
  return model.dirtyTracker.hasChanges();
}

export function checkIsDirty(model: Model, column: string): boolean {
  return model.dirtyTracker.isDirty(column);
}

export function getDirtyColumnsWithValues(model: Model): Record<string, { oldValue: unknown; newValue: unknown }> {
  return model.dirtyTracker.getDirtyColumnsWithValues();
}

export function getRemovedColumns(model: Model): string[] {
  return model.dirtyTracker.getRemovedColumns();
}

export function getDirtyColumns(model: Model): string[] {
  return model.dirtyTracker.getDirtyColumns();
}
