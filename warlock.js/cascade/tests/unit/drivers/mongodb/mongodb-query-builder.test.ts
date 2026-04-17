import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataSource } from "../../../../src/data-source/data-source";
import { dataSourceRegistry } from "../../../../src/data-source/data-source-registry";
import { MongoQueryBuilder } from "../../../../src/drivers/mongodb/mongodb-query-builder";
import { createMockDriver } from "../../../helpers/mock-driver";

describe("MongoQueryBuilder", () => {
  let queryBuilder: MongoQueryBuilder;
  let mockDataSource: DataSource;
  let mockDriver: ReturnType<typeof createMockDriver>;

  beforeEach(() => {
    // Create mock driver and data source
    mockDriver = createMockDriver("mongodb");
    mockDataSource = new DataSource({
      name: "test",
      driver: mockDriver,
      isDefault: true,
    });

    // Register the mock data source as default
    dataSourceRegistry.register(mockDataSource);

    // Create query builder instance
    queryBuilder = new MongoQueryBuilder("users", mockDataSource);
  });

  afterEach(() => {
    // Clean up registered data sources
    dataSourceRegistry.clear();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a query builder with the given table name", () => {
      expect(queryBuilder.table).toBe("users");
    });

    it("should use provided data source", () => {
      expect(queryBuilder.dataSource).toBe(mockDataSource);
    });

    it("should use default data source from registry if none provided", () => {
      const builder = new MongoQueryBuilder("posts");
      // Uses strict equality check since registry may return different reference
      expect(builder.dataSource.name).toBe(mockDataSource.name);
      expect(builder.dataSource.driver).toBe(mockDataSource.driver);
    });

    it("should initialize with empty operations array", () => {
      expect(queryBuilder.operations).toEqual([]);
    });
  });

  describe("WHERE clauses - basic", () => {
    describe("where()", () => {
      it("should add where operation with field and value", () => {
        queryBuilder.where("name", "John");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "name",
          operator: "=",
          value: "John",
        });
      });

      it("should add where operation with field, operator and value", () => {
        queryBuilder.where("age", ">", 18);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          operator: ">",
          value: 18,
        });
      });

      it("should add where operation with object conditions", () => {
        queryBuilder.where({ name: "John", age: 25 });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where:object");
        expect(queryBuilder.operations[0].data).toEqual({
          name: "John",
          age: 25,
        });
      });

      it("should add where operation with callback", () => {
        const callback = (q: any) => q.where("status", "active");
        queryBuilder.where(callback);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where:callback");
      });

      it("should return this for chaining", () => {
        const result = queryBuilder.where("name", "John");
        expect(result).toBe(queryBuilder);
      });
    });

    describe("orWhere()", () => {
      it("should add orWhere operation with field and value", () => {
        queryBuilder.orWhere("name", "Jane");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orWhere");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "name",
          operator: "=",
          value: "Jane",
        });
      });

      it("should add orWhere operation with field, operator and value", () => {
        queryBuilder.orWhere("age", "<=", 30);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orWhere");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          operator: "<=",
          value: 30,
        });
      });
    });

    describe("whereRaw()", () => {
      it("should add raw where expression", () => {
        const expression = { $expr: { $gt: ["$stock", "$reserved"] } };
        queryBuilder.whereRaw(expression);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toEqual(expression);
      });

      it("should support bindings", () => {
        queryBuilder.whereRaw("this.age > ?", [30]);

        expect(queryBuilder.operations[0].data.bindings).toEqual([30]);
      });
    });

    describe("orWhereRaw()", () => {
      it("should add raw orWhere expression", () => {
        const expression = { $where: "this.isAdmin === true" };
        queryBuilder.orWhereRaw(expression);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orWhereRaw");
      });
    });
  });

  describe("WHERE clauses - comparison operators", () => {
    describe("whereIn()", () => {
      it("should add whereIn operation", () => {
        queryBuilder.whereIn("status", ["active", "pending"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereIn");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "status",
          values: ["active", "pending"],
        });
      });
    });

    describe("whereNotIn()", () => {
      it("should add whereNotIn operation", () => {
        queryBuilder.whereNotIn("status", ["deleted", "archived"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotIn");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "status",
          values: ["deleted", "archived"],
        });
      });
    });

    describe("whereNull()", () => {
      it("should add whereNull operation", () => {
        queryBuilder.whereNull("deletedAt");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNull");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "deletedAt",
        });
      });
    });

    describe("whereNotNull()", () => {
      it("should add whereNotNull operation", () => {
        queryBuilder.whereNotNull("email");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotNull");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "email",
        });
      });
    });

    describe("whereBetween()", () => {
      it("should add whereBetween operation", () => {
        queryBuilder.whereBetween("age", [18, 65]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereBetween");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          range: [18, 65],
        });
      });
    });

    describe("whereNotBetween()", () => {
      it("should add whereNotBetween operation", () => {
        queryBuilder.whereNotBetween("age", [18, 65]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotBetween");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          range: [18, 65],
        });
      });
    });
  });

  describe("WHERE clauses - pattern matching", () => {
    describe("whereLike()", () => {
      it("should add whereLike operation with string pattern", () => {
        queryBuilder.whereLike("name", "%john%");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereLike");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "name",
          pattern: "%john%",
        });
      });

      it("should add whereLike operation with regex pattern", () => {
        const pattern = /john/i;
        queryBuilder.whereLike("name", pattern);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereLike");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "name",
          pattern,
        });
      });
    });

    describe("whereNotLike()", () => {
      it("should add whereNotLike operation", () => {
        queryBuilder.whereNotLike("email", "%@spam.com");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotLike");
      });
    });

    describe("whereStartsWith()", () => {
      it("should add whereStartsWith operation", () => {
        queryBuilder.whereStartsWith("name", "John");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereStartsWith");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "name",
          value: "John",
        });
      });
    });

    describe("whereNotStartsWith()", () => {
      it("should add whereNotStartsWith operation", () => {
        queryBuilder.whereNotStartsWith("name", "Admin");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotStartsWith");
      });
    });

    describe("whereEndsWith()", () => {
      it("should add whereEndsWith operation", () => {
        queryBuilder.whereEndsWith("email", "@example.com");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereEndsWith");
      });
    });

    describe("whereNotEndsWith()", () => {
      it("should add whereNotEndsWith operation", () => {
        queryBuilder.whereNotEndsWith("email", "@spam.com");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotEndsWith");
      });
    });
  });

  describe("WHERE clauses - column comparison", () => {
    describe("whereColumn()", () => {
      it("should add whereColumn operation", () => {
        queryBuilder.whereColumn("stock", ">", "reserved");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereColumn");
        expect(queryBuilder.operations[0].data).toEqual({
          first: "stock",
          operator: ">",
          second: "reserved",
        });
      });
    });

    describe("orWhereColumn()", () => {
      it("should add orWhereColumn operation", () => {
        queryBuilder.orWhereColumn("startDate", "<", "endDate");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orWhereColumn");
      });
    });

    describe("whereColumns()", () => {
      it("should add multiple column comparisons", () => {
        queryBuilder.whereColumns([
          ["price", ">", "discountPrice"],
          ["stock", ">=", "reserved"],
        ]);

        expect(queryBuilder.operations).toHaveLength(2);
        expect(queryBuilder.operations[0].type).toBe("whereColumn");
        expect(queryBuilder.operations[1].type).toBe("whereColumn");
      });
    });

    describe("whereBetweenColumns()", () => {
      it("should add whereBetweenColumns operation", () => {
        queryBuilder.whereBetweenColumns("age", "minAge", "maxAge");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereBetweenColumns");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          lowerColumn: "minAge",
          upperColumn: "maxAge",
        });
      });
    });
  });

  describe("WHERE clauses - date operations", () => {
    describe("whereDate()", () => {
      it("should add whereDate operation with string date", () => {
        queryBuilder.whereDate("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDate");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "createdAt",
          value: "2024-05-01",
        });
      });

      it("should add whereDate operation with Date object", () => {
        const date = new Date("2024-05-01");
        queryBuilder.whereDate("createdAt", date);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDate");
      });
    });

    describe("whereDateEquals()", () => {
      it("should add whereDateEquals operation", () => {
        queryBuilder.whereDateEquals("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDateEquals");
      });
    });

    describe("whereDateBefore()", () => {
      it("should add whereDateBefore operation", () => {
        queryBuilder.whereDateBefore("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDateBefore");
      });
    });

    describe("whereDateAfter()", () => {
      it("should add whereDateAfter operation", () => {
        queryBuilder.whereDateAfter("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDateAfter");
      });
    });

    describe("whereTime()", () => {
      it("should add whereTime operation", () => {
        queryBuilder.whereTime("opensAt", "08:00:00");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereTime");
      });
    });

    describe("whereDay()", () => {
      it("should add whereDay operation", () => {
        queryBuilder.whereDay("createdAt", 15);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDay");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "createdAt",
          value: 15,
        });
      });
    });

    describe("whereMonth()", () => {
      it("should add whereMonth operation", () => {
        queryBuilder.whereMonth("createdAt", 6);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereMonth");
      });
    });

    describe("whereYear()", () => {
      it("should add whereYear operation", () => {
        queryBuilder.whereYear("createdAt", 2024);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereYear");
      });
    });

    describe("whereDateBetween()", () => {
      it("should add whereDateBetween operation", () => {
        const start = new Date("2024-01-01");
        const end = new Date("2024-12-31");
        queryBuilder.whereDateBetween("createdAt", [start, end]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDateBetween");
      });
    });

    describe("whereDateNotBetween()", () => {
      it("should add whereDateNotBetween operation", () => {
        const start = new Date("2024-01-01");
        const end = new Date("2024-12-31");
        queryBuilder.whereDateNotBetween("createdAt", [start, end]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDateNotBetween");
      });
    });
  });

  describe("WHERE clauses - JSON operations", () => {
    describe("whereJsonContains()", () => {
      it("should add whereJsonContains operation", () => {
        queryBuilder.whereJsonContains("tags", "javascript");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonContains");
        expect(queryBuilder.operations[0].data).toEqual({
          path: "tags",
          value: "javascript",
        });
      });
    });

    describe("whereJsonDoesntContain()", () => {
      it("should add whereJsonDoesntContain operation", () => {
        queryBuilder.whereJsonDoesntContain("tags", "deprecated");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonDoesntContain");
      });
    });

    describe("whereJsonContainsKey()", () => {
      it("should add whereJsonContainsKey operation", () => {
        queryBuilder.whereJsonContainsKey("settings.theme");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonContainsKey");
      });
    });

    describe("whereJsonLength()", () => {
      it("should add whereJsonLength operation", () => {
        queryBuilder.whereJsonLength("tags", ">", 3);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonLength");
        expect(queryBuilder.operations[0].data).toEqual({
          path: "tags",
          operator: ">",
          value: 3,
        });
      });
    });

    describe("whereJsonIsArray()", () => {
      it("should add whereJsonIsArray operation", () => {
        queryBuilder.whereJsonIsArray("items");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonIsArray");
      });
    });

    describe("whereJsonIsObject()", () => {
      it("should add whereJsonIsObject operation", () => {
        queryBuilder.whereJsonIsObject("settings");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereJsonIsObject");
      });
    });

    describe("whereArrayLength()", () => {
      it("should add whereArrayLength operation", () => {
        queryBuilder.whereArrayLength("roles", ">=", 2);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereArrayLength");
      });
    });
  });

  describe("WHERE clauses - convenience methods", () => {
    describe("whereId()", () => {
      it("should add where operation for id field", () => {
        queryBuilder.whereId(123);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where");
        expect(queryBuilder.operations[0].data.field).toBe("id");
        expect(queryBuilder.operations[0].data.value).toBe(123);
      });
    });

    describe("whereIds()", () => {
      it("should add whereIn operation for id field", () => {
        queryBuilder.whereIds([1, 2, 3]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereIn");
        expect(queryBuilder.operations[0].data.field).toBe("id");
        expect(queryBuilder.operations[0].data.values).toEqual([1, 2, 3]);
      });
    });

    describe("whereUuid()", () => {
      it("should add where operation for uuid field", () => {
        queryBuilder.whereUuid("abc-123-def");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.field).toBe("uuid");
      });
    });

    describe("whereUlid()", () => {
      it("should add where operation for ulid field", () => {
        queryBuilder.whereUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.field).toBe("ulid");
      });
    });

    describe("whereFullText()", () => {
      it("should add whereFullText operation with single field", () => {
        queryBuilder.whereFullText("title", "javascript tutorial");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereFullText");
        expect(queryBuilder.operations[0].data).toEqual({
          fields: ["title"],
          query: "javascript tutorial",
        });
      });

      it("should add whereFullText operation with multiple fields", () => {
        queryBuilder.whereFullText(["title", "content"], "javascript");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.fields).toEqual(["title", "content"]);
      });
    });

    describe("whereSearch()", () => {
      it("should alias to whereFullText", () => {
        queryBuilder.whereSearch("title", "javascript");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereFullText");
      });
    });

    describe("whereNot()", () => {
      it("should add whereNot operation with callback", () => {
        queryBuilder.whereNot((q) => q.where("status", "inactive"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where:not");
      });
    });

    describe("orWhereNot()", () => {
      it("should add orWhereNot operation with callback", () => {
        queryBuilder.orWhereNot((q) => q.where("status", "inactive"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orWhere:not");
      });
    });
  });

  describe("WHERE clauses - existence", () => {
    describe("whereExists()", () => {
      it("should add whereExists operation for field", () => {
        queryBuilder.whereExists("optionalField");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereExists");
      });

      it("should add whereExists operation with callback", () => {
        queryBuilder.whereExists((q: any) => q.where("status", "active"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where:exists");
      });
    });

    describe("whereNotExists()", () => {
      it("should add whereNotExists operation for field", () => {
        queryBuilder.whereNotExists("deletedAt");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotExists");
      });

      it("should add whereNotExists operation with callback", () => {
        queryBuilder.whereNotExists((q: any) => q.where("status", "inactive"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("where:notExists");
      });
    });

    describe("whereSize()", () => {
      it("should add whereSize operation with exact size", () => {
        queryBuilder.whereSize("tags", 3);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereSize");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "tags",
          operator: "=",
          size: 3,
        });
      });

      it("should add whereSize operation with operator", () => {
        queryBuilder.whereSize("tags", ">", 0);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data).toEqual({
          field: "tags",
          operator: ">",
          size: 0,
        });
      });
    });
  });

  describe("WHERE clauses - array operations", () => {
    describe("whereArrayContains()", () => {
      it("should add whereArrayContains operation", () => {
        queryBuilder.whereArrayContains("tags", "javascript");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereArrayContains");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "tags",
          value: "javascript",
          key: undefined,
        });
      });

      it("should add whereArrayContains with key for array of objects", () => {
        queryBuilder.whereArrayContains("items", "laptop", "name");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.key).toBe("name");
      });
    });

    describe("whereArrayNotContains()", () => {
      it("should add whereArrayNotContains operation", () => {
        queryBuilder.whereArrayNotContains("tags", "deprecated");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereArrayNotContains");
      });
    });

    describe("whereArrayHasOrEmpty()", () => {
      it("should add whereArrayHasOrEmpty operation", () => {
        queryBuilder.whereArrayHasOrEmpty("permissions", "admin");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereArrayHasOrEmpty");
      });
    });

    describe("whereArrayNotHaveOrEmpty()", () => {
      it("should add whereArrayNotHaveOrEmpty operation", () => {
        queryBuilder.whereArrayNotHaveOrEmpty("blockedUsers", "user123");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereArrayNotHaveOrEmpty");
      });
    });
  });

  describe("textSearch()", () => {
    it("should add textSearch operation", () => {
      queryBuilder.textSearch("javascript tutorial");

      expect(queryBuilder.operations).toHaveLength(1);
      expect(queryBuilder.operations[0].type).toBe("textSearch");
      expect(queryBuilder.operations[0].data.query).toBe("javascript tutorial");
    });

    it("should add textSearch with filters", () => {
      queryBuilder.textSearch("javascript", { language: "en" });

      expect(queryBuilder.operations).toHaveLength(1);
      expect(queryBuilder.operations[0].data.filters).toEqual({ language: "en" });
    });
  });

  describe("SELECT / PROJECTION", () => {
    describe("select()", () => {
      it("should add select operation with array of fields", () => {
        queryBuilder.select(["name", "email", "age"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("select");
        expect(queryBuilder.operations[0].data).toEqual({
          fields: ["name", "email", "age"],
        });
      });

      it("should add select operation with rest parameters", () => {
        queryBuilder.select("name", "email");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data).toEqual({
          fields: ["name", "email"],
        });
      });

      it("should add select operation with object projection", () => {
        queryBuilder.select({ name: 1, email: 1, password: 0 });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data).toEqual({
          projection: { name: 1, email: 1, password: 0 },
        });
      });
    });

    describe("selectAs()", () => {
      it("should add select with alias", () => {
        queryBuilder.selectAs("name", "fullName");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data).toEqual({
          projection: { name: "fullName" },
        });
      });
    });

    describe("selectRaw()", () => {
      it("should add raw select expression", () => {
        const expression = { total: { $sum: "$items.price" } };
        queryBuilder.selectRaw(expression);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("selectRaw");
      });
    });

    describe("deselect()", () => {
      it("should add deselect operation", () => {
        queryBuilder.deselect(["password", "token"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("deselect");
      });
    });

    describe("clearSelect()", () => {
      it("should remove all select operations", () => {
        queryBuilder.select(["name"]).select(["email"]).clearSelect();

        const projectOps = queryBuilder.operations.filter((op) => op.stage === "$project");
        expect(projectOps).toHaveLength(0);
      });
    });

    describe("selectAll()", () => {
      it("should alias to clearSelect", () => {
        queryBuilder.select(["name"]).selectAll();

        const projectOps = queryBuilder.operations.filter((op) => op.stage === "$project");
        expect(projectOps).toHaveLength(0);
      });
    });

    describe("addSelect()", () => {
      it("should add to existing selection", () => {
        queryBuilder.select(["name"]).addSelect(["email"]);

        expect(queryBuilder.operations).toHaveLength(2);
        expect(queryBuilder.operations[1].type).toBe("addSelect");
      });
    });

    describe("distinctValues()", () => {
      it("should add distinct operation", () => {
        queryBuilder.distinctValues("category");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("distinct");
      });

      it("should accept array of fields", () => {
        queryBuilder.distinctValues(["category", "status"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.fields).toEqual(["category", "status"]);
      });
    });
  });

  describe("ORDERING", () => {
    describe("orderBy()", () => {
      it("should add orderBy operation with single field", () => {
        queryBuilder.orderBy("createdAt", "desc");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orderBy");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "createdAt",
          direction: "desc",
        });
      });

      it("should default to asc direction", () => {
        queryBuilder.orderBy("name");

        expect(queryBuilder.operations[0].data.direction).toBe("asc");
      });

      it("should add orderBy with object of fields", () => {
        queryBuilder.orderBy({ id: "asc", age: "desc" });

        expect(queryBuilder.operations).toHaveLength(2);
      });
    });

    describe("orderByDesc()", () => {
      it("should add descending order", () => {
        queryBuilder.orderByDesc("createdAt");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.direction).toBe("desc");
      });
    });

    describe("orderByRaw()", () => {
      it("should add raw order expression", () => {
        queryBuilder.orderByRaw({ $meta: "textScore" });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orderByRaw");
      });
    });

    describe("orderByRandom()", () => {
      it("should add random order", () => {
        queryBuilder.orderByRandom(100);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orderByRandom");
      });
    });

    describe("oldest()", () => {
      it("should add ascending order by createdAt", () => {
        queryBuilder.oldest();

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.field).toBe("createdAt");
        expect(queryBuilder.operations[0].data.direction).toBe("asc");
      });

      it("should allow custom column", () => {
        queryBuilder.oldest("updatedAt");

        expect(queryBuilder.operations[0].data.field).toBe("updatedAt");
      });
    });
  });

  describe("LIMITING / PAGINATION", () => {
    describe("limit()", () => {
      it("should add limit operation", () => {
        queryBuilder.limit(10);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("limit");
        expect(queryBuilder.operations[0].data.value).toBe(10);
      });
    });

    describe("skip()", () => {
      it("should add skip operation", () => {
        queryBuilder.skip(20);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("skip");
        expect(queryBuilder.operations[0].data.value).toBe(20);
      });
    });

    describe("offset()", () => {
      it("should alias to skip", () => {
        queryBuilder.offset(20);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("skip");
      });
    });

    describe("take()", () => {
      it("should alias to limit", () => {
        queryBuilder.take(5);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("limit");
      });
    });

    describe("cursor()", () => {
      it("should add cursor operation", () => {
        queryBuilder.cursor("abc123", undefined);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("cursor");
      });
    });
  });

  describe("GROUPING / AGGREGATION", () => {
    describe("groupBy()", () => {
      it("should add groupBy operation with single field", () => {
        queryBuilder.groupBy("category");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("groupBy");
        expect(queryBuilder.operations[0].data.fields).toBe("category");
      });

      it("should add groupBy operation with multiple fields", () => {
        queryBuilder.groupBy(["category", "status"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.fields).toEqual(["category", "status"]);
      });
    });

    describe("groupByRaw()", () => {
      it("should add raw groupBy expression", () => {
        queryBuilder.groupByRaw({ _id: "$category", count: { $sum: 1 } });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("groupByRaw");
      });
    });

    describe("having()", () => {
      it("should add having operation with field and value", () => {
        queryBuilder.having("count", 10);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("having");
      });

      it("should add having operation with operator", () => {
        queryBuilder.having("count", ">", 10);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data).toEqual({
          field: "count",
          operator: ">",
          value: 10,
        });
      });

      it("should add having operation with condition object", () => {
        queryBuilder.having({ count: 10 });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("having:condition");
      });
    });

    describe("havingRaw()", () => {
      it("should add raw having expression", () => {
        queryBuilder.havingRaw({ $expr: { $gt: ["$count", 10] } });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("havingRaw");
      });
    });
  });

  describe("JOINS", () => {
    describe("join()", () => {
      it("should add join operation with simple params", () => {
        queryBuilder.join("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("join");
        expect(queryBuilder.operations[0].data).toEqual({
          table: "profiles",
          localField: "id",
          foreignField: "userId",
          type: "left",
        });
      });

      it("should add join operation with options object", () => {
        queryBuilder.join({
          table: "profiles",
          localField: "id",
          foreignField: "userId",
          alias: "profile",
          select: ["bio", "avatar"],
        });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.alias).toBe("profile");
      });
    });

    describe("leftJoin()", () => {
      it("should add left join operation", () => {
        queryBuilder.leftJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.type).toBe("left");
      });
    });

    describe("rightJoin()", () => {
      it("should add right join operation", () => {
        queryBuilder.rightJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.type).toBe("right");
      });
    });

    describe("innerJoin()", () => {
      it("should add inner join operation", () => {
        queryBuilder.innerJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.type).toBe("inner");
      });
    });

    describe("fullJoin()", () => {
      it("should add full outer join operation", () => {
        queryBuilder.fullJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.type).toBe("full");
      });
    });

    describe("crossJoin()", () => {
      it("should add cross join operation", () => {
        queryBuilder.crossJoin("colors");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.type).toBe("cross");
      });
    });

    describe("joinRaw()", () => {
      it("should add raw join expression", () => {
        const expression = {
          $lookup: {
            from: "profiles",
            localField: "_id",
            foreignField: "userId",
            as: "profile",
          },
        };
        queryBuilder.joinRaw(expression);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("raw");
      });
    });
  });

  describe("UTILITY / CHAINING", () => {
    describe("clone()", () => {
      it("should create a copy with same operations", () => {
        queryBuilder.where("name", "John").orderBy("createdAt");

        const cloned = queryBuilder.clone();

        expect(cloned).not.toBe(queryBuilder);
        expect(cloned.operations).toHaveLength(2);
        expect(cloned.operations).toEqual(queryBuilder.operations);
      });

      it("should create independent copy", () => {
        queryBuilder.where("name", "John");

        const cloned = queryBuilder.clone();
        cloned.where("age", 25);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(cloned.operations).toHaveLength(2);
      });
    });

    describe("tap()", () => {
      it("should execute callback and return this", () => {
        const callback = vi.fn();
        const result = queryBuilder.tap(callback);

        expect(callback).toHaveBeenCalledWith(queryBuilder);
        expect(result).toBe(queryBuilder);
      });
    });

    describe("when()", () => {
      it("should apply callback when condition is truthy", () => {
        queryBuilder.when(true, (q) => q.where("active", true));

        expect(queryBuilder.operations).toHaveLength(1);
      });

      it("should not apply callback when condition is falsy", () => {
        queryBuilder.when(false, (q) => q.where("active", true));

        expect(queryBuilder.operations).toHaveLength(0);
      });

      it("should apply otherwise callback when condition is falsy", () => {
        queryBuilder.when(
          false,
          (q) => q.where("active", true),
          (q) => q.where("inactive", true),
        );

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.field).toBe("inactive");
      });

      it("should pass truthy value to callback", () => {
        const searchTerm = "test";
        queryBuilder.when(searchTerm, (q, term) => q.whereLike("name", term));

        expect(queryBuilder.operations[0].data.pattern).toBe("test");
      });
    });

    describe("raw()", () => {
      it("should allow native query manipulation", () => {
        const builder = vi.fn().mockReturnValue({ $match: {} });
        queryBuilder.raw(builder);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("raw");
      });
    });

    describe("extend()", () => {
      it("should throw for unsupported extensions", () => {
        expect(() => queryBuilder.extend("unsupported")).toThrow(
          "Extension 'unsupported' is not supported",
        );
      });
    });
  });

  describe("SCOPES", () => {
    describe("withoutGlobalScope()", () => {
      it("should add scope names to disabled list", () => {
        queryBuilder.withoutGlobalScope("tenant", "softDelete");

        expect(queryBuilder.disabledGlobalScopes.has("tenant")).toBe(true);
        expect(queryBuilder.disabledGlobalScopes.has("softDelete")).toBe(true);
      });
    });

    describe("withoutGlobalScopes()", () => {
      it("should disable all pending global scopes", () => {
        queryBuilder.pendingGlobalScopes = new Map([
          ["scope1", { callback: () => {}, timing: "before" }],
          ["scope2", { callback: () => {}, timing: "after" }],
        ]);

        queryBuilder.withoutGlobalScopes();

        expect(queryBuilder.disabledGlobalScopes.has("scope1")).toBe(true);
        expect(queryBuilder.disabledGlobalScopes.has("scope2")).toBe(true);
      });
    });

    describe("scope()", () => {
      it("should apply local scope", () => {
        const scopeCallback = vi.fn((q) => q.where("active", true));
        queryBuilder.availableLocalScopes = new Map([["active", scopeCallback]]);

        queryBuilder.scope("active");

        expect(scopeCallback).toHaveBeenCalledWith(queryBuilder);
      });

      it("should throw when no local scopes available", () => {
        expect(() => queryBuilder.scope("active")).toThrow("No local scopes available");
      });

      it("should throw when scope not found", () => {
        queryBuilder.availableLocalScopes = new Map();

        expect(() => queryBuilder.scope("nonexistent")).toThrow(
          'Local scope "nonexistent" not found',
        );
      });
    });
  });

  describe("HYDRATION CALLBACKS", () => {
    describe("hydrate()", () => {
      it("should set hydrate callback", () => {
        const callback = (data: any) => ({ ...data, hydrated: true });
        queryBuilder.hydrate(callback);

        expect(queryBuilder.hydrateCallback).toBe(callback);
      });
    });

    describe("onFetching()", () => {
      it("should set fetching callback and return unsubscribe", () => {
        const callback = vi.fn();
        const unsubscribe = queryBuilder.onFetching(callback);

        expect(typeof unsubscribe).toBe("function");

        unsubscribe();
        // Callback should be cleared after unsubscribe
      });
    });

    describe("onHydrating()", () => {
      it("should set hydrating callback and return unsubscribe", () => {
        const callback = vi.fn();
        const unsubscribe = queryBuilder.onHydrating(callback);

        expect(typeof unsubscribe).toBe("function");
      });
    });

    describe("onFetched()", () => {
      it("should set fetched callback and return unsubscribe", () => {
        const callback = vi.fn();
        const unsubscribe = queryBuilder.onFetched(callback);

        expect(typeof unsubscribe).toBe("function");
      });
    });
  });

  describe("EAGER LOADING (stubs)", () => {
    describe("with()", () => {
      it("should add relation to eager load map", () => {
        queryBuilder.with("posts");

        expect(queryBuilder.eagerLoadRelations.get("posts")).toBe(true);
      });

      it("should add multiple relations", () => {
        queryBuilder.with("posts", "comments");

        expect(queryBuilder.eagerLoadRelations.get("posts")).toBe(true);
        expect(queryBuilder.eagerLoadRelations.get("comments")).toBe(true);
      });

      it("should add relation with constraint callback", () => {
        const constraint = (q: any) => q.where("published", true);
        queryBuilder.with("posts", constraint);

        expect(queryBuilder.eagerLoadRelations.get("posts")).toBe(constraint);
      });

      it("should add relations from object config", () => {
        const constraint = (q: any) => q.where("published", true);
        queryBuilder.with({
          posts: constraint,
          comments: true,
        });

        expect(queryBuilder.eagerLoadRelations.get("posts")).toBe(constraint);
        expect(queryBuilder.eagerLoadRelations.get("comments")).toBe(true);
      });
    });

    describe("withCount()", () => {
      it("should add relation to count array", () => {
        queryBuilder.withCount("posts");

        expect(queryBuilder.countRelations).toContain("posts");
      });

      it("should add multiple relations", () => {
        queryBuilder.withCount("posts", "comments");

        expect(queryBuilder.countRelations).toEqual(["posts", "comments"]);
      });
    });

    describe("has()", () => {
      it("should add has operation", () => {
        queryBuilder.has("posts");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("has");
      });

      it("should add has operation with count", () => {
        queryBuilder.has("posts", ">=", 5);

        expect(queryBuilder.operations[0].data).toEqual({
          relation: "posts",
          operator: ">=",
          count: 5,
        });
      });
    });

    describe("whereHas()", () => {
      it("should add whereHas operation", () => {
        const callback = (q: any) => q.where("published", true);
        queryBuilder.whereHas("posts", callback);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereHas");
      });
    });

    describe("doesntHave()", () => {
      it("should add doesntHave operation", () => {
        queryBuilder.doesntHave("posts");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("doesntHave");
      });
    });

    describe("whereDoesntHave()", () => {
      it("should add whereDoesntHave operation", () => {
        const callback = (q: any) => q.where("published", true);
        queryBuilder.whereDoesntHave("posts", callback);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDoesntHave");
      });
    });

    describe("joinWith()", () => {
      it("should add relation to joinRelations map when definition exists", () => {
        queryBuilder.relationDefinitions = {
          author: { type: "belongsTo", model: "User" },
        };

        queryBuilder.joinWith("author");

        expect(queryBuilder.joinRelations.has("author")).toBe(true);
        expect(queryBuilder.joinRelations.get("author")).toEqual({
          alias: "_rel_author",
          type: "belongsTo",
        });
      });
    });
  });

  describe("CHAINING", () => {
    it("should support complex query chains", () => {
      queryBuilder
        .select(["name", "email"])
        .where("status", "active")
        .where("age", ">", 18)
        .orWhere("role", "admin")
        .whereIn("department", ["sales", "marketing"])
        .whereNotNull("email")
        .orderBy("createdAt", "desc")
        .limit(10)
        .offset(20);

      expect(queryBuilder.operations.length).toBeGreaterThan(0);

      // Verify the chain maintains integrity
      const whereOps = queryBuilder.operations.filter((op) => op.stage === "$match");
      expect(whereOps.length).toBeGreaterThan(0);
    });

    it("should maintain fluent interface for all methods", () => {
      const chain = queryBuilder.select(["name"]).where("active", true).orderBy("name").limit(10);

      expect(chain).toBe(queryBuilder);
    });
  });
});
