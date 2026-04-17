/**
 * Options for generating the next ID.
 */
export type GenerateIdOptions = {
  /** The table/collection name */
  table: string;
  /** Initial ID value for the first record (default: 1) */
  initialId?: number;
  /** Amount to increment by for each new record (default: 1) */
  incrementIdBy?: number;
};

/**
 * ID generator contract for auto-incrementing IDs in NoSQL databases.
 *
 * This service generates sequential integer IDs for NoSQL databases (like MongoDB)
 * that don't have native auto-increment support. It maintains a separate collection
 * that tracks the last generated ID for each table.
 *
 * **Note:** SQL databases (PostgreSQL, MySQL) use native AUTO_INCREMENT/SERIAL
 * and don't need this service.
 *
 * @example
 * ```typescript
 * // For MongoDB
 * const mongoDriver = new MongoDbDriver({ ...config, autoGenerateId: true });
 * const idGenerator = mongoDriver.getIdGenerator();
 *
 * // Generate next ID
 * const id = await idGenerator.generateNextId({
 *   table: "users",
 *   initialId: 1000,
 *   incrementIdBy: 1
 * });
 * console.log(id); // 1000 (first time), 1001 (second time), etc.
 *
 * // Get last ID for a table
 * const lastId = await idGenerator.getLastId("users"); // Returns 1001
 *
 * // Manually set last ID (useful for migrations)
 * await idGenerator.setLastId("users", 5000);
 * ```
 */
export interface IdGeneratorContract {
  /**
   * Generate the next ID for a table.
   *
   * This method:
   * 1. Atomically increments the counter in the tracking collection
   * 2. Returns the new ID
   * 3. Creates the counter document if it doesn't exist (using initialId)
   *
   * The operation is atomic to ensure uniqueness even in concurrent scenarios.
   *
   * @param options - Configuration for ID generation
   * @returns The generated ID
   *
   * @example
   * ```typescript
   * const id = await idGenerator.generateNextId({
   *   table: "users",
   *   initialId: 1000,
   *   incrementIdBy: 5
   * });
   * console.log(id); // 1000, 1005, 1010, etc.
   * ```
   */
  generateNextId(options: GenerateIdOptions): Promise<number>;

  /**
   * Get the last generated ID for a table.
   *
   * Returns 0 if no IDs have been generated yet for this table.
   *
   * @param table - The table/collection name
   * @returns The last generated ID, or 0 if none exists
   *
   * @example
   * ```typescript
   * const lastId = await idGenerator.getLastId("users");
   * console.log(lastId); // 42
   * ```
   */
  getLastId(table: string): Promise<number>;

  /**
   * Set the last ID for a table.
   *
   * Useful for:
   * - Migrations: Setting a starting point for IDs
   * - Manual ID management: Adjusting counters after bulk operations
   * - Testing: Resetting ID sequences
   *
   * @param table - The table/collection name
   * @param id - The ID to set as the last generated ID
   *
   * @example
   * ```typescript
   * // Start IDs from 1000
   * await idGenerator.setLastId("users", 1000);
   *
   * // Next generated ID will be 1001
   * const nextId = await idGenerator.generateNextId({
   *   table: "users",
   *   incrementIdBy: 1
   * });
   * console.log(nextId); // 1001
   * ```
   */
  setLastId(table: string, id: number): Promise<void>;
}
