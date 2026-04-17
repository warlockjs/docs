/**
 * @fileoverview Pivot table operations for many-to-many relationships.
 *
 * This module provides methods for managing the pivot table in
 * belongsToMany relationships: attach, detach, sync, and toggle.
 *
 * @module @warlock.js/cascade/relations/pivot-operations
 */

import type { ChildModel, Model } from "../model/model";
import type { PivotData, PivotIds, RelationDefinition } from "./types";

// ============================================================================
// PIVOT OPERATIONS CLASS
// ============================================================================

/**
 * Manages pivot table operations for many-to-many relationships.
 *
 * Provides attach, detach, sync, and toggle operations for managing
 * the connections between two models through a pivot table.
 *
 * @example
 * ```typescript
 * const pivotOps = new PivotOperations(post, "tags", tagsDefinition);
 *
 * // Attach tags
 * await pivotOps.attach([1, 2, 3]);
 *
 * // Attach with pivot data
 * await pivotOps.attach([4], { addedBy: userId });
 *
 * // Detach specific tags
 * await pivotOps.detach([2]);
 *
 * // Sync (replace all)
 * await pivotOps.sync([1, 5, 6]);
 *
 * // Toggle (attach if missing, detach if present)
 * await pivotOps.toggle([1, 7]);
 * ```
 */
export class PivotOperations {
  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================

  /**
   * The model instance performing the pivot operation.
   */
  private readonly model: Model;

  /**
   * The name of the relation.
   */
  private readonly relationName: string;

  /**
   * The relation definition with pivot table configuration.
   */
  private readonly definition: RelationDefinition;

  /**
   * The model class of the source model.
   */
  private readonly modelClass: ChildModel<Model>;

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================

  /**
   * Creates a new PivotOperations instance.
   *
   * @param model - The model instance performing the operation
   * @param relationName - The name of the belongsToMany relation
   * @param definition - The relation definition
   * @param modelClass - The model class constructor
   */
  public constructor(
    model: Model,
    relationName: string,
    definition: RelationDefinition,
    modelClass: ChildModel<Model>,
  ) {
    if (definition.type !== "belongsToMany") {
      throw new Error(
        `Pivot operations are only available for belongsToMany relations. ` +
          `Relation "${relationName}" is of type "${definition.type}".`,
      );
    }

    if (!definition.pivot) {
      throw new Error(`Relation "${relationName}" is missing the pivot table configuration.`);
    }

    this.model = model;
    this.relationName = relationName;
    this.definition = definition;
    this.modelClass = modelClass;
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Attaches one or more related models via the pivot table.
   *
   * Creates new records in the pivot table linking this model to the
   * specified related model IDs. Existing attachments are not duplicated.
   *
   * @param ids - The IDs of the related models to attach
   * @param pivotData - Optional additional data to store in the pivot record
   *
   * @example
   * ```typescript
   * // Attach tags to a post
   * await post.attach("tags", [1, 2, 3]);
   *
   * // Attach with additional pivot data
   * await post.attach("tags", [4], { addedBy: currentUserId });
   * ```
   */
  public async attach(ids: PivotIds, pivotData?: PivotData): Promise<void> {
    if (ids.length === 0) return;

    const { pivotTable, localKeyValue, pivotLocalKey, pivotForeignKey } = this.getPivotConfig();

    // Get existing attachments to avoid duplicates
    const existingIds = await this.getExistingPivotIds();
    const newIds = ids.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) return;

    // Create pivot records
    const records = newIds.map((id) => ({
      [pivotLocalKey]: localKeyValue,
      [pivotForeignKey]: id,
      ...pivotData,
    }));

    const dataSource = this.modelClass.getDataSource();
    await dataSource.driver.insertMany(pivotTable, records);
  }

  /**
   * Detaches one or more related models from the pivot table.
   *
   * Removes records from the pivot table. If no IDs are specified,
   * all attachments for this model are removed.
   *
   * @param ids - Optional IDs to detach. If omitted, detaches all.
   *
   * @example
   * ```typescript
   * // Detach specific tags
   * await post.detach("tags", [2, 3]);
   *
   * // Detach all tags
   * await post.detach("tags");
   * ```
   */
  public async detach(ids?: PivotIds): Promise<void> {
    const { pivotTable, localKeyValue, pivotLocalKey, pivotForeignKey } = this.getPivotConfig();

    const dataSource = this.modelClass.getDataSource();

    // Build filter based on local key and optionally foreign keys
    const filter: Record<string, unknown> = { [pivotLocalKey]: localKeyValue };

    if (ids && ids.length > 0) {
      // Use $in operator style for filtering by multiple IDs
      filter[pivotForeignKey] = { $in: ids };
    }

    await dataSource.driver.deleteMany(pivotTable, filter);
  }

  /**
   * Synchronizes the pivot table to match the specified IDs.
   *
   * Attaches any new IDs and detaches any IDs not in the list.
   * After sync, the pivot table will contain exactly the specified IDs.
   *
   * @param ids - The IDs that should be attached after sync
   * @param pivotData - Optional data for newly attached records
   *
   * @example
   * ```typescript
   * // Set tags to exactly [1, 3, 5], removing any others
   * await post.sync("tags", [1, 3, 5]);
   * ```
   */
  public async sync(ids: PivotIds, pivotData?: PivotData): Promise<void> {
    const existingIds = await this.getExistingPivotIds();
    const newIdSet = new Set(ids);

    // Find IDs to detach (in existing but not in new)
    const toDetach: PivotIds = [];
    for (const existingId of existingIds) {
      if (!newIdSet.has(existingId)) {
        toDetach.push(existingId);
      }
    }

    // Find IDs to attach (in new but not in existing)
    const toAttach = ids.filter((id) => !existingIds.has(id));

    // Perform operations
    if (toDetach.length > 0) {
      await this.detach(toDetach);
    }

    if (toAttach.length > 0) {
      await this.attach(toAttach, pivotData);
    }
  }

  /**
   * Toggles the attachment status of the specified IDs.
   *
   * For each ID: if attached, detaches it; if not attached, attaches it.
   *
   * @param ids - The IDs to toggle
   * @param pivotData - Optional data for newly attached records
   *
   * @example
   * ```typescript
   * // Toggle tags - attached become detached, detached become attached
   * await post.toggle("tags", [1, 4]);
   * ```
   */
  public async toggle(ids: PivotIds, pivotData?: PivotData): Promise<void> {
    if (ids.length === 0) return;

    const existingIds = await this.getExistingPivotIds();

    const toAttach: PivotIds = [];
    const toDetach: PivotIds = [];

    for (const id of ids) {
      if (existingIds.has(id)) {
        toDetach.push(id);
      } else {
        toAttach.push(id);
      }
    }

    if (toDetach.length > 0) {
      await this.detach(toDetach);
    }

    if (toAttach.length > 0) {
      await this.attach(toAttach, pivotData);
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Gets the pivot table configuration.
   *
   * @returns The pivot configuration object
   */
  private getPivotConfig(): {
    pivotTable: string;
    localKeyValue: unknown;
    pivotLocalKey: string;
    pivotForeignKey: string;
    relatedKey: string;
  } {
    const pivotTable = this.definition.pivot!;
    const localKey = this.definition.pivotLocalKey ?? "id";
    const pivotLocalKey = this.definition.localKey ?? this.inferForeignKey(this.modelClass.name);
    const pivotForeignKey =
      this.definition.foreignKey ?? this.inferForeignKey(this.definition.model);
    const relatedKey = this.definition.pivotForeignKey ?? "id";
    const localKeyValue = this.model.get(localKey);

    return {
      pivotTable,
      localKeyValue,
      pivotLocalKey,
      pivotForeignKey,
      relatedKey,
    };
  }

  /**
   * Gets all currently attached IDs from the pivot table.
   *
   * @returns A set of attached foreign key values
   */
  private async getExistingPivotIds(): Promise<Set<number | string>> {
    const { pivotTable, localKeyValue, pivotLocalKey, pivotForeignKey } = this.getPivotConfig();

    const dataSource = this.modelClass.getDataSource();
    const records = await dataSource.driver
      .queryBuilder(pivotTable)
      .select([pivotForeignKey])
      .where(pivotLocalKey, localKeyValue)
      .get();

    const ids = new Set<number | string>();
    for (const record of records as Record<string, unknown>[]) {
      const id = record[pivotForeignKey];
      if (id !== undefined && id !== null) {
        ids.add(id as number | string);
      }
    }

    return ids;
  }

  /**
   * Infers a foreign key name from a model name.
   *
   * @param modelName - The model class name
   * @returns The inferred foreign key (e.g., "User" -> "userId")
   */
  private inferForeignKey(modelName: string): string {
    return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}Id`;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a PivotOperations instance for a model and relation.
 *
 * @param model - The model instance
 * @param relationName - The name of the belongsToMany relation
 * @returns A PivotOperations instance
 * @throws Error if the relation is not a belongsToMany or not defined
 */
export function createPivotOperations(model: Model, relationName: string): PivotOperations {
  const ModelClass = model.constructor as ChildModel<Model>;
  const relations = (ModelClass as unknown as { relations?: Record<string, RelationDefinition> })
    .relations;

  if (!relations || !relations[relationName]) {
    throw new Error(`Relation "${relationName}" is not defined on model "${ModelClass.name}".`);
  }

  return new PivotOperations(model, relationName, relations[relationName], ModelClass);
}
