import type { Infer, ObjectValidator } from "@warlock.js/seal";
import type { ModelSchema } from "../model/model";
import { Model } from "../model/model";
import { registerModelInRegistry } from "../model/register-model";
import type { DeleteStrategy, StrictMode } from "../types";

/**
 * Configuration options for defining a model.
 */
export type DefineModelOptions<TSchema extends ModelSchema> = {
  /**
   * The database table/collection name.
   */
  table: string;

  /**
   * Model name
   * If provided, it will be registered in the models registery
   */
  name?: string;

  /**
   * The validation schema for the model.
   * Use `v.object()` from @warlock.js/seal to define the schema.
   */
  schema: ObjectValidator;

  /**
   * Optional: Delete strategy for the model.
   * - "hard": Permanently delete records (default)
   * - "soft": Mark records as deleted but keep them in the database
   * - "disable": Mark records as disabled
   */
  deleteStrategy?: DeleteStrategy;

  /**
   * Optional: Strict mode for unknown fields.
   * - "strip": Remove unknown fields (default)
   * - "fail": Throw error on unknown fields
   */
  strictMode?: StrictMode;

  /**
   * Optional: Whether to automatically generate IDs.
   * Default: false (use MongoDB's _id)
   */
  autoGenerateId?: boolean;

  /**
   * Optional: Whether to use random increments for IDs.
   * Default: false
   */
  randomIncrement?: boolean;

  /**
   * Optional: Initial ID value when auto-generating.
   * Default: 1
   */
  initialId?: number;

  /**
   * Optional: Custom instance properties (getters/setters/methods).
   * Define computed properties, custom getters, or instance methods.
   *
   * The `this` context will be the Model instance, giving you access to
   * all Model methods like `get()`, `set()`, `save()`, etc.
   *
   * @example
   * ```typescript
   * properties: {
   *   get fullName(this: Model<UserSchema>) {
   *     return `${this.get("firstName")} ${this.get("lastName")}`;
   *   },
   *   get isActive(this: Model<UserSchema>) {
   *     return this.get("status") === "active";
   *   },
   *   async sendEmail(this: Model<UserSchema>, subject: string) {
   *     // this.get(), this.save(), etc. all work!
   *   },
   * }
   * ```
   */
  properties?: ThisType<Model<TSchema>> & Record<string, any>;

  /**
   * Optional: Custom static methods.
   * Define class-level methods like custom finders or utilities.
   *
   * @example
   * ```typescript
   * statics: {
   *   async findByEmail(email: string) {
   *     return this.first({ email });
   *   },
   *   async findActive() {
   *     return this.query().where("status", "active").get();
   *   },
   * }
   * ```
   */
  statics?: Record<string, any>;
};

/**
 * Define a model with a clean, concise API.
 *
 * This utility function creates a Model class with the specified configuration,
 * reducing boilerplate and providing a more declarative way to define models.
 *
 * @param options - Model configuration options
 * @returns A Model class with the specified configuration
 *
 * @example
 * ```typescript
 * import { defineModel } from "@warlock.js/cascade";
 * import { v } from "@warlock.js/seal";
 *
 * export const User = defineModel({
 *   table: "users",
 *   schema: v.object({
 *     name: v.string().required().trim(),
 *     email: v.string().email().required().lowercase(),
 *     password: v.string().required().min(6),
 *     role: v.string().default("user"),
 *   }),
 *   deleteStrategy: "soft",
 * });
 *
 * // Usage
 * const user = await User.create({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "secret123",
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With type inference
 * export const Post = defineModel({
 *   table: "posts",
 *   schema: v.object({
 *     title: v.string().required(),
 *     content: v.string().required(),
 *     authorId: v.number().required(),
 *     published: v.boolean().default(false),
 *   }),
 * });
 *
 * // TypeScript knows the exact type!
 * const post = await Post.create({
 *   title: "Hello World",
 *   content: "My first post",
 *   authorId: 1,
 * });
 *
 * console.log(post.title); // ✅ Type-safe!
 * ```
 */
export function defineModel<
  TSchema extends ModelSchema,
  TSchemaValidator extends ObjectValidator = ObjectValidator,
  TProperties extends Record<string, any> = {},
  TStatics extends Record<string, any> = {},
>(
  options: DefineModelOptions<TSchema> & {
    schema: TSchemaValidator;
    properties?: ThisType<Model<Infer<TSchemaValidator>>> & TProperties;
    statics?: ThisType<typeof Model<Infer<TSchemaValidator>>> & TStatics;
  },
) {
  type InferredSchema = Infer<TSchemaValidator>;

  class DefinedModel extends Model<InferredSchema> {
    /**
     * Table/collection name
     */
    public static table = options.table;

    /**
     * Validation schema
     */
    public static schema = options.schema;

    /**
     * Delete strategy
     */
    public static deleteStrategy: DeleteStrategy = options.deleteStrategy || "trash";

    /**
     * Strict mode
     */
    public static strictMode = options.strictMode || "strip";

    /**
     * Auto-generate ID
     */
    public static autoGenerateId = options.autoGenerateId || false;

    /**
     * Random increment
     */
    public static randomIncrement = options.randomIncrement || false;

    /**
     * Initial ID
     */
    public static initialId = options.initialId || 1;
  }

  // Apply custom instance properties (getters/setters/methods)
  if (options.properties) {
    Object.defineProperties(
      DefinedModel.prototype,
      Object.getOwnPropertyDescriptors(options.properties),
    );
  }

  if (options.name) {
    registerModelInRegistry(options.name, DefinedModel);
  }

  // Apply custom static methods
  if (options.statics) {
    Object.defineProperties(DefinedModel, Object.getOwnPropertyDescriptors(options.statics));
  }

  // Return with proper type inference
  type ReturnType = {
    new (initialData?: Partial<InferredSchema>): DefinedModel & TProperties;
  } & Omit<typeof DefinedModel, "new"> &
    TStatics;

  return DefinedModel as unknown as ReturnType;
}

/**
 * Type helper to infer the schema type from a defined model.
 *
 * @example
 * ```typescript
 * const User = defineModel({
 *   table: "users",
 *   schema: v.object({
 *     name: v.string(),
 *     email: v.string(),
 *   }),
 * });
 *
 * type UserType = ModelType<typeof User>;
 * // { name: string; email: string; }
 * ```
 */
export type ModelType<T extends ReturnType<typeof defineModel>> = T extends new (
  ...args: any[]
) => infer R
  ? R extends Model<infer S>
    ? S
    : never
  : never;
