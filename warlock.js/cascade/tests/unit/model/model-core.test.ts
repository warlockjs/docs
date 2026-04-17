import { describe, expect, it } from "vitest";
import { Model } from "../../../src/model/model";
import { RegisterModel } from "../../../src/model/register-model";

// Test model for basic operations
@RegisterModel()
class TestUser extends Model {
  static table = "test_users";
  static primaryKey = "id";
  static createdAtColumn = "createdAt";
  static updatedAtColumn = "updatedAt";
}

// Test model with custom primary key
@RegisterModel()
class CustomPKModel extends Model {
  static table = "custom_pk";
  static primaryKey = "_id";
}

// Test model with soft deletes
@RegisterModel()
class SoftDeleteModel extends Model {
  static table = "soft_delete_test";
  static deleteStrategy = "soft" as const;
  static deletedAtColumn = "deletedAt";
}

describe("Model Core", () => {
  describe("constructor", () => {
    it("should create instance with empty data", () => {
      const user = new TestUser();
      expect(user).toBeInstanceOf(Model);
      expect(user).toBeInstanceOf(TestUser);
    });

    it("should create instance with initial data", () => {
      const user = new TestUser({ name: "Alice", email: "alice@example.com" });
      expect(user.get("name")).toBe("Alice");
      expect(user.get("email")).toBe("alice@example.com");
    });

    it("should initialize dirty tracker", () => {
      const user = new TestUser({ name: "Bob" });
      expect(user.hasChanges()).toBe(false);
    });
  });

  describe("get()", () => {
    it("should get top-level field value", () => {
      const user = new TestUser({ name: "Charlie" });
      expect(user.get("name")).toBe("Charlie");
    });

    it("should return undefined for missing field", () => {
      const user = new TestUser();
      expect(user.get("name")).toBeUndefined();
    });

    it("should return default value for missing field", () => {
      const user = new TestUser();
      expect(user.get("name", "Default")).toBe("Default");
    });

    it("should support dot notation for nested fields", () => {
      const user = new TestUser({
        address: { city: "NYC", zip: "10001" },
      });
      expect(user.get("address.city")).toBe("NYC");
    });

    it("should return default for missing nested field", () => {
      const user = new TestUser({ address: {} });
      expect(user.get("address.city", "Unknown")).toBe("Unknown");
    });
  });

  describe("set()", () => {
    it("should set top-level field value", () => {
      const user = new TestUser();
      user.set("name", "Diana");
      expect(user.get("name")).toBe("Diana");
    });

    it("should mark field as dirty", () => {
      const user = new TestUser({ name: "Eve" });
      user.set("name", "Frank");
      expect(user.hasChanges()).toBe(true);
    });

    it("should support method chaining", () => {
      const user = new TestUser();
      user.set("name", "Grace").set("email", "grace@example.com").set("age", 25);
      expect(user.get("name")).toBe("Grace");
      expect(user.get("email")).toBe("grace@example.com");
      expect(user.get("age")).toBe(25);
    });

    it("should support dot notation for nested fields", () => {
      const user = new TestUser();
      user.set("address.city", "LA");
      expect(user.get("address.city")).toBe("LA");
    });
  });

  describe("has()", () => {
    it("should return true for existing field", () => {
      const user = new TestUser({ name: "Henry" });
      expect(user.has("name")).toBe(true);
    });

    it("should return false for missing field", () => {
      const user = new TestUser();
      expect(user.has("name")).toBe(false);
    });

    it("should support dot notation", () => {
      const user = new TestUser({ address: { city: "Boston" } });
      expect(user.has("address.city")).toBe(true);
      expect(user.has("address.country")).toBe(false);
    });
  });

  describe("unset()", () => {
    it("should remove field from data", () => {
      const user = new TestUser({ name: "Ivy", email: "ivy@example.com" });
      user.unset("email");
      expect(user.has("email")).toBe(false);
    });

    it("should support multiple fields", () => {
      const user = new TestUser({ name: "Jack", email: "jack@example.com", age: 30 });
      user.unset("email", "age");
      expect(user.has("email")).toBe(false);
      expect(user.has("age")).toBe(false);
      expect(user.has("name")).toBe(true);
    });

    it("should support method chaining", () => {
      const user = new TestUser({ name: "Kate", email: "kate@example.com", age: 30 } as any);
      user.unset("email").unset("age");
      expect(user.has("email")).toBe(false);
      expect(user.has("age")).toBe(false);
      expect(user.has("name")).toBe(true);
    });
  });

  describe("increment()", () => {
    it("should increment numeric field", () => {
      const user = new TestUser({ age: 25 });
      user.increment("age", 5);
      expect(user.get("age")).toBe(30);
    });

    it("should default increment by 1", () => {
      const user = new TestUser({ age: 25 });
      user.increment("age", 1);
      expect(user.get("age")).toBe(26);
    });

    it("should support method chaining", () => {
      const user = new TestUser({ age: 20, score: 100 } as any);
      user.increment("age", 10).increment("score", 50);
      expect(user.get("age")).toBe(30);
      expect(user.get("score")).toBe(150);
    });
  });

  describe("decrement()", () => {
    it("should decrement numeric field", () => {
      const user = new TestUser({ age: 30 });
      user.decrement("age", 5);
      expect(user.get("age")).toBe(25);
    });

    it("should support method chaining", () => {
      const user = new TestUser({ age: 50, score: 200 } as any);
      user.decrement("age", 10).decrement("score", 25);
      expect(user.get("age")).toBe(40);
      expect(user.get("score")).toBe(175);
    });
  });

  describe("only()", () => {
    it("should return only specified fields", () => {
      const user = new TestUser({
        name: "Leo",
        email: "leo@example.com",
        age: 28,
      });

      const result = user.only(["name", "email"]);
      expect(result).toEqual({
        name: "Leo",
        email: "leo@example.com",
      });
      expect(result).not.toHaveProperty("age");
    });

    it("should handle missing fields gracefully", () => {
      const user = new TestUser({ name: "Mia" });
      const result = user.only(["name", "email"]);
      expect(result).toHaveProperty("name");
      expect(result.email).toBeUndefined();
    });
  });

  describe("string()", () => {
    it("should get string value", () => {
      const user = new TestUser({ name: "Nina" });
      expect(user.string("name")).toBe("Nina");
    });

    it("should return default for missing field", () => {
      const user = new TestUser();
      expect(user.string("name", "Default")).toBe("Default");
    });
  });

  describe("number()", () => {
    it("should get number value", () => {
      const user = new TestUser({ age: 35 });
      expect(user.number("age")).toBe(35);
    });

    it("should return default for missing field", () => {
      const user = new TestUser();
      expect(user.number("age", 0)).toBe(0);
    });
  });

  describe("boolean()", () => {
    it("should get boolean value", () => {
      const user = new TestUser({ active: true });
      expect(user.boolean("active")).toBe(true);
    });

    it("should return default for missing field", () => {
      const user = new TestUser();
      expect(user.boolean("active", false)).toBe(false);
    });
  });

  describe("hasChanges()", () => {
    it("should return false for new instance without changes", () => {
      const user = new TestUser({ name: "Oscar" });
      expect(user.hasChanges()).toBe(false);
    });

    it("should return true after modification", () => {
      const user = new TestUser({ name: "Paul" });
      user.set("name", "Peter");
      expect(user.hasChanges()).toBe(true);
    });

    it("should return true after adding new field", () => {
      const user = new TestUser({ name: "Quinn" });
      user.set("email", "quinn@example.com");
      expect(user.hasChanges()).toBe(true);
    });
  });

  describe("id", () => {
    it("should return id if present", () => {
      const user = new TestUser({ id: 42 });
      expect(user.id).toBe(42);
    });

    it("should return undefined if no id", () => {
      const user = new TestUser();
      expect(user.id).toBeUndefined();
    });
  });

  describe("static properties", () => {
    it("should have correct table name", () => {
      expect(TestUser.table).toBe("test_users");
    });

    it("should have default primary key", () => {
      expect(TestUser.primaryKey).toBe("id");
    });

    it("should have custom primary key", () => {
      expect(CustomPKModel.primaryKey).toBe("_id");
    });

    it("should have createdAt column", () => {
      expect(TestUser.createdAtColumn).toBe("createdAt");
    });

    it("should have updatedAt column", () => {
      expect(TestUser.updatedAtColumn).toBe("updatedAt");
    });

    it("should have soft delete strategy", () => {
      expect(SoftDeleteModel.deleteStrategy).toBe("soft");
    });

    it("should have deletedAt column", () => {
      expect(SoftDeleteModel.deletedAtColumn).toBe("deletedAt");
    });
  });

  describe("merge()", () => {
    it("should merge new values into existing data", () => {
      const user = new TestUser({ name: "Alice", email: "alice@example.com" });
      user.merge({ age: 30, city: "NYC" } as any);
      expect(user.get("name")).toBe("Alice");
      expect(user.get("email")).toBe("alice@example.com");
      expect(user.get("age")).toBe(30);
      expect(user.get("city")).toBe("NYC");
    });

    it("should overwrite existing values", () => {
      const user = new TestUser({ name: "Bob", age: 25 } as any);
      user.merge({ name: "Robert", age: 26 } as any);
      expect(user.get("name")).toBe("Robert");
      expect(user.get("age")).toBe(26);
    });

    it("should mark merged fields as dirty", () => {
      const user = new TestUser({ name: "Charlie" });
      user.merge({ name: "Charles", email: "charles@example.com" });
      expect(user.hasChanges()).toBe(true);
    });

    it("should support method chaining", () => {
      const user = new TestUser();
      user.merge({ name: "Diana" }).merge({ email: "diana@example.com" });
      expect(user.get("name")).toBe("Diana");
      expect(user.get("email")).toBe("diana@example.com");
    });
  });

  describe("clone()", () => {
    it("should create a deep copy of the model", () => {
      const user = new TestUser({ name: "Eve", email: "eve@example.com", age: 28 } as any);
      const clone = user.clone();

      expect(clone).not.toBe(user);
      expect(clone.get("name")).toBe("Eve");
      expect(clone.get("email")).toBe("eve@example.com");
      expect(clone.get("age")).toBe(28);
    });

    it("should create immutable clone", () => {
      const user = new TestUser({ name: "Frank" });
      const clone = user.clone();

      // Clone should be frozen
      expect(() => {
        clone.set("name", "Franklin");
      }).toThrow();
    });

    it("should preserve isNew flag", () => {
      const user = new TestUser({ name: "Grace" });
      user.isNew = false;
      const clone = user.clone();

      expect(clone.isNew).toBe(false);
    });

    it("should not affect original when cloned", () => {
      const user = new TestUser({ name: "Henry", age: 30 } as any);
      const clone = user.clone();

      user.set("name", "Harry");
      expect(user.get("name")).toBe("Harry");
      expect(clone.get("name")).toBe("Henry");
    });
  });

  describe("isDirty()", () => {
    it("should return false for unchanged field", () => {
      const user = new TestUser({ name: "Ivy" });
      expect(user.isDirty("name")).toBe(false);
    });

    it("should return true for modified field", () => {
      const user = new TestUser({ name: "Jack" });
      user.set("name", "John");
      expect(user.isDirty("name")).toBe(true);
    });

    it("should return false for unmodified field", () => {
      const user = new TestUser({ name: "Kate", email: "kate@example.com" });
      user.set("name", "Katherine");
      expect(user.isDirty("email")).toBe(false);
    });
  });

  describe("getDirtyColumns()", () => {
    it("should return empty array when no changes", () => {
      const user = new TestUser({ name: "Leo" });
      expect(user.getDirtyColumns()).toEqual([]);
    });

    it("should return modified columns", () => {
      const user = new TestUser({ name: "Mia", email: "mia@example.com" });
      user.set("name", "Maria");
      const dirty = user.getDirtyColumns();
      expect(dirty).toContain("name");
      expect(dirty).not.toContain("email");
    });

    it("should return all modified columns", () => {
      const user = new TestUser({ name: "Nina", email: "nina@example.com" });
      user.set("name", "Nora");
      user.set("email", "nora@example.com");
      const dirty = user.getDirtyColumns();
      expect(dirty).toContain("name");
      expect(dirty).toContain("email");
    });
  });

  describe("getDirtyColumnsWithValues()", () => {
    it("should return empty object when no changes", () => {
      const user = new TestUser({ name: "Oscar" });
      expect(user.getDirtyColumnsWithValues()).toEqual({});
    });

    it("should return old and new values for dirty columns", () => {
      const user = new TestUser({ name: "Paul", age: 25 } as any);
      user.set("name", "Peter");
      const dirty = user.getDirtyColumnsWithValues();

      expect(dirty.name).toEqual({
        oldValue: "Paul",
        newValue: "Peter",
      });
      expect(dirty.age).toBeUndefined();
    });
  });

  describe("getRemovedColumns()", () => {
    it("should return empty array when no columns removed", () => {
      const user = new TestUser({ name: "Quinn" });
      expect(user.getRemovedColumns()).toEqual([]);
    });

    it("should return removed columns", () => {
      const user = new TestUser({ name: "Rachel", email: "rachel@example.com", age: 30 } as any);
      user.unset("email");
      const removed = user.getRemovedColumns();
      expect(removed).toContain("email");
      expect(removed).not.toContain("name");
    });
  });

  describe("helper methods", () => {
    it("getTableName() should return table name", () => {
      const user = new TestUser();
      expect(user.getTableName()).toBe("test_users");
    });

    it("getPrimaryKey() should return primary key", () => {
      const user = new TestUser();
      expect(user.getPrimaryKey()).toBe("id");
    });

    it("self() should return constructor", () => {
      const user = new TestUser();
      const constructor = user.self();
      expect(constructor).toBe(TestUser);
      expect(constructor.table).toBe("test_users");
    });
  });
});
