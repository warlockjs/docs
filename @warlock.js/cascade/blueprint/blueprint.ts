import type { GenericObject } from "@mongez/reinforcements";
import type { CreateIndexesOptions } from "mongodb";
import { ObjectId } from "mongodb";
import type { Database } from "../database";
import { masterMind } from "../model/master-mind";

export class Blueprint {
  /**
   * Blueprint Schema
   */
  public schema: GenericObject = {};

  /**
   * List of all commands that will be executed
   */
  public commands: any[] = [];

  /**
   * Constructor
   */
  public constructor(
    public collectionName: string,
    public database: Database = database,
  ) {
    //
  }

  /**
   * Create index
   */
  public index(columns: string | string[], options: CreateIndexesOptions = {}) {
    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    if (!options.name) {
      options.name = this.getIndexName(columns);
    }

    const columnsList = columns.reduce(
      (list: GenericObject, column: string) => {
        list[column] = 1;
        return list;
      },
      {},
    );

    this.commands.push({
      command: "createIndex",
      columns: columnsList,
      options,
    });

    return this;
  }

  /**
   * Create unique index
   */
  public unique(column: string | string[], options: CreateIndexesOptions = {}) {
    options.unique = true;
    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "unique");
    }

    return this.index(column, options);
  }

  /**
   * Create text index
   */
  public textIndex(
    column: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "text");
    }

    const columnsList = column.reduce((list: GenericObject, column: string) => {
      list[column] = "text";
      return list;
    }, {});

    this.commands.push({
      command: "createIndex",
      columns: columnsList,
      options,
    });

    return this;
  }

  /**
   * Create geo index
   */
  public geoIndex(
    column: string | string[],
    options: CreateIndexesOptions = {},
  ) {
    if (!Array.isArray(column)) {
      column = [column];
    }

    if (!options.name) {
      options.name = this.getIndexName(column, "geo");
    }

    const columnsList = column.reduce((list: GenericObject, column: string) => {
      list[column] = "2dsphere";
      return list;
    }, {});

    this.commands.push({
      command: "createIndex",
      columns: columnsList,
      options,
    });

    return this;
  }

  /**
   * List indexes
   */
  public async listIndexes() {
    return await this.collection().listIndexes().toArray();
  }

  /**
   * Drop index
   */
  public dropIndex(...columns: string[]) {
    const name = this.getIndexName(columns);

    this.commands.push({
      command: "dropIndex",
      columns,
      name,
    });

    return this;
  }

  /**
   * Drop unique index
   */
  public dropUniqueIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "unique");

    this.commands.push({
      command: "dropIndex",
      columns,
      name,
    });

    return this;
  }

  /**
   * Drop text index
   */
  public dropTextIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "text");

    this.commands.push({
      command: "dropIndex",
      columns,
      name,
    });

    return this;
  }

  /**
   * Drop geo index
   */
  public dropGeoIndex(...columns: string[]) {
    const name = this.getIndexName(columns, "geo");

    this.commands.push({
      command: "dropIndex",
      columns,
      name,
    });

    return this;
  }

  /**
   * Drop all indexes
   */
  public async dropAllIndexes() {
    return await this.collection().dropIndexes();
  }

  /**
   * Check if index exists
   */
  public async indexExists(name: string) {
    return await this.collection().indexExists(name);
  }

  /**
   * Get index name
   */
  public getIndexName(columns: string[], type = "index") {
    return `${this.collectionName}_${columns.join("_")}_${type}`;
  }

  /**
   * Get index info
   */
  public async indexInformation() {
    return await this.collection().indexInformation();
  }

  /**
   * Get collection stats
   */
  public async stats(withLatencyStats = true) {
    // because stats method is deprecated
    // we need to use the aggregate method with $collStats pipeline
    const pipelineOptions: GenericObject = {
      storageStats: {},
    };

    if (withLatencyStats) {
      pipelineOptions["latencyStats"] = {
        histograms: ["queryExecutor", "getmore", "commands"],
        lastBucketSample: {},
      };
    }

    return (
      await this.collection()
        .aggregate([
          {
            $collStats: pipelineOptions,
          },
        ])
        .toArray()
    )[0];
  }

  /**
   * Get collection size in bytes
   */
  public async size() {
    const stats = await this.stats(false);
    return stats.storageSize;
  }

  /**
   * Get average document size in bytes
   */
  public async averageDocumentSize() {
    const stats = await this.stats(false);
    return stats.avgObjSize;
  }

  /**
   * @alias averageDocumentSize
   */
  public async avgDocSize() {
    return await this.averageDocumentSize();
  }

  /**
   * Get total indexes size in bytes
   */
  public async indexesSize() {
    const stats = await this.stats(false);
    return stats.totalIndexSize;
  }

  /**
   * Total size = collection size + indexes size
   */
  public async totalSize() {
    const stats = await this.stats(false);
    return stats.totalSize;
  }

  /**
   * Count documents
   */
  public async count() {
    return await this.collection().countDocuments();
  }

  /**
   * Delete all documents
   */
  public async truncate() {
    return await this.collection().deleteMany({});
  }

  /**
   * Drop collection
   */
  public async drop() {
    return await this.collection().drop();
  }

  /**
   * Get collection instance
   */
  public collection() {
    return this.database.collection(this.collectionName);
  }

  /**
   * Rename collection to the given name
   */
  public async rename(newName: string) {
    const output = await this.collection().rename(newName);

    // now update the collection name in mastermind
    await masterMind.renameCollection(this.collectionName, newName);

    return output;
  }

  /**
   * Get base schema
   */
  public get baseSchema() {
    return {
      _id: ObjectId,
      id: "int",
      createdAt: Date,
      updatedAt: Date,
    };
  }

  /**
   * Get default schema
   */
  public baseSchemaWith(schema: GenericObject) {
    return {
      ...this.baseSchema,
      ...schema,
    };
  }

  /**
   * Dump the entire collection
   */
  public async dump() {
    return await this.collection().find({}).toArray();
  }

  /**
   * Set last id in mastermind
   */
  public async setLastId(id: number) {
    return await masterMind.setLastId(this.collectionName, id);
  }

  /**
   * Execute all commands
   */
  public async executeCommands() {
    for (const command of this.commands) {
      const { command: commandName, ...options } = command;

      if (commandName === "createIndex") {
        await this.collection().createIndex(options.columns, options.options);
      } else if (commandName === "dropIndex") {
        await this.collection().dropIndex(options.name);
      }
    }
  }

  /**
   * @alias executeCommands
   */
  public async execute() {
    return await this.executeCommands();
  }

  /**
   * @alias executeCommands
   */
  public async run() {
    return await this.executeCommands();
  }

  /**
   * Clone the blueprint instance
   */
  public clone() {
    // the blueprint instance must be created from the constructor as it may be extended
    const blueprint: Blueprint = new (this as any).constructor(
      this.collectionName,
      this.database,
    );

    blueprint.schema = this.schema;
    blueprint.commands = this.commands;
    blueprint.database = this.database;
    blueprint.collectionName = this.collectionName;

    return blueprint;
  }
}

/**
 * Get a blueprint class for the given collection
 */
export function blueprint(collectionName: string) {
  return new Blueprint(collectionName);
}
