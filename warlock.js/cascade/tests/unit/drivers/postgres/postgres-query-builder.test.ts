import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataSource } from "../../../../src/data-source/data-source";
import { dataSourceRegistry } from "../../../../src/data-source/data-source-registry";
import { PostgresDialect } from "../../../../src/drivers/postgres/postgres-dialect";
import { PostgresQueryBuilder } from "../../../../src/drivers/postgres/postgres-query-builder";
import { createMockDriver } from "../../../helpers/mock-driver";

/**
 * Create a mock PostgreSQL driver with dialect support
 */
function createMockPostgresDriver() {
  const mockDriver = createMockDriver("postgres");
  // Add dialect to the mock driver
  (mockDriver as any).dialect = new PostgresDialect();
  (mockDriver as any).query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  return mockDriver;
}

describe("PostgresQueryBuilder", () => {
  let queryBuilder: PostgresQueryBuilder;
  let mockDataSource: DataSource;
  let mockDriver: ReturnType<typeof createMockPostgresDriver>;

  beforeEach(() => {
    // Create mock driver and data source
    mockDriver = createMockPostgresDriver();
    mockDataSource = new DataSource({
      name: "test",
      driver: mockDriver,
      isDefault: true,
    });

    // Register the mock data source as default
    dataSourceRegistry.register(mockDataSource);

    // Create query builder instance
    queryBuilder = new PostgresQueryBuilder("users", mockDataSource);
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
      const builder = new PostgresQueryBuilder("posts");
      // Uses property equality check since registry may return different reference
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

        // Object conditions are expanded into individual where operations
        expect(queryBuilder.operations).toHaveLength(2);
        expect(queryBuilder.operations[0].data.field).toBe("name");
        expect(queryBuilder.operations[1].data.field).toBe("age");
      });

      it("should add where operation with callback for nested conditions", () => {
        queryBuilder.where((q: any) => q.where("status", "active"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.nested).toBeDefined();
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
        queryBuilder.whereRaw("age > $1", [30]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toBe("age > $1");
        expect(queryBuilder.operations[0].data.bindings).toEqual([30]);
      });
    });

    describe("orWhereRaw()", () => {
      it("should add raw orWhere expression", () => {
        queryBuilder.orWhereRaw("status = $1 OR role = $2", ["active", "admin"]);

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
        // Regex is converted to source string
        expect(queryBuilder.operations[0].data.pattern).toBe("john");
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
      it("should use whereLike with prefix pattern", () => {
        queryBuilder.whereStartsWith("name", "John");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereLike");
        expect(queryBuilder.operations[0].data.pattern).toBe("John%");
      });
    });

    describe("whereNotStartsWith()", () => {
      it("should use whereNotLike with prefix pattern", () => {
        queryBuilder.whereNotStartsWith("name", "Admin");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotLike");
        expect(queryBuilder.operations[0].data.pattern).toBe("Admin%");
      });
    });

    describe("whereEndsWith()", () => {
      it("should use whereLike with suffix pattern", () => {
        queryBuilder.whereEndsWith("email", "@example.com");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereLike");
        expect(queryBuilder.operations[0].data.pattern).toBe("%@example.com");
      });
    });

    describe("whereNotEndsWith()", () => {
      it("should use whereNotLike with suffix pattern", () => {
        queryBuilder.whereNotEndsWith("email", "@spam.com");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotLike");
        expect(queryBuilder.operations[0].data.pattern).toBe("%@spam.com");
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
      it("should add whereBetween operation with columns", () => {
        queryBuilder.whereBetweenColumns("age", "minAge", "maxAge");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereBetween");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "age",
          lowerColumn: "minAge",
          upperColumn: "maxAge",
          useColumns: true,
        });
      });
    });
  });

  describe("WHERE clauses - date operations", () => {
    describe("whereDate()", () => {
      it("should add whereDate operation", () => {
        queryBuilder.whereDate("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDate");
        expect(queryBuilder.operations[0].data).toEqual({
          field: "createdAt",
          value: "2024-05-01",
        });
      });
    });

    describe("whereDateEquals()", () => {
      it("should alias to whereDate", () => {
        queryBuilder.whereDateEquals("createdAt", "2024-05-01");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereDate");
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

    describe("whereDay()", () => {
      it("should add raw where for day extraction", () => {
        queryBuilder.whereDay("createdAt", 15);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain("EXTRACT(DAY FROM createdAt)");
      });
    });

    describe("whereMonth()", () => {
      it("should add raw where for month extraction", () => {
        queryBuilder.whereMonth("createdAt", 6);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain(
          "EXTRACT(MONTH FROM createdAt)",
        );
      });
    });

    describe("whereYear()", () => {
      it("should add raw where for year extraction", () => {
        queryBuilder.whereYear("createdAt", 2024);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain(
          "EXTRACT(YEAR FROM createdAt)",
        );
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
      it("should add whereNotBetween operation", () => {
        const start = new Date("2024-01-01");
        const end = new Date("2024-12-31");
        queryBuilder.whereDateNotBetween("createdAt", [start, end]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotBetween");
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
      it("should add raw where for key existence", () => {
        queryBuilder.whereJsonContainsKey("settings.theme");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain("IS NOT NULL");
      });
    });

    describe("whereJsonLength()", () => {
      it("should add raw where for jsonb array length", () => {
        queryBuilder.whereJsonLength("tags", ">", 3);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain("jsonb_array_length");
      });
    });

    describe("whereJsonIsArray()", () => {
      it("should add raw where for jsonb type check", () => {
        queryBuilder.whereJsonIsArray("items");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("jsonb_typeof");
      });
    });

    describe("whereJsonIsObject()", () => {
      it("should add raw where for jsonb type check", () => {
        queryBuilder.whereJsonIsObject("settings");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("jsonb_typeof");
      });
    });

    describe("whereArrayLength()", () => {
      it("should add raw where for PostgreSQL array length", () => {
        queryBuilder.whereArrayLength("roles", ">=", 2);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("array_length");
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
      });
    });

    describe("whereIds()", () => {
      it("should add whereIn operation for id field", () => {
        queryBuilder.whereIds([1, 2, 3]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereIn");
        expect(queryBuilder.operations[0].data.field).toBe("id");
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
  });

  describe("WHERE clauses - existence", () => {
    describe("whereExists()", () => {
      it("should add whereNotNull for field existence", () => {
        queryBuilder.whereExists("optionalField");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotNull");
      });

      it("should add whereExists operation with callback for subquery", () => {
        queryBuilder.whereExists((q: any) => q.where("status", "active"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereExists");
        expect(queryBuilder.operations[0].data.subquery).toBeDefined();
      });
    });

    describe("whereNotExists()", () => {
      it("should add whereNull for field non-existence", () => {
        queryBuilder.whereNotExists("deletedAt");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNull");
      });

      it("should add whereNotExists operation with callback", () => {
        queryBuilder.whereNotExists((q: any) => q.where("status", "inactive"));

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereNotExists");
      });
    });

    describe("whereSize()", () => {
      it("should use whereArrayLength with exact size", () => {
        queryBuilder.whereSize("tags", 3);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("array_length");
      });

      it("should use whereArrayLength with operator", () => {
        queryBuilder.whereSize("tags", ">", 0);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain(">");
      });
    });
  });

  describe("WHERE clauses - array operations", () => {
    describe("whereArrayContains()", () => {
      it("should add raw where for array contains", () => {
        queryBuilder.whereArrayContains("tags", "javascript");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("whereRaw");
        expect(queryBuilder.operations[0].data.expression).toContain("ANY");
      });

      it("should handle array of objects with key", () => {
        queryBuilder.whereArrayContains("items", "laptop", "name");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("@>");
        expect(queryBuilder.operations[0].data.expression).toContain("jsonb");
      });
    });

    describe("whereArrayNotContains()", () => {
      it("should add raw where for array not contains", () => {
        queryBuilder.whereArrayNotContains("tags", "deprecated");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("NOT");
      });
    });

    describe("whereArrayHasOrEmpty()", () => {
      it("should add raw where for has or empty", () => {
        queryBuilder.whereArrayHasOrEmpty("permissions", "admin");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("OR");
      });
    });

    describe("whereArrayNotHaveOrEmpty()", () => {
      it("should add raw where for not have or empty", () => {
        queryBuilder.whereArrayNotHaveOrEmpty("blockedUsers", "user123");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.expression).toContain("NOT");
        expect(queryBuilder.operations[0].data.expression).toContain("OR");
      });
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
        expect(queryBuilder.operations[0].data.fields).toEqual({
          name: 1,
          email: 1,
          password: 0,
        });
      });
    });

    describe("selectAs()", () => {
      it("should add select with alias", () => {
        queryBuilder.selectAs("name", "fullName");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.fields).toEqual({
          name: "fullName",
        });
      });
    });

    describe("selectRaw()", () => {
      it("should add raw select expression", () => {
        queryBuilder.selectRaw("COUNT(*) as total");

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
        queryBuilder.select(["name"]).selectRaw("COUNT(*)").clearSelect();

        const selectOps = queryBuilder.operations.filter(
          (op) => op.type.startsWith("select") || op.type === "deselect",
        );
        expect(selectOps).toHaveLength(0);
      });
    });

    describe("selectAll()", () => {
      it("should alias to clearSelect", () => {
        queryBuilder.select(["name"]).selectAll();

        const selectOps = queryBuilder.operations.filter((op) => op.type.startsWith("select"));
        expect(selectOps).toHaveLength(0);
      });
    });

    describe("addSelect()", () => {
      it("should add to existing selection", () => {
        queryBuilder.select(["name"]).addSelect(["email"]);

        expect(queryBuilder.operations).toHaveLength(2);
        expect(queryBuilder.operations[1].data.add).toBe(true);
      });
    });

    describe("distinctValues()", () => {
      it("should add distinct operation", () => {
        queryBuilder.distinctValues("category");

        expect(queryBuilder.operations).toHaveLength(2); // distinct + select
        expect(queryBuilder.operations[0].type).toBe("distinct");
      });

      it("should accept array of fields", () => {
        queryBuilder.distinctValues(["category", "status"]);

        expect(queryBuilder.operations).toHaveLength(2);
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
        queryBuilder.orderByRaw("RANDOM()");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("orderByRaw");
      });
    });

    describe("orderByRandom()", () => {
      it("should add random order with limit", () => {
        queryBuilder.orderByRandom(100);

        expect(queryBuilder.operations).toHaveLength(2); // orderByRaw + limit
        expect(queryBuilder.operations[0].type).toBe("orderByRaw");
        expect(queryBuilder.operations[0].data.expression).toBe("RANDOM()");
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
      it("should add offset operation", () => {
        queryBuilder.skip(20);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("offset");
        expect(queryBuilder.operations[0].data.value).toBe(20);
      });
    });

    describe("offset()", () => {
      it("should alias to skip", () => {
        queryBuilder.offset(20);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("offset");
      });
    });

    describe("take()", () => {
      it("should alias to limit", () => {
        queryBuilder.take(5);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("limit");
      });
    });
  });

  describe("GROUPING / AGGREGATION", () => {
    describe("groupBy()", () => {
      it("should add groupBy operation with single field", () => {
        queryBuilder.groupBy("category");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("groupBy");
        expect(queryBuilder.operations[0].data.fields).toEqual(["category"]);
      });

      it("should add groupBy operation with multiple fields", () => {
        queryBuilder.groupBy(["category", "status"]);

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.fields).toEqual(["category", "status"]);
      });
    });

    describe("groupByRaw()", () => {
      it("should add raw groupBy expression", () => {
        queryBuilder.groupByRaw("DATE(createdAt)");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("groupBy");
        expect(queryBuilder.operations[0].data.expression).toBe("DATE(createdAt)");
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
    });

    describe("havingRaw()", () => {
      it("should add raw having expression", () => {
        queryBuilder.havingRaw("COUNT(*) > $1", [10]);

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
        });
      });

      it("should add join operation with options object", () => {
        queryBuilder.join({
          table: "profiles",
          localField: "id",
          foreignField: "userId",
          alias: "profile",
        });

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].data.alias).toBe("profile");
      });
    });

    describe("leftJoin()", () => {
      it("should add leftJoin operation", () => {
        queryBuilder.leftJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("leftJoin");
      });
    });

    describe("rightJoin()", () => {
      it("should add rightJoin operation", () => {
        queryBuilder.rightJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("rightJoin");
      });
    });

    describe("innerJoin()", () => {
      it("should add innerJoin operation", () => {
        queryBuilder.innerJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("innerJoin");
      });
    });

    describe("fullJoin()", () => {
      it("should add fullJoin operation", () => {
        queryBuilder.fullJoin("profiles", "id", "userId");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("fullJoin");
      });
    });

    describe("crossJoin()", () => {
      it("should add crossJoin operation", () => {
        queryBuilder.crossJoin("colors");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("crossJoin");
        expect(queryBuilder.operations[0].data.table).toBe("colors");
      });
    });

    describe("joinRaw()", () => {
      it("should add raw join expression", () => {
        queryBuilder.joinRaw(
          "LEFT JOIN profiles ON profiles.user_id = users.id AND profiles.active = $1",
          [true],
        );

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("joinRaw");
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
    });

    describe("raw()", () => {
      it("should allow native query manipulation", () => {
        const builder = vi.fn();
        queryBuilder.raw(builder);

        expect(builder).toHaveBeenCalledWith(queryBuilder.operations);
      });
    });

    describe("extend()", () => {
      it("should throw for unsupported extensions", () => {
        expect(() => queryBuilder.extend("unsupported")).toThrow(
          'Extension "unsupported" is not supported',
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

        expect(scopeCallback).toHaveBeenCalled();
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
    });

    describe("withCount()", () => {
      it("should add relation to count array", () => {
        queryBuilder.withCount("posts");

        expect(queryBuilder.countRelations).toContain("posts");
      });
    });

    describe("has()", () => {
      it("should add has operation", () => {
        queryBuilder.has("posts");

        expect(queryBuilder.operations).toHaveLength(1);
        expect(queryBuilder.operations[0].type).toBe("has");
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
    });

    it("should maintain fluent interface for all methods", () => {
      const chain = queryBuilder.select(["name"]).where("active", true).orderBy("name").limit(10);

      expect(chain).toBe(queryBuilder);
    });
  });

  describe("SQL parsing - parse()", () => {
    it("should return SQL object with sql and params", () => {
      queryBuilder.select(["name", "email"]).where("status", "active");

      const result = queryBuilder.parse();

      expect(result).toHaveProperty("sql");
      expect(result).toHaveProperty("params");
      expect(typeof result.sql).toBe("string");
      expect(Array.isArray(result.params)).toBe(true);
    });
  });

  describe("pretty()", () => {
    it("should return formatted SQL string with parameters", () => {
      queryBuilder.select(["name"]).where("status", "active");

      const result = queryBuilder.pretty();

      expect(typeof result).toBe("string");
      expect(result).toContain("Parameters:");
    });
  });
});
