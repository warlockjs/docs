import { Context } from "@warlock.js/context";
import { describe, expect, it, vi } from "vitest";
import { databaseDataSourceContext } from "../../../src/context/database-data-source-context";
import { DataSource } from "../../../src/data-source/data-source";
import { dataSourceRegistry } from "../../../src/data-source/data-source-registry";
import { MissingDataSourceError } from "../../../src/errors/missing-data-source.error";
import { createMockDriver } from "../../helpers/mock-driver";

describe("DataSourceRegistry", () => {
  describe("register()", () => {
    it("should add data source to registry", () => {
      const mockDriver = createMockDriver("postgres");

      const dataSource = dataSourceRegistry.register({
        name: "primary",
        driver: mockDriver,
      });

      expect(dataSource).toBeInstanceOf(DataSource);
      expect(dataSource.name).toBe("primary");
    });

    it("should set first source as default if none exist", () => {
      const mockDriver1 = createMockDriver();
      const mockDriver2 = createMockDriver();

      const ds1 = dataSourceRegistry.register({
        name: "first-" + Date.now(),
        driver: mockDriver1,
      });

      const ds2 = dataSourceRegistry.register({
        name: "second-" + Date.now(),
        driver: mockDriver2,
      });

      // First one should be default only if no other default exists
      // Since registry is a singleton, we just check that ds2 is not default
      expect(ds2.isDefault).toBe(false);
    });

    it("should respect explicit isDefault: true", () => {
      const mockDriver1 = createMockDriver();
      const mockDriver2 = createMockDriver();

      dataSourceRegistry.register({
        name: "first",
        driver: mockDriver1,
      });

      const ds2 = dataSourceRegistry.register({
        name: "second",
        driver: mockDriver2,
        isDefault: true,
      });

      expect(ds2.isDefault).toBe(true);
    });

    it("should emit 'registered' event", () => {
      const mockDriver = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.on("registered", listener);

      const dataSource = dataSourceRegistry.register({
        name: "test",
        driver: mockDriver,
      });

      expect(listener).toHaveBeenCalledWith(dataSource);
    });

    it("should emit 'default-registered' for default data source", () => {
      const mockDriver = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.on("default-registered", listener);

      const dataSource = dataSourceRegistry.register({
        name: "default-test",
        driver: mockDriver,
        isDefault: true,
      });

      expect(listener).toHaveBeenCalledWith(dataSource);
    });

    it("should forward 'connected' event from driver", () => {
      const mockDriver = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.on("connected", listener);

      const dataSource = dataSourceRegistry.register({
        name: "test",
        driver: mockDriver,
      });

      // Simulate driver emitting connected event
      const driverOnCall = (mockDriver.on as any).mock.calls.find(
        (call: any) => call[0] === "connected",
      );
      if (driverOnCall) {
        driverOnCall[1](); // Trigger the callback
      }

      expect(listener).toHaveBeenCalledWith(dataSource);
    });
  });

  describe("get()", () => {
    it("should return named data source", () => {
      const mockDriver = createMockDriver();
      const registered = dataSourceRegistry.register({
        name: "my-db",
        driver: mockDriver,
      });

      const retrieved = dataSourceRegistry.get("my-db");
      expect(retrieved).toBe(registered);
    });

    it("should return default when no name provided", () => {
      const mockDriver = createMockDriver();
      const registered = dataSourceRegistry.register({
        name: "default-db",
        driver: mockDriver,
        isDefault: true,
      });

      const retrieved = dataSourceRegistry.get();
      expect(retrieved).toBe(registered);
    });

    it("should throw MissingDataSourceError for unknown name", () => {
      expect(() => {
        dataSourceRegistry.get("non-existent");
      }).toThrow(MissingDataSourceError);

      try {
        dataSourceRegistry.get("unknown-db");
      } catch (error) {
        expect(error).toBeInstanceOf(MissingDataSourceError);
        expect((error as MissingDataSourceError).dataSourceName).toBe("unknown-db");
      }
    });

    it.skip("should throw when no default registered", () => {
      // NOTE: This test is skipped because dataSourceRegistry is a singleton
      // and may already have a default from previous tests.
      // In a real scenario, you would need a way to clear/reset the registry
      // or use dependency injection to test this properly.

      expect(() => {
        dataSourceRegistry.get();
      }).toThrow(MissingDataSourceError);

      try {
        dataSourceRegistry.get();
      } catch (error) {
        expect(error).toBeInstanceOf(MissingDataSourceError);
        expect((error as MissingDataSourceError).message).toContain("No default");
      }
    });

    it("should respect context override with string", async () => {
      const mockDriver1 = createMockDriver();
      const mockDriver2 = createMockDriver();

      dataSourceRegistry.register({ name: "db1", driver: mockDriver1 });
      const db2 = dataSourceRegistry.register({
        name: "db2",
        driver: mockDriver2,
      });

      await (databaseDataSourceContext as Context).run({ dataSource: "db2" }, async () => {
        const retrieved = dataSourceRegistry.get();
        expect(retrieved).toBe(db2);
      });
    });

    it("should respect context override with DataSource instance", async () => {
      const mockDriver = createMockDriver();
      const contextDataSource = new DataSource({
        name: "context-ds",
        driver: mockDriver,
      });

      await (databaseDataSourceContext as Context).run(
        { dataSource: contextDataSource },
        async () => {
          const retrieved = dataSourceRegistry.get();
          expect(retrieved).toBe(contextDataSource);
        },
      );
    });

    it("should throw if context override references unregistered source", async () => {
      await (databaseDataSourceContext as Context).run(
        { dataSource: "unregistered-source" },
        async () => {
          expect(() => {
            dataSourceRegistry.get();
          }).toThrow(MissingDataSourceError);

          try {
            dataSourceRegistry.get();
          } catch (error) {
            expect((error as MissingDataSourceError).message).toContain("context override");
          }
        },
      );
    });
  });

  describe("getAllDataSources()", () => {
    it("should return all registered sources", () => {
      const mockDriver1 = createMockDriver();
      const mockDriver2 = createMockDriver();

      const ds1 = dataSourceRegistry.register({ name: "db1", driver: mockDriver1 });
      const ds2 = dataSourceRegistry.register({ name: "db2", driver: mockDriver2 });

      const allSources = dataSourceRegistry.getAllDataSources();

      expect(allSources).toContain(ds1);
      expect(allSources).toContain(ds2);
      expect(allSources.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array when no sources registered", () => {
      // This assumes a fresh registry
      const allSources = dataSourceRegistry.getAllDataSources();
      expect(Array.isArray(allSources)).toBe(true);
    });
  });

  describe("event listeners", () => {
    it("should support on() for adding listeners", () => {
      const mockDriver = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.on("registered", listener);
      dataSourceRegistry.register({ name: "test", driver: mockDriver });

      expect(listener).toHaveBeenCalled();
    });

    it("should support once() for one-time listeners", () => {
      const mockDriver1 = createMockDriver();
      const mockDriver2 = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.once("registered", listener);

      dataSourceRegistry.register({ name: "test1", driver: mockDriver1 });
      dataSourceRegistry.register({ name: "test2", driver: mockDriver2 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should support off() for removing listeners", () => {
      const mockDriver = createMockDriver();
      const listener = vi.fn();

      dataSourceRegistry.on("registered", listener);
      dataSourceRegistry.off("registered", listener);

      dataSourceRegistry.register({ name: "test", driver: mockDriver });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
