import { describe, expect, it } from "vitest";
import { DataSource } from "../../../src/data-source/data-source";
import { createMockDriver } from "../../helpers/mock-driver";

describe("DataSource", () => {
  describe("constructor", () => {
    it("should initialize all properties", () => {
      const mockDriver = createMockDriver("postgres");

      const dataSource = new DataSource({
        name: "primary",
        driver: mockDriver,
        isDefault: true,
        defaultDeleteStrategy: "soft",
        defaultTrashTable: "trash_bin",
      });

      expect(dataSource.name).toBe("primary");
      expect(dataSource.driver).toBe(mockDriver);
      expect(dataSource.isDefault).toBe(true);
      expect(dataSource.defaultDeleteStrategy).toBe("soft");
      expect(dataSource.defaultTrashTable).toBe("trash_bin");
    });

    it("should handle minimal configuration", () => {
      const mockDriver = createMockDriver();

      const dataSource = new DataSource({
        name: "minimal",
        driver: mockDriver,
      });

      expect(dataSource.name).toBe("minimal");
      expect(dataSource.driver).toBe(mockDriver);
      expect(dataSource.isDefault).toBe(false);
      expect(dataSource.defaultDeleteStrategy).toBeUndefined();
      expect(dataSource.defaultTrashTable).toBeUndefined();
    });
  });

  describe("properties", () => {
    it("should have readonly name property", () => {
      const mockDriver = createMockDriver();
      const dataSource = new DataSource({ name: "test", driver: mockDriver });

      expect(dataSource.name).toBe("test");
      // TypeScript enforces readonly, but we can verify it's set correctly
    });

    it("should store driver reference correctly", () => {
      const mockDriver = createMockDriver("mongodb");
      const dataSource = new DataSource({ name: "mongo", driver: mockDriver });

      expect(dataSource.driver).toBe(mockDriver);
      expect(dataSource.driver.name).toBe("mongodb");
    });

    it("should default isDefault to false", () => {
      const mockDriver = createMockDriver();
      const dataSource = new DataSource({ name: "test", driver: mockDriver });

      expect(dataSource.isDefault).toBe(false);
    });

    it("should respect explicit isDefault: true", () => {
      const mockDriver = createMockDriver();
      const dataSource = new DataSource({
        name: "test",
        driver: mockDriver,
        isDefault: true,
      });

      expect(dataSource.isDefault).toBe(true);
    });

    it("should handle all delete strategies", () => {
      const mockDriver = createMockDriver();

      const softDelete = new DataSource({
        name: "soft",
        driver: mockDriver,
        defaultDeleteStrategy: "soft",
      });
      expect(softDelete.defaultDeleteStrategy).toBe("soft");

      const hardDelete = new DataSource({
        name: "hard",
        driver: mockDriver,
        defaultDeleteStrategy: "permanent",
      });
      expect(hardDelete.defaultDeleteStrategy).toBe("permanent");

      const trash = new DataSource({
        name: "trash",
        driver: mockDriver,
        defaultDeleteStrategy: "trash",
      });
      expect(trash.defaultDeleteStrategy).toBe("trash");
    });
  });

  describe("idGenerator", () => {
    it("should return driver's ID generator when available", () => {
      const mockIdGenerator = {
        generateNextId: async () => 123,
        getLastId: async () => 122,
        setLastId: async () => {},
      };

      const mockDriver = {
        ...createMockDriver("mongodb"),
        getIdGenerator: () => mockIdGenerator,
      } as any;

      const dataSource = new DataSource({ name: "mongo", driver: mockDriver });

      expect(dataSource.idGenerator).toBe(mockIdGenerator);
    });

    it("should return undefined for SQL drivers without ID generator", () => {
      const mockDriver = createMockDriver("postgres");
      const dataSource = new DataSource({ name: "pg", driver: mockDriver });

      expect(dataSource.idGenerator).toBeUndefined();
    });

    it("should return undefined when driver does not implement getIdGenerator", () => {
      const basicDriver = {
        ...createMockDriver(),
        // No getIdGenerator method
      };
      delete (basicDriver as any).getIdGenerator;

      const dataSource = new DataSource({ name: "basic", driver: basicDriver });

      expect(dataSource.idGenerator).toBeUndefined();
    });
  });

  describe("modelDefaults", () => {
    it("should store model defaults when provided", () => {
      const mockDriver = createMockDriver();
      const modelDefaults = {
        timestamps: false,
        softDeletes: true,
      };

      const dataSource = new DataSource({
        name: "test",
        driver: mockDriver,
        modelDefaults,
      });

      expect(dataSource.modelDefaults).toBe(modelDefaults);
    });

    it("should be undefined when not provided", () => {
      const mockDriver = createMockDriver();
      const dataSource = new DataSource({ name: "test", driver: mockDriver });

      expect(dataSource.modelDefaults).toBeUndefined();
    });
  });
});
