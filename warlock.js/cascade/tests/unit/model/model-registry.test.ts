import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Model } from "../../../src/model/model";
import {
  RegisterModel,
  cleanupModelsRegistery,
  getAllModelsFromRegistry,
  getModelFromRegistry,
  registerModelInRegistry,
  removeModelFromRegistery,
} from "../../../src/model/register-model";

describe("Model Registry", () => {
  // Clean up registry before and after each test
  beforeEach(() => {
    cleanupModelsRegistery();
  });

  afterEach(() => {
    cleanupModelsRegistery();
  });

  describe("@RegisterModel() decorator", () => {
    it("should register model with class name", () => {
      @RegisterModel()
      class User extends Model {
        static table = "users";
      }

      const retrievedModel = getModelFromRegistry("User");
      expect(retrievedModel).toBe(User);
    });

    it("should register model with custom name", () => {
      @RegisterModel({ name: "CustomUser" })
      class User extends Model {
        static table = "users";
      }

      const retrievedModel = getModelFromRegistry("CustomUser");
      expect(retrievedModel).toBe(User);
    });

    it("should throw error if model name cannot be determined", () => {
      // This is a edge case - creating an anonymous class
      expect(() => {
        const AnonymousModel = RegisterModel()(
          class extends Model {
            static table = "test";
          },
        );
      }).toThrow(/Unable to determine model name/);
    });

    it("should warn on duplicate registration", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      @RegisterModel({ name: "User" })
      class User2 extends Model {
        static table = "users";
      }

      @RegisterModel({ name: "User" })
      class User extends Model {
        static table = "users";
      }

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("already registered"));

      consoleSpy.mockRestore();
    });

    it("should overwrite previous registration on duplicate", () => {
      @RegisterModel({ name: "User" })
      class UserV1 extends Model {
        static table = "users_v1";
      }

      @RegisterModel({ name: "User" })
      class UserV2 extends Model {
        static table = "users_v2";
      }

      const retrieved = getModelFromRegistry("User");
      expect(retrieved).toBe(UserV2);
      expect(retrieved?.table).toBe("users_v2");
    });
  });

  describe("getModelFromRegistry()", () => {
    it("should return registered model by name", () => {
      @RegisterModel()
      class Post extends Model {
        static table = "posts";
      }

      const retrieved = getModelFromRegistry("Post");
      expect(retrieved).toBe(Post);
    });

    it("should return undefined for unknown model", () => {
      const retrieved = getModelFromRegistry("NonExistent");
      expect(retrieved).toBeUndefined();
    });

    it("should be case-sensitive", () => {
      @RegisterModel()
      class Product extends Model {
        static table = "products";
      }

      expect(getModelFromRegistry("Product")).toBe(Product);
      expect(getModelFromRegistry("product")).toBeUndefined();
    });
  });

  describe("getAllModelsFromRegistry()", () => {
    it("should return all registered models", () => {
      @RegisterModel()
      class User extends Model {
        static table = "users";
      }

      @RegisterModel()
      class Post extends Model {
        static table = "posts";
      }

      const allModels = getAllModelsFromRegistry();

      expect(allModels.size).toBe(2);
      expect(allModels.get("User")).toBe(User);
      expect(allModels.get("Post")).toBe(Post);
    });

    it("should return empty map when no models registered", () => {
      const allModels = getAllModelsFromRegistry();
      expect(allModels.size).toBe(0);
    });

    it("should return a copy of the registry (not a reference)", () => {
      @RegisterModel()
      class User extends Model {
        static table = "users";
      }

      const copy1 = getAllModelsFromRegistry();
      const copy2 = getAllModelsFromRegistry();

      expect(copy1).not.toBe(copy2);
      expect(copy1.size).toBe(copy2.size);
    });
  });

  describe("cleanupModelsRegistery()", () => {
    it("should clear all registered models", () => {
      @RegisterModel()
      class User extends Model {
        static table = "users";
      }

      @RegisterModel()
      class Post extends Model {
        static table = "posts";
      }

      expect(getAllModelsFromRegistry().size).toBe(2);

      cleanupModelsRegistery();

      expect(getAllModelsFromRegistry().size).toBe(0);
    });
  });

  describe("removeModelFromRegistery()", () => {
    it("should remove specific model from registry", () => {
      @RegisterModel()
      class User extends Model {
        static table = "users";
      }

      @RegisterModel()
      class Post extends Model {
        static table = "posts";
      }

      removeModelFromRegistery("User");

      expect(getModelFromRegistry("User")).toBeUndefined();
      expect(getModelFromRegistry("Post")).toBe(Post);
    });

    it("should handle removing non-existent model gracefully", () => {
      expect(() => {
        removeModelFromRegistery("NonExistent");
      }).not.toThrow();
    });
  });

  describe("registerModelInRegistry()", () => {
    it("should programmatically register model", () => {
      class Category extends Model {
        static table = "categories";
      }

      registerModelInRegistry("Category", Category);

      const retrieved = getModelFromRegistry("Category");
      expect(retrieved).toBe(Category);
    });

    it("should allow custom name for programmatic registration", () => {
      class Tag extends Model {
        static table = "tags";
      }

      registerModelInRegistry("CustomTag", Tag);

      expect(getModelFromRegistry("CustomTag")).toBe(Tag);
      expect(getModelFromRegistry("Tag")).toBeUndefined();
    });
  });
});
