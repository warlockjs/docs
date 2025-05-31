import { faker, type Faker } from "@faker-js/faker";
import { Random, clone } from "@mongez/reinforcements";
import { modelBlueprint } from "../blueprint/model-blueprint";
import { database, type Database } from "../database";
import { query } from "../query/query";
import { getDatabaseConfig } from "./../config";
import { masterMind } from "./master-mind";
import type { Model } from "./model";
import { ModelEvents } from "./model-events";
import type { FactoryCreatorCallback } from "./types";
import { ModelDeleteStrategy, type ChildModel, type Document } from "./types";

const modelEvents = new Map<string, ModelEvents>();

const getModelEvent = (collection: string) => {
  let eventsInstance = modelEvents.get(collection);

  if (!eventsInstance) {
    eventsInstance = new ModelEvents(collection);
    modelEvents.set(collection, eventsInstance);
  }

  return eventsInstance;
};

export abstract class BaseModel {
  /**
   * Collection Name
   */
  public static collection: string;

  /**
   * Connection instance
   */
  public static database: Database = database;

  /**
   * Model associated output
   */
  public static output?: any;

  /**
   * Define list of columns that should be serialized
   */
  protected static serializeOnly?: string[];

  /**
   * Define list of columns that should not be serialized
   */
  protected static serializeExcept?: string[];

  /**
   * Missing key symbol
   */
  public static MISSING_KEY = Symbol("MISSING_KEY");

  /**
   * Define the initial value of the id
   */
  public static initialId?: number;

  /**
   * Randomly generate first id
   * if initial id is defined, this option will be ignored
   * @default false
   */
  public static randomInitialId?: boolean | (() => number);

  /**
   * Define the amount to eb incremented by for the next generated id
   */
  public static incrementIdBy?: number;

  /**
   * Randomly generate increment id
   * @default false
   */
  public static randomIncrement?: boolean | (() => number);

  /**
   * Primary id column
   */
  public static get primaryIdColumn() {
    return "id";
  }

  /**
   * A flag to determine whether to auto generate id on insertion or not
   *
   * @default true
   */
  public static autoGenerateId = true;

  /**
   * Query instance
   */
  public static query = query;

  /**
   * Define the delete method
   *
   * @default true
   */
  public static deleteStrategy: ModelDeleteStrategy =
    ModelDeleteStrategy.moveToTrash;

  /**
   * Items per page
   */
  public static perPage = 15;

  /**
   * If set to true, then only the original data and the data in the casts property will be saved
   * If set to false, all data will be saved
   */
  public static isStrict = true;

  /**
   * Get increment id by
   */
  public static getIncrementIdBy(): number {
    if (this.incrementIdBy) return this.incrementIdBy;

    const modelConfigurations = getDatabaseConfig("model") || {};

    const autoIncrementBy = modelConfigurations?.autoIncrementBy;

    if (autoIncrementBy) return autoIncrementBy;

    if (this.randomIncrement) {
      return typeof this.randomIncrement === "function"
        ? this.randomIncrement()
        : Random.int(1, 999);
    }

    if (modelConfigurations.randomIncrement) {
      return typeof modelConfigurations.randomIncrement === "function"
        ? modelConfigurations.randomIncrement()
        : Random.int(1, 999);
    }

    return 1;
  }

  /**
   * Get initial id
   */
  public static getInitialId(): number {
    if (this.initialId) return this.initialId;

    const modelConfigurations = getDatabaseConfig("model") || {};

    const initialId = modelConfigurations.initialId;

    if (initialId) return initialId;

    if (this.randomInitialId) {
      return typeof this.randomInitialId === "function"
        ? this.randomInitialId()
        : Random.int(10000, 499999);
    }

    if (modelConfigurations.randomInitialId) {
      return typeof modelConfigurations.randomInitialId === "function"
        ? modelConfigurations.randomInitialId()
        : Random.int(10000, 499999);
    }

    return 1;
  }

  /**
   * Generate next id
   */
  public static async genNextId() {
    return await masterMind.generateNextId(
      this.collection,
      this.getIncrementIdBy(),
      this.getInitialId(),
    );
  }

  /**
   * Get last id of current model
   */
  public static async getLastId() {
    return await masterMind.getLastId(this.collection);
  }

  /**
   * Get an instance of child class
   */
  protected static self(data: Document) {
    return new (this as any)(data);
  }

  /**
   * Get collection name
   */
  public getCollection(): string {
    return this.getStaticProperty("collection");
  }

  /**
   * Get collection query
   */
  public getQuery() {
    return this.getStaticProperty("query");
  }

  /**
   * Get database instance
   */
  public getDatabase(): Database {
    return this.getStaticProperty("database");
  }

  /**
   * Get static property
   */
  public getStaticProperty(property: keyof typeof BaseModel) {
    return (this.constructor as any)[property];
  }

  /**
   * Prepare model for response
   */
  public async toJSON() {
    // get static output class
    const Output = this.getStaticProperty("output");

    if (Output.toJSON) {
      return await Output.toJSON((this as any).publicData);
    }

    // if the model has a Output class
    if (Output) {
      // then return the Output instance and call `toJSON` method
      return await new Output(clone((this as any as Model).data)).toJSON();
    }

    // check if there a `serialize` object in the model
    const serialize = this.getStaticProperty("serialize" as any);

    // if there is a serialize object
    if (serialize) {
      // then return the serialized data
      return await serialize(this);
    }

    // otherwise return the data object
    return (this as any).publicData;
  }

  protected static async serialize(model: Model) {
    const serializeOnly = this.serializeOnly;

    if (serializeOnly) {
      return model.only(serializeOnly);
    }

    const serializeExcept = this.serializeExcept;

    if (serializeExcept) {
      return model.except(serializeExcept);
    }

    return model.publicData;
  }

  /**
   * Get current output instance
   */
  public getOutput(data?: Document) {
    // get static output class
    const Output = this.getStaticProperty("output");

    return Output ? new Output(data) : data;
  }

  /**
   * Get model events instance
   */
  public static events<T extends Model>(this: ChildModel<T>) {
    return getModelEvent(this.collection ?? "__baseModel__");
  }

  /**
   * Get model events for current model
   */
  public getModelEvents() {
    return getModelEvent(this.getCollection()) as ModelEvents;
  }

  /**
   * Get base model events
   */
  public getBaseModelEvents() {
    return getModelEvent("__baseModel__");
  }

  /**
   * Get model blueprint
   */
  public static blueprint() {
    return modelBlueprint(this as any);
  }

  /**
   * Define what columns should be embedded when model document is embedded in another document.
   */
  public static embedOnly(...columns: string[]) {
    return {
      model: this,
      embeddedKey: columns,
    };
  }

  /**
   * Define the embedded getter key to be used when embedding the model
   */
  public static embed(key: string | string[]) {
    return {
      model: this,
      embeddedKey: key,
    };
  }

  /**
   * Embed only id
   */
  public static get embedOnlyId() {
    return {
      model: this,
      embeddedKey: "onlyId",
    };
  }

  /**
   * Document Factory
   */
  protected static documentFactory: FactoryCreatorCallback = (
    _faker: Faker,
    _index: number,
  ) => {
    throw new Error(
      "Document factory is not defined, pass a callback to `factory.create` method or define `documentFactory` method in the model class",
    );
  };

  /**
   * Get user factory
   */
  public static get factory() {
    return {
      /**
       * Create documents based on the given number of records
       */
      create: async (
        size: number,
        recordCallback: FactoryCreatorCallback = this.documentFactory,
      ) => {
        for (let i = 0; i < size; i++) {
          await (this as any).create(recordCallback(faker, i));
        }
      },
    };
  }
}
