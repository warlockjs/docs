import type { QueryBuilderContract } from "../contracts";
import type { Model } from "./model";

/**
 * Timing control for global scopes
 */
export type ScopeTiming = "before" | "after";

/**
 * Global scope definition with callback and timing
 */
export type GlobalScopeDefinition = {
  callback: (query: QueryBuilderContract) => void;
  timing: ScopeTiming;
};

/**
 * Local scope callback function
 */
export type LocalScopeCallback = (query: QueryBuilderContract, ...args: any[]) => void;

/**
 * Options for adding global scopes
 */
export type GlobalScopeOptions = {
  timing?: ScopeTiming;
};

/**
 * Generic schema type representing the structure of model data.
 */
export type ModelSchema = Record<string, any>;

/**
 * Represents the static side of a model subclass.
 *
 * Used for `this`-typed static methods so TypeScript can infer the concrete
 * subclass and return the correct model type from static factory methods like
 * `find()`, `create()`, `query()`, etc.
 *
 * @example
 * ```ts
 * public static async find<TModel extends Model>(
 *   this: ChildModel<TModel>,
 *   id: number,
 * ): Promise<TModel | null>
 * ```
 */
export type ChildModel<TModel extends Model> = (new (...args: any[]) => TModel) &
  Pick<
    typeof Model,
    | "table"
    | "primaryKey"
    | "dataSource"
    | "schema"
    | "strictMode"
    | "autoGenerateId"
    | "initialId"
    | "randomInitialId"
    | "incrementIdBy"
    | "resource"
    | "resourceColumns"
    | "toJsonColumns"
    | "randomIncrement"
    | "getDataSource"
    | "getDriver"
    | "query"
    | "find"
    | "first"
    | "last"
    | "all"
    | "latest"
    | "count"
    | "where"
    | "increase"
    | "decrease"
    | "atomic"
    | "events"
    | "on"
    | "once"
    | "off"
    | "globalEvents"
    | "delete"
    | "deleteOne"
    | "deleteStrategy"
    | "trashTable"
    | "restore"
    | "restoreAll"
    | "deletedAtColumn"
    | "createdAtColumn"
    | "updatedAtColumn"
    | "create"
    | "createMany"
    | "sync"
    | "embed"
    | "syncMany"
    | "addGlobalScope"
    | "removeGlobalScope"
    | "addScope"
    | "removeScope"
    | "localScopes"
    | "globalScopes"
    | "relations"
    | "newQueryBuilder"
    | "builder"
    | "findAndUpdate"
    | "findOneAndUpdate"
    | "hydrate"
    | "fromSnapshot"
    | "findAndReplace"
    | "findOneAndDelete"
    | "findOrCreate"
  >;
