/**
 * @fileoverview Restores relation data onto model instances from a plain object snapshot.
 *
 * This is the cache-restoration counterpart to RelationLoader (which loads from the DB).
 * It is intentionally decoupled from query execution — it only deals with instantiating
 * related models from already-serialized data.
 *
 * @module @warlock.js/cascade/relations/relation-hydrator
 *
 * @example
 * ```typescript
 * // Restoring a model + its relations from a cache snapshot:
 * const snapshot = await cache.get(key);
 * const chat = Chat.fromSnapshot(snapshot);
 * // chat.unit, chat.organization etc. are fully hydrated Model instances.
 * ```
 */

import type { ChildModel, Model } from "../model/model";
import { getModelFromRegistry } from "../model/register-model";
import type { RelationDefinition } from "./types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * The serialized shape of a single relation entry inside a model snapshot.
 * Each value is either:
 * - `null`  — the relation was loaded and resolved to nothing (e.g. belongsTo with no match)
 * - A nested snapshot object `{ data, relations }` — a single related model
 * - An array of nested snapshot objects — a collection relation
 */
export type SerializedRelation = null | ModelSnapshot | ModelSnapshot[];

/**
 * The plain-object shape produced by `model.toSnapshot()` and consumed by
 * `Model.fromSnapshot()`. The `relations` map uses the same relation names
 * defined in the model's static `relations` property.
 */
export type ModelSnapshot = {
  data: Record<string, unknown>;
  relations: Record<string, SerializedRelation>;
};

// ============================================================================
// RELATION HYDRATOR CLASS
// ============================================================================

/**
 * Restores eager-loaded relations from a plain snapshot onto a model instance.
 *
 * Mirrors the interface of RelationLoader but instead of issuing DB queries,
 * it recursively instantiates related models from serialized snapshot data.
 *
 * @example
 * ```typescript
 * // Used internally by Model.fromSnapshot():
 * const model = new Chat(snapshot.data);
 * RelationHydrator.hydrate(model, Chat.relations, snapshot.relations);
 * ```
 */
export class RelationHydrator {
  /**
   * Hydrate all relations from a snapshot onto `model`.
   *
   * - Looks up each relation name in `relationDefs` to find the target model class.
   * - Recursively calls `fromSnapshot` on nested snapshots so deeply nested
   *   relations are fully hydrated as well.
   * - Sets each relation on both `model.loadedRelations` (Map) and as a direct
   *   property (`model[name]`) to match the behaviour of RelationLoader.
   * - Intentionally preserves `null` entries — a null relation was explicitly
   *   loaded and resolved to nothing; this is different from a missing relation.
   *
   * @param model - The model instance to attach relations to
   * @param relationDefs - The static `relations` map from the model class
   * @param relationsSnapshot - The `relations` portion of a `ModelSnapshot`
   */
  public static hydrate(
    model: Model,
    relationDefs: Record<string, RelationDefinition>,
    relationsSnapshot: Record<string, SerializedRelation> | undefined,
  ): void {
    if (!relationsSnapshot) return;

    for (const [name, snapshot] of Object.entries(relationsSnapshot)) {
      const def = relationDefs[name];

      // Relation name not in definition — skip gracefully rather than throwing,
      // since the snapshot could be from an older schema version.
      if (!def) continue;

      const RelModel = getModelFromRegistry(def.model) as ChildModel<Model> | undefined;
      if (!RelModel) continue;

      let hydrated: Model | Model[] | null;

      if (snapshot === null) {
        // Explicitly loaded relation that resolved to nothing — keep as null.
        hydrated = null;
      } else if (Array.isArray(snapshot)) {
        // Collection relation (hasMany / belongsToMany)
        hydrated = snapshot.map((item) => RelModel.fromSnapshot(item));
      } else {
        // Single relation (belongsTo / hasOne)
        hydrated = RelModel.fromSnapshot(snapshot);
      }

      // Set on the Map for getRelation() / isLoaded() API
      model.loadedRelations.set(name, hydrated);

      // Set as direct property for convenient access (model.unit, model.posts, …)
      (model as unknown as Record<string, unknown>)[name] = hydrated;
    }
  }
}
