import { Model } from "../../src/model/model";

/**
 * Create a test model class dynamically.
 * Useful for creating isolated test models without importing real models.
 */
export function createTestModel(
  tableName: string,
  options: {
    fillable?: string[];
    guarded?: string[];
    timestamps?: boolean;
    softDeletes?: boolean;
  } = {},
) {
  class TestModel extends Model {
    static table = tableName;
    static fillable = options.fillable;
    static guarded = options.guarded;
    static timestamps = options.timestamps ?? true;
    static softDeletes = options.softDeletes ?? false;
  }

  return TestModel;
}

/**
 * Create a test model instance with data.
 */
export function createTestModelInstance(tableName: string, data: Record<string, unknown> = {}) {
  const TestModel = createTestModel(tableName);
  return new TestModel(data);
}
