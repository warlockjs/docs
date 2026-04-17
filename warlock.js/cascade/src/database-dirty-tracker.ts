import { areEqual, clone } from "@mongez/reinforcements";
import { isPlainObject } from "@mongez/supportive-is";

function canBeFlatten(object: unknown): boolean {
  return isPlainObject(object);
}

/**
 * A fix for flatten as non-plain object is being flatten as well which it should not be
 */
function flatten(
  object: Record<string, unknown>,
  separator = ".",
  keepNestedOriginalObject = false,
  parent?: string,
  root: Record<string, unknown> = {},
) {
  if (canBeFlatten(object) === false) {
    return object;
  }
  // object = toPlainObject(object);
  for (const key of Object.keys(object)) {
    const value = object[key];
    const keyChain = parent ? parent + separator + key : key;
    if ((Array.isArray(value) && value.length === 0) || typeof value === "function") {
      root[keyChain] = value;
    } else if (canBeFlatten(value)) {
      if (keepNestedOriginalObject) {
        root[keyChain] = value;
      }
      flatten(
        value as Record<string, unknown>,
        separator,
        keepNestedOriginalObject,
        keyChain,
        root,
      );
    } else {
      root[keyChain] = value;
    }
  }
  return root;
}

/**
 * Flattened record type representing dot-notation paths mapped to their values.
 */
type FlatRecord = Record<string, unknown>;

/**
 * Represents the old and new values of a dirty column.
 */
type DirtyColumnValues = { oldValue: unknown; newValue: unknown };

/**
 * Tracks changes to model data by maintaining snapshots of initial and current state.
 *
 * The tracker stores both raw (nested) and flattened (dot-notation) versions of the data
 * to accurately detect modifications, additions, and removals at any nesting level.
 *
 * @example
 * ```typescript
 * const tracker = new DatabaseDirtyTracker({ name: "Alice", age: 30 });
 * tracker.mergeChanges({ age: 31 });
 * console.log(tracker.hasChanges()); // true
 * console.log(tracker.getDirtyColumns()); // ["age"]
 * console.log(tracker.getDirtyColumnsWithValues());
 * // { age: { oldValue: 30, newValue: 31 } }
 * ```
 */
export class DatabaseDirtyTracker {
  /**
   * The initial raw data snapshot taken at construction or last reset.
   * Used as the baseline for comparison.
   */
  protected initialRaw: Record<string, unknown>;

  /**
   * The current raw data snapshot reflecting all changes made via merge/unset.
   */
  protected currentRaw: Record<string, unknown>;

  /**
   * Flattened version of the initial data using dot-notation keys.
   * Example: { "address.city": "NYC" }
   */
  protected initialFlattened: FlatRecord;

  /**
   * Flattened version of the current data using dot-notation keys.
   */
  protected currentFlattened: FlatRecord;

  /**
   * Set of column names (dot-notation paths) that have been modified.
   */
  protected readonly dirtyColumns = new Set<string>();

  /**
   * Set of column names (dot-notation paths) that existed initially but have been removed.
   */
  protected readonly removedColumns = new Set<string>();

  public constructor(data: Record<string, unknown>) {
    this.initialRaw = this.cloneData(data);
    this.currentRaw = this.cloneData(data);

    this.initialFlattened = this.flattenData(this.initialRaw);
    this.currentFlattened = { ...this.initialFlattened };

    this.updateDirtyState();
  }

  /**
   * Returns the list of dirty columns using dot-notation.
   *
   * A column is considered dirty if its value has changed compared to the initial snapshot.
   *
   * @returns An array of column names (dot-notation paths) that have been modified
   *
   * @example
   * ```typescript
   * tracker.mergeChanges({ name: "Bob", "address.city": "LA" });
   * tracker.getDirtyColumns(); // ["name", "address.city"]
   * ```
   */
  public getDirtyColumns(): string[] {
    return Array.from(this.dirtyColumns);
  }

  /**
   * Determines whether there are any tracked changes.
   *
   * Returns `true` if any columns have been modified or removed since the initial snapshot.
   *
   * @returns `true` if there are changes, `false` otherwise
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice" });
   * tracker.hasChanges(); // false
   * tracker.mergeChanges({ name: "Bob" });
   * tracker.hasChanges(); // true
   * tracker.unset("name");
   * tracker.hasChanges(); // true (removed column counts as a change)
   * ```
   */
  public hasChanges(): boolean {
    return this.dirtyColumns.size > 0 || this.removedColumns.size > 0;
  }

  /**
   * Check if the given column is dirty (changed)
   */
  public isDirty(column: string): boolean {
    return this.dirtyColumns.has(column);
  }

  /**
   * Returns the set of columns that have been removed compared to the baseline.
   *
   * A column is considered removed if it existed in the initial snapshot but has been
   * explicitly unset or deleted from the current data.
   *
   * @returns An array of column names (dot-notation paths) that have been removed
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice", temp: "value" });
   * tracker.unset("temp");
   * tracker.getRemovedColumns(); // ["temp"]
   * ```
   */
  public getRemovedColumns(): string[] {
    return Array.from(this.removedColumns);
  }

  /**
   * Provides a mapping of dirty columns to their previous and current values.
   *
   * This is useful for generating audit logs, building partial update payloads,
   * or displaying change summaries to users.
   *
   * @returns A record mapping each dirty column to an object containing oldValue and newValue
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice", age: 30 });
   * tracker.mergeChanges({ age: 31 });
   * tracker.getDirtyColumnsWithValues();
   * // { age: { oldValue: 30, newValue: 31 } }
   * ```
   */
  public getDirtyColumnsWithValues(): Record<string, DirtyColumnValues> {
    const result: Record<string, DirtyColumnValues> = {};

    for (const column of this.dirtyColumns) {
      const hasCurrent =
        this.currentFlattened[column] !== undefined || column in this.currentFlattened;

      result[column] = {
        oldValue: this.initialFlattened[column],
        newValue: hasCurrent ? this.currentFlattened[column] : undefined,
      };
    }

    return result;
  }

  /**
   * Replaces the current data snapshot entirely and recomputes the diff.
   *
   * This is useful when you want to replace all current data with a new set,
   * while keeping the initial baseline for comparison.
   *
   * @param data - The new data to set as the current snapshot
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice" });
   * tracker.replaceCurrentData({ name: "Bob", email: "bob@example.com" });
   * tracker.getDirtyColumns(); // ["name", "email"]
   * ```
   */
  public replaceCurrentData(data: Record<string, unknown>): void {
    this.currentRaw = this.cloneData(data);
    this.currentFlattened = this.flattenData(this.currentRaw);
    this.updateDirtyState();
  }

  /**
   * Merges a partial payload into the current snapshot and recomputes the diff.
   *
   * This performs a deep merge, preserving existing nested structures while
   * updating only the specified fields.
   *
   * @param partial - Partial data to merge into the current snapshot
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice", address: { city: "NYC" } });
   * tracker.mergeChanges({ address: { zip: "10001" } });
   * // Current data: { name: "Alice", address: { city: "NYC", zip: "10001" } }
   * tracker.getDirtyColumns(); // ["address.zip"]
   * ```
   */
  public mergeChanges(partial: Record<string, unknown>): void {
    this.mergeIntoRaw(this.currentRaw, partial);
    this.currentFlattened = this.flattenData(this.currentRaw);
    this.updateDirtyState();
  }

  /**
   * Explicitly removes one or more columns from the current data.
   *
   * Supports both single column names and arrays of column names.
   * Columns can be specified using dot-notation for nested paths.
   *
   * @param columns - A single column name or an array of column names to remove
   *
   * @example
   * ```typescript
   * tracker.unset("tempField");
   * tracker.unset(["field1", "field2", "nested.field"]);
   * tracker.getRemovedColumns(); // ["tempField", "field1", "field2", "nested.field"]
   * ```
   */
  public unset(columns: string | string[]): void {
    const targets = Array.isArray(columns) ? columns : [columns];

    for (const path of targets) {
      this.deleteFromRaw(path);
    }

    this.currentFlattened = this.flattenData(this.currentRaw);
    this.updateDirtyState();
  }

  /**
   * Resets both the initial and current snapshots to the provided data.
   *
   * If no data is provided, the current snapshot becomes the new baseline.
   * This clears all tracked changes and removed columns.
   *
   * @param data - Optional new data to use as the baseline. If omitted, uses current data.
   *
   * @example
   * ```typescript
   * const tracker = new DatabaseDirtyTracker({ name: "Alice" });
   * tracker.mergeChanges({ name: "Bob" });
   * tracker.hasChanges(); // true
   * tracker.reset(); // Make current state the new baseline
   * tracker.hasChanges(); // false
   *
   * // Or reset to entirely new data:
   * tracker.reset({ name: "Charlie", age: 25 });
   * ```
   */
  public reset(data?: Record<string, unknown>): void {
    const source = data ?? this.currentRaw;
    this.initialRaw = this.cloneData(source);
    this.currentRaw = this.cloneData(source);

    this.initialFlattened = this.flattenData(this.initialRaw);
    this.currentFlattened = this.flattenData(this.currentRaw);

    this.dirtyColumns.clear();
    this.removedColumns.clear();
  }

  /**
   * Flattens the given data object.
   * Can be overridden by subclasses to change flattening behavior.
   */
  protected flattenData(data: Record<string, unknown>): FlatRecord {
    return flatten(data);
  }

  /**
   * Recomputes the dirty and removed column sets by comparing initial and current snapshots.
   *
   * This method is called internally after any operation that modifies the current data.
   * It iterates through all keys in both flattened snapshots and determines which columns
   * have been modified or removed.
   *
   * @protected
   */
  protected updateDirtyState(): void {
    this.dirtyColumns.clear();
    this.removedColumns.clear();

    const keys = new Set([
      ...Object.keys(this.initialFlattened),
      ...Object.keys(this.currentFlattened),
    ]);

    for (const key of keys) {
      const hasCurrent = this.currentFlattened[key] !== undefined || key in this.currentFlattened;
      const hasInitial = this.initialFlattened[key] !== undefined || key in this.initialFlattened;

      if (!hasCurrent && hasInitial) {
        this.removedColumns.add(key);
      }

      const initialValue = this.initialFlattened[key];
      const currentValue = hasCurrent ? this.currentFlattened[key] : undefined;

      if (!areEqual(initialValue, currentValue)) {
        this.dirtyColumns.add(key);
      }
    }
  }

  /**
   * Recursively merges source object into target object, performing a deep merge.
   *
   * For nested objects, the merge is recursive. For arrays and primitives, the source
   * value replaces the target value. All values are cloned to prevent reference sharing.
   *
   * @param target - The object to merge into
   * @param source - The object to merge from
   * @private
   */
  protected mergeIntoRaw(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        target[key] &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        this.mergeIntoRaw(target[key] as Record<string, unknown>, value as Record<string, unknown>);
        continue;
      }

      target[key] = this.cloneData(value);
    }
  }

  /**
   * Deletes a field from the current raw data using a dot-notation path.
   *
   * Supports nested paths (e.g., "address.city") and array indices (e.g., "items.0").
   * If any segment in the path doesn't exist, the operation is a no-op.
   *
   * @param path - The dot-notation path to the field to delete
   * @private
   */
  protected deleteFromRaw(path: string): void {
    const segments = path.split(".");
    let container: unknown = this.currentRaw;

    for (let index = 0; index < segments.length - 1; index += 1) {
      if (container === undefined || container === null) {
        return;
      }

      container = this.resolveSegment(container, segments[index]);
    }

    if (container === undefined || container === null) {
      return;
    }

    const lastSegment = segments[segments.length - 1];
    if (Array.isArray(container)) {
      const numericIndex = Number(lastSegment);
      if (!Number.isNaN(numericIndex)) {
        container.splice(numericIndex, 1);
      }
      return;
    }

    if (typeof container === "object") {
      delete (container as Record<string, unknown>)[lastSegment];
    }
  }

  /**
   * Resolves a single segment of a dot-notation path within a container.
   *
   * Handles both object property access and array index access.
   *
   * @param container - The object or array to access
   * @param segment - The property name or array index as a string
   * @returns The value at the specified segment, or undefined if not found
   * @private
   */
  protected resolveSegment(container: unknown, segment: string): unknown {
    if (Array.isArray(container)) {
      const numericIndex = Number(segment);
      if (Number.isNaN(numericIndex)) {
        return undefined;
      }

      return container[numericIndex];
    }

    if (container && typeof container === "object") {
      return (container as Record<string, unknown>)[segment];
    }

    return undefined;
  }

  /**
   * Creates a deep clone of the provided data.
   *
   * @param data - The data to clone
   * @returns A deep clone of the data
   * @private
   */
  protected cloneData<T>(data: T): T {
    return clone(data);
  }
}
