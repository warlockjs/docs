import { colors } from "@mongez/copper";
import type { GenericObject } from "@mongez/reinforcements";
import type { Pipeline } from "../aggregate";
import { $agg, Aggregate } from "../aggregate";
import type { Model } from "../model/model";
import { joinableProxy } from "../utils/joinable-proxy";
import type { Joinable, JoinableProxy } from "./joinable";
import type {
  ChunkCallback,
  Document,
  Filter,
  PaginationListing,
} from "./types";

type JoiningOptions = {
  where?: GenericObject;
  query?: (query: JoinableProxy) => any;
  as?: string;
  select?: string[];
  pipeline?: (GenericObject | Pipeline)[];
  joining?: (string | JoinableProxy | JoiningOptions)[];
};

export class ModelAggregate<T extends Model> extends Aggregate {
  /**
   * Joining list
   * Each key will have the model as a value reference to it
   */
  protected joiningList: GenericObject = {};

  /**
   * Constructor
   */
  public constructor(protected readonly model: typeof Model) {
    super(model.collection);
    this.query = model.query;
  }

  /**
   * {@inheritDoc}
   */
  public async get<Output = T>(
    mapData?: (record: any) => any,
  ): Promise<Output[]> {
    if (!mapData) {
      mapData = (record: any) => {
        const model = new this.model(record);

        for (const relation in this.joiningList) {
          const data = model.get(relation);

          if (!data) continue;

          model.set(relation, this.joiningList[relation](data));
        }

        return model;
      };
    }
    return (await super.get(mapData)) as Output[];
  }

  /**
   * Find or create
   */
  public async findOrCreate<Data extends Document = Document>(
    data: Data,
  ): Promise<T> {
    return (await this.first()) || ((await this.model.create(data)) as T);
  }

  /**
   * Find and update the given data
   * Please note that the filter should be done via where() methods
   * This method returns the updated records
   * If you need just to update the records directly in the database, then use `update` method directly.
   */
  public async findAndUpdate<Data extends Document = Document>(
    data: Data,
  ): Promise<T[]> {
    const records = await this.get();

    await Promise.all(records.map(async model => await model.save(data)));

    return records;
  }

  /**
   * {@inheritdoc}
   */
  public async chunk<Output = T>(
    limit: number,
    callback: ChunkCallback<Output>,
    mapData?: (data: any) => any,
  ) {
    return super.chunk(limit, callback, mapData);
  }

  /**
   * {@inheritDoc}
   */
  public async first(mapData?: (data: any) => any) {
    return (await super.first(mapData)) as T | undefined;
  }

  /**
   * {@inheritDoc}
   */
  public async last(filters?: Filter) {
    return (await super.last(filters)) as T | undefined;
  }

  /**
   * {@inheritDoc}
   */
  public async paginate<G = T>(
    page = 1,
    limit = this.model.perPage,
  ): Promise<PaginationListing<G>> {
    return await super.paginate<G>(page, limit);
  }

  /**
   * Delete records
   */
  public async delete() {
    const records = await this.get();

    records.forEach(async (model: any) => {
      await model.destroy();
    });

    return records.length;
  }

  /**
   * Include a related collection in the query results based on a defined relationship.
   *
   * @param relationName - The name of the relationship as defined in the static relations property
   * @param options - Optional. Override or extend the base relationship configuration
   * @returns The query builder for chaining
   *
   * @example
   * // Basic usage with defaults from relation definition
   * Post.aggregate().joining("author").get();
   *
   * // With overrides
   * Post.aggregate().joining("author", {
   *   select: ["id", "name", "avatar"],
   *   where: { isActive: true }
   * }).get();
   *
   * @example
   * // Using a function to override the query
   * Post.aggregate().joining("author", query => {
   *   query.where("id", 1);
   * }).get();
   *
   * @example
   * // Using multiple options
   * Post.aggregate().joining("author", {
   *   select: ["id", "name", "avatar"],
   *   where: { isActive: true },
   *   query: query => {
   *     query.where("id", 1);
   *   }
   * }).get();
   */
  public joining(
    joining: string | JoinableProxy,
    options?: JoiningOptions | ((query: JoinableProxy) => any),
  ) {
    joining = this.getJoinable(joining);

    if (typeof options === "function") {
      options(joining);
    } else {
      if (options?.where) {
        joining.where(options.where);
      }

      if (options?.query) {
        options.query(joining);
      }

      if (options?.select) {
        joining.select(...options.select);
      }

      if (options?.as) {
        joining.as(options.as);
      }

      if (options?.joining) {
        // Perform the joining
      }

      if (options?.pipeline) {
        joining.addPipelines(options.pipeline);
      }
    }

    const data = joining.parse();

    this.joiningList[data.as] = joining.getReturnAs();

    return this.lookup(data);
  }

  /**
   * Get joinable instance for current model
   */
  protected getJoinable(joinable: string | Joinable) {
    let joinableObject: Joinable;
    if (typeof joinable === "string") {
      joinableObject = this.model.relations[joinable] as Joinable;
      if (!joinableObject) {
        throw new Error(
          `Call to undefined joinable ${colors.redBright(joinable)} in ${this.model.name} model relations`,
        );
      }
    } else {
      joinableObject = joinable;
    }

    return joinableProxy(joinableObject.clone());
  }

  /**
   * Perform a join and count the records of the joined collection
   */
  public countJoining(
    joining: string | JoinableProxy,
    options?: {
      where?: GenericObject;
      select?: string[];
      pipeline: (GenericObject | Pipeline)[];
      as?: string;
    },
  ) {
    const joiningObject = this.getJoinable(joining);

    const as = joiningObject.get("as");

    const returnAs = options?.as || (as || "document") + "Count";

    return this.joining(joiningObject, options)
      .addField(returnAs, {
        $size: $agg.columnName(as),
      })
      .deselect([as]);
  }

  /**
   * Clone the aggregate model class
   */
  public clone() {
    const aggregate = new ModelAggregate(this.model);

    aggregate.pipelines = this.pipelines.slice();

    return aggregate as this;
  }
}
