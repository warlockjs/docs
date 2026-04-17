/**
 * @fileoverview Relation type definitions for the Cascade ORM relations system.
 *
 * This module defines all the types and interfaces needed for configuring
 * model relationships including hasMany, belongsTo, belongsToMany, and hasOne.
 *
 * @module @warlock.js/cascade/relations/types
 */

import type { QueryBuilderContract } from "../contracts";
import type { Model } from "../model/model";

// ============================================================================
// RELATION TYPES
// ============================================================================

/**
 * The type of relationship between models.
 *
 * - `hasOne`: One-to-one relationship where the foreign key is on the related model
 * - `hasMany`: One-to-many relationship where the foreign key is on the related model
 * - `belongsTo`: Inverse of hasOne/hasMany where the foreign key is on this model
 * - `belongsToMany`: Many-to-many relationship through a pivot table
 *
 * @example
 * ```typescript
 * // User hasOne Profile (profile.userId references user.id)
 * // User hasMany Posts (post.userId references user.id)
 * // Post belongsTo User (post.userId references user.id)
 * // Post belongsToMany Tags (through post_tags pivot table)
 * ```
 */
export type RelationType = "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";

// ============================================================================
// RELATION DEFINITION
// ============================================================================

/**
 * Complete definition of a model relationship.
 *
 * This interface describes how two models are connected, including
 * the type of relationship and the keys used for joining.
 *
 * @example
 * ```typescript
 * const postsRelation: RelationDefinition = {
 *   type: "hasMany",
 *   model: "Post",
 *   foreignKey: "userId",
 *   localKey: "id",
 * };
 * ```
 */
export type RelationDefinition = {
  /**
   * The type of relationship.
   */
  readonly type: RelationType;

  /**
   * The name of the related model in the registry.
   * Models must be decorated with `@RegisterModel()` to be resolvable.
   */
  readonly model: string;

  /**
   * The foreign key field on the related model (for hasOne/hasMany)
   * or on this model (for belongsTo).
   *
   * For belongsToMany, this is the key on the related model.
   */
  readonly foreignKey?: string;

  /**
   * The local key field on this model that the foreign key references.
   *
   * @default "id"
   */
  readonly localKey?: string;

  /**
   * The pivot table name (only for belongsToMany relationships).
   */
  readonly pivot?: string;

  /**
   * The column in the pivot table that references this model's primary key.
   * Only applicable for belongsToMany relationships.
   */
  readonly pivotLocalKey?: string;

  /**
   * The column in the pivot table that references the related model's primary key.
   * Only applicable for belongsToMany relationships.
   */
  readonly pivotForeignKey?: string;

  /**
   * List of specific columns to select.
   *
   * If not provided, defaults to all columns.
   */
  readonly select?: string[];
};

// ============================================================================
// RELATION OPTIONS INTERFACES
// ============================================================================

/**
 * Configuration options for a hasMany relationship.
 *
 * @example
 * ```typescript
 * // User has many Posts via post.userId
 * static relations = {
 *   posts: hasMany("Post", { foreignKey: "userId" }),
 * };
 * ```
 */
export type HasManyOptions = {
  /**
   * The foreign key field on the related model.
   *
   * If not provided, defaults to `{thisModelName}Id` (e.g., `userId` for User model).
   */
  readonly foreignKey?: string;

  /**
   * The local key field on this model that the foreign key references.
   *
   * @default "id"
   */
  readonly localKey?: string;

  /**
   * List of specific columns to select.
   *
   * If not provided, defaults to all columns.
   */
  readonly select?: string[];
};

/**
 * Configuration options for a hasOne relationship.
 *
 * @example
 * ```typescript
 * // User has one Profile via profile.userId
 * static relations = {
 *   profile: hasOne("Profile", { foreignKey: "userId" }),
 * };
 * ```
 */
export type HasOneOptions = {
  /**
   * The foreign key field on the related model.
   *
   * If not provided, defaults to `{thisModelName}Id` (e.g., `userId` for User model).
   */
  readonly foreignKey?: string;

  /**
   * The local key field on this model that the foreign key references.
   *
   * @default "id"
   */
  readonly localKey?: string;

  /**
   * List of specific columns to select.
   *
   * If not provided, defaults to all columns.
   */
  readonly select?: string[];
};

/**
 * Configuration options for a belongsTo relationship.
 *
 * @example
 * ```typescript
 * // Post belongs to User via post.userId
 * static relations = {
 *   author: belongsTo("User", { foreignKey: "userId" }),
 * };
 * ```
 */
export type BelongsToOptions = {
  /**
   * The foreign key field on this model that references the related model.
   *
   * If not provided, defaults to `{relationName}Id` (e.g., `authorId` for author relation).
   */
  readonly foreignKey?: string;

  /**
   * The primary key field on the related model.
   *
   * @default "id"
   */
  readonly ownerKey?: string;

  /**
   * List of specific columns to select from the related model.
   */
  readonly select?: string[];
};

/**
 * Configuration options for a belongsToMany relationship.
 *
 * @example
 * ```typescript
 * // Post belongs to many Tags via post_tags pivot table
 * static relations = {
 *   tags: belongsToMany("Tag", {
 *     pivot: "post_tags",
 *     localKey: "postId",
 *     foreignKey: "tagId",
 *   }),
 * };
 * ```
 */
export type BelongsToManyOptions = {
  /**
   * The pivot table name that connects the two models.
   * This is required for many-to-many relationships.
   */
  readonly pivot: string;

  /**
   * The column in the pivot table that references this model's primary key.
   *
   * If not provided, defaults to `{thisModelName}Id`.
   */
  readonly localKey?: string;

  /**
   * The column in the pivot table that references the related model's primary key.
   *
   * If not provided, defaults to `{relatedModelName}Id`.
   */
  readonly foreignKey?: string;

  /**
   * The primary key of this model that the pivot table references.
   *
   * @default "id"
   */
  readonly pivotLocalKey?: string;

  /**
   * The primary key of the related model that the pivot table references.
   *
   * @default "id"
   */
  readonly pivotForeignKey?: string;

  /**
   * List of specific columns to select from the related model.
   */
  readonly select?: string[];
};

// ============================================================================
// CONSTRAINT AND CALLBACK TYPES
// ============================================================================

/**
 * Callback function to apply constraints when loading a relation.
 *
 * @example
 * ```typescript
 * User.query().with("posts", (query) => {
 *   query.where("isPublished", true).orderBy("createdAt", "desc");
 * });
 * ```
 */
export type RelationConstraintCallback = (query: QueryBuilderContract) => void;

/**
 * Constraints to apply when loading relations.
 *
 * Can be:
 * - A single constraint callback for a relation
 * - An object mapping relation names to constraint callbacks or boolean values
 *
 * @example
 * ```typescript
 * // Object form
 * await User.loadRelations(users, {
 *   posts: (query) => query.where("isPublished", true),
 *   organization: true,
 * });
 * ```
 */
export type RelationConstraints = Record<string, boolean | RelationConstraintCallback>;

// ============================================================================
// LOADED RELATIONS STORAGE
// ============================================================================

/**
 * Type for the result of loading a relation.
 *
 * - For hasOne/belongsTo: A single model instance or null
 * - For hasMany/belongsToMany: An array of model instances
 */
export type LoadedRelationResult = Model | Model[] | null;

/**
 * Map that stores loaded relation data on a model instance.
 *
 * @example
 * ```typescript
 * // After user.load("posts", "profile")
 * user.loadedRelations.get("posts"); // Post[]
 * user.loadedRelations.get("profile"); // Profile | null
 * ```
 */
export type LoadedRelationsMap = Map<string, LoadedRelationResult>;

// ============================================================================
// RELATION DEFINITION MAP
// ============================================================================

/**
 * A map of relation names to their definitions.
 *
 * This is the type for the static `relations` property on models.
 *
 * @example
 * ```typescript
 * class User extends Model {
 *   static relations: RelationDefinitions = {
 *     posts: hasMany("Post"),
 *     profile: hasOne("Profile"),
 *     organization: belongsTo("Organization"),
 *   };
 * }
 * ```
 */
export type RelationDefinitions = Record<string, RelationDefinition>;

// ============================================================================
// PIVOT DATA TYPES
// ============================================================================

/**
 * Additional data to store in the pivot table for many-to-many relationships.
 *
 * @example
 * ```typescript
 * await post.attach("tags", [1, 2, 3], { addedBy: userId, addedAt: new Date() });
 * ```
 */
export type PivotData = Record<string, unknown>;

/**
 * IDs that can be used for pivot operations.
 * Supports both numeric and string IDs.
 */
export type PivotIds = (number | string)[];
