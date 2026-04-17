import { DatabaseWriter } from "../../writer/database-writer";
import type { Model } from "../model";

export function applyDefaultsToModel(ModelClass: any, defaults: any): void {
  // Only apply defaults if model doesn't have its own value

  // ============================================================================
  // ID Generation
  // ============================================================================
  if (defaults.autoGenerateId !== undefined && ModelClass.autoGenerateId === undefined) {
    ModelClass.autoGenerateId = defaults.autoGenerateId;
  }
  if (defaults.initialId !== undefined && ModelClass.initialId === undefined) {
    ModelClass.initialId = defaults.initialId;
  }
  if (defaults.randomInitialId !== undefined && ModelClass.randomInitialId === undefined) {
    ModelClass.randomInitialId = defaults.randomInitialId;
  }
  if (defaults.incrementIdBy !== undefined && ModelClass.incrementIdBy === undefined) {
    ModelClass.incrementIdBy = defaults.incrementIdBy;
  }
  if (defaults.randomIncrement !== undefined && ModelClass.randomIncrement === undefined) {
    ModelClass.randomIncrement = defaults.randomIncrement;
  }

  // ============================================================================
  // Timestamps
  // ============================================================================
  if (defaults.createdAtColumn !== undefined && ModelClass.createdAtColumn === undefined) {
    ModelClass.createdAtColumn = defaults.createdAtColumn;
  }

  if (defaults.updatedAtColumn !== undefined && ModelClass.updatedAtColumn === undefined) {
    ModelClass.updatedAtColumn = defaults.updatedAtColumn;
  }

  // ============================================================================
  // Deletion
  // ============================================================================
  if (defaults.deleteStrategy !== undefined && ModelClass.deleteStrategy === undefined) {
    ModelClass.deleteStrategy = defaults.deleteStrategy;
  }
  if (defaults.deletedAtColumn !== undefined && ModelClass.deletedAtColumn === undefined) {
    ModelClass.deletedAtColumn = defaults.deletedAtColumn;
  }
  if (defaults.trashTable !== undefined && ModelClass.trashTable === undefined) {
    // Handle function-based trash table
    if (typeof defaults.trashTable === "function") {
      ModelClass.trashTable = defaults.trashTable(ModelClass.table);
    } else {
      ModelClass.trashTable = defaults.trashTable;
    }
  }

  // ============================================================================
  // Validation
  // ============================================================================
  if (defaults.strictMode !== undefined && ModelClass.strictMode === undefined) {
    ModelClass.strictMode = defaults.strictMode;
  }
}

export async function generateModelNextId(model: Model): Promise<number | string> {
  const writer = new DatabaseWriter(model);
  await writer.generateNextId();
  return model.id!;
}

export async function performAtomicUpdate(
  model: Model,
  operations: Record<string, unknown>,
): Promise<number> {
  return model.self().atomic({ id: model.id! }, operations);
}

export async function performAtomicIncrement<T extends string>(
  model: Model,
  field: T,
  amount = 1,
): Promise<number> {
  model.increment(field, amount);
  return performAtomicUpdate(model, {
    $inc: {
      [field]: amount,
    },
  });
}

export async function performAtomicDecrement<T extends string>(
  model: Model,
  field: T,
  amount = 1,
): Promise<number> {
  model.decrement(field, amount);
  return performAtomicUpdate(model, {
    $inc: {
      [field]: -amount,
    },
  });
}
