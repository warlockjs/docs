import { colors } from "@mongez/copper";
import type { Db, IndexDescriptionInfo } from "mongodb";
import {
  DriverBlueprintContract,
  TableIndexInformation,
} from "../../contracts/driver-blueprint.contract";

export class MongoDBBlueprint implements DriverBlueprintContract {
  /**
   * Constructor
   */
  public constructor(protected database: Db) {}

  /**
   * List all tables in the database
   */
  public async listTables(): Promise<string[]> {
    const collections = await this.database.listCollections().toArray();
    return collections.map((collection) => collection.name);
  }

  /**
   * List all indexes for a specific table
   */
  public async listIndexes(table: string): Promise<TableIndexInformation[]> {
    const collection = this.database.collection(table);
    const indexes = await collection.indexes();
    return indexes.map(this.buildIndexInformation);
  }

  /**
   * Build index information
   */
  protected buildIndexInformation(index: IndexDescriptionInfo): TableIndexInformation {
    return {
      name: index.name!,
      type: index.type,
      columns: Object.keys(index.key),
      unique: !!index.unique,
      partial: !!index.partialFilterExpression,
      options: index,
    };
  }

  /**
   * List all columns for a specific table
   */
  public async listColumns(table: string): Promise<string[]> {
    console.log(
      colors.yellowBright(
        `MongoDBBlueprint: listColumns(${table}) MongoDB does not have static columns`,
      ),
    );

    return [];
  }

  /**
   * Check if the given table exists
   */
  public async tableExists(table: string): Promise<boolean> {
    const collections = await this.database.listCollections().toArray();
    return collections.some((collection) => collection.name === table);
  }
}
