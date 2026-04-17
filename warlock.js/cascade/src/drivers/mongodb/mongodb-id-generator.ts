import type { GenerateIdOptions, IdGeneratorContract } from "../../contracts";
import type { MongoDbDriver } from "./mongodb-driver";

/**
 * MongoDB-specific ID generator for auto-incrementing integer IDs.
 *
 * Maintains a separate collection that tracks the last generated ID for each table.
 * Generates auto-incrementing IDs similar to SQL's AUTO_INCREMENT feature.
 *
 * **Collection Structure:**
 * ```json
 * {
 *   "collection": "users",
 *   "id": 12345
 * }
 * ```
 *
 * **Features:**
 * - Atomic ID generation using findOneAndUpdate with aggregation pipeline
 * - Automatic transaction support (driver handles session context)
 * - Configurable initial ID and increment values
 * - Thread-safe and concurrent-safe
 *
 * @example
 * ```typescript
 * const mongoDriver = new MongoDbDriver(config);
 * const idGenerator = new MongoIdGenerator(mongoDriver);
 *
 * const dataSource = new DataSource({
 *   name: "primary",
 *   driver: mongoDriver,
 *   idGenerator,
 * });
 *
 * // Generate IDs with custom configuration
 * const id = await idGenerator.generateNextId({
 *   table: "users",
 *   initialId: 1000,
 *   incrementIdBy: 1
 * });
 * ```
 */
export class MongoIdGenerator implements IdGeneratorContract {
  /**
   * The collection name that stores ID counters.
   * Each document tracks the last ID for a specific table.
   *
   * Named "MasterMind" for backward compatibility with legacy Cascade.
   */
  public readonly counterCollection: string = "MasterMind";

  /**
   * Create a new MongoDB ID generator instance.
   *
   * @param driver - The MongoDB driver instance
   * @param counterCollection - Name of the collection storing ID counters (default: "MasterMind")
   *
   * @example
   * ```typescript
   * const idGenerator = new MongoIdGenerator(mongoDriver, "id_counters");
   * ```
   */
  public constructor(
    private readonly driver: MongoDbDriver,
    counterCollection?: string,
  ) {
    if (counterCollection) {
      this.counterCollection = counterCollection;
    }
  }

  /**
   * Generate the next ID for a table.
   *
   * Uses atomic findOneAndUpdate with aggregation pipeline to ensure uniqueness
   * even in concurrent scenarios. Automatically participates in active transactions.
   *
   * @param options - Configuration for ID generation
   * @returns The generated ID
   *
   * @example
   * ```typescript
   * // Simple usage
   * const id = await idGenerator.generateNextId({ table: "users" });
   *
   * // With custom initial ID
   * const id = await idGenerator.generateNextId({
   *   table: "products",
   *   initialId: 1000,
   *   incrementIdBy: 1
   * });
   * ```
   */
  public async generateNextId(options: GenerateIdOptions): Promise<number> {
    const { table, initialId = 1, incrementIdBy = 1 } = options;

    // Get the MongoDB database instance
    const database = this.driver.getDatabase();
    const collection = database.collection(this.counterCollection);

    // Use atomic findOneAndUpdate with aggregation pipeline
    // The driver's withSession method will automatically attach the session if in a transaction
    const result = await collection.findOneAndUpdate(
      { collection: table },
      [
        {
          $set: {
            id: {
              $cond: {
                if: { $or: [{ $eq: ["$id", null] }, { $not: "$id" }] },
                then: initialId,
                else: { $add: ["$id", incrementIdBy] },
              },
            },
            collection: table,
          },
        },
      ],
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    return result?.id ?? initialId;
  }

  /**
   * Get the last generated ID for a table.
   *
   * @param table - The table/collection name
   * @returns The last generated ID, or 0 if none exists
   *
   * @example
   * ```typescript
   * const lastId = await idGenerator.getLastId("users");
   * console.log(`Last user ID: ${lastId}`);
   * ```
   */
  public async getLastId(table: string): Promise<number> {
    const query = this.driver.queryBuilder(this.counterCollection);
    const doc = (await query.where("collection", table).first()) as Record<string, unknown> | null;
    return (doc?.id as number) ?? 0;
  }

  /**
   * Set the last ID for a table.
   *
   * Creates or updates the counter document for the specified table.
   * Useful for seeding or resetting ID sequences.
   *
   * @param table - The table/collection name
   * @param id - The ID to set as the last generated ID
   *
   * @example
   * ```typescript
   * // Reset user IDs to start from 1000
   * await idGenerator.setLastId("users", 1000);
   * ```
   */
  public async setLastId(table: string, id: number): Promise<void> {
    await this.driver.update(
      this.counterCollection,
      { collection: table },
      { $set: { id, collection: table } },
      { upsert: true },
    );
  }
}
