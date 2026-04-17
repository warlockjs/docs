import { DatabaseRemover } from "../../remover/database-remover";
import type { DeleteStrategy } from "../../types";
import type { RemoverResult } from "../../contracts";
import type { ChildModel, Model } from "../model";

export async function destroyModel(
  model: Model,
  options?: { strategy?: DeleteStrategy; skipEvents?: boolean },
): Promise<RemoverResult> {
  const remover = new DatabaseRemover(model);
  return remover.destroy(options);
}

export async function deleteRecords(
  ModelClass: ChildModel<any>,
  filter?: Record<string, unknown>,
): Promise<number> {
  return ModelClass.getDriver().deleteMany(ModelClass.table, filter);
}

export async function deleteOneRecord(
  ModelClass: ChildModel<any>,
  filter?: Record<string, unknown>,
): Promise<number> {
  return ModelClass.getDriver().delete(ModelClass.table, filter);
}
