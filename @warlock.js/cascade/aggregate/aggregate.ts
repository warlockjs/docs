import type { GenericObject } from "@mongez/reinforcements";
import { get } from "@mongez/reinforcements";
import { log } from "@warlock.js/logger";
import { ObjectId } from "mongodb";
import type {
  ChunkCallback,
  CursorPagination,
  CursorPaginationResults,
  Filter,
  PaginationListing,
} from "../model";
import { ModelEvents } from "../model/model-events";
import { query } from "../query";
import { DeselectPipeline } from "./DeselectPipeline";
import { GroupByPipeline } from "./GroupByPipeline";
import { LimitPipeline } from "./LimitPipeline";
import type { LookupPipelineOptions } from "./LookupPipeline";
import { LookupPipeline } from "./LookupPipeline";
import { OrWherePipeline } from "./OrWherePipeline";
import { SelectPipeline } from "./SelectPipeline";
import { SkipPipeline } from "./SkipPipeline";
import { SortByPipeline } from "./SortByPipeline";
import { SortPipeline } from "./SortPipeline";
import { SortRandomPipeline } from "./SortRandomPipeline";
import type { UnwindOptions } from "./UnwindPipeline";
import { UnwindPipeline } from "./UnwindPipeline";
import {
  WhereExpression,
  parseValuesInObject,
  toOperator,
} from "./WhereExpression";
import { WherePipeline } from "./WherePipeline";
import {
  $agg,
  count,
  dayOfMonth,
  last,
  month,
  week,
  year,
} from "./expressions";
import { applyFilters } from "./filters/apply-filters";
import type { FilterOptions, FilterStructure } from "./filters/types";
import { parsePipelines } from "./parsePipelines";
import type { Pipeline } from "./pipeline";
import type { WhereOperator } from "./types";

export class Aggregate {
  /**
   * Collection pipelines
   */
  public pipelines: (Pipeline | GenericObject)[] = [];

  /**
   * Aggregate events
   */
  public static _events = new ModelEvents();

  /**
   * Query manager
   */
  public query = query;

  /**
   * Constructor
   */
  public constructor(public readonly collection: string) {
    // get the events instance
    const events = Aggregate._events;

    Aggregate._events.trigger("fetching", this);

    events.collection = collection;
  }

  /**
   * Get the events instance
   */
  public static events() {
    return Aggregate._events;
  }

  /**
   * Sort by the given column
   */
  public sort(column: string, direction: "asc" | "desc" = "asc") {
    return this.pipeline(new SortPipeline(column, direction));
  }

  /**
   * @alias sort
   */
  public orderBy(column: string, direction: "asc" | "desc" = "asc") {
    return this.sort(column, direction);
  }

  /**
   * Order by descending
   */
  public sortByDesc(column: string) {
    return this.sort(column, "desc");
  }

  /**
   * Order by descending
   */
  public orderByDesc(column: string) {
    return this.sort(column, "desc");
  }

  /**
   * Sort by multiple columns
   */
  public sortBy(columns: Record<string, "desc" | "asc">) {
    return this.pipeline(new SortByPipeline(columns));
  }

  /**
   * Sort randomly
   */
  public random(limit?: number) {
    if (!limit) {
      // get limit pipeline
      const limitPipeline = this.pipelines.find(
        pipeline => pipeline.name === "limit",
      );

      if (limitPipeline) {
        limit = limitPipeline.getData();
      }

      if (!limit) {
        throw new Error(
          "You must provide a limit when using random() or use limit() pipeline",
        );
      }
    }

    // order by random in mongodb using $sample
    return this.pipeline(new SortRandomPipeline(limit));
  }

  /**
   * Order by latest created records
   */
  public latest(column = "createdAt") {
    return this.sort(column, "desc");
  }

  /**
   * Order by oldest created records
   */
  public oldest(column = "createdAt") {
    return this.sort(column, "asc");
  }

  /**
   * Group by aggregate
   */
  public groupBy(GroupByPipeline: GroupByPipeline): this;
  public groupBy(
    GroupByPipeline: GenericObject,
    groupByData?: GenericObject,
  ): this;
  public groupBy(groupByColumns: string[], groupByData?: GenericObject): this;
  public groupBy(groupBy_id: string | null): this;
  public groupBy(groupBy_id: string | null, groupByData: GenericObject): this;
  public groupBy(...args: any[]) {
    const [groupBy_id, groupByData] = args;

    if (groupBy_id instanceof GroupByPipeline) {
      return this.pipeline(groupBy_id);
    }

    return this.pipeline(new GroupByPipeline(groupBy_id, groupByData));
  }

  /**
   * Group by year
   */
  public groupByYear(column: string, groupByData?: GenericObject) {
    return this.groupBy(
      {
        year: year($agg.columnName(column)),
      },
      groupByData,
    );
  }

  /**
   * Group by month and year
   */
  public groupByMonthAndYear(column: string, groupByData?: GenericObject) {
    column = $agg.columnName(column);
    return this.groupBy(
      {
        year: year(column),
        month: month(column),
      },
      groupByData,
    );
  }

  /**
   * Group by month only
   */
  public groupByMonth(column: string, groupByData?: GenericObject) {
    column = $agg.columnName(column);
    return this.groupBy(
      {
        month: month(column),
      },
      groupByData,
    );
  }

  /**
   * Group by day, month and year
   */
  public groupByDate(column: string, groupByData?: GenericObject) {
    column = $agg.columnName(column);
    return this.groupBy(
      {
        year: year(column),
        month: month(column),
        day: dayOfMonth(column),
      },
      groupByData,
    );
  }

  /**
   * Group by week and year
   */
  public groupByWeek(column: string, groupByData?: GenericObject) {
    column = $agg.columnName(column);
    return this.groupBy(
      {
        year: year(column),
        week: week(column),
      },
      groupByData,
    );
  }

  /**
   * Group by day only
   */
  public groupByDayOfMonth(column: string, groupByData?: GenericObject) {
    column = $agg.columnName(column);
    return this.groupBy(
      {
        day: dayOfMonth(column),
      },
      groupByData,
    );
  }

  /**
   * Pluck only the given column
   */
  public async pluck(column: string) {
    return await this.select([column]).get(record => get(record, column));
  }

  /**
   * Get average of the given column
   */
  public async avg(column: string) {
    const document = await this.groupBy(null, {
      avg: $agg.avg(column),
    }).first(document => document);

    return document?.avg || 0;
  }

  /**
   * {@alias} avg
   */
  public average(column: string) {
    return this.avg(column);
  }

  /**
   * Sum values of the given column
   */
  public async sum(column: string) {
    const document = await this.groupBy(null, {
      sum: $agg.sum(column),
    }).first(document => document);

    return document?.sum || 0;
  }

  /**
   * Get minimum value of the given column
   */
  public async min(column: string) {
    const document = await this.groupBy(null, {
      min: $agg.min(column),
    }).first(document => document);

    return document?.min || 0;
  }

  /**
   * Get maximum value of the given column
   */
  public async max(column: string) {
    const document = await this.groupBy(null, {
      max: $agg.max(column),
    }).first(document => document);

    return document?.max || 0;
  }

  /**
   * Get distinct value for the given column using aggregation
   */
  public async distinct<T = any>(column: string) {
    return (await this.groupBy(null, {
      // use addToSet to get unique values
      [column]: $agg.addToSet(column),
    })
      .select([column])
      .get(data => data[column])) as T[];
  }

  /**
   * {@alias} distinct
   */
  public unique<T = any>(column: string) {
    return this.distinct<T>(column);
  }

  /**
   * Get distinct values that are not empty
   */
  public async distinctHeavy<T = any>(column: string) {
    return await this.whereNotNull(column).distinct<T>(column);
  }

  /**
   * {@alias} distinctHeavy
   */
  public async uniqueHeavy<T = any>(column: string) {
    return await this.distinctHeavy<T>(column);
  }

  /**
   * Get values list of the given column
   */
  public async values<T = any>(column: string) {
    return (await this.groupBy(null, {
      values: $agg.push(column),
    })
      .select(["values"])
      .get(data => data.values)) as T;
  }

  /**
   * Limit the number of results
   */
  public limit(limit: number) {
    return this.pipeline(new LimitPipeline(limit));
  }

  /**
   * Skip the given number of results
   */
  public skip(skip: number) {
    return this.pipeline(new SkipPipeline(skip));
  }

  /**
   * Select the given columns
   */
  public select(...columns: string[]): this;
  public select(columns: string[] | Record<string, 0 | 1 | boolean>): this;
  public select(...columns: any[]) {
    if (columns.length === 1 && Array.isArray(columns[0])) {
      columns = columns[0];
    }

    return this.pipeline(new SelectPipeline(columns));
  }

  /**
   * Deselect the given columns
   */
  public deselect(columns: string[]) {
    return this.pipeline(new DeselectPipeline(columns));
  }

  /**
   * Unwind/Extract the given column
   */
  public unwind(column: string, options?: UnwindOptions) {
    return this.pipeline(new UnwindPipeline(column, options));
  }

  /**
   * Add where stage
   */
  public where(column: string, value: any): this;
  public where(column: string, operator: WhereOperator, value: any): this;
  public where(column: GenericObject): this;
  public where(...args: any[]) {
    return this.pipeline(
      new WherePipeline(WhereExpression.parse.apply(null, args as any)),
    );
  }

  /**
   * Add comparison between two or more columns
   */
  public whereColumns(
    column1: string,
    operator: WhereOperator,
    ...otherColumns: string[]
  ) {
    const mongoOperator = toOperator(operator) || operator;
    return this.where(
      $agg.expr({
        [mongoOperator]: [
          $agg.columnName(column1),
          ...otherColumns.map(column => $agg.columnName(column)),
        ],
      }),
    );
  }

  /**
   * Or Where stage
   */
  public orWhere(...operations: GenericObject[]): this;
  public orWhere(...operations: [column: string, value: any][]): this;
  public orWhere(column: GenericObject) {
    return this.pipeline(new OrWherePipeline(column));
  }

  /**
   * Perform a text search
   * Please note that this method will add the `match` stage to the beginning of the pipeline
   * Also it will add `score` field to the result automatically
   *
   * @warning This method will not work if the collection is not indexed for text search
   */
  public textSearch(query: string, moreFilters?: GenericObject) {
    this.pipelines.unshift({
      $match: {
        $text: { $search: query },
        ...moreFilters,
      },
    });

    this.addField("score", { $meta: "textScore" });

    return this;
  }

  /**
   * Where null
   */
  public whereNull(column: string) {
    return this.where(column, null);
  }

  /**
   * Check if the given column array has the given value or it is empty
   * Empty means either the array column does not exists or exists but empty
   *
   * @usecase for when to use this method is when you have lessons collection and you want to get all lessons that either does not have column `allowedStudents`
   * or has an empty array of `allowedStudents` or the `allowedStudents` column has the given student id
   *
   * Passing third argument empty means we will check directly in the given array (not array of objects in this case)
   */
  public whereArrayHasOrEmpty(column: string, value: any, key = "id") {
    const keyName = key ? `.${key}` : "";

    return this.orWhere([
      {
        [`${column}${keyName}`]: value,
      },
      {
        [column]: { $size: 0 },
      },
      {
        [column]: { $exists: false },
      },
    ]);
  }

  /**
   * Check if the given column array does not have the given value or it is empty.
   * Empty means either the array column does not exist or exists but is empty.
   *
   * @usecase This method is useful when you have a collection, such as `lessons`, and you want to retrieve all lessons that either column `excludedStudents` does not contain the specified student id,
   * have an empty array for `excludedStudents`, or the `excludedStudents` does not exist.
   */
  public whereArrayNotHaveOrEmpty(column: string, value: any, key = "id") {
    const keyName = key ? `.${key}` : "";
    return this.orWhere([
      {
        [`${column}${keyName}`]: { $ne: value },
      },
      {
        [column]: { $size: 0 },
      },
      {
        [column]: { $exists: false },
      },
    ]);
  }

  /**
   * Where not null
   */
  public whereNotNull(column: string) {
    return this.where(column, "!=", null);
  }

  /**
   * Where like operator
   */
  public whereLike(column: string, value: string) {
    return this.where(column, "like", value);
  }

  /**
   * Where not like operator
   */
  public whereNotLike(column: string, value: string) {
    return this.where(column, "notLike", value);
  }

  /**
   * Where column starts with the given value
   */
  public whereStartsWith(column: string, value: string | number) {
    return this.where(column, "startsWith", value);
  }

  /**
   * Where column not starts with the given value
   */
  public whereNotStartsWith(column: string, value: string | number) {
    return this.where(column, "notStartsWith", value);
  }

  /**
   * Where column ends with the given value
   */
  public whereEndsWith(column: string, value: string | number) {
    return this.where(column, "endsWith", value);
  }

  /**
   * Where column not ends with the given value
   */
  public whereNotEndsWith(column: string, value: string | number) {
    return this.where(column, "notEndsWith", value);
  }

  /**
   * Where between operator
   */
  public whereBetween(column: string, value: [any, any]) {
    return this.where(column, "between", value);
  }

  /**
   * Where date between operator
   */
  public whereDateBetween(column: string, value: [Date, Date]) {
    return this.where(column, "between", value);
  }

  /**
   * Where date not between operator
   */
  public whereDateNotBetween(column: string, value: [Date, Date]) {
    return this.where(column, "notBetween", value);
  }

  /**
   * Where not between operator
   */
  public whereNotBetween(column: string, value: [any, any]) {
    return this.where(column, "notBetween", value);
  }

  /**
   * Where exists operator
   */
  public whereExists(column: string) {
    return this.where(column, "exists", true);
  }

  /**
   * Where not exists operator
   */
  public whereNotExists(column: string) {
    return this.where(column, "exists", false);
  }

  /**
   * Where size operator
   */
  public whereSize(column: string, size: number): this;
  public whereSize(
    column: string,
    operator: ">" | ">=" | "=" | "<" | "<=",
    size: number,
  ): this;
  public whereSize(...args: any[]) {
    // first we need to project the column to get the size
    const [column, operator, columnSize] = args;
    this.project({
      [column + "_size"]: {
        $size: $agg.columnName(column),
      },
    });

    // then we can use the size operator
    this.where(column + "_size", operator, columnSize);

    // now we need to deselect the column size
    // this.project({
    //   [column + "_size"]: 0,
    // });

    return this;
  }

  /**
   * Add project pipeline
   *
   */
  public project(data: Record<string, any>) {
    return this.addPipeline({
      $project: data,
    });
  }

  /**
   * Where in operator
   * If value is a string, it will be treated as a column name
   */
  public whereIn(column: string, values: string | any[]) {
    return this.where(column, "in", values);
  }

  /**
   * Where not in operator
   * If value is a string, it will be treated as a column name
   */
  public whereNotIn(column: string, values: string | any[]) {
    return this.where(column, "notIn", values);
  }

  /**
   * // TODO: Make a proper implementation
   * Where location near
   */
  public whereNear(column: string, value: [number, number], _distance: number) {
    return this.where(column, "near", value);
  }

  /**
   * // TODO: Make a proper implementation
   * Get nearby location between the given min and max distance
   */
  public async whereNearByIn(
    column: string,
    value: [number, number],
    _minDistance: number,
    _maxDistance: number,
  ) {
    return this.where(column, value);
  }

  /**
   * Lookup the given collection
   */
  public lookup(options: LookupPipelineOptions) {
    this.pipeline(new LookupPipeline(options));

    if (options.single && options.as) {
      const as = options.as;
      this.addField(as, last(as));
    }

    return this;
  }

  /**
   * Add field to the pipeline
   */
  public addField(field: string, value: any) {
    return this.addPipeline({
      $addFields: {
        [field]: value,
      },
    });
  }

  /**
   * Add fields to the pipeline
   */
  public addFields(fields: GenericObject) {
    return this.addPipeline({
      $addFields: fields,
    });
  }

  /**
   * Get new pipeline instance
   */
  public pipeline(...pipelines: Pipeline[]) {
    this.pipelines.push(...pipelines);

    return this;
  }

  /**
   * Unshift pipeline to the beginning of the pipelines
   */
  public unshiftPipelines(pipelines: Pipeline[]) {
    this.pipelines.unshift(...pipelines);

    return this;
  }

  /**
   * Add mongodb plain stage
   */
  public addPipeline(pipeline: any) {
    this.pipelines.push(pipeline);

    return this;
  }

  /**
   * Add mongodb plain stages
   */
  public addPipelines(pipelines: any[]) {
    this.pipelines.push(...pipelines);

    return this;
  }

  /**
   * Get pipelines
   */
  public getPipelines() {
    return this.pipelines;
  }

  /**
   * Determine if record exists
   */
  public async exists() {
    return (await this.limit(1).count()) > 0;
  }

  /**
   * {@inheritdoc}
   */
  public toJSON() {
    return this.parse();
  }

  /**
   * Get only first result
   */
  public async first(mapData?: (data: any) => any): Promise<any> {
    const results = await this.limit(1).get(mapData);

    return results[0];
  }

  /**
   * Get last result
   */
  public async last(filters?: Filter): Promise<any> {
    if (filters) {
      this.where(filters);
    }

    const results = await this.orderByDesc("id").limit(1).get();

    return results[0];
  }

  /**
   * Delete records
   */
  public async delete() {
    const ids = await (
      await this.select(["_id"]).pluck("_id")
    ).map(_id => new ObjectId(_id));
    Aggregate._events.trigger("deleting", this);

    return await query.delete(this.collection, {
      _id: ids,
    });
  }

  /**
   * Get the data
   */
  public async get(mapData?: (data: any) => any): Promise<any[]> {
    const records = await this.execute();

    return mapData ? records.map(mapData) : records;
  }

  /**
   * Chunk documents based on the given limit
   */
  public async chunk<T = any>(
    limit: number,
    callback: ChunkCallback<T>,
    mapData?: (data: any) => any,
  ) {
    const totalDocuments = await this.clone().count();

    const totalPages = Math.ceil(totalDocuments / limit);

    for (let page = 1; page <= totalPages; page++) {
      const results = await this.clone().paginate(page, limit, mapData);

      const { documents, paginationInfo } = results;

      const output = await callback(documents, paginationInfo);

      if (output === false) break;
    }
  }

  /**
   * Paginate records based on the given filter
   */
  public async paginate<T = any>(
    page = 1,
    limit = 15,
    mapData?: (data: any) => T,
  ): Promise<PaginationListing<T>> {
    const totalDocumentsQuery = this.parse();

    this.skip((page - 1) * limit).limit(limit);

    const records = await this.get(mapData);

    this.pipelines = totalDocumentsQuery;

    const totalDocuments = await this.count();

    const result: PaginationListing<T> = {
      documents: records,
      paginationInfo: {
        limit,
        page,
        result: records.length,
        total: totalDocuments,
        pages: Math.ceil(totalDocuments / limit),
      },
    };

    return result;
  }

  /**
   * Use cursor pagination-based for better performance
   */
  public async cursorPaginate<T = any>(
    options: CursorPagination,
    mapData?: (data: any) => T,
  ): Promise<CursorPaginationResults<T>> {
    if (options.cursorId) {
      this.where(
        options.column ?? "id",
        options.direction === "next" ? ">" : "<",
        options.cursorId,
      );
    }

    // now set the limit
    // we need to increase the limit by 1 to check if we have more records
    this.limit(options.limit + 1);

    const records = await this.execute();

    // now let's check if we have more records

    const hasMore = records.length > options.limit;
    let nextCursorId = null;

    if (hasMore) {
      // Remove the extra fetched record depending on the pagination direction
      const record =
        options.direction === "next"
          ? records.pop() // Forward: pop the last record
          : records.shift(); // Backward: shift the first record

      // Get the next cursor id from the popped or shifted record
      nextCursorId = get(record, options.column ?? "id");
    }

    return {
      documents: mapData ? records.map(mapData) : (records as T[]),
      hasMore,
      nextCursorId,
    };
  }

  /**
   * Explain the query
   */
  public async explain() {
    return (
      await this.query.aggregate(this.collection, this.parse(), {
        explain: true,
      })
    ).explain();
  }

  /**
   * Update the given data
   */
  public async update(data: any) {
    try {
      const query: any[] = [];

      const filters = {};

      this.parse().forEach(pipeline => {
        if (pipeline.$match) {
          Object.assign(filters, pipeline.$match);
        } else {
          query.push(pipeline);
        }
      });

      Aggregate._events.trigger("updating", this);

      const results = await this.query.updateMany(this.collection, filters, [
        ...query,
        {
          $set: parseValuesInObject(data),
        },
      ]);

      return results.modifiedCount;
    } catch (error: any) {
      log.error("database", "aggregate.update", error);
      throw error;
    }
  }

  /**
   * Increment the given column
   */
  public async increment(
    column: string | string[] | Record<string, number>,
    value: number = 1,
  ) {
    try {
      const query: any[] = [];
      const filters = {};

      this.parse().forEach(pipeline => {
        if (pipeline.$match) {
          Object.assign(filters, pipeline.$match);
        } else {
          query.push(pipeline);
        }
      });

      Aggregate._events.trigger("updating", this);

      let incrementData: Record<string, number>;

      if (typeof column === "string") {
        incrementData = { [column]: value };
      } else if (Array.isArray(column)) {
        incrementData = column.reduce(
          (acc, col) => {
            acc[col] = value;
            return acc;
          },
          {} as Record<string, number>,
        );
      } else {
        incrementData = column;
      }

      const results = await this.query.updateMany(this.collection, filters, [
        ...query,
        {
          $inc: incrementData,
        },
      ]);

      return results.modifiedCount;
    } catch (error: any) {
      log.error("database", "aggregate.increment", error);
      throw error;
    }
  }

  /**
   * Decrement the given column(s)
   */
  public async decrement(column: string, value = 1) {
    return this.increment(column, -value);
  }

  /**
   * Multiply the given column(s)
   */
  public async multiply(
    column: string | string[] | Record<string, number>,
    value: number,
  ) {
    try {
      const query: any[] = [];
      const filters = {};

      this.parse().forEach(pipeline => {
        if (pipeline.$match) {
          Object.assign(filters, pipeline.$match);
        } else {
          query.push(pipeline);
        }
      });

      Aggregate._events.trigger("updating", this);

      let multiplyData: Record<string, number>;

      if (typeof column === "string") {
        multiplyData = { [column]: value };
      } else if (Array.isArray(column)) {
        multiplyData = column.reduce(
          (acc, col) => {
            acc[col] = value;
            return acc;
          },
          {} as Record<string, number>,
        );
      } else {
        multiplyData = column;
      }

      const results = await this.query.updateMany(this.collection, filters, [
        ...query,
        {
          $mul: multiplyData,
        },
      ]);

      return results.modifiedCount;
    } catch (error: any) {
      log.error("database", "aggregate.multiply", error);
      throw error;
    }
  }

  /**
   * Divide the given column(s)
   */
  public async divide(
    column: string | string[] | Record<string, number>,
    value: number,
  ) {
    if (value === 0) {
      throw new Error("Division by zero is not allowed.");
    }

    try {
      const query: any[] = [];
      const filters = {};

      this.parse().forEach(pipeline => {
        if (pipeline.$match) {
          Object.assign(filters, pipeline.$match);
        } else {
          query.push(pipeline);
        }
      });

      Aggregate._events.trigger("updating", this);

      let divideData: Record<string, number>;

      if (typeof column === "string") {
        divideData = { [column]: 1 / value };
      } else if (Array.isArray(column)) {
        divideData = column.reduce(
          (acc, col) => {
            acc[col] = 1 / value;
            return acc;
          },
          {} as Record<string, number>,
        );
      } else {
        divideData = Object.fromEntries(
          Object.entries(column).map(([key, val]) => [key, 1 / val]),
        );
      }

      const results = await this.query.updateMany(this.collection, filters, [
        ...query,
        {
          $mul: divideData,
        },
      ]);

      return results.modifiedCount;
    } catch (error: any) {
      log.error("database", "aggregate.divide", error);
      throw error;
    }
  }

  /**
   * Unset the given columns
   */
  public async unset(...columns: string[]) {
    try {
      const query: any[] = [];

      const filters = {};

      this.parse().forEach(pipeline => {
        if (pipeline.$match) {
          Object.assign(filters, pipeline.$match);
        } else {
          query.push(pipeline);
        }
      });

      Aggregate._events.trigger("updating", this);

      const results = await this.query.updateMany(this.collection, filters, [
        ...query,
        {
          $unset: columns,
        },
      ]);

      return results.modifiedCount;
    } catch (error) {
      log.error("database", "aggregate.unset", error);
      console.log(error);
      throw error;
    }
  }

  /**
   * Execute the query
   */
  public async execute() {
    const results = (
      await this.query.aggregate(this.collection, this.parse())
    ).toArray();

    return results;
  }

  /**
   * Count the results
   */
  public async count(): Promise<number> {
    this.groupBy(null, {
      total: count(),
    });

    const results = await this.execute();

    return get(results, "0.total", 0);
  }

  /**
   * Parse pipelines
   */
  public parse() {
    return parsePipelines(this.pipelines);
  }

  /**
   * Reset the pipeline
   */
  public reset() {
    this.pipelines = [];

    return this;
  }

  /**
   * Clone the aggregate class
   */
  public clone() {
    const aggregate = new (this.constructor as any)(this.collection);

    aggregate.pipelines = this.pipelines.slice();

    return aggregate as this;
  }

  /**
   * Apply filters to the query
   */
  public applyFilters(
    filters: FilterStructure,
    data: Record<string, any> = {},
    options: FilterOptions = {},
  ): this {
    applyFilters({
      query: this as any,
      filters,
      data,
      options,
    });
    return this;
  }
}
