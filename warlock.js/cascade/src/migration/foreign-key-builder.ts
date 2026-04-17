import type { ForeignKeyDefinition } from "../contracts/migration-driver.contract";

/**
 * Reference to the Migration type to avoid circular imports.
 */
type MigrationLike = {
  addForeignKeyOperation(fk: ForeignKeyDefinition): void;
};

/**
 * Mutable foreign key definition being built.
 */
interface MutableForeignKeyDefinition {
  name?: string;
  column: string;
  referencesTable: string;
  referencesColumn: string;
  onDelete: ForeignKeyDefinition["onDelete"];
  onUpdate: ForeignKeyDefinition["onUpdate"];
}

/**
 * Fluent builder for foreign key constraints.
 *
 * Allows building foreign key definitions with a chainable API.
 * SQL-only feature; NoSQL drivers ignore foreign keys.
 *
 * The operation is pushed when `.references()` is called using a mutable
 * reference — subsequent `.onDelete()` / `.onUpdate()` calls mutate the
 * same definition already queued in pendingOperations.
 *
 * @example
 * ```typescript
 * this.foreign("user_id")
 *   .references("users", "id")
 *   .onDelete("cascade")
 *   .onUpdate("cascade");
 * ```
 */
export class ForeignKeyBuilder {
  /** Mutable foreign key definition being accumulated */
  private readonly definition: MutableForeignKeyDefinition;

  /**
   * Create a new foreign key builder.
   *
   * @param migration - Parent migration instance
   * @param column - Local column name that will reference another table
   */
  public constructor(
    private readonly migration: MigrationLike,
    column: string,
  ) {
    this.definition = {
      column,
      referencesTable: "",
      referencesColumn: "id",
      onDelete: "restrict",
      onUpdate: "restrict",
    };
  }

  /**
   * Set the constraint name.
   *
   * @param name - Constraint name (auto-generated if not provided)
   * @returns This builder for chaining
   */
  public name(name: string): this {
    this.definition.name = name;
    return this;
  }

  /**
   * Set the referenced table and column, and register the foreign key operation.
   *
   * Pushes the operation immediately using a mutable reference — any
   * `.onDelete()` / `.onUpdate()` calls after this will mutate the same
   * definition already queued in pendingOperations.
   *
   * @param table - Referenced table name
   * @param column - Referenced column name (default: "id")
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.foreign("user_id").references("users", "id");
   * this.foreign("category_id").references("categories"); // defaults to "id"
   * ```
   */
  public references(table: string, column = "id"): this {
    this.definition.referencesTable = table;
    this.definition.referencesColumn = column;
    this.migration.addForeignKeyOperation(this.definition as ForeignKeyDefinition);
    return this;
  }

  /**
   * Set the ON DELETE action.
   *
   * @param action - Action to take when referenced row is deleted
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.foreign("user_id")
   *   .references("users")
   *   .onDelete("cascade"); // Delete child when parent is deleted
   * ```
   */
  public onDelete(action: ForeignKeyDefinition["onDelete"]): this {
    this.definition.onDelete = action;
    return this;
  }

  /**
   * Set the ON UPDATE action.
   *
   * @param action - Action to take when referenced row's key is updated
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.foreign("user_id")
   *   .references("users")
   *   .onUpdate("cascade"); // Update child when parent key changes
   * ```
   */
  public onUpdate(action: ForeignKeyDefinition["onUpdate"]): this {
    this.definition.onUpdate = action;
    return this;
  }

  /**
   * Shorthand for `.onDelete("cascade").onUpdate("cascade")`.
   *
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.foreign("user_id").references("users").cascadeAll();
   * ```
   */
  public cascadeAll(): this {
    this.definition.onDelete = "cascade";
    this.definition.onUpdate = "cascade";
    return this;
  }

}
