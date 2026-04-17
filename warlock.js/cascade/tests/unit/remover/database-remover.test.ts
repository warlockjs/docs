import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DriverContract } from "../../../src/contracts/database-driver.contract";
import type { DataSource } from "../../../src/data-source/data-source";
import { Model } from "../../../src/model/model";
import { DatabaseRemover } from "../../../src/remover/database-remover";
import { createMockDataSource, createMockDriver } from "../../utils/test-helpers";

// Mock model class for testing
class TestModel extends Model {
  static table = "test_models";
  static primaryKey = "id";
  static deleteStrategy?: "trash" | "permanent" | "soft";
  static deletedAtColumn = "deletedAt";
  static trashTable?: string;
}

describe("DatabaseRemover", () => {
  let mockDriver: DriverContract;
  let mockDataSource: DataSource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDriver = createMockDriver();
    mockDataSource = createMockDataSource({ driver: mockDriver });

    // Reset static properties
    TestModel.deleteStrategy = undefined;
    TestModel.trashTable = undefined;

    // Mock the static getDataSource method
    vi.spyOn(TestModel, "getDataSource").mockReturnValue(mockDataSource);
  });

  describe("constructor", () => {
    it("should initialize with model properties", () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      const remover = new DatabaseRemover(model);

      expect(remover).toBeInstanceOf(DatabaseRemover);
    });
  });

  describe("destroy() - Validation", () => {
    it("should throw error when trying to delete a new (unsaved) model", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;

      const remover = new DatabaseRemover(model);

      await expect(remover.destroy()).rejects.toThrow(
        "Cannot destroy TestModel instance that hasn't been saved",
      );
    });

    it("should throw error when model has no primary key value", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = false;
      // id is undefined

      const remover = new DatabaseRemover(model);

      await expect(remover.destroy()).rejects.toThrow("primary key (id) is missing");
    });
  });

  describe("destroy() - Permanent Strategy", () => {
    it("should permanently delete the record", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy({ strategy: "permanent" });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe("permanent");
      expect(result.deletedCount).toBe(1);
      expect(mockDriver.delete).toHaveBeenCalledWith("test_models", { id: 1 });
    });

    it("should mark model as new after permanent deletion", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "permanent" });

      expect(model.isNew).toBe(true);
    });

    it("should use permanent as default strategy", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy();

      expect(result.strategy).toBe("permanent");
    });

    it("should throw error if record not found", async () => {
      (mockDriver.delete as any).mockResolvedValue(0);

      const model = new TestModel({ id: 999, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);

      await expect(remover.destroy()).rejects.toThrow("record not found");
    });
  });

  describe("destroy() - Soft Delete Strategy", () => {
    it("should set deletedAt timestamp instead of deleting", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy({ strategy: "soft" });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe("soft");
      expect(mockDriver.update).toHaveBeenCalledWith(
        "test_models",
        { id: 1 },
        {
          $set: { deletedAt: expect.any(Date) },
        },
      );
      expect(mockDriver.delete).not.toHaveBeenCalled();
    });

    it("should NOT mark model as new after soft deletion", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "soft" });

      expect(model.isNew).toBe(false);
    });

    it("should use custom deletedAtColumn if defined", async () => {
      class CustomDeletedAtModel extends Model {
        static table = "custom_models";
        static primaryKey = "id";
        static deletedAtColumn = "removed_at";
      }
      vi.spyOn(CustomDeletedAtModel, "getDataSource").mockReturnValue(mockDataSource);

      const model = new CustomDeletedAtModel({ id: 1 });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "soft" });

      expect(mockDriver.update).toHaveBeenCalledWith(
        "custom_models",
        { id: 1 },
        {
          $set: { removed_at: expect.any(Date) },
        },
      );
    });
  });

  describe("destroy() - Trash Strategy", () => {
    it("should move record to trash table before deleting", async () => {
      const model = new TestModel({ id: 1, name: "Test", email: "test@example.com" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy({ strategy: "trash" });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe("trash");
      expect(result.trashRecord).toBeDefined();

      // Should insert into trash table
      expect(mockDriver.insert).toHaveBeenCalledWith(
        "test_modelsTrash", // Default pattern: {table}Trash
        expect.objectContaining({
          id: 1,
          name: "Test",
          email: "test@example.com",
          deletedAt: expect.any(Date),
          originalTable: "test_models",
        }),
      );

      // Then delete from original table
      expect(mockDriver.delete).toHaveBeenCalledWith("test_models", { id: 1 });
    });

    it("should use custom trashTable if defined on model", async () => {
      TestModel.trashTable = "RecycleBin";

      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "trash" });

      expect(mockDriver.insert).toHaveBeenCalledWith("RecycleBin", expect.any(Object));
    });

    it("should use defaultTrashTable from data source if set", async () => {
      (mockDataSource as any).defaultTrashTable = "GlobalTrash";

      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "trash" });

      expect(mockDriver.insert).toHaveBeenCalledWith("GlobalTrash", expect.any(Object));
    });

    it("should mark model as new after trash deletion", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "trash" });

      expect(model.isNew).toBe(true);
    });
  });

  describe("destroy() - Strategy Resolution", () => {
    it("should use options.strategy first", async () => {
      TestModel.deleteStrategy = "permanent";
      (mockDataSource as any).defaultDeleteStrategy = "soft";

      const model = new TestModel({ id: 1 });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy({ strategy: "trash" });

      expect(result.strategy).toBe("trash");
    });

    it("should use model deleteStrategy if options not provided", async () => {
      TestModel.deleteStrategy = "soft";

      const model = new TestModel({ id: 1 });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy();

      expect(result.strategy).toBe("soft");
    });

    it("should use dataSource defaultDeleteStrategy if model has none", async () => {
      (mockDataSource as any).defaultDeleteStrategy = "trash";

      const model = new TestModel({ id: 1 });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy();

      expect(result.strategy).toBe("trash");
    });

    it("should default to permanent if nothing is configured", async () => {
      const model = new TestModel({ id: 1 });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      const result = await remover.destroy();

      expect(result.strategy).toBe("permanent");
    });
  });

  describe("destroy() - Events", () => {
    it("should emit deleting event before deletion", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      const deletingListener = vi.fn();
      model.on("deleting", deletingListener);

      const remover = new DatabaseRemover(model);
      await remover.destroy();

      expect(deletingListener).toHaveBeenCalledWith(
        model,
        expect.objectContaining({
          strategy: "permanent",
          primaryKeyValue: 1,
          primaryKey: "id",
        }),
      );
    });

    it("should emit deleted event after deletion", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      const deletedListener = vi.fn();
      model.on("deleted", deletedListener);

      const remover = new DatabaseRemover(model);
      await remover.destroy();

      expect(deletedListener).toHaveBeenCalledWith(
        model,
        expect.objectContaining({
          strategy: "permanent",
          deletedCount: 1,
        }),
      );
    });

    it("should skip events when skipEvents option is true", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      const deletingListener = vi.fn();
      const deletedListener = vi.fn();
      model.on("deleting", deletingListener);
      model.on("deleted", deletedListener);

      const remover = new DatabaseRemover(model);
      await remover.destroy({ skipEvents: true });

      expect(deletingListener).not.toHaveBeenCalled();
      expect(deletedListener).not.toHaveBeenCalled();
    });

    it("should include trashRecord in deleted event context for trash strategy", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      const deletedListener = vi.fn();
      model.on("deleted", deletedListener);

      const remover = new DatabaseRemover(model);
      await remover.destroy({ strategy: "trash" });

      expect(deletedListener).toHaveBeenCalledWith(
        model,
        expect.objectContaining({
          strategy: "trash",
          trashRecord: expect.any(Object),
        }),
      );
    });
  });

  describe("destroy() - Custom Primary Keys", () => {
    it("should use custom primary key for deletion", async () => {
      class CustomPKModel extends Model {
        static table = "custom_pk_models";
        static primaryKey = "uuid";
      }
      vi.spyOn(CustomPKModel, "getDataSource").mockReturnValue(mockDataSource);

      const model = new CustomPKModel({ uuid: "abc-123", name: "Test" });
      model.isNew = false;

      const remover = new DatabaseRemover(model);
      await remover.destroy();

      expect(mockDriver.delete).toHaveBeenCalledWith("custom_pk_models", { uuid: "abc-123" });
    });
  });
});
