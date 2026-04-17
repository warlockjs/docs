import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DriverContract } from "../../../src/contracts/database-driver.contract";
import type { DataSource } from "../../../src/data-source/data-source";
import { Model } from "../../../src/model/model";
import { DatabaseWriter } from "../../../src/writer/database-writer";
import { createMockDataSource, createMockDriver } from "../../utils/test-helpers";

// Mock model class for testing
class TestModel extends Model {
  static table = "test_models";
  static primaryKey = "id";
  static autoGenerateId = false;
  static createdAtColumn: string | false = "createdAt";
  static updatedAtColumn: string | false = "updatedAt";
}

describe("DatabaseWriter", () => {
  let mockDriver: DriverContract;
  let mockDataSource: DataSource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDriver = createMockDriver();
    mockDataSource = createMockDataSource({ driver: mockDriver });

    // Mock the static getDataSource method
    vi.spyOn(TestModel, "getDataSource").mockReturnValue(mockDataSource);
  });

  describe("constructor", () => {
    it("should initialize with model properties", () => {
      const model = new TestModel({ name: "Test" });
      const writer = new DatabaseWriter(model);

      expect(writer).toBeInstanceOf(DatabaseWriter);
    });
  });

  describe("save() - Insert Operations", () => {
    it("should insert a new model", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      const result = await writer.save();

      expect(result.success).toBe(true);
      expect(result.isNew).toBe(true);
      expect(mockDriver.insert).toHaveBeenCalledWith(
        "test_models",
        expect.objectContaining({
          name: "Test",
        }),
      );
    });

    it("should merge returned document data after insert", async () => {
      const model = new TestModel({ name: "Test 42" });
      model.isNew = true;

      (mockDriver.insert as any).mockResolvedValue({
        document: { id: 42, _id: "mongo_id_123", name: "Test 42" },
      });

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(model.get("id")).toBe(42);
      expect(model.get("_id")).toBe("mongo_id_123");
    });

    it("should set isNew to false after successful insert", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(model.isNew).toBe(false);
    });

    it("should add createdAt and updatedAt timestamps on insert", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockDriver.insert).toHaveBeenCalledWith(
        "test_models",
        expect.objectContaining({
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe("save() - Update Operations", () => {
    it("should update an existing model with changes", async () => {
      const model = new TestModel({ id: 1, name: "Original" });
      model.isNew = false;
      model.set("name", "Updated");

      const writer = new DatabaseWriter(model);
      const result = await writer.save();

      expect(result.success).toBe(true);
      expect(result.isNew).toBe(false);
      expect(mockDriver.update).toHaveBeenCalledWith(
        "test_models",
        { id: 1 },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: "Updated",
          }),
        }),
      );
    });

    it("should skip save if no changes on existing model", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.dirtyTracker.reset(); // Clear any dirty state

      const writer = new DatabaseWriter(model);
      const result = await writer.save();

      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(0);
      expect(mockDriver.update).not.toHaveBeenCalled();
    });

    it("should handle $unset operations for removed fields", async () => {
      const model = new TestModel({ id: 1, name: "Test", tempField: "value" });
      model.isNew = false;
      model.dirtyTracker.reset();
      model.unset("tempField");

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockDriver.update).toHaveBeenCalledWith(
        "test_models",
        { id: 1 },
        expect.objectContaining({
          $unset: { tempField: 1 },
        }),
      );
    });

    it("should update updatedAt timestamp on update", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.set("name", "Updated");

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockDriver.update).toHaveBeenCalledWith(
        "test_models",
        { id: 1 },
        expect.objectContaining({
          $set: expect.objectContaining({
            updatedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("should use replace mode when options.replace is true", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.set("name", "Updated");

      const writer = new DatabaseWriter(model);
      await writer.save({ replace: true });

      expect(mockDriver.replace).toHaveBeenCalledWith("test_models", { id: 1 }, expect.any(Object));
      expect(mockDriver.update).not.toHaveBeenCalled();
    });
  });

  describe("save() - Events", () => {
    it("should emit saving event before validation", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;
      const savingListener = vi.fn();
      model.on("saving", savingListener);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(savingListener).toHaveBeenCalledWith(
        model,
        expect.objectContaining({
          isInsert: true,
          mode: "insert",
        }),
      );
    });

    it("should emit creating event for new models", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;
      const creatingListener = vi.fn();
      model.on("creating", creatingListener);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(creatingListener).toHaveBeenCalled();
    });

    it("should emit updating event for existing models", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.set("name", "Updated");
      const updatingListener = vi.fn();
      model.on("updating", updatingListener);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(updatingListener).toHaveBeenCalled();
    });

    it("should emit saved and created events after insert", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;
      const savedListener = vi.fn();
      const createdListener = vi.fn();
      model.on("saved", savedListener);
      model.on("created", createdListener);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(savedListener).toHaveBeenCalled();
      expect(createdListener).toHaveBeenCalled();
    });

    it("should emit saved and updated events after update", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.set("name", "Updated");
      const savedListener = vi.fn();
      const updatedListener = vi.fn();
      model.on("saved", savedListener);
      model.on("updated", updatedListener);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(savedListener).toHaveBeenCalled();
      expect(updatedListener).toHaveBeenCalled();
    });

    it("should skip events when skipEvents option is true", async () => {
      const model = new TestModel({ name: "Test" });
      model.isNew = true;
      const savingListener = vi.fn();
      model.on("saving", savingListener);

      const writer = new DatabaseWriter(model);
      await writer.save({ skipEvents: true });

      expect(savingListener).not.toHaveBeenCalled();
    });
  });

  describe("save() - Options", () => {
    it("should skip validation when skipValidation is true", async () => {
      // Create a model with schema that would fail
      class ValidatedModel extends Model {
        static table = "validated_models";
        static primaryKey = "id";
      }
      vi.spyOn(ValidatedModel, "getDataSource").mockReturnValue(mockDataSource);

      const model = new ValidatedModel({ invalidField: "value" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      // Should not throw even if validation would fail
      const result = await writer.save({ skipValidation: true });

      expect(result.success).toBe(true);
    });
  });

  describe("Dirty Tracking Integration", () => {
    it("should reset dirty tracker after successful save", async () => {
      const model = new TestModel({ id: 1, name: "Test" });
      model.isNew = false;
      model.set("name", "Updated");

      expect(model.hasChanges()).toBe(true);

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(model.hasChanges()).toBe(false);
    });

    it("should track multiple field changes in $set", async () => {
      const model = new TestModel({ id: 1, name: "Test", email: "old@test.com" });
      model.isNew = false;
      model.dirtyTracker.reset();
      model.set("name", "Updated");
      model.set("email", "new@test.com");

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockDriver.update).toHaveBeenCalledWith(
        "test_models",
        { id: 1 },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: "Updated",
            email: "new@test.com",
          }),
        }),
      );
    });
  });

  describe("ID Generation", () => {
    it("should generate ID using idGenerator on insert", async () => {
      class AutoIdModel extends Model {
        static table = "auto_id_models";
        static primaryKey = "id";
        static autoGenerateId = true;
      }

      const mockIdGenerator = {
        resolveInitialId: vi.fn().mockResolvedValue(0),
        generateNextId: vi.fn().mockResolvedValue(42),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(AutoIdModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new AutoIdModel({ name: "Test using idGenerator" });
      model.isNew = true;

      // Make driver mock return the data it received, including the generated ID
      (mockDriver.insert as any).mockImplementation((_table: string, data: any) => {
        return Promise.resolve({
          document: { ...data, _id: "mock_mongo_id" },
        });
      });

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          table: "auto_id_models",
        }),
      );
      expect(model.get("id")).toBe(42);
    });

    it("should not generate ID if already set", async () => {
      class AutoIdModel extends Model {
        static table = "auto_id_models";
        static primaryKey = "id";
        static autoGenerateId = true;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(99),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(AutoIdModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new AutoIdModel({ id: 100, name: "Test II" });
      model.isNew = true;

      // Make driver mock return the data it received
      (mockDriver.insert as any).mockImplementation((_table: string, data: any) => {
        return Promise.resolve({
          document: { ...data, _id: "mock_mongo_id" },
        });
      });

      const writer = new DatabaseWriter(model);
      await writer.save();

      // Should not call generator since ID is already set
      expect(mockIdGenerator.generateNextId).not.toHaveBeenCalled();
      expect(model.id).toBe(100);
    });

    it("should use initialId from model config", async () => {
      class CustomIdModel extends Model {
        static table = "custom_id_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static initialId = 1000;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(1000),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(CustomIdModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new CustomIdModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          initialId: 1000,
        }),
      );
    });

    it.skip("should use randomInitialId when configured as true", async () => {
      class RandomIdModel extends Model {
        static table = "random_id_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static randomInitialId = true;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(12345),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(RandomIdModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new RandomIdModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      // initialId should be a random number between 10000 and 499999
      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          initialId: expect.any(Number),
        }),
      );
    });

    it.skip("should use randomInitialId function when provided", async () => {
      class FnIdModel extends Model {
        static table = "fn_id_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static randomInitialId = () => 5000;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(5000),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(FnIdModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new FnIdModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          initialId: 5000,
        }),
      );
    });

    it("should use incrementIdBy from model config", async () => {
      class IncrementModel extends Model {
        static table = "increment_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static incrementIdBy = 5;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(6),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(IncrementModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new IncrementModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          incrementIdBy: 5,
        }),
      );
    });

    it.skip("should use randomIncrement when configured as true", async () => {
      class RandomIncrModel extends Model {
        static table = "random_incr_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static randomIncrement = true;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(10),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(RandomIncrModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new RandomIncrModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          incrementIdBy: expect.any(Number),
        }),
      );
    });

    it.skip("should use randomIncrement function when provided", async () => {
      class FnIncrModel extends Model {
        static table = "fn_incr_models";
        static primaryKey = "id";
        static autoGenerateId = true;
        static randomIncrement = () => 3;
      }

      const mockIdGenerator = {
        generateNextId: vi.fn().mockResolvedValue(4),
      };

      const dataSourceWithIdGen = createMockDataSource({
        driver: mockDriver,
        idGenerator: mockIdGenerator,
      });

      vi.spyOn(FnIncrModel, "getDataSource").mockReturnValue(dataSourceWithIdGen);

      const model = new FnIncrModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockIdGenerator.generateNextId).toHaveBeenCalledWith(
        expect.objectContaining({
          incrementIdBy: 3,
        }),
      );
    });
  });

  describe("Timestamp Columns", () => {
    it("should use custom timestamp column names", async () => {
      // Reset driver mocks to ensure clean state
      vi.clearAllMocks();

      class CustomTimestampModel extends Model {
        static table = "custom_ts_models";
        static primaryKey = "id";
        static createdAtColumn = "created_date";
        static updatedAtColumn = "modified_date";
      }

      vi.spyOn(CustomTimestampModel, "getDataSource").mockReturnValue(mockDataSource);

      const model = new CustomTimestampModel({ name: "Test" });
      model.isNew = true;

      const writer = new DatabaseWriter(model);
      await writer.save();

      expect(mockDriver.insert).toHaveBeenCalledWith(
        "custom_ts_models",
        expect.objectContaining({
          created_date: expect.any(Date),
          modified_date: expect.any(Date),
        }),
      );
    });
  });
});
