import { beforeEach, describe, expect, it } from "vitest";
import { Model } from "../../../src/model/model";
import { RegisterModel, cleanupModelsRegistery } from "../../../src/model/register-model";
import {
  databaseModelRule,
  databaseModelsRule,
} from "../../../src/validation/rules/database-model-rule";

describe("Database Validation Rules", () => {
  beforeEach(() => {
    cleanupModelsRegistery();
  });

  describe("databaseModelRule", () => {
    it("should validate Model instances", async () => {
      class User extends Model {
        static table = "users";
      }

      const user = new User({ id: 1, name: "John" });
      const context = {
        value: user,
        field: "user",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: User },
      } as any;

      const result = await databaseModelRule.validate?.call({ context }, user, context);

      expect(result).toEqual({ isValid: true });
    });

    it("should reject non-Model values", async () => {
      const notAModel = { id: 1, name: "Not a model" };
      const context = {
        value: notAModel,
        field: "user",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: { name: "User" } },
      } as any;

      const result = await databaseModelRule.validate?.call({ context }, notAModel, context);

      expect(result).toHaveProperty("isValid", false);
    });

    it("should set model name in attributesList for error messages", async () => {
      const notAModel = "string value";
      const context = {
        value: notAModel,
        field: "user",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: { name: "User" } },
      } as any;

      await databaseModelRule.validate?.call({ context }, notAModel, context);

      expect(context.attributesList.model).toBe("User");
    });

    it("should handle null values", async () => {
      const context = {
        value: null,
        field: "user",
        rules: {},
        data: {},
        attributesList: {},
        options: {},
      } as any;

      const result = await databaseModelRule.validate?.call({ context }, null, context);

      expect(result).toHaveProperty("isValid", false);
    });
  });

  describe("databaseModelsRule", () => {
    it("should validate array of Model instances", async () => {
      class Post extends Model {
        static table = "posts";
      }

      const posts = [new Post({ id: 1, title: "Post 1" }), new Post({ id: 2, title: "Post 2" })];

      const context = {
        value: posts,
        field: "posts",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: Post },
      } as any;

      const result = await databaseModelsRule.validate?.call({ context }, posts, context);

      expect(result).toEqual({ isValid: true });
    });

    it("should reject mixed arrays", async () => {
      class Comment extends Model {
        static table = "comments";
      }

      const mixed = [new Comment({ id: 1 }), { id: 2, text: "not a model" }];

      const context = {
        value: mixed,
        field: "comments",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: Comment },
      } as any;

      const result = await databaseModelsRule.validate?.call({ context }, mixed, context);

      expect(result).toHaveProperty("isValid", false);
    });

    it("should reject non-array values", async () => {
      const notArray = "not an array";
      const context = {
        value: notArray,
        field: "items",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: { name: "Item" } },
      } as any;

      const result = await databaseModelsRule.validate?.call({ context }, notArray, context);

      expect(result).toHaveProperty("isValid", false);
    });

    it("should support string model reference", async () => {
      @RegisterModel()
      class Product extends Model {
        static table = "products";
      }

      const products = [new Product({ id: 1 }), new Product({ id: 2 })];

      const context = {
        value: products,
        field: "products",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: "Product" }, // String reference
      } as any;

      const result = await databaseModelsRule.validate?.call({ context }, products, context);

      expect(result).toEqual({ isValid: true });
    });

    it("should set model name in attributesList", async () => {
      class Category extends Model {
        static table = "categories";
      }

      const context = {
        value: [],
        field: "categories",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: Category },
      } as any;

      await databaseModelsRule.validate?.call({ context }, [], context);

      expect(context.attributesList.model).toBe("Category");
    });

    it("should handle empty arrays", async () => {
      class Tag extends Model {
        static table = "tags";
      }

      const context = {
        value: [],
        field: "tags",
        rules: {},
        data: {},
        attributesList: {},
        options: { model: Tag },
      } as any;

      const result = await databaseModelsRule.validate?.call({ context }, [], context);

      expect(result).toEqual({ isValid: true });
    });
  });

  describe("error messages", () => {
    it("databaseModelRule should have correct default message", () => {
      expect(databaseModelRule.defaultErrorMessage).toBe("The :input must be a valid :model model");
    });

    it("databaseModelsRule should have correct default message", () => {
      expect(databaseModelsRule.defaultErrorMessage).toBe(
        "The :input must be a list of valid :model",
      );
    });

    it("should have correct rule names", () => {
      expect(databaseModelRule.name).toBe("databaseModule");
      expect(databaseModelsRule.name).toBe("databaseModels");
    });
  });
});
