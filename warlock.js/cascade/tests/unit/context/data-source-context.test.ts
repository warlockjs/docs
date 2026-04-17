import { beforeEach, describe, expect, it } from "vitest";
import { databaseDataSourceContext } from "../../../src/context/database-data-source-context";
import { DataSource } from "../../../src/data-source/data-source";
import { createMockDriver } from "../../helpers/mock-driver";

describe("DatabaseDataSourceContext", () => {
  beforeEach(() => {
    // Clear context before each test
    databaseDataSourceContext.clear();
  });

  describe("getDataSource()", () => {
    it("should return undefined when not set", () => {
      const result = databaseDataSourceContext.getDataSource();
      expect(result).toBeUndefined();
    });

    it("should return data source after being set", () => {
      databaseDataSourceContext.setDataSource("primary");

      const result = databaseDataSourceContext.getDataSource();
      expect(result).toBe("primary");
    });
  });

  describe("setDataSource()", () => {
    it("should store data source by name (string)", () => {
      databaseDataSourceContext.setDataSource("secondary");

      expect(databaseDataSourceContext.getDataSource()).toBe("secondary");
    });

    it("should store DataSource instance", () => {
      const mockDriver = createMockDriver();
      const dataSource = new DataSource({
        name: "test",
        driver: mockDriver,
      });

      databaseDataSourceContext.setDataSource(dataSource);

      const result = databaseDataSourceContext.getDataSource();
      expect(result).toBe(dataSource);
      expect(result).toBeInstanceOf(DataSource);
    });

    it("should overwrite previous data source", () => {
      databaseDataSourceContext.setDataSource("first");
      databaseDataSourceContext.setDataSource("second");

      expect(databaseDataSourceContext.getDataSource()).toBe("second");
    });
  });

  describe("buildStore()", () => {
    it("should return correct initial state", () => {
      const store = databaseDataSourceContext.buildStore();

      expect(store).toEqual({ dataSource: undefined });
    });
  });

  describe("context isolation", () => {
    it("should maintain separate contexts in async operations", async () => {
      const operation1 = async () => {
        return databaseDataSourceContext.run({ dataSource: "db1" }, async () => {
          return databaseDataSourceContext.getDataSource();
        });
      };

      const operation2 = async () => {
        return databaseDataSourceContext.run({ dataSource: "db2" }, async () => {
          return databaseDataSourceContext.getDataSource();
        });
      };

      const [result1, result2] = await Promise.all([operation1(), operation2()]);

      expect(result1).toBe("db1");
      expect(result2).toBe("db2");
    });
  });
});
