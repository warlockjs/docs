import { DatabaseRestorer } from "../../restorer/database-restorer";
import type { ChildModel, Model } from "../model";

export async function restoreRecord<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  id: string | number,
  options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean },
): Promise<TModel> {
  const restorer = new DatabaseRestorer(ModelClass as unknown as typeof Model);
  const result = await restorer.restore(id, options);

  if (!result.restoredRecord) {
    throw new Error(
      `Failed to restore ${ModelClass.name} with ${ModelClass.primaryKey} ${id}: no record returned.`,
    );
  }

  return result.restoredRecord as TModel;
}

export async function restoreAllRecords<TModel extends Model>(
  ModelClass: ChildModel<TModel>,
  options?: { onIdConflict?: "fail" | "assignNew"; skipEvents?: boolean },
): Promise<TModel[]> {
  const restorer = new DatabaseRestorer(ModelClass as unknown as typeof Model);
  const result = await restorer.restoreAll(options);

  return result.restoredCount === 0 ? [] : (result.restoredRecords as TModel[]);
}
