import { beforeEach, describe, expect, it } from "vitest";
import { DatabaseDirtyTracker } from "../../src/database-dirty-tracker";

describe("DatabaseDirtyTracker", () => {
  let tracker: DatabaseDirtyTracker;

  beforeEach(() => {
    tracker = new DatabaseDirtyTracker({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    });
  });

  describe("constructor", () => {
    it("should initialize with snapshot data", () => {
      expect(tracker.hasChanges()).toBe(false);
    });

    it("should handle empty initialization", () => {
      const emptyTracker = new DatabaseDirtyTracker({});
      expect(emptyTracker.hasChanges()).toBe(false);
    });
  });

  describe("mergeChanges", () => {
    it("should detect simple field changes", () => {
      tracker.mergeChanges({ name: "Jane Doe" });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toEqual(["name"]);
    });

    it("should detect multiple field changes", () => {
      tracker.mergeChanges({ name: "Jane Doe", email: "jane@example.com" });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("name");
      expect(tracker.getDirtyColumns()).toContain("email");
    });

    it("should detect nested field changes with dot notation", () => {
      const nestedTracker = new DatabaseDirtyTracker({
        user: { profile: { age: 25 } },
      });

      nestedTracker.mergeChanges({ "user.profile.age": 26 });

      expect(nestedTracker.hasChanges()).toBe(true);
      expect(nestedTracker.getDirtyColumns()).toContain("user.profile.age");
    });

    it("should not mark field as dirty if value is the same", () => {
      tracker.mergeChanges({ name: "John Doe" });

      expect(tracker.hasChanges()).toBe(false);
    });

    it("should handle null values", () => {
      tracker.mergeChanges({ email: null });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("email");
    });

    it("should handle undefined to value change", () => {
      tracker.mergeChanges({ newField: "new value" });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("newField");
    });
  });

  describe("getDirtyColumns", () => {
    it("should return only changed columns", () => {
      tracker.mergeChanges({ name: "Jane Doe" });

      const dirtyColumns = tracker.getDirtyColumns();
      expect(dirtyColumns).toEqual(["name"]);
      expect(dirtyColumns).not.toContain("email");
    });

    it("should return empty array when no changes", () => {
      expect(tracker.getDirtyColumns()).toEqual([]);
    });
  });

  describe("getDirtyColumnsWithValues", () => {
    it("should return columns with old and new values", () => {
      tracker.mergeChanges({ name: "Jane Doe" });

      const dirtyData = tracker.getDirtyColumnsWithValues();
      expect(dirtyData).toHaveProperty("name");
      expect(dirtyData.name).toEqual({
        oldValue: "John Doe",
        newValue: "Jane Doe",
      });
    });
  });

  describe("hasChanges", () => {
    it("should return false when no changes", () => {
      expect(tracker.hasChanges()).toBe(false);
    });

    it("should return true after modification", () => {
      tracker.mergeChanges({ name: "Jane Doe" });
      expect(tracker.hasChanges()).toBe(true);
    });
  });

  describe("unset", () => {
    it("should mark column as removed", () => {
      tracker.unset("email");

      expect(tracker.getRemovedColumns()).toContain("email");
    });

    it("should handle multiple unset calls", () => {
      tracker.unset("email");
      tracker.unset("name");

      const removed = tracker.getRemovedColumns();
      expect(removed).toContain("email");
      expect(removed).toContain("name");
    });
  });

  describe("getRemovedColumns", () => {
    it("should return unset columns", () => {
      tracker.unset("email");
      expect(tracker.getRemovedColumns()).toEqual(["email"]);
    });

    it("should return empty array when no columns removed", () => {
      expect(tracker.getRemovedColumns()).toEqual([]);
    });
  });

  describe("replaceCurrentData", () => {
    it("should replace current data and recompute diff against baseline", () => {
      // Initial: { id: 1, name: "John Doe", email: "john@example.com" }
      tracker.mergeChanges({ name: "Jane Doe" });

      // Replace current data entirely
      tracker.replaceCurrentData({ name: "Bob", email: "bob@example.com", id: 1 });

      // Should show changes compared to original baseline
      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("name");
      expect(tracker.getDirtyColumns()).toContain("email");
    });
  });

  describe("edge cases", () => {
    it("should handle large nested objects correctly", () => {
      const largeTracker = new DatabaseDirtyTracker({
        deep: {
          nested: {
            object: {
              value: 123,
            },
          },
        },
      });

      largeTracker.mergeChanges({ "deep.nested.object.value": 456 });

      expect(largeTracker.hasChanges()).toBe(true);
    });

    it("should handle arrays correctly", () => {
      const arrayTracker = new DatabaseDirtyTracker({
        tags: ["javascript", "typescript"],
      });

      arrayTracker.mergeChanges({ tags: ["javascript", "typescript", "node"] });

      expect(arrayTracker.hasChanges()).toBe(true);
    });

    it("should handle empty arrays as values", () => {
      const tracker = new DatabaseDirtyTracker({ items: [] });
      tracker.mergeChanges({ items: ["new item"] });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("items");
    });

    it.skip("should handle function values", () => {
      const fn = () => "test";
      const tracker = new DatabaseDirtyTracker({ callback: fn });

      expect(tracker.hasChanges()).toBe(false);

      // Change to a different function
      tracker.mergeChanges({ callback: () => "different" });
      expect(tracker.hasChanges()).toBe(true);
    });

    it("should deep merge nested objects", () => {
      const tracker = new DatabaseDirtyTracker({
        user: {
          profile: { name: "Alice", age: 25 },
          settings: { theme: "dark" },
        },
      });

      // Merge nested change - should preserve other nested properties
      tracker.mergeChanges({
        user: { profile: { age: 26 } },
      });

      expect(tracker.hasChanges()).toBe(true);
      expect(tracker.getDirtyColumns()).toContain("user.profile.age");
    });

    it("should handle unset on non-existent path", () => {
      const tracker = new DatabaseDirtyTracker({ name: "Alice" });

      // Should not throw when unsetting a path that doesn't exist
      expect(() => tracker.unset("nonexistent.deeply.nested.path")).not.toThrow();
      expect(tracker.hasChanges()).toBe(false);
    });

    it("should handle unset on null in path", () => {
      const tracker = new DatabaseDirtyTracker({
        data: null,
      });

      // Should not throw when path contains null
      expect(() => tracker.unset("data.nested")).not.toThrow();
    });

    it("should handle unset on nested path that becomes null", () => {
      const tracker = new DatabaseDirtyTracker({
        level1: { level2: { level3: "value" } },
      });

      tracker.mergeChanges({ level1: { level2: null } });

      // Now try to unset a path under the null
      expect(() => tracker.unset("level1.level2.level3")).not.toThrow();
    });

    it("should handle unsetting array elements by index", () => {
      const tracker = new DatabaseDirtyTracker({
        items: ["a", "b", "c"],
      });

      // Unset element at index 1
      tracker.unset("items.1");

      expect(tracker.hasChanges()).toBe(true);
    });

    it("should handle unsetting with non-numeric array index", () => {
      const tracker = new DatabaseDirtyTracker({
        items: ["a", "b", "c"],
      });

      // Try to unset with invalid index
      expect(() => tracker.unset("items.invalid")).not.toThrow();
    });

    it("should handle isDirty check for specific column", () => {
      const tracker = new DatabaseDirtyTracker({ name: "Alice", email: "a@b.com" });
      tracker.mergeChanges({ name: "Bob" });

      expect(tracker.isDirty("name")).toBe(true);
      expect(tracker.isDirty("email")).toBe(false);
    });

    it.skip("should handle Date objects", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-06-01");

      const tracker = new DatabaseDirtyTracker({ createdAt: date1 });
      tracker.mergeChanges({ createdAt: date2 });

      expect(tracker.hasChanges()).toBe(true);
    });

    it("should handle unset with array of columns", () => {
      const tracker = new DatabaseDirtyTracker({
        field1: "value1",
        field2: "value2",
        field3: "value3",
      });

      tracker.unset(["field1", "field2"]);

      const removed = tracker.getRemovedColumns();
      expect(removed).toContain("field1");
      expect(removed).toContain("field2");
      expect(removed).not.toContain("field3");
    });

    it("should handle reset with new data", () => {
      const tracker = new DatabaseDirtyTracker({ name: "Alice" });
      tracker.mergeChanges({ name: "Bob" });

      expect(tracker.hasChanges()).toBe(true);

      // Reset with new baseline
      tracker.reset({ name: "Charlie", age: 30 });

      expect(tracker.hasChanges()).toBe(false);

      // Now changes are measured against new baseline
      tracker.mergeChanges({ name: "David" });
      const dirty = tracker.getDirtyColumnsWithValues();
      expect(dirty.name?.oldValue).toBe("Charlie");
    });

    it("should handle deeply nested arrays", () => {
      const tracker = new DatabaseDirtyTracker({
        data: {
          matrix: [
            [1, 2],
            [3, 4],
          ],
        },
      });

      tracker.mergeChanges({
        data: {
          matrix: [
            [1, 2],
            [3, 5],
          ],
        },
      });

      expect(tracker.hasChanges()).toBe(true);
    });

    it("should handle primitive values at root when trying to flatten", () => {
      // This tests the flatten function's guard for non-objects
      const tracker = new DatabaseDirtyTracker({});
      tracker.mergeChanges({ value: 123 });

      expect(tracker.hasChanges()).toBe(true);
    });

    it("should handle objects with undefined values", () => {
      const tracker = new DatabaseDirtyTracker({ name: undefined });
      tracker.mergeChanges({ name: "Alice" });

      expect(tracker.hasChanges()).toBe(true);
    });

    it("should handle replacing value with undefined", () => {
      const tracker = new DatabaseDirtyTracker({ name: "Alice" });
      tracker.mergeChanges({ name: undefined });

      expect(tracker.hasChanges()).toBe(true);
    });
  });
});
