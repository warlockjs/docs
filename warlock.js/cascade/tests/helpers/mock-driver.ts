import { vi } from "vitest";
import type { DriverContract } from "../../src/contracts/database-driver.contract";
import type { QueryBuilderContract } from "../../src/contracts/query-builder.contract";

/**
 * Mock driver for unit testing purposes.
 * Implements the DriverContract interface with Vitest mocks.
 */
export function createMockDriver(name = "mock"): DriverContract {
  const mockQueryBuilder = createMockQueryBuilder();

  return {
    name,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    insert: vi.fn().mockResolvedValue({ id: 1 }),
    insertMany: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    update: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: vi.fn().mockResolvedValue({ modifiedCount: 2 }),
    delete: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 2 }),
    truncateTable: vi.fn().mockResolvedValue(undefined),
    dropTable: vi.fn().mockResolvedValue(undefined),
    dropTableIfExists: vi.fn().mockResolvedValue(undefined),
    dropAllTables: vi.fn().mockResolvedValue(undefined),
    createDatabase: vi.fn().mockResolvedValue(undefined),
    dropDatabase: vi.fn().mockResolvedValue(undefined),
    databaseExists: vi.fn().mockResolvedValue(true),
    listDatabases: vi.fn().mockResolvedValue(["test_db"]),
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    queryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
  } as unknown as DriverContract;
}

/**
 * Mock query builder for unit testing purposes.
 */
export function createMockQueryBuilder(): QueryBuilderContract<any> {
  const mock: any = {
    where: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    whereNotIn: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    whereBetween: vi.fn().mockReturnThis(),
    orWhere: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue([]),
    first: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    paginate: vi.fn().mockResolvedValue({
      documents: [],
      paginationInfo: { page: 1, limit: 15, total: 0 },
    }),
    clone: vi.fn().mockReturnThis(),
    when: vi.fn().mockReturnThis(),
    unless: vi.fn().mockReturnThis(),
  };

  return mock as QueryBuilderContract<any>;
}
