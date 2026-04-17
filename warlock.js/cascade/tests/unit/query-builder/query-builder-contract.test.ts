import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoQueryBuilder } from "../../../src/drivers/mongodb/mongodb-query-builder";
import { PostgresQueryBuilder } from "../../../src/drivers/postgres/postgres-query-builder";
import { PostgresDialect } from "../../../src/drivers/postgres/postgres-dialect";
import { DataSource } from "../../../src/data-source/data-source";
import { dataSourceRegistry } from "../../../src/data-source/data-source-registry";
import { createMockDriver } from "../../helpers/mock-driver";
import type { QueryBuilderContract } from "../../../src/contracts/query-builder.contract";

/**
 * Contract test suite for query builders.
 * These tests ensure both MongoDB and PostgreSQL query builders
 * implement the QueryBuilderContract interface correctly.
 */
describe("QueryBuilderContract - Shared Behavior Tests", () => {
  // Test both implementations
  const implementations = [
    {
      name: "MongoQueryBuilder",
      createBuilder: (table: string, ds: DataSource) => new MongoQueryBuilder(table, ds),
      createMockDriver: () => createMockDriver("mongodb"),
    },
    {
      name: "PostgresQueryBuilder",
      createBuilder: (table: string, ds: DataSource) => new PostgresQueryBuilder(table, ds),
      createMockDriver: () => {
        const driver = createMockDriver("postgres");
        (driver as any).dialect = new PostgresDialect();
        (driver as any).query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        return driver;
      },
    },
  ];

  implementations.forEach(({ name, createBuilder, createMockDriver: createDriver }) => {
    describe(`${name}`, () => {
      let queryBuilder: QueryBuilderContract;
      let mockDataSource: DataSource;
      let mockDriver: ReturnType<typeof createMockDriver>;

      beforeEach(() => {
        mockDriver = createDriver();
        mockDataSource = new DataSource({
          name: "test",
          driver: mockDriver,
        });
        dataSourceRegistry.register(mockDataSource, true);
        queryBuilder = createBuilder("users", mockDataSource);
      });

      afterEach(() => {
        dataSourceRegistry.clear();
        vi.clearAllMocks();
      });

      describe("Contract Properties", () => {
        it("should have a table property", () => {
          expect(queryBuilder.table).toBe("users");
        });

        it("should initialize eagerLoadRelations as a Map", () => {
          expect(queryBuilder.eagerLoadRelations).toBeInstanceOf(Map);
        });

        it("should initialize countRelations as an array", () => {
          expect(Array.isArray(queryBuilder.countRelations)).toBe(true);
        });

        it("should initialize disabledGlobalScopes as a Set", () => {
          expect(queryBuilder.disabledGlobalScopes).toBeInstanceOf(Set);
        });
      });

      describe("Fluent Interface - All methods should return 'this'", () => {
        it("where() should return this", () => {
          expect(queryBuilder.where("name", "John")).toBe(queryBuilder);
        });

        it("orWhere() should return this", () => {
          expect(queryBuilder.orWhere("name", "Jane")).toBe(queryBuilder);
        });

        it("whereIn() should return this", () => {
          expect(queryBuilder.whereIn("status", ["active"])).toBe(queryBuilder);
        });

        it("whereNotIn() should return this", () => {
          expect(queryBuilder.whereNotIn("status", ["deleted"])).toBe(queryBuilder);
        });

        it("whereNull() should return this", () => {
          expect(queryBuilder.whereNull("deletedAt")).toBe(queryBuilder);
        });

        it("whereNotNull() should return this", () => {
          expect(queryBuilder.whereNotNull("email")).toBe(queryBuilder);
        });

        it("whereBetween() should return this", () => {
          expect(queryBuilder.whereBetween("age", [18, 65])).toBe(queryBuilder);
        });

        it("whereNotBetween() should return this", () => {
          expect(queryBuilder.whereNotBetween("age", [18, 65])).toBe(queryBuilder);
        });

        it("whereLike() should return this", () => {
          expect(queryBuilder.whereLike("name", "%test%")).toBe(queryBuilder);
        });

        it("whereNotLike() should return this", () => {
          expect(queryBuilder.whereNotLike("name", "%test%")).toBe(queryBuilder);
        });

        it("select() should return this", () => {
          expect(queryBuilder.select(["name"])).toBe(queryBuilder);
        });

        it("orderBy() should return this", () => {
          expect(queryBuilder.orderBy("name")).toBe(queryBuilder);
        });

        it("orderByDesc() should return this", () => {
          expect(queryBuilder.orderByDesc("name")).toBe(queryBuilder);
        });

        it("limit() should return this", () => {
          expect(queryBuilder.limit(10)).toBe(queryBuilder);
        });

        it("offset() should return this", () => {
          expect(queryBuilder.offset(20)).toBe(queryBuilder);
        });

        it("skip() should return this", () => {
          expect(queryBuilder.skip(20)).toBe(queryBuilder);
        });

        it("take() should return this", () => {
          expect(queryBuilder.take(10)).toBe(queryBuilder);
        });

        it("groupBy() should return this", () => {
          expect(queryBuilder.groupBy("category")).toBe(queryBuilder);
        });

        it("having() should return this", () => {
          expect(queryBuilder.having("count", ">", 5)).toBe(queryBuilder);
        });

        it("tap() should return this", () => {
          expect(queryBuilder.tap(() => {})).toBe(queryBuilder);
        });

        it("when() should return this", () => {
          expect(queryBuilder.when(true, () => {})).toBe(queryBuilder);
        });

        it("with() should return this", () => {
          expect(queryBuilder.with("posts")).toBe(queryBuilder);
        });

        it("withCount() should return this", () => {
          expect(queryBuilder.withCount("posts")).toBe(queryBuilder);
        });

        it("withoutGlobalScope() should return this", () => {
          expect(queryBuilder.withoutGlobalScope("scope1")).toBe(queryBuilder);
        });

        it("withoutGlobalScopes() should return this", () => {
          expect(queryBuilder.withoutGlobalScopes()).toBe(queryBuilder);
        });
      });

      describe("clone() - Independence", () => {
        it("should create independent query builder instance", () => {
          queryBuilder.where("name", "John");
          const cloned = queryBuilder.clone();

          expect(cloned).not.toBe(queryBuilder);
          cloned.where("age", 25);

          // Original should remain unchanged
          expect((queryBuilder as any).operations).toHaveLength(1);
          expect((cloned as any).operations).toHaveLength(2);
        });
      });

      describe("when() - Conditional Application", () => {
        it("should apply callback when condition is truthy", () => {
          queryBuilder.when("searchTerm", (q, value) => {
            q.where("name", value);
          });

          expect((queryBuilder as any).operations).toHaveLength(1);
        });

        it("should not apply callback when condition is falsy", () => {
          queryBuilder.when(null, (q) => {
            q.where("name", "test");
          });

          expect((queryBuilder as any).operations).toHaveLength(0);
        });

        it("should apply otherwise callback when condition is falsy", () => {
          queryBuilder.when(
            false,
            (q) => q.where("active", true),
            (q) => q.where("inactive", true)
          );

          const ops = (queryBuilder as any).operations;
          expect(ops).toHaveLength(1);
          expect(ops[0].data.field).toBe("inactive");
        });

        it("should handle callback returning value", () => {
          queryBuilder.when(() => true, (q) => {
            q.where("evaluated", true);
          });

          expect((queryBuilder as any).operations).toHaveLength(1);
        });
      });

      describe("tap() - Side Effects", () => {
        it("should execute callback with builder instance", () => {
          const callback = vi.fn();
          queryBuilder.tap(callback);

          expect(callback).toHaveBeenCalledWith(queryBuilder);
        });

        it("should not modify the chain", () => {
          let capturedBuilder: QueryBuilderContract | undefined;
          const result = queryBuilder.tap((q) => {
            capturedBuilder = q;
          });

          expect(result).toBe(queryBuilder);
          expect(capturedBuilder).toBe(queryBuilder);
        });
      });

      describe("with() - Eager Loading", () => {
        it("should add single relation", () => {
          queryBuilder.with("posts");

          expect(queryBuilder.eagerLoadRelations?.get("posts")).toBe(true);
        });

        it("should add multiple relations", () => {
          queryBuilder.with("posts", "comments", "author");

          expect(queryBuilder.eagerLoadRelations?.get("posts")).toBe(true);
          expect(queryBuilder.eagerLoadRelations?.get("comments")).toBe(true);
          expect(queryBuilder.eagerLoadRelations?.get("author")).toBe(true);
        });

        it("should add relation with constraint callback", () => {
          const constraint = vi.fn();
          queryBuilder.with("posts", constraint);

          expect(queryBuilder.eagerLoadRelations?.get("posts")).toBe(constraint);
        });

        it("should add relations from object", () => {
          const postsConstraint = vi.fn();
          queryBuilder.with({
            posts: postsConstraint,
            comments: true,
          });

          expect(queryBuilder.eagerLoadRelations?.get("posts")).toBe(postsConstraint);
          expect(queryBuilder.eagerLoadRelations?.get("comments")).toBe(true);
        });
      });

      describe("withCount() - Relation Counting", () => {
        it("should add single relation to count", () => {
          queryBuilder.withCount("posts");

          expect(queryBuilder.countRelations).toContain("posts");
        });

        it("should add multiple relations to count", () => {
          queryBuilder.withCount("posts", "comments", "likes");

          expect(queryBuilder.countRelations).toContain("posts");
          expect(queryBuilder.countRelations).toContain("comments");
          expect(queryBuilder.countRelations).toContain("likes");
        });
      });

      describe("Scopes", () => {
        describe("withoutGlobalScope()", () => {
          it("should disable specified global scopes", () => {
            queryBuilder.withoutGlobalScope("tenant", "softDelete");

            expect(queryBuilder.disabledGlobalScopes?.has("tenant")).toBe(true);
            expect(queryBuilder.disabledGlobalScopes?.has("softDelete")).toBe(true);
          });
        });

        describe("withoutGlobalScopes()", () => {
          it("should disable all pending global scopes", () => {
            queryBuilder.pendingGlobalScopes = new Map([
              ["scope1", { callback: () => {}, timing: "before" }],
              ["scope2", { callback: () => {}, timing: "after" }],
            ]);

            queryBuilder.withoutGlobalScopes();

            expect(queryBuilder.disabledGlobalScopes?.has("scope1")).toBe(true);
            expect(queryBuilder.disabledGlobalScopes?.has("scope2")).toBe(true);
          });
        });

        describe("scope()", () => {
          it("should apply registered local scope", () => {
            const scopeCallback = vi.fn((q) => q.where("active", true));
            queryBuilder.availableLocalScopes = new Map([["active", scopeCallback]]);

            queryBuilder.scope("active");

            expect(scopeCallback).toHaveBeenCalledWith(queryBuilder);
          });

          it("should throw when no local scopes available", () => {
            expect(() => queryBuilder.scope("active")).toThrow(/No local scopes/);
          });

          it("should throw when scope not found", () => {
            queryBuilder.availableLocalScopes = new Map();
            expect(() => queryBuilder.scope("nonexistent")).toThrow(/not found/);
          });
        });
      });

      describe("Lifecycle Callbacks", () => {
        describe("onFetching()", () => {
          it("should return unsubscribe function", () => {
            const unsubscribe = queryBuilder.onFetching(() => {});
            expect(typeof unsubscribe).toBe("function");
          });
        });

        describe("onHydrating()", () => {
          it("should return unsubscribe function", () => {
            const unsubscribe = queryBuilder.onHydrating(() => {});
            expect(typeof unsubscribe).toBe("function");
          });
        });

        describe("onFetched()", () => {
          it("should return unsubscribe function", () => {
            const unsubscribe = queryBuilder.onFetched(() => {});
            expect(typeof unsubscribe).toBe("function");
          });
        });

        describe("hydrate()", () => {
          it("should set hydrate callback", () => {
            const callback = (data: any) => data;
            queryBuilder.hydrate(callback);

            expect((queryBuilder as any).hydrateCallback).toBe(callback);
          });
        });
      });

      describe("Complex Query Chains", () => {
        it("should support complex where combinations", () => {
          queryBuilder
            .where("status", "active")
            .where("age", ">", 18)
            .orWhere("role", "admin")
            .whereIn("department", ["sales", "marketing"])
            .whereNotNull("email")
            .whereNull("deletedAt");

          const ops = (queryBuilder as any).operations;
          expect(ops.length).toBeGreaterThanOrEqual(6);
        });

        it("should support select with ordering and pagination", () => {
          queryBuilder
            .select(["id", "name", "email"])
            .orderBy("createdAt", "desc")
            .orderBy("name", "asc")
            .limit(20)
            .offset(40);

          const ops = (queryBuilder as any).operations;
          expect(ops.length).toBeGreaterThanOrEqual(5);
        });

        it("should support grouping with having", () => {
          queryBuilder.groupBy("category").having("count", ">", 5);

          const ops = (queryBuilder as any).operations;
          expect(ops.length).toBe(2);
        });

        it("should support eager loading with constraints", () => {
          queryBuilder
            .with("posts", (q) => q.where("published", true).orderBy("createdAt", "desc"))
            .with("comments")
            .withCount("likes");

          expect(queryBuilder.eagerLoadRelations?.has("posts")).toBe(true);
          expect(queryBuilder.eagerLoadRelations?.has("comments")).toBe(true);
          expect(queryBuilder.countRelations).toContain("likes");
        });
      });

      describe("Required Interface Methods", () => {
        it("should have get() method", () => {
          expect(typeof queryBuilder.get).toBe("function");
        });

        it("should have first() method", () => {
          expect(typeof queryBuilder.first).toBe("function");
        });

        it("should have count() method", () => {
          expect(typeof queryBuilder.count).toBe("function");
        });

        it("should have sum() method", () => {
          expect(typeof queryBuilder.sum).toBe("function");
        });

        it("should have avg() method", () => {
          expect(typeof queryBuilder.avg).toBe("function");
        });

        it("should have min() method", () => {
          expect(typeof queryBuilder.min).toBe("function");
        });

        it("should have max() method", () => {
          expect(typeof queryBuilder.max).toBe("function");
        });

        it("should have pluck() method", () => {
          expect(typeof queryBuilder.pluck).toBe("function");
        });

        it("should have exists() method", () => {
          expect(typeof queryBuilder.exists).toBe("function");
        });

        it("should have notExists() method", () => {
          expect(typeof queryBuilder.notExists).toBe("function");
        });

        it("should have paginate() method", () => {
          expect(typeof queryBuilder.paginate).toBe("function");
        });

        it("should have cursorPaginate() method", () => {
          expect(typeof queryBuilder.cursorPaginate).toBe("function");
        });

        it("should have chunk() method", () => {
          expect(typeof queryBuilder.chunk).toBe("function");
        });

        it("should have parse() method", () => {
          expect(typeof queryBuilder.parse).toBe("function");
        });

        it("should have pretty() method", () => {
          expect(typeof queryBuilder.pretty).toBe("function");
        });
      });
    });
  });
});

describe("QueryBuilder - Operation Types Consistency", () => {
  /**
   * These tests verify that operations added by methods
   * have consistent types across implementations
   */

  const implementations = [
    {
      name: "MongoQueryBuilder",
      createBuilder: (table: string, ds: DataSource) => new MongoQueryBuilder(table, ds),
      createMockDriver: () => createMockDriver("mongodb"),
    },
    {
      name: "PostgresQueryBuilder",
      createBuilder: (table: string, ds: DataSource) => new PostgresQueryBuilder(table, ds),
      createMockDriver: () => {
        const driver = createMockDriver("postgres");
        (driver as any).dialect = new PostgresDialect();
        return driver;
      },
    },
  ];

  implementations.forEach(({ name, createBuilder, createMockDriver: createDriver }) => {
    describe(`${name} - Operation Type Verification`, () => {
      let queryBuilder: QueryBuilderContract;
      let mockDataSource: DataSource;

      beforeEach(() => {
        const mockDriver = createDriver();
        mockDataSource = new DataSource({
          name: "test",
          driver: mockDriver,
        });
        dataSourceRegistry.register(mockDataSource, true);
        queryBuilder = createBuilder("users", mockDataSource);
      });

      afterEach(() => {
        dataSourceRegistry.clear();
        vi.clearAllMocks();
      });

      it("where operations should include field and value", () => {
        queryBuilder.where("name", "John");
        const op = (queryBuilder as any).operations[0];

        expect(op.data.field).toBe("name");
        expect(op.data.value).toBe("John");
      });

      it("whereIn operations should include field and values array", () => {
        queryBuilder.whereIn("status", ["active", "pending"]);
        const op = (queryBuilder as any).operations[0];

        expect(op.data.field).toBe("status");
        expect(op.data.values).toEqual(["active", "pending"]);
      });

      it("whereBetween operations should include field and range", () => {
        queryBuilder.whereBetween("age", [18, 65]);
        const op = (queryBuilder as any).operations[0];

        expect(op.data.field).toBe("age");
        expect(op.data.range).toEqual([18, 65]);
      });

      it("orderBy operations should include field and direction", () => {
        queryBuilder.orderBy("createdAt", "desc");
        const op = (queryBuilder as any).operations[0];

        expect(op.data.field).toBe("createdAt");
        expect(op.data.direction).toBe("desc");
      });

      it("limit operations should include numeric value", () => {
        queryBuilder.limit(25);
        const op = (queryBuilder as any).operations[0];

        expect(op.data.value).toBe(25);
      });
    });
  });
});
