import { type GenericObject } from "@mongez/reinforcements";
import type { ObjectValidator } from "@warlock.js/seal";
import type {
  DriverContract,
  PaginationOptions,
  PaginationResult,
  RemoverResult,
  UpdateOperations,
  WriterOptions,
} from "../contracts";
import { QueryBuilderContract, WhereCallback, WhereObject, WhereOperator } from "../contracts";
import type { DataSource } from "../data-source/data-source";
import { DatabaseDirtyTracker } from "../database-dirty-tracker";
import type { ModelEventListener, ModelEventName } from "../events/model-events";
import { ModelEvents } from "../events/model-events";
import type { ModelSnapshot } from "../relations/relation-hydrator";
import { RelationLoader } from "../relations/relation-loader";
import { modelSync } from "../sync/model-sync";
import type { ModelSyncOperationContract } from "../sync/types";
import type { DeleteStrategy, StrictMode } from "../types";
import {
  decrementField,
  getBooleanField,
  getFieldValue,
  getNumberField,
  getOnlyFields,
  getStringField,
  hasField,
  incrementField,
  mergeFields,
  setFieldValue,
  unsetFields,
} from "./methods/accessor-methods";
import { deleteOneRecord, deleteRecords, destroyModel } from "./methods/delete-methods";
import {
  checkHasChanges,
  checkIsDirty,
  getDirtyColumns,
  getDirtyColumnsWithValues,
  getRemovedColumns,
} from "./methods/dirty-methods";
import {
  cloneModel,
  deepFreezeObject,
  hydrateModel,
  modelFromSnapshot,
  modelToSnapshot,
  replaceModelData,
  serializeModel,
} from "./methods/hydration-methods";
import {
  emitModelEvent,
  offModelEvent,
  onceModelEvent,
  onModelEvent,
} from "./methods/instance-event-methods";
import {
  applyDefaultsToModel,
  generateModelNextId,
  performAtomicDecrement,
  performAtomicIncrement,
  performAtomicUpdate,
} from "./methods/meta-methods";
import {
  buildNewQueryBuilder,
  buildQuery,
  countRecords,
  decreaseField,
  findAll,
  findAndReplaceRecord,
  findAndUpdateRecords,
  findById,
  findFirst,
  findLast,
  findLatest,
  findOneAndDeleteRecord,
  findOneAndUpdateRecord,
  increaseField,
  paginateRecords,
  performAtomic,
  resolveDataSource,
  updateById,
} from "./methods/query-methods";
import { restoreAllRecords, restoreRecord } from "./methods/restore-methods";
import {
  addGlobalModelScope,
  addLocalModelScope,
  removeGlobalModelScope,
  removeLocalModelScope,
} from "./methods/scope-methods";
import { modelToJSON } from "./methods/serialization-methods";
import {
  cleanupModelEvents,
  getGlobalEvents,
  getModelEvents,
  offStaticEvent,
  onceStaticEvent,
  onStaticEvent,
} from "./methods/static-event-methods";
import {
  createManyRecords,
  createRecord,
  findOrCreateRecord,
  saveModel,
  upsertRecord,
} from "./methods/write-methods";
import type {
  ChildModel,
  GlobalScopeDefinition,
  GlobalScopeOptions,
  LocalScopeCallback,
  ModelSchema,
} from "./model.types";
import { getAllModelsFromRegistry, getModelFromRegistry } from "./register-model";
export type {
  ChildModel,
  GlobalScopeDefinition,
  GlobalScopeOptions,
  LocalScopeCallback,
  ModelSchema,
  ScopeTiming,
} from "./model.types";

/**
 * Base class that powers all Cascade models.
 *
 * Provides:
 * - Type-safe value accessors with dot-notation support (get, set, has, unset, merge)
 * - Automatic dirty tracking for efficient partial updates
 * - Lifecycle event hooks (saving, created, deleting, etc.)
 * - Integration with the data-source registry for multi-database support
 * - Support for both per-model and global event listeners
 *
 * @template TSchema - The shape of the model's underlying data
 *
 * @example
 * ```typescript
 * interface UserSchema {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * class User extends Model<UserSchema> {
 *   public static table = "users";
 * }
 *
 * const user = new User({ name: "Alice" });
 * user.set("email", "alice@example.com");
 * console.log(user.hasChanges()); // true
 * ```
 */
export abstract class Model<TSchema extends ModelSchema = ModelSchema> {
  /**
   * The database table or collection name associated with this model.
   *
   * Must be defined by each concrete model subclass.
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static table = "users";
   * }
   * ```
   */
  public static table: string;

  /**
   * Resource for this model.
   * It is a class that holds a toJSON function
   * Called when the model is being converted to JSON (by calling toJSON or JSON.stringify(model))
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static resource = UserResource;
   * }
   * ```
   */
  public static resource?: any;

  /**
   * Resource columns
   * Define what columns should be sent to the resource (if any) when converting to JSON
   */
  public static resourceColumns?: string[];

  /**
   * JSON keys for this model.
   * This could be used if resource is not passed
   * It will select only these keys from the model
   * @example
   * ```typescript
   * class User extends Model {
   *   public static toJsonColumns = ["id", "name"];
   * }
   * ```
   */
  public static toJsonColumns?: string[];

  /**
   * Data source reference for this model.
   *
   * Can be:
   * - A string name registered in the data-source registry
   * - A DataSource instance
   * - Undefined (falls back to the default data source)
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static dataSource = "primary";
   * }
   * ```
   */
  public static dataSource?: string | DataSource;

  /**
   * Query builder class
   */
  public static builder?: new (...args: any[]) => QueryBuilderContract<Model>;

  /**
   * Primary key field name used to identify records.
   *
   * @default "id"
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static primaryKey = "_id"; // MongoDB
   * }
   *
   * class Product extends Model {
   *   public static primaryKey = "id"; // SQL
   * }
   * ```
   */
  public static primaryKey: string = "id";

  /**
   * Embeded fields when document is Being embeded
   */
  public static embed?: string[];

  /**
   * Validation and casting schema using @warlock.js/seal.
   *
   * Defines validation rules and data transformations for the model.
   * Used automatically during save operations.
   *
   * @example
   * ```typescript
   * import { v } from "@warlock.js/seal";
   *
   * class User extends Model {
   *   public static schema = v.object({
   *     name: v.string().required().trim(),
   *     age: v.number().min(0).max(120),
   *     email: v.string().email().required().toLowerCase(),
   *     createdAt: v.date().default(() => new Date()),
   *   });
   * }
   * ```
   */
  public static schema?: ObjectValidator;

  /**
   * Strict mode behavior for unknown fields.
   *
   * - `"strip"`: Remove unknown fields silently (default, recommended for APIs)
   * - `"fail"`: Throw validation error on unknown fields (strict validation)
   * - `"allow"`: Allow unknown fields to pass through (permissive)
   *
   * @default "strip"
   *
   * @example
   * ```typescript
   * import { Model, type StrictMode } from "@warlock.js/cascade";
   *
   * class User extends Model {
   *   public static strictMode: StrictMode = "fail"; // Throw on unknown fields
   * }
   *
   * const user = new User({ name: "Alice", unknownField: "value" });
   * await user.save(); // DatabaseWriterValidationError: unknown field
   * ```
   */
  public static strictMode: StrictMode = "strip";

  /**
   * Auto-generate incremental `id` field on insert (NoSQL only).
   *
   * When enabled, the ID generator creates a sequential integer ID
   * separate from the database's native ID (_id for MongoDB).
   *
   * **Note:** SQL databases use native AUTO_INCREMENT and don't need this.
   *
   * @default true
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static autoGenerateId = true;
   * }
   *
   * const user = new User({ name: "Alice" });
   * await user.save();
   * console.log(user.get("_id")); // ObjectId("...") - MongoDB
   * console.log(user.get("id")); // 1 - Generated
   * ```
   */
  public static autoGenerateId = true;

  /**
   * Initial ID value for the first record.
   *
   * If not set, defaults to 1 or uses `randomInitialId`.
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static initialId = 1000; // Start from 1000
   * }
   * ```
   */
  public static initialId?: number;

  /**
   * Randomly generate the initial ID.
   *
   * Can be:
   * - `true`: Generate random ID between 10000-499999
   * - Function: Custom random ID generator
   * - `false`: Use `initialId` or default to 1
   *
   * @default false
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static randomInitialId = true; // Random 10000-499999
   * }
   *
   * class Product extends Model {
   *   public static randomInitialId = () => Math.floor(Math.random() * 1000000);
   * }
   * ```
   */
  public static randomInitialId?: boolean | (() => number);

  /**
   * Amount to increment ID by for each new record.
   *
   * If not set, defaults to 1 or uses `randomIncrement`.
   *
   * @default 1
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static incrementIdBy = 5; // Increment by 5
   * }
   * ```
   */
  public static incrementIdBy?: number = 1;

  /**
   * Randomly generate the increment amount.
   *
   * Can be:
   * - `true`: Generate random increment between 1-10
   * - Function: Custom random increment generator
   * - `false`: Use `incrementIdBy` or default to 1
   *
   * @default false
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static randomIncrement = true; // Random 1-10
   * }
   *
   * class Product extends Model {
   *   public static randomIncrement = () => Math.floor(Math.random() * 100);
   * }
   * ```
   */
  public static randomIncrement?: boolean | (() => number);

  /**
   * Created at column name.
   */
  public static createdAtColumn?: string | false;

  /**
   * Updated at column name.
   */
  public static updatedAtColumn?: string | false;

  /**
   * Delete strategy for this model.
   *
   * Controls how models are deleted:
   * - `"trash"` - Moves to trash collection, then deletes
   * - `"permanent"` - Direct deletion (hard delete)
   * - `"soft"` - Sets deletedAt timestamp (soft delete)
   *
   * Can be overridden by destroy() options.
   * Falls back to data source default if not set.
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static deleteStrategy: DeleteStrategy = "soft";
   * }
   * ```
   */
  public static deleteStrategy?: DeleteStrategy;

  /**
   * Column name for soft delete timestamp.
   *
   * Used when delete strategy is "soft".
   *
   * @default "deletedAt"
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static deletedAtColumn = "archivedAt";
   * }
   * ```
   */
  public static deletedAtColumn: string | false = "deletedAt";

  /**
   * Trash table/collection name override.
   *
   * If not set, defaults to `{table}Trash` or data source default.
   * Used when delete strategy is "trash".
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static trashTable = "userRecycleBin";
   * }
   * ```
   */
  public static trashTable?: string;

  /**
   * Global scopes that are automatically applied to all queries.
   * These scopes are inherited by child models.
   */
  public static globalScopes = new Map<string, GlobalScopeDefinition>();

  /**
   * Local scopes that can be manually applied to queries.
   * These are reusable query snippets that developers opt into.
   */
  public static localScopes = new Map<string, LocalScopeCallback>();

  /**
   * Relation definitions for this model.
   *
   * Define relationships to other models using helper functions:
   * - `hasMany()` - One-to-many (User has many Posts)
   * - `hasOne()` - One-to-one (User has one Profile)
   * - `belongsTo()` - Inverse of hasMany/hasOne (Post belongs to User)
   * - `belongsToMany()` - Many-to-many with pivot table (User has many Roles)
   *
   * @example
   * ```typescript
   * import { hasMany, belongsTo, belongsToMany, hasOne } from "@warlock.js/cascade";
   *
   * class User extends Model {
   *   public posts?: Post[];  // Optional: for TypeScript autocomplete
   *
   *   static relations = {
   *     posts: hasMany("Post"),
   *     profile: hasOne("Profile"),
   *     organization: belongsTo("Organization"),
   *     roles: belongsToMany("Role", { pivot: "user_roles" }),
   *   };
   * }
   *
   * // Usage:
   * const users = await User.query().with("posts").get();
   * console.log(users[0].posts); // Post[]
   * ```
   */
  public static relations: Record<string, any> = {};

  /**
   * Flag indicating whether this model instance represents a new (unsaved) record.
   *
   * - `true`: The model has not been persisted to the database yet
   * - `false`: The model represents an existing database record
   *
   * This flag is used by the writer to determine whether to perform an insert or update.
   */
  public isNew = true;

  /**
   * The raw mutable data backing this model instance.
   *
   * All field accessors (get, set, merge, etc.) operate on this object.
   */
  public data: TSchema;

  /**
   * Dirty tracker that monitors changes to the model's data.
   *
   * Tracks:
   * - Which fields have been modified (dirty columns)
   * - Which fields have been removed
   * - Original vs. current values for each dirty field
   *
   * Used by the writer to generate efficient partial update payloads.
   */
  public readonly dirtyTracker: DatabaseDirtyTracker;

  /**
   * Model instance events.
   * Allows registering listeners for lifecycle events on this specific instance.
   */
  public events: ModelEvents<any> = new ModelEvents();

  /**
   * Map of loaded relations for this model instance.
   *
   * Populated automatically when using `with()` for eager loading,
   * or when calling `load()` for lazy loading.
   *
   * @example
   * ```typescript
   * const user = await User.query().with("posts").first();
   * console.log(user.loadedRelations.get("posts")); // Post[]
   *
   * // Also accessible as direct properties:
   * console.log(user.posts); // Post[]\n   * ```
   */
  public loadedRelations: Map<string, any> = new Map();

  /**
   * Column name for active status.
   */
  protected isActiveColumn = "isActive";

  /**
   * Constructs a new model instance with optional initial data.
   *
   * Initializes the dirty tracker with a snapshot of the provided data.
   *
   * @param initialData - Partial data to populate the model
   *
   * @example
   * ```typescript
   * const user = new User({ name: "Alice", email: "alice@example.com" });
   * ```
   */
  public constructor(initialData: Partial<TSchema> = {}) {
    this.data = initialData as TSchema;
    this.dirtyTracker = this.self().getDriver().getDirtyTracker(this.data);
  }

  /**
   * Lazily load one or more relations for this model instance.
   *
   * This method loads relations on-demand after the model has been fetched.
   * The loaded relations are attached directly to the model instance and
   * also stored in `loadedRelations` map.
   *
   * @param relations - Relation name(s) to load
   * @returns This model instance for chaining
   *
   * @example
   * ```typescript
   * const user = await User.first();
   *
   * // Load single relation
   * await user.load("posts");
   * console.log(user.posts); // Post[]
   *
   * // Load multiple relations
   * await user.load("posts", "organization");
   *
   * // Chain with other operations
   * const posts = await user.load("posts").then(() => user.posts);
   * ```
   */
  public async load(...relations: string[]): Promise<this> {
    const ModelClass = this.constructor as ChildModel<Model>;
    const loader = new RelationLoader([this], ModelClass);
    await loader.load(relations);
    return this;
  }

  /**
   * Check if a relation has been loaded.
   *
   * @param relationName - Name of the relation to check
   * @returns True if the relation has been loaded
   *
   * @example
   * ```typescript
   * const user = await User.first();
   *
   * console.log(user.isLoaded("posts")); // false
   * await user.load("posts");
   * console.log(user.isLoaded("posts")); // true
   * ```
   */

  public isLoaded(relationName: string): boolean {
    return this.loadedRelations.has(relationName);
  }

  /**
   * Get a loaded relation by name.
   *
   * Returns undefined if the relation has not been loaded.
   *
   * @param relationName - Name of the relation to get
   * @returns The loaded relation data, or undefined
   *
   * @example
   * ```typescript
   * const user = await User.query().with("posts").first();
   *
   * const posts = user.getRelation<Post[]>("posts");
   * console.log(posts?.length);
   * ```
   */
  public getRelation<TRelation = any>(relationName: string): TRelation | undefined {
    return this.loadedRelations.get(relationName) as TRelation | undefined;
  }

  /**
   * Get a model class by its name from the global registry.
   *
   * Models must be decorated with @RegisterModel() to be available in the registry.
   *
   * @param name - The model class name
   * @returns The model class or undefined if not found
   *
   * @example
   * ```typescript
   * const UserModel = Model.getModel("User");
   * if (UserModel) {
   *   const user = await UserModel.find(1);
   * }
   * ```
   */
  public static getModel(name: string) {
    return getModelFromRegistry(name);
  }

  /**
   * Get all registered models from the global registry.
   *
   * Only models decorated with @RegisterModel() will appear here.
   *
   * @returns A Map of all registered model classes by name
   *
   * @example
   * ```typescript
   * const allModels = Model.getAllModels();
   * for (const [name, ModelClass] of allModels) {
   *   console.log(`Found model: ${name} with table: ${ModelClass.table}`);
   * }
   * ```
   */
  public static getAllModels() {
    return getAllModelsFromRegistry();
  }

  // ============================================================================
  // STATIC SYNC METHODS
  // ============================================================================

  /**
   * Create a sync operation for a single embedded document.
   *
   * When this model is updated, the target model's field
   * will be updated with the embedded data.
   *
   * @param TargetModel - Target model class that receives data
   * @param targetField - Field path in target model
   * @returns Sync operation for chaining configuration
   *
   * @example
   * ```typescript
   * // When Category updates, update Product.category
   * Category.sync(Product, "category");
   * ```
   */
  public static sync<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    TargetModel: ChildModel<Model>,
    targetField: string,
  ): ModelSyncOperationContract {
    return modelSync.sync(this, TargetModel, targetField);
  }

  /**
   * Create a sync operation for an array of embedded documents.
   *
   * When this model is updated, the corresponding element
   * in the target model's array field will be updated.
   *
   * @param TargetModel - Target model class that receives data
   * @param targetField - Array field path in target model
   * @returns Sync operation for chaining configuration
   *
   * @example
   * ```typescript
   * // When Tag updates, update Post.tags[i] where tags[i].id matches
   * Tag.syncMany(Post, "tags").identifyBy("id");
   * ```
   */
  public static syncMany<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    TargetModel: ChildModel<Model>,
    targetField: string,
  ): ModelSyncOperationContract {
    return modelSync.syncMany(this, TargetModel, targetField);
  }

  /**
   * Get model id
   */
  public get id(): number | string {
    return this.get("id");
  }

  /**
   * Get uuid
   */
  public get uuid(): string {
    return this.get("id");
  }

  /**
   * Retrieves a field value from the model's data.
   *
   * Supports both top-level keys and dot-notation paths for nested access.
   *
   * @param field - The field name or dot-notation path (e.g., "address.city")
   * @param defaultValue - Value to return if the field is missing
   * @returns The field value or the default value if not found
   *
   * @example
   * ```typescript
   * user.get("name"); // "Alice"
   * user.get("address.city", "Unknown"); // "Unknown" if address.city is missing
   * ```
   */
  public get<TKey extends keyof TSchema & string>(field: TKey): TSchema[TKey];
  public get<TKey extends keyof TSchema & string>(
    field: TKey,
    defaultValue: TSchema[TKey],
  ): TSchema[TKey];
  public get<Type extends unknown = any>(field: string): Type;
  public get<Type extends unknown = any>(field: string, defaultValue: Type): Type;
  public get(field: string, defaultValue?: unknown): any {
    return getFieldValue(this, field, defaultValue);
  }

  /**
   * Get only the values of the given fields
   */
  public only<TKey extends keyof TSchema & string>(fields: TKey[]): Record<TKey, TSchema[TKey]>;
  public only(fields: string[]): Record<string, unknown>;
  public only(fields: string[]): Record<string, unknown> {
    return getOnlyFields(this, fields);
  }

  /**
   * Get a string value
   */
  public string(key: string, defaultValue?: string): string | undefined {
    return getStringField(this, key, defaultValue);
  }

  /**
   * Get a number value
   */
  public number(key: string, defaultValue?: number): number | undefined {
    return getNumberField(this, key, defaultValue);
  }

  /**
   * Get a boolean value
   */
  public boolean(key: string, defaultValue?: boolean): boolean | undefined {
    return getBooleanField(this, key, defaultValue);
  }

  /**
   * Sets a field value in the model's data and marks it as dirty.
   *
   * Supports both top-level keys and dot-notation paths for nested assignment.
   * Automatically updates the dirty tracker to reflect the change.
   *
   * @param field - The field name or dot-notation path (e.g., "address.city")
   * @param value - The value to assign
   * @returns The model instance for method chaining
   *
   * @example
   * ```typescript
   * user.set("name", "Bob").set("address.city", "NYC");
   * ```
   */
  public set<TKey extends keyof TSchema & string>(field: TKey, value: TSchema[TKey]): this;
  public set(field: string, value: unknown): this;
  public set(field: string, value: unknown): this {
    return setFieldValue(this, field, value) as this;
  }

  /**
   * Checks whether a field exists in the model's data.
   *
   * Supports both top-level keys and dot-notation paths.
   *
   * @param field - The field name or dot-notation path
   * @returns `true` if the field exists, `false` otherwise
   *
   * @example
   * ```typescript
   * user.has("name"); // true
   * user.has("address.zipCode"); // false
   * ```
   */
  public has<TKey extends keyof TSchema & string>(field: TKey): boolean;
  public has(field: string): boolean;
  public has(field: string): boolean {
    return hasField(this, field);
  }

  /**
   * Increment the given field by the given amount
   */
  public increment<TKey extends keyof TSchema & string>(field: TKey, amount: number): this;
  public increment(field: string, amount?: number): this;
  public increment(field: string, amount?: number): this {
    return incrementField(this, field, amount) as this;
  }

  /**
   * Decrement the given field by the given amount
   */
  public decrement<TKey extends keyof TSchema & string>(field: TKey, amount: number): this;
  public decrement(field: string, amount?: number): this;
  public decrement(field: string, amount?: number): this {
    return decrementField(this, field, amount) as this;
  }

  /**
   * Removes one or more fields from the model's data and marks them as removed.
   *
   * Supports both top-level keys and dot-notation paths.
   * Automatically updates the dirty tracker to reflect the removal.
   *
   * @param fields - One or more field names or dot-notation paths to remove
   * @returns The model instance for method chaining
   *
   * @example
   * ```typescript
   * user.unset("tempField", "address.oldZip");
   * ```
   */
  public unset(...fields: (keyof TSchema & string)[]): this;
  public unset(...fields: string[]): this;
  public unset(...fields: string[]): this {
    return unsetFields(this, ...fields) as this;
  }

  /**
   * Merges new values into the model's data and marks changed fields as dirty.
   *
   * Performs a deep merge, preserving existing nested structures.
   * Automatically updates the dirty tracker to reflect all changes.
   *
   * @param values - Partial data to merge into the model
   * @returns The model instance for method chaining
   *
   * @example
   * ```typescript
   * user.merge({ name: "Charlie", address: { city: "LA" } });
   * ```
   */
  public merge(values: Partial<TSchema>): this;
  public merge(values: Record<string, unknown>): this;
  public merge(values: Record<string, unknown>): this {
    return mergeFields(this, values) as this;
  }

  /**
   * Perform atomoic update from current model instance
   * Please note that it would require the id to be existing in the current
   * model instance
   * @returns number of affected records
   */
  public async atomicUpdate(operations: Record<string, unknown>): Promise<number> {
    return performAtomicUpdate(this, operations);
  }

  /**
   * Perform atomic increment
   * This would issue a query update and update the given field without
   * saving the model
   */
  public async atomicIncrement<T extends keyof TSchema & string>(
    field: T,
    amount: number = 1,
  ): Promise<number> {
    return performAtomicIncrement(this, field, amount);
  }

  /**
   * Perform atomic decrement
   * This would issue a query update and update the given field without
   * saving the model
   */
  public async atomicDecrement<T extends keyof TSchema & string>(
    field: T,
    amount: number = 1,
  ): Promise<number> {
    return performAtomicDecrement(this, field, amount);
  }

  /**
   * Determine if current model is active
   */
  public get isActive(): boolean {
    return this.get<boolean>(this.isActiveColumn);
  }

  /**
   * Get created at date
   */
  public get createdAt(): Date | undefined {
    const createdAtColumn = this.self().createdAtColumn;

    if (!createdAtColumn) return;

    return this.get<Date>(createdAtColumn);
  }

  /**
   * Get updated at date
   */
  public get updatedAt(): Date | undefined {
    const updatedAtColumn = this.self().updatedAtColumn;

    if (!updatedAtColumn) return;

    return this.get<Date>(updatedAtColumn);
  }

  /**
   * Check if current model record is created by the given user model
   */
  public isCreatedBy(user: Model | GenericObject): boolean {
    return this.get(`createdBy.id`) === user.id;
  }

  /**
   * Checks whether the model's data has changed since instantiation or last reset.
   *
   * @returns `true` if any fields have been modified or removed, `false` otherwise
   *
   * @example
   * ```typescript
   * const user = new User({ name: "Alice" });
   * user.hasChanges(); // false
   * user.set("name", "Bob");
   * user.hasChanges(); // true
   * ```
   */
  public hasChanges(): boolean {
    return checkHasChanges(this);
  }

  /**
   * Check if the given column has been modified.
   *
   * @param column - The column name to check
   * @returns `true` if the column has been modified, `false` otherwise
   *
   * @example
   * ```typescript
   * user.set("name", "Bob");
   * user.isDirty("name"); // true
   * ```
   */
  public isDirty(column: string): boolean {
    return checkIsDirty(this, column);
  }

  /**
   * Retrieves all dirty columns with their old and new values.
   *
   * @returns A record mapping each dirty column to its previous and current value
   *
   * @example
   * ```typescript
   * user.set("name", "Bob");
   * user.getDirtyColumnsWithValues();
   * // { name: { oldValue: "Alice", newValue: "Bob" } }
   * ```
   */
  public getDirtyColumnsWithValues(): Record<string, { oldValue: unknown; newValue: unknown }> {
    return getDirtyColumnsWithValues(this);
  }

  /**
   * Lists all columns that have been removed from the model's data.
   *
   * @returns An array of field names that were present initially but have been unset
   *
   * @example
   * ```typescript
   * user.unset("tempField");
   * user.getRemovedColumns(); // ["tempField"]
   * ```
   */
  public getRemovedColumns(): string[] {
    return getRemovedColumns(this);
  }

  /**
   * Lists all columns that have been modified since instantiation or last reset.
   *
   * @returns An array of field names that have changed
   *
   * @example
   * ```typescript
   * user.set("name", "Bob");
   * user.getDirtyColumns(); // ["name"]
   * ```
   */
  public getDirtyColumns(): string[] {
    return getDirtyColumns(this);
  }

  /**
   * Emits a lifecycle event to both per-model and global listeners.
   *
   * This method is public so that external services (like the writer) can trigger
   * lifecycle events when appropriate.
   *
   * @param event - The event name (e.g., "saving", "created", "deleting")
   * @param context - Optional context data to pass to listeners
   *
   * @example
   * ```typescript
   * await user.emitEvent("saving");
   * await user.emitEvent("validated", { errors: [] });
   * ```
   */
  public async emitEvent<TContext = unknown>(
    event: ModelEventName,
    context?: TContext,
  ): Promise<void> {
    return emitModelEvent(this, event, context);
  }

  /**
   * Register a listener for a model lifecycle event on this instance.
   *
   * @param event - Event name (e.g., "saving", "updated")
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public on<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<this, TContext>,
  ): () => void {
    return onModelEvent(this, event, listener as any);
  }

  /**
   * Register a one-time listener for a model lifecycle event on this instance.
   *
   * @param event - Event name
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  public once<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<this, TContext>,
  ): () => void {
    return onceModelEvent(this, event, listener as any);
  }

  /**
   * Remove a listener from this instance.
   *
   * @param event - Event name
   * @param listener - Callback function to remove
   */
  public off<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<this, TContext>,
  ): void {
    offModelEvent(this, event, listener as any);
  }

  /**
   * Resolves the data source associated with this model.
   *
   * Resolution order:
   * 1. If `dataSource` is a string, looks it up in the data-source registry
   * 2. If `dataSource` is a DataSource instance, returns it directly
   * 3. Otherwise, returns the default data source from the registry
   *
   * @returns The resolved DataSource instance
   * @throws Error if no data source is found
   *
   * @example
   * ```typescript
   * class User extends Model {
   *   public static dataSource = "primary";
   * }
   *
   * const ds = User.getDataSource();
   * ```
   */
  public static getDataSource(): DataSource {
    return resolveDataSource(this as any);
  }

  /**
   * Get driver instance
   */
  public static getDriver(): DriverContract {
    return this.getDataSource().driver;
  }

  /**
   * Generate next id and set it to current model's id
   */
  public async generateNextId(): Promise<number | string> {
    return generateModelNextId(this);
  }

  /**
   * Apply model defaults from data source configuration.
   *
   * This is called automatically by getDataSource() the first time
   * a model accesses its data source. Defaults are only applied if
   * the model doesn't already have its own value set.
   *
   * The hierarchy is:
   * 1. Model static property (highest priority - skipped here)
   * 2. Database config modelDefaults (passed here)
   * 3. Driver modelDefaults (merged before passing here)
   * 4. Framework defaults (fallback values in the code)
   *
   * @param defaults - Model default configuration from data source
   */
  public static applyModelDefaults(defaults: any): void {
    applyDefaultsToModel(this, defaults);
  }

  /**
   * Add a global scope that is automatically applied to all queries.
   *
   * Global scopes are inherited by child models and applied before query execution.
   * Use for security filters, multi-tenancy, soft deletes, etc.
   *
   * @param name - Unique name for the scope
   * @param callback - Function that modifies the query
   * @param options - Scope options (timing: 'before' | 'after')
   *
   * @example
   * ```typescript
   * // Multi-tenancy scope
   * Model.addGlobalScope('tenant', (query) => {
   *   query.where('tenantId', getCurrentTenant());
   * }, { timing: 'before' });
   *
   * // Soft delete scope
   * User.addGlobalScope('notDeleted', (query) => {
   *   query.whereNull('deletedAt');
   * });
   * ```
   */
  public static addGlobalScope(
    name: string,
    callback: (query: QueryBuilderContract) => void,
    options: GlobalScopeOptions = {},
  ): void {
    addGlobalModelScope(this as any, name, callback, options);
  }

  /**
   * Remove a global scope by name.
   *
   * @param name - Name of the scope to remove
   *
   * @example
   * ```typescript
   * Model.removeGlobalScope('tenant');
   * ```
   */
  public static removeGlobalScope(name: string): void {
    removeGlobalModelScope(this as any, name);
  }

  /**
   * Add a local scope that can be manually applied to queries.
   *
   * Local scopes are reusable query snippets that developers opt into.
   * They are not automatically applied.
   *
   * @param name - Unique name for the scope
   * @param callback - Function that modifies the query
   *
   * @example
   * ```typescript
   * // Define reusable scopes
   * User.addScope('active', (query) => {
   *   query.where('isActive', true);
   * });
   *
   * User.addScope('admins', (query) => {
   *   query.where('role', 'admin');
   * });
   *
   * // Use explicitly
   * await User.query().scope('active').get();
   * await User.query().scope('admins').get();
   * ```
   */
  public static addScope(name: string, callback: LocalScopeCallback): void {
    addLocalModelScope(this as any, name, callback);
  }

  /**
   * Remove a local scope by name.
   *
   * @param name - Name of the scope to remove
   *
   * @example
   * ```typescript
   * User.removeScope('active');
   * ```
   */
  public static removeScope(name: string): void {
    removeLocalModelScope(this as any, name);
  }

  /**
   * Create a new query builder for this model
   */
  public static query<TModel extends Model = Model>(
    this: ChildModel<TModel>,
  ): QueryBuilderContract<TModel> {
    return buildQuery(this, Model);
  }

  // Short hand for the query builder method with
  /**
   * Eagerly load one or more relations with the query results.
   *
   * Relations are loaded in separate optimized queries to prevent N+1 problems.
   * The loaded relations are attached to each model instance.
   *
   * @param relation - Single relation name to load
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Load single relation
   * const user = await User.query().with("posts").find(1);
   * console.log(user.posts); // Post[]
   *
   * // Load multiple relations
   * const user = await User.query().with("posts", "organization").find(1);
   *
   * // Load nested relations
   * const user = await User.query().with("posts.comments.author").find(1);
   * ```
   */
  public static with<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    relation: string,
  ): QueryBuilderContract<TModel>;

  /**
   * Eagerly load multiple relations.
   *
   * @param relations - Relation names to load
   * @returns Query builder for chaining
   */
  public static with<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    ...relations: string[]
  ): QueryBuilderContract<TModel>;

  /**
   * Eagerly load a relation with a constraint callback.
   *
   * The callback receives the relation query builder, allowing you to
   * add conditions, ordering, or limits to the related query.
   *
   * @param relation - Relation name to load
   * @param constraint - Callback to configure the relation query
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const user = await User.query()
   *   .with("posts", (query) => {
   *     query.where("isPublished", true)
   *       .orderBy("createdAt", "desc")
   *       .limit(5);
   *   })
   *   .find(1);
   * ```
   */
  public static with<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    relation: string,
    constraint: (query: QueryBuilderContract) => void,
  ): QueryBuilderContract<TModel>;

  /**
   * Eagerly load multiple relations with constraints.
   *
   * Pass an object where keys are relation names and values are either:
   * - `true` to load without constraints
   * - A callback function to configure the relation query
   *
   * @param relations - Object mapping relation names to constraints
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * const user = await User.query()
   *   .with({
   *     posts: (query) => query.where("isPublished", true),
   *     organization: true,
   *     roles: (query) => query.orderBy("priority"),
   *   })
   *   .find(1);
   * ```
   */
  public static with<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    relations: Record<string, boolean | ((query: QueryBuilderContract) => void)>,
  ): QueryBuilderContract<TModel>;

  public static with<TModel extends Model = Model>(this: ChildModel<TModel>, ...args: any[]) {
    return this.query().with(...args);
  }

  /**
   * Load relations using database JOINs in a single query.
   *
   * Unlike `with()` which uses separate queries, `joinWith()` uses
   * LEFT JOIN (SQL) or $lookup (MongoDB) to fetch related data
   * in a single query. The related data is hydrated into proper
   * model instances and attached to the main model.
   *
   * Best for: belongsTo and hasOne relations where you need
   * efficient single-query loading.
   *
   * @param relations - Relation names to load via JOIN
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * // Single relation
   * const post = await Post.joinWith("author").first();
   * console.log(post.author); // User model instance
   * console.log(post.data);   // { id, title, authorId } - no author data
   *
   * // Multiple relations
   * const post = await Post.joinWith("author", "category").first();
   * ```
   */
  public static joinWith<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    ...relations: string[]
  ): QueryBuilderContract<TModel> {
    return this.query().joinWith(...relations);
  }

  /**
   * Create new query builder.
   *
   * If the model has a static `builder` property set to a query builder class,
   * it will be instantiated instead of the default driver query builder.
   *
   * @example
   * ```typescript
   * class UserQueryBuilder<T = User> extends MongoQueryBuilder<T> {
   *   active() { return this.where("isActive", true); }
   * }
   *
   * class User extends Model {
   *   static builder = UserQueryBuilder;  // That's it! ✨
   * }
   *
   * // Now User.query() returns UserQueryBuilder<User> with autocomplete!
   * ```
   */
  public static newQueryBuilder<TModel extends Model = Model>(
    this: ChildModel<TModel>,
  ): QueryBuilderContract<TModel> {
    return buildNewQueryBuilder(this);
  }

  /**
   * Get First matched record for the given filter
   */
  public static async first<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<TModel | null> {
    return findFirst(this, filter);
  }

  /**
   * Get last matched record for the given filter
   */
  public static async last<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<TModel | null> {
    return findLast(this, filter);
  }

  /**
   * Use where clause directly
   */
  public static where<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    field: string,
    value: unknown,
  ): QueryBuilderContract<TModel>;
  public static where<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    field: string,
    operator: WhereOperator,
    value: unknown,
  ): QueryBuilderContract<TModel>;
  public static where<TModel extends Model = Model>(
    this: (new (...args: any[]) => TModel) &
      Pick<typeof Model, "query" | "getDataSource" | "table">,
    conditions: WhereObject,
  ): QueryBuilderContract<TModel>;
  public static where<TModel extends Model = Model>(
    this: (new (...args: any[]) => TModel) &
      Pick<typeof Model, "query" | "getDataSource" | "table">,
    callback: WhereCallback<TModel>,
  ): QueryBuilderContract<TModel>;
  public static where<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    ...args: any[]
  ): QueryBuilderContract<TModel> {
    return (this.query().where as any)(...args);
  }

  /**
   * Count the number of records in the table
   * @param filter - The filter to apply to the query
   */
  public static count<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<number> {
    return countRecords(this, filter);
  }

  /**
   * Find record by id
   */
  public static async find<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    id: string | number,
  ): Promise<TModel | null> {
    return findById(this, id);
  }

  /**
   * Get all records from the table
   *
   * @param filter - The filter to apply to the query
   * @returns All records from the table
   */
  public static async all<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<TModel[]> {
    return findAll(this, filter);
  }

  /**
   * Perform pagination
   */
  public static async paginate<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    options: PaginationOptions & {
      filter?: Record<string, unknown>;
    } = {},
  ): Promise<PaginationResult<TModel>> {
    return paginateRecords(this, options);
  }

  /**
   * Get latest records from the table
   *
   * @param filter - The filter to apply to the query
   */
  public static async latest<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<TModel[]> {
    return findLatest(this, filter);
  }

  /**
   * Increment the given field by the given amount using atomic update
   *
   * @example ```typescript
   * // Increase age by 1 for user id 1
   * User.increment({id: 1}, "age", 1);
   * // Increase age by 1 and views by 2 for user id 1
   * User.increment({id: 1}, {age: 1, views: 2});
   * ```
   */
  public static increase<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    field: string,
    amount: number,
  ): Promise<number> {
    return increaseField(this, filter, field, amount);
  }

  /**
   * Decrement the given field by the given amount using atomic update
   * @example ```typescript
   * // Decrease age by 1 for user id 1
   * User.decrement({id: 1}, "age", 1);
   * // Decrease age by 1 and views by 2 for user id 1
   * User.decrement({id: 1}, {age: 1, views: 2});
   * ```
   */
  public static decrease<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    field: string,
    amount: number,
  ): Promise<number> {
    return decreaseField(this, filter, field, amount);
  }

  /**
   * Perform atomic operation
   * Example
   *
   * ```typescript
   * const user = await User.atomic({id: 1}, {$inc: {age: 1}})
   * Returns user model with updated age
   */
  public static async atomic<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    operations: UpdateOperations,
  ): Promise<number> {
    return performAtomic(this, filter, operations);
  }

  /**
   * Perform an atomic update for the given id
   */
  public static async update<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<number> {
    return updateById(this, id, data);
  }

  /**
   * Find one and update multiple records that matches the provided filter and return the updated record
   * @param filter - Filter conditions
   * @param update - Update operations ($set, $unset, $inc)
   * @returns The updated records
   */
  public static async findAndUpdate<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    update: UpdateOperations,
  ): Promise<TModel[]> {
    return findAndUpdateRecords(this, filter, update);
  }

  /**
   * Find one and update a single record that matches the provided filter and return the updated record
   * @param filter - Filter conditions
   * @param update - Update operations ($set, $unset, $inc)
   * @returns The updated record or null
   */
  public static async findOneAndUpdate<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    update: UpdateOperations,
  ): Promise<TModel | null> {
    return findOneAndUpdateRecord(this, filter, update);
  }

  /**
   * Find and replace the entire document that matches the provided filter and return the replaced document
   */
  public static async findAndReplace<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    document: Record<string, unknown>,
  ): Promise<TModel | null> {
    return findAndReplaceRecord(this, filter, document);
  }

  /**
   * Destroy (delete) the current model instance from the database.
   *
   * Emits lifecycle events:
   * - `deleting` - Before deletion
   * - `deleted` - After successful deletion
   *
   * @param options - Destroy options (strategy override, skipEvents)
   * @throws {Error} If the model is new (not saved) or if deletion fails
   *
   * @example
   * ```typescript
   * const user = await User.find(1);
   * await user.destroy(); // Uses default strategy
   * await user.destroy({ strategy: "permanent" }); // Override strategy
   * await user.destroy({ skipEvents: true }); // Silent delete
   * ```
   */
  public async destroy(options?: {
    strategy?: DeleteStrategy;
    skipEvents?: boolean;
  }): Promise<RemoverResult> {
    return destroyModel(this, options);
  }

  /**
   * Get the class constructor from an instance.
   *
   * This helper method allows instance methods to access static properties
   * and methods of the model class in a type-safe way.
   *
   * @returns The model class constructor
   *
   * @example
   * ```typescript
   * const constructor = this.self();
   * const table = constructor.table;
   * await constructor.deleteOne({ id: 1 });
   * ```
   */
  public self<TModel extends Model = this>(): ChildModel<TModel> {
    return this.constructor as any as ChildModel<TModel>;
  }

  /**
   * Creates an immutable clone of the model with its current state.
   *
   * The cloned model:
   * - Contains a deep copy of all current data
   * - Has frozen (immutable) data that cannot be modified
   * - Preserves the `isNew` flag from the original
   * - Has no dirty changes (clean state)
   * - Cannot be saved or modified
   *
   * This is useful for:
   * - Creating snapshots of model state
   * - Passing read-only model data to other parts of the application
   * - Preventing accidental mutations
   * - Maintaining historical records
   *
   * @returns A new immutable model instance with the current state
   *
   * @example
   * ```typescript
   * const user = new User({ name: "Alice", email: "alice@example.com" });
   * await user.save();
   *
   * // Create an immutable snapshot
   * const snapshot = user.clone();
   *
   * // This will throw an error because the clone is immutable
   * snapshot.set("name", "Bob"); // TypeError: Cannot assign to read only property
   *
   * // Original can still be modified
   * user.set("name", "Bob");
   * await user.save();
   * ```
   */
  public clone(): this {
    return cloneModel(this);
  }

  /**
   * Recursively freezes an object and all its nested properties.
   *
   * @param obj - The object to freeze
   * @returns The frozen object
   */
  public deepFreeze<T>(obj: T): T {
    return deepFreezeObject(obj);
  }

  /**
   * Get table name
   */
  public getTableName(): string {
    return this.self().table;
  }

  /**
   * Get primary key name
   */
  public getPrimaryKey(): string {
    return this.self().primaryKey;
  }

  /**
   * Get model schema
   */
  public getSchema() {
    return this.self().schema;
  }

  /**
   * Check if schema has the given key
   */
  public schemaHas(key: string): boolean {
    return this.self().schema?.schema[key] !== undefined;
  }

  /**
   * Get strict mode
   */
  public getStrictMode(): StrictMode {
    return this.self().strictMode;
  }

  /**
   * Get data source (Connection)
   */
  public getConnection(): DataSource {
    return this.self().getDataSource();
  }

  /**
   * Delete all matching documents from the table.
   */
  public static async delete<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<number> {
    return deleteRecords(this, filter);
  }

  /**
   * Delete a single matching document from the table.
   */
  public static async deleteOne<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter?: Record<string, unknown>,
  ): Promise<number> {
    return deleteOneRecord(this, filter);
  }

  /**
   * Restore a single deleted record by its ID.
   *
   * Automatically detects whether the record was deleted via "trash" or "soft" strategy.
   * Handles ID conflicts based on options.
   *
   * @param id - The primary key value of the record to restore
   * @param options - Restorer options (onIdConflict, skipEvents)
   * @returns The restored model instance
   *
   * @throws {Error} If record not found in trash or soft-deleted records
   * @throws {Error} If ID conflict and onIdConflict is "fail"
   *
   * @example
   * ```typescript
   * // Restore with default options (assign new ID if conflict)
   * const user = await User.restore(123);
   *
   * // Restore and fail if ID conflict
   * const user = await User.restore(123, { onIdConflict: "fail" });
   *
   * // Silent restore (skip events)
   * const user = await User.restore(123, { skipEvents: true });
   * ```
   */
  public static async restore<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    id: string | number,
    options?: {
      onIdConflict?: "fail" | "assignNew";
      skipEvents?: boolean;
    },
  ): Promise<TModel> {
    return restoreRecord(this, id, options);
  }

  /**
   * Restore all deleted records for the model's table.
   *
   * Restores all records from the trash table (if using trash strategy)
   * or all soft-deleted records (if using soft strategy).
   *
   * @param options - Restorer options (onIdConflict, skipEvents)
   * @returns Array of restored model instances
   *
   * @example
   * ```typescript
   * // Restore all with default options
   * const users = await User.restoreAll();
   *
   * // Restore all and fail on any ID conflict
   * const users = await User.restoreAll({ onIdConflict: "fail" });
   * ```
   */
  public static async restoreAll<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    options?: {
      onIdConflict?: "fail" | "assignNew";
      skipEvents?: boolean;
    },
  ): Promise<TModel[]> {
    return restoreAllRecords(this, options);
  }

  /**
   * Create a new record in database and return the model instance.
   *
   * The data type is automatically inferred from the model's schema type.
   *
   * @param data - Partial data matching the model's schema type
   * @returns The created model instance
   *
   * @example
   * ```typescript
   * // TypeScript automatically infers UserSchema from User model
   * const user = await User.create({
   *   name: "Alice",
   *   email: "alice@example.com",
   *   age: 30
   * });
   * // Type: User (with UserSchema inferred)
   * ```
   */
  public static async create<
    TModel extends Model = Model,
    TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
  >(this: ChildModel<TModel>, data: Partial<TSchema>): Promise<TModel> {
    return createRecord(this, data);
  }

  /**
   * Create many documents and return an array of created models
   */
  public static async createMany<
    TModel extends Model = Model,
    TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
  >(this: ChildModel<TModel>, data: Partial<TSchema>[]): Promise<TModel[]> {
    return createManyRecords(this, data);
  }

  /**
   * Find a record or create it if not found.
   *
   * Does NOT update existing records - returns them as-is.
   * Useful when you want to ensure a record exists without modifying it.
   *
   * @param filter - Conditions to find by
   * @param data - Data to create if not found (merged with filter)
   * @returns Promise resolving to found or created model
   *
   * @example
   * ```typescript
   * // Ensure default admin exists (don't modify if exists)
   * const admin = await User.findOrCreate(
   *   { email: "admin@example.com" },
   *   { email: "admin@example.com", name: "Admin", role: "admin" }
   * );
   * // If admin exists, returns existing (password unchanged)
   * // If not found, creates new admin
   * ```
   */
  public static async findOrCreate<
    TModel extends Model = Model,
    TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
  >(this: ChildModel<TModel>, filter: Partial<TSchema>, data: Partial<TSchema>): Promise<TModel> {
    return findOrCreateRecord(this, filter, data);
  }

  /**
   * Upsert (insert or update) a record atomically.
   *
   * Uses the driver's native upsert operation for atomic insert-or-update.
   * More efficient than updateOrCreate as it's a single database operation.
   *
   * Includes full Model features:
   * - ID generation (if creating)
   * - createdAt timestamp (if creating)
   * - updatedAt timestamp (always)
   * - Validation & casting
   * - Lifecycle events
   *
   * @param filter - Conditions to find by (used for conflict detection)
   * @param data - Data to update or create (merged with filter)
   * @param options - Upsert options (conflictColumns for PostgreSQL, etc.)
   * @returns Promise resolving to upserted model
   *
   * @example
   * ```typescript
   * // PostgreSQL: upsert on unique email
   * const user = await User.upsert(
   *   { email: "user@example.com" },
   *   {
   *     email: "user@example.com",
   *     name: "John Updated",
   *     lastSyncedAt: new Date()
   *   },
   *   { conflictColumns: ["email"] }
   * );
   *
   * // MongoDB: upsert by filter
   * const user = await User.upsert(
   *   { externalId: "ext-123" },
   *   {
   *     externalId: "ext-123",
   *     name: "John Updated",
   *     email: "john.new@example.com"
   *   }
   * );
   * ```
   */
  public static async upsert<
    TModel extends Model = Model,
    TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
  >(
    this: ChildModel<TModel>,
    filter: Partial<TSchema>,
    data: Partial<TSchema>,
    options?: Record<string, unknown>,
  ): Promise<TModel> {
    return upsertRecord(this, filter, data, options);
  }

  /**
   * Update a record or create it if not found (upsert).
   *
   * @deprecated Use `upsert()` instead for better performance and atomicity.
   * This method is kept for backward compatibility but uses upsert internally.
   *
   * @param filter - Conditions to find by
   * @param data - Data to update or create (merged with filter)
   * @returns Promise resolving to updated or created model
   */
  public static async updateOrCreate<
    TModel extends Model = Model,
    TSchema extends ModelSchema = TModel extends Model<infer S> ? S : ModelSchema,
  >(
    this: ChildModel<TModel>,
    filter: Partial<TSchema>,
    data: Partial<TSchema>,
    options?: Record<string, unknown>,
  ): Promise<TModel> {
    // Use upsert internally for better performance
    return await (this as any).upsert(filter, data, options);
  }

  /**
   * Find one and delete a record that matches the filter and return the deleted record.
   *
   * @param filter - Filter conditions
   * @param options - Optional delete options
   * @returns The deleted model instance or null if not found
   *
   * @example
   * ```typescript
   * const deleted = await User.findOneAndDelete({ id: 1 });
   * if (deleted) {
   *   console.log('Deleted user:', deleted.get('name'));
   * }
   * ```
   */
  public static async findOneAndDelete<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    filter: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<TModel | null> {
    return findOneAndDeleteRecord(this, filter, options);
  }

  /**
   * Returns embedded data for sync operations.
   * Excludes internal MongoDB fields and ensures proper date serialization.
   *
   * @returns Embedded data object suitable for syncing
   *
   * @example
   * ```typescript
   * const user = await User.find(1);
   * const embedData = user.embedData;
   * // Returns: { id: 1, name: "Alice", email: "alice@example.com", ... }
   * // Excludes: _id
   * ```
   */
  public get embedData(): Record<string, unknown> {
    return this.self().embed ? this.only(this.self().embed as any) : this.data;
  }

  /**
   * Cleanup model events
   */
  public static $cleanup() {
    cleanupModelEvents(this);
  }

  /**
   * Accesses the event emitter dedicated to this model constructor.
   *
   * Each model subclass gets its own isolated event emitter, allowing you to
   * register lifecycle hooks that only apply to that specific model.
   *
   * @returns The ModelEvents instance for this model constructor
   *
   * @example
   * ```typescript
   * User.events().onSaving((user) => {
   *   console.log("User is being saved:", user);
   * });
   * ```
   */
  public static events<TModel extends Model = Model>(
    this: ChildModel<TModel>,
  ): ModelEvents<TModel> {
    return getModelEvents<TModel>(this);
  }

  /**
   * Registers an event listener for this model constructor.
   *
   * Convenience shorthand for `Model.events().on(...)`.
   *
   * @param event - The event name (e.g., "saving", "created")
   * @param listener - The callback to invoke when the event fires
   * @returns An unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = User.on("saving", (user) => {
   *   console.log("Saving user:", user);
   * });
   * ```
   */
  public static on<TModel extends Model = Model, TContext = unknown>(
    this: ChildModel<TModel>,
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return onStaticEvent<TModel, TContext>(this, event, listener);
  }

  /**
   * Registers a one-time event listener for this model constructor.
   *
   * The listener will automatically unsubscribe after its first invocation.
   * Convenience shorthand for `Model.events().once(...)`.
   *
   * @param event - The event name (e.g., "saving", "created")
   * @param listener - The callback to invoke when the event fires
   * @returns An unsubscribe function
   *
   * @example
   * ```typescript
   * User.once("created", (user) => {
   *   console.log("First user created:", user);
   * });
   * ```
   */
  public static once<TModel extends Model = Model, TContext = unknown>(
    this: ChildModel<TModel>,
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return onceStaticEvent<TModel, TContext>(this, event, listener);
  }

  /**
   * Removes an event listener from this model constructor.
   *
   * Convenience shorthand for `Model.events().off(...)`.
   *
   * @param event - The event name
   * @param listener - The callback to remove
   *
   * @example
   * ```typescript
   * const listener = (user) => console.log(user);
   * User.on("saving", listener);
   * User.off("saving", listener);
   * ```
   */
  public static off<TModel extends Model = Model, TContext = unknown>(
    this: ChildModel<TModel>,
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): void {
    offStaticEvent<TModel, TContext>(this, event, listener);
  }

  /**
   * Accesses the global event emitter shared by all model instances.
   *
   * Use this for cross-cutting concerns like auditing, logging, or injecting
   * common fields (e.g., `createdBy`, `updatedBy`) across all models.
   *
   * @returns The global ModelEvents instance
   *
   * @example
   * ```typescript
   * Model.globalEvents().onSaving((model) => {
   *   model.set("updatedAt", new Date());
   * });
   * ```
   */
  public static globalEvents(): ModelEvents<Model> {
    return getGlobalEvents();
  }

  /**
   * Replace the model's data entirely.
   *
   * Used internally by the writer after validation to update the model
   * with validated/casted data.
   *
   * **Warning:** This replaces all data and updates the dirty tracker.
   * Use with caution in application code.
   *
   * @param data - New data to replace current data
   *
   * @example
   * ```typescript
   * // Internal usage by writer
   * model.replaceData(validatedData);
   * ```
   */
  public replaceData(data: Record<string, unknown>): void {
    replaceModelData(this, data);
  }

  /**
   * Save the model to the database.
   *
   * Performs insert if `isNew === true`, otherwise performs update.
   * Automatically validates, casts, generates IDs, and emits lifecycle events.
   *
   * **Features:**
   * - Validation via @warlock.js/seal schema
   * - Data casting (string → number, etc.)
   * - ID generation (NoSQL only)
   * - Partial updates (only changed fields)
   * - Lifecycle events (validating, saving, created/updated, saved)
   *
   * @param data - Optional data to merge before saving
   * @param options - Save options
   * @returns The model instance for method chaining
   *
   * @throws {ValidationError} If validation fails
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * // Simple save
   * const user = new User({ name: "Alice" });
   * await user.save();
   *
   * // Merge data before saving
   * await user.save({ age: 31, email: "alice@example.com" });
   *
   * // Silent save (no events)
   * await user.save(null, { skipEvents: true });
   *
   * // Skip validation
   * await user.save(null, { skipValidation: true });
   *
   * // Method chaining
   * await user.set("name", "Bob").save();
   * ```
   */
  public async save(options?: WriterOptions & { merge?: Partial<TSchema> }): Promise<this> {
    return saveModel(this as any, options) as Promise<this>;
  }

  /**
   * Serialize the model data for storage in the database.
   *
   * Uses the driver's `serialize` to apply driver-specific type transformations
   * (e.g. Date → ISO string, BigInt → string for Postgres).
   *
   * **Not** the same as `toSnapshot` — this is a DB write concern, not a cache concern.
   */
  public serialize() {
    return serializeModel(this);
  }

  /**
   * Produce a plain-object snapshot of this model suitable for cache storage.
   *
   * - `data`: The model's own fields, serialized via the driver (handles Dates, BigInt, ObjectId).
   * - `relations`: Each entry in `loadedRelations` recursively snapshotted via `toSnapshot`.
   *   A relation that was loaded but resolved to `null` is stored as `null` (not omitted),
   *   so that `fromSnapshot` can distinguish "loaded + null" from "never loaded".
   *
   * Use `Model.fromSnapshot(snapshot)` to reconstruct.
   *
   * @example
   * ```typescript
   * await cache.set(key, chat.toSnapshot());
   * ```
   */
  public toSnapshot(): ModelSnapshot {
    return modelToSnapshot(this);
  }

  /**
   * Reconstruct a model instance (with relations) from a cache snapshot.
   *
   * Counterpart to `toSnapshot`. Applies driver deserialization (e.g. ISO string → Date)
   * and recursively hydrates any nested relation snapshots via `RelationHydrator`.
   *
   * @example
   * ```typescript
   * const snapshot = await cache.get(key);
   * const chat = Chat.fromSnapshot(snapshot);
   * chat.unit; // Unit model instance, fully hydrated
   * ```
   */
  public static fromSnapshot<TModel extends Model>(
    this: ChildModel<TModel>,
    snapshot: ModelSnapshot,
  ): TModel {
    return modelFromSnapshot(this, snapshot);
  }

  /**
   * Create a model instance from raw data (no relations).
   *
   * This is the data-only hydration path, used by the query builder when
   * converting a raw DB row into a model instance. Relations are NOT restored
   * here — use `fromSnapshot` when restoring from a cache snapshot that
   * includes relation data.
   *
   * @example
   * ```typescript
   * // Query builder internals:
   * const user = User.hydrate(rawRow);
   * ```
   */
  public static hydrate<TModel extends Model = Model>(
    this: ChildModel<TModel>,
    data: Record<string, unknown>,
  ): TModel {
    return hydrateModel(this, data);
  }

  /**
   * Convert the model into JSON
   */
  public toJSON() {
    return modelToJSON(this);
  }
}
