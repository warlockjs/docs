/**
 * MongoDB-specific sync adapter implementation.
 *
 * @module cascade-next/drivers/mongodb/mongodb-sync-adapter
 */

import type { SyncAdapterContract, SyncInstruction } from "../../contracts/sync-adapter.contract";
import type { MongoDbDriver } from "./mongodb-driver";

/**
 * MongoDB implementation of the sync adapter.
 * Handles array updates using positional operators and arrayFilters.
 * Automatically participates in active transactions via the driver's session context.
 */
export class MongoSyncAdapter implements SyncAdapterContract {
  private readonly driver: MongoDbDriver;

  /**
   * Creates a new MongoDB sync adapter.
   *
   * @param driver - The MongoDB driver instance (provides session-aware operations)
   */
  public constructor(driver: MongoDbDriver) {
    this.driver = driver;
  }

  /**
   * Executes a batch of sync instructions.
   *
   * @param instructions - Array of sync instructions
   * @returns Total number of documents affected
   */
  public async executeBatch(instructions: SyncInstruction[]): Promise<number> {
    let totalAffected = 0;

    for (const instruction of instructions) {
      const affected = instruction.isArrayUpdate
        ? await this.executeArrayUpdate(instruction)
        : await this.executeOne(instruction);

      totalAffected += affected;
    }

    return totalAffected;
  }

  /**
   * Executes a single sync instruction.
   * Uses the driver's updateMany to automatically participate in active transactions.
   *
   * @param instruction - The sync instruction
   * @returns Number of documents affected
   */
  public async executeOne(instruction: SyncInstruction): Promise<number> {
    const result = await this.driver.updateMany(
      instruction.targetTable,
      instruction.filter,
      instruction.update,
    );

    return result.modifiedCount;
  }

  /**
   * Executes an array update using MongoDB positional operators.
   * Uses the driver's updateMany to automatically participate in active transactions.
   *
   * @param instruction - The sync instruction with array info
   * @returns Number of documents affected
   */
  public async executeArrayUpdate(instruction: SyncInstruction): Promise<number> {
    if (!instruction.arrayField || !instruction.identifierField) {
      throw new Error("Array update requires arrayField and identifierField to be specified");
    }

    // Strategy 1: Try positional operator $ (simpler, faster)
    // Works when filter already identifies the array element
    if (this.canUsePositionalOperator(instruction)) {
      const result = await this.driver.updateMany(
        instruction.targetTable,
        instruction.filter,
        instruction.update,
      );
      return result.modifiedCount;
    }

    // Strategy 2: Use arrayFilters (more flexible)
    // Works for any array update scenario
    return await this.executeWithArrayFilters(instruction);
  }

  /**
   * Checks if positional operator $ can be used.
   * Requires filter to already match the array element.
   *
   * @param instruction - The sync instruction
   * @returns True if positional operator can be used
   */
  private canUsePositionalOperator(instruction: SyncInstruction): boolean {
    // Check if filter already includes array element match
    const arrayElementFilter = `${instruction.arrayField}.${instruction.identifierField}`;
    return arrayElementFilter in instruction.filter;
  }

  /**
   * Executes array update using arrayFilters.
   * Uses the driver's updateMany with arrayFilters option to participate in transactions.
   *
   * @param instruction - The sync instruction
   * @returns Number of documents affected
   */
  private async executeWithArrayFilters(instruction: SyncInstruction): Promise<number> {
    // Build arrayFilters to match array elements
    const arrayFilters = [
      {
        [`elem.${instruction.identifierField}`]: instruction.identifierValue,
      },
    ];

    // Transform update to use array filter placeholder
    const transformedUpdate = this.transformUpdateForArrayFilters(
      instruction.update,
      instruction.arrayField!,
    );

    // Build optimized filter to reduce documents scanned
    const optimizedFilter = this.buildOptimizedFilter(
      instruction.filter,
      instruction.arrayField!,
      instruction.identifierField!,
    );

    // Use driver's updateMany (session-aware) with arrayFilters
    const result = await this.driver.updateMany(
      instruction.targetTable,
      optimizedFilter,
      transformedUpdate,
      { arrayFilters },
    );

    return result.modifiedCount;
  }

  /**
   * Builds an optimized filter to reduce the number of documents scanned.
   * Adds array existence check when filter doesn't already match array elements.
   *
   * @param originalFilter - The original filter from the instruction
   * @param arrayField - The array field path
   * @param identifierField - The identifier field within array elements
   * @returns Optimized filter
   */
  private buildOptimizedFilter(
    originalFilter: Record<string, unknown>,
    arrayField: string,
    identifierField: string,
  ): Record<string, unknown> {
    // If filter already has array element match, use it as-is
    const arrayElementFilter = `${arrayField}.${identifierField}`;
    if (arrayElementFilter in originalFilter) {
      return originalFilter;
    }

    // Otherwise, add array existence check to avoid full collection scan
    return {
      ...originalFilter,
      [arrayField]: { $exists: true, $ne: [] }, // Array exists and not empty
    };
  }

  /**
   * Transforms update operation to use arrayFilters placeholder.
   *
   * @param update - Original update operation
   * @param arrayField - Array field path
   * @returns Transformed update operation
   */
  private transformUpdateForArrayFilters(
    update: Record<string, unknown>,
    arrayField: string,
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const [operator, fields] of Object.entries(update)) {
      if (typeof fields === "object" && fields !== null) {
        const transformedFields: Record<string, unknown> = {};

        for (const [field, value] of Object.entries(fields)) {
          // Replace positional $ with arrayFilters placeholder $[elem]
          const transformedField = field.replace(`${arrayField}.$`, `${arrayField}.$[elem]`);
          transformedFields[transformedField] = value;
        }

        transformed[operator] = transformedFields;
      }
    }

    return transformed;
  }
}
