/**
 * @fileoverview Helper functions for defining model relationships.
 *
 * This module provides a clean, intuitive API for defining relationships
 * between models using helper functions instead of raw configuration objects.
 *
 * @module @warlock.js/cascade/relations/helpers
 *
 * @example
 * ```typescript
 * import { hasMany, belongsTo, belongsToMany, hasOne } from "@warlock.js/cascade";
 *
 * class User extends Model {
 *   static relations = {
 *     posts: hasMany("Post"),
 *     profile: hasOne("Profile"),
 *     organization: belongsTo("Organization", { foreignKey: "organizationId" }),
 *     roles: belongsToMany("Role", { pivot: "user_roles" }),
 *   };
 * }
 * ```
 */

import type {
  BelongsToManyOptions,
  BelongsToOptions,
  HasManyOptions,
  HasOneOptions,
  RelationDefinition,
} from "./types";

// ============================================================================
// HAS MANY
// ============================================================================

/**
 * Defines a one-to-many relationship.
 *
 * Use this when the current model owns many instances of another model.
 * The foreign key is stored on the related model.
 *
 * @param model - The name of the related model in the registry
 * @param options - Optional configuration for the relationship
 * @returns A relation definition object
 *
 * @example
 * ```typescript
 * // User has many Posts
 * // The Post model has a userId column referencing User.id
 * static relations = {
 *   posts: hasMany("Post"),
 * };
 *
 * // With custom foreign key
 * static relations = {
 *   comments: hasMany("Comment", { foreignKey: "authorId" }),
 * };
 *
 * // Usage
 * const user = await User.query().with("posts").find(1);
 * console.log(user.posts); // Post[]
 * ```
 */
export function hasMany(model: string, options?: HasManyOptions): RelationDefinition {
  return {
    type: "hasMany",
    model,
    foreignKey: options?.foreignKey,
    localKey: options?.localKey ?? "id",
    select: options?.select,
  };
}

// ============================================================================
// HAS ONE
// ============================================================================

/**
 * Defines a one-to-one relationship where the foreign key is on the related model.
 *
 * Use this when the current model owns exactly one instance of another model.
 * The foreign key is stored on the related model.
 *
 * @param model - The name of the related model in the registry
 * @param options - Optional configuration for the relationship
 * @returns A relation definition object
 *
 * @example
 * ```typescript
 * // User has one Profile
 * // The Profile model has a userId column referencing User.id
 * static relations = {
 *   profile: hasOne("Profile"),
 * };
 *
 * // With custom keys
 * static relations = {
 *   settings: hasOne("UserSettings", {
 *     foreignKey: "ownerId",
 *     localKey: "id",
 *   }),
 * };
 *
 * // Usage
 * const user = await User.query().with("profile").find(1);
 * console.log(user.profile); // Profile | null
 * ```
 */
export function hasOne(model: string, options?: HasOneOptions): RelationDefinition {
  return {
    type: "hasOne",
    model,
    foreignKey: options?.foreignKey,
    localKey: options?.localKey ?? "id",
    select: options?.select,
  };
}

// ============================================================================
// BELONGS TO
// ============================================================================

/**
 * Defines a many-to-one (inverse) relationship.
 *
 * Use this when the current model belongs to another model.
 * The foreign key is stored on this model.
 *
 * @param model - The name of the related model in the registry
 * @param options - Optional configuration for the relationship
 * @returns A relation definition object
 *
 * @example
 * ```typescript
 * // Post belongs to User (author)
 * // The Post model has a userId column referencing User.id
 * static relations = {
 *   author: belongsTo("User", { foreignKey: "userId" }),
 * };
 *
 * // Category self-reference (parent category)
 * static relations = {
 *   parent: belongsTo("Category", { foreignKey: "parentId" }),
 * };
 *
 * // Usage
 * const post = await Post.query().with("author").find(1);
 * console.log(post.author); // User | null
 * ```
 */
export function belongsTo(model: string, options?: BelongsToOptions | string): RelationDefinition {
  const resolvedOptions =
    typeof options === "string" ? { foreignKey: options, ownerKey: "id" } : options;
  return {
    type: "belongsTo",
    model,
    foreignKey: resolvedOptions?.foreignKey,
    localKey: resolvedOptions?.ownerKey,
    select: resolvedOptions?.select,
  };
}

// ============================================================================
// BELONGS TO MANY
// ============================================================================

/**
 * Defines a many-to-many relationship through a pivot table.
 *
 * Use this when both models can have many of each other.
 * A pivot (junction) table connects the two models.
 *
 * @param model - The name of the related model in the registry
 * @param options - Configuration for the relationship including the pivot table
 * @returns A relation definition object
 *
 * @example
 * ```typescript
 * // Post belongs to many Tags through post_tags pivot table
 * // Pivot table: post_tags (postId, tagId)
 * static relations = {
 *   tags: belongsToMany("Tag", {
 *     pivot: "post_tags",
 *     localKey: "postId",      // Column in pivot referencing this model
 *     foreignKey: "tagId",     // Column in pivot referencing related model
 *   }),
 * };
 *
 * // User has many Roles through user_roles pivot
 * static relations = {
 *   roles: belongsToMany("Role", {
 *     pivot: "user_roles",
 *     localKey: "userId",
 *     foreignKey: "roleId",
 *   }),
 * };
 *
 * // Usage
 * const post = await Post.query().with("tags").find(1);
 * console.log(post.tags); // Tag[]
 *
 * // Pivot operations
 * await post.attach("tags", [1, 2, 3]);
 * await post.detach("tags", [2]);
 * await post.sync("tags", [1, 3, 5]);
 * ```
 */
export function belongsToMany(model: string, options: BelongsToManyOptions): RelationDefinition {
  return {
    type: "belongsToMany",
    model,
    pivot: options.pivot,
    localKey: options.localKey,
    foreignKey: options.foreignKey,
    pivotLocalKey: options.pivotLocalKey ?? "id",
    pivotForeignKey: options.pivotForeignKey ?? "id",
    select: options.select,
  };
}
