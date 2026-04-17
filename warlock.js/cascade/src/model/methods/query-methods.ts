import type {
  PaginationOptions,
  PaginationResult,
  QueryBuilderContract,
  UpdateOperations,
} from "../../contracts";
import type { DataSource } from "../../data-source/data-source";
import { dataSourceRegistry } from "../../data-source/data-source-registry";
import { RelationLoader } from "../../relations/relation-loader";
import type { ChildModel, GlobalScopeDefinition, Model } from "../model";

export function buildQuery<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  BaseModel: typeof Model,
): QueryBuilderContract<TModel> {
  const queryBuilder = ModelClass.newQueryBuilder<TModel>();
  const qb = queryBuilder;

  // Collect global scopes from base Model and child model
  const allGlobalScopes = new Map<string, GlobalScopeDefinition>([
    ...BaseModel.globalScopes,
    ...ModelClass.globalScopes,
  ]);

  queryBuilder.pendingGlobalScopes = allGlobalScopes;
  queryBuilder.availableLocalScopes = ModelClass.localScopes;
  queryBuilder.disabledGlobalScopes = new Set();
  queryBuilder.relationDefinitions = ModelClass.relations;
  queryBuilder.modelClass = ModelClass;

  ModelClass.events().emitFetching(queryBuilder, {
    table: ModelClass.table,
    modelClass: ModelClass,
  });

  queryBuilder.hydrate((data: any) => {
    return ModelClass.hydrate(data);
  });

  queryBuilder.onFetched(async (models: any[]) => {
    const eagerRelations = qb.eagerLoadRelations;
    if (eagerRelations && eagerRelations.size > 0 && models.length > 0) {
      const constraints: Record<string, (query: QueryBuilderContract) => void> = {};
      for (const [name, constraint] of eagerRelations) {
        if (typeof constraint === "function") {
          constraints[name] = constraint;
        }
      }

      const loader = new RelationLoader(models, ModelClass as any);
      await loader.load([...eagerRelations.keys()], constraints);
    }
    await ModelClass.events().emit("fetched", models as any, {});
  });

  return queryBuilder;
}

export function buildNewQueryBuilder<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
): QueryBuilderContract<TModel> {
  const dataSource = ModelClass.getDataSource();

  if (ModelClass.builder) {
    const BuilderClass = ModelClass.builder;
    return new BuilderClass(ModelClass.table, dataSource) as QueryBuilderContract<TModel>;
  }

  const queryBuilder = dataSource.driver.queryBuilder<TModel>(ModelClass.table);
  return queryBuilder;
}

export async function findFirst<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter?: Record<string, unknown>,
): Promise<TModel | null> {
  const query = ModelClass.query();
  if (filter) {
    query.where(filter);
  }
  return query.first();
}

export async function findLast<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter?: Record<string, unknown>,
): Promise<TModel | null> {
  const query = ModelClass.query();
  if (filter) {
    query.where(filter);
  }

  return query.last();
}

export async function findAll<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter?: Record<string, unknown>,
): Promise<TModel[]> {
  const query = ModelClass.query();
  if (filter) {
    query.where(filter);
  }
  return query.get();
}

export function countRecords<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter?: Record<string, unknown>,
): Promise<number> {
  const query = ModelClass.query();
  if (filter) {
    query.where(filter);
  }
  return query.count();
}

export async function findById<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  id: string | number,
): Promise<TModel | null> {
  const query = ModelClass.query();
  return query.where(ModelClass.primaryKey, id).first();
}

export async function paginateRecords<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  options: PaginationOptions & { filter?: Record<string, unknown> } = {},
): Promise<PaginationResult<TModel>> {
  const query = ModelClass.query();
  if (options.filter) {
    query.where(options.filter);
  }

  return query.paginate({
    limit: options.limit,
    page: options.page,
  });
}

export async function findLatest<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter?: Record<string, unknown>,
): Promise<TModel[]> {
  const query = ModelClass.query();
  if (filter) {
    query.where(filter);
  }
  return (await query.latest()) as unknown as TModel[];
}

export function increaseField<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  field: string,
  amount: number,
): Promise<number> {
  const query = ModelClass.query().where(filter);
  return query.increment(field, amount);
}

export function decreaseField<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  field: string,
  amount: number,
): Promise<number> {
  const query = ModelClass.query().where(filter);
  return query.decrement(field, amount);
}

export async function performAtomic<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  operations: UpdateOperations,
): Promise<number> {
  const result = await ModelClass.getDriver().atomic(ModelClass.table, filter, operations);
  return result.modifiedCount;
}

export async function updateById<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  id: string | number,
  data: Record<string, unknown>,
): Promise<number> {
  const result = await ModelClass.getDriver().update(ModelClass.table, { [ModelClass.primaryKey]: id }, { $set: data });
  return result.modifiedCount;
}

export async function findAndUpdateRecords<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  update: UpdateOperations,
): Promise<TModel[]> {
  await performAtomic(ModelClass, filter, update);
  return await ModelClass.query().where(filter).get();
}

export async function findOneAndUpdateRecord<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  update: UpdateOperations,
): Promise<TModel | null> {
  const result = await ModelClass.getDriver().findOneAndUpdate(ModelClass.table, filter, update);
  if (!result) return null;
  const ctor = ModelClass as any;
  return new ctor(result);
}

export async function findAndReplaceRecord<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  document: Record<string, unknown>,
): Promise<TModel | null> {
  const result = await ModelClass.getDriver().replace(ModelClass.table, filter, document);
  if (!result) return null;
  const ctor = ModelClass as any;
  return new ctor(result);
}

export async function findOneAndDeleteRecord<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  filter: Record<string, unknown>,
  options?: Record<string, unknown>,
): Promise<TModel | null> {
  const driver = ModelClass.getDriver();
  const result = await driver.findOneAndDelete(ModelClass.table, filter, options);

  if (!result) {
    return null;
  }

  const model = ModelClass.hydrate(result as Record<string, unknown>);
  model.dirtyTracker.reset();
  return model;
}

export function resolveDataSource<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
): DataSource {
  const ref = ModelClass.dataSource;
  let dataSource: DataSource;

  if (typeof ref === "string") {
    dataSource = dataSourceRegistry.get(ref);
  } else if (ref) {
    dataSource = ref;
  } else {
    dataSource = dataSourceRegistry.get();
  }

  if (!ModelClass.hasOwnProperty("_defaultsApplied")) {
    const driverDefaults = dataSource.driver.modelDefaults || {};
    const dataSourceDefaults = dataSource.modelDefaults || {};

    const mergedDefaults = {
      ...driverDefaults,
      ...dataSourceDefaults,
    };

    if (Object.keys(mergedDefaults).length > 0) {
      (ModelClass as any).applyModelDefaults(mergedDefaults);
    }

    (ModelClass as any)._defaultsApplied = true;
  }

  return dataSource;
}
