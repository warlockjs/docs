import type { ChildModel, Model } from "./model";

/**
 * Options for the RegisterModel decorator
 */
export type RegisterModelOptions = {
  /**
   * Custom name for the model in the global registry.
   * If not provided, uses the class name.
   *
   * @example
   * ```typescript
   * @RegisterModel({ name: "CustomUser" })
   * export class User extends Model {}
   * ```
   */
  name?: string;
};

/**
 * Global model registry that maps model class names to their constructors.
 * This allows for string-based model references to avoid circular dependencies.
 */
const modelsRegistry = new Map<string, ChildModel<Model>>();

/**
 * Class decorator that registers a model in the global registry.
 *
 * This is an opt-in mechanism that allows models to be referenced by string name
 * instead of direct class imports, helping avoid circular dependencies.
 *
 * @param options - Optional configuration for registration
 *
 * @example
 * ```typescript
 * // Auto-capture class name
 * @RegisterModel()
 * export class User extends Model {
 *   static table = "users";
 * }
 *
 * // Custom name
 * @RegisterModel({ name: "UserModel" })
 * export class User extends Model {
 *   static table = "users";
 * }
 *
 * // Later, retrieve by name:
 * const UserModel = Model.getModel("User");
 * ```
 */
export function RegisterModel(options?: RegisterModelOptions) {
  return function <T extends ChildModel<Model>>(target: T): T {
    const modelName = options?.name || target.name;

    if (!modelName) {
      throw new Error(
        "@RegisterModel decorator: Unable to determine model name. " +
          "Please provide a name in options or ensure your class has a name.",
      );
    }

    if (modelsRegistry.has(modelName)) {
      console.warn(
        `⚠️  Model "${modelName}" is already registered. ` +
          `This will overwrite the previous registration.`,
      );
    }

    modelsRegistry.set(modelName, target);

    return target;
  };
}

export function registerModelInRegistry(name: string, model: ChildModel<Model>) {
  modelsRegistry.set(name, model);
}

/**
 * Get a model class by its name from the global registry.
 *
 * @param name - The model class name
 * @returns The model class or undefined if not found
 *
 * @example
 * ```typescript
 * const UserModel = getModelFromRegistry("User");
 * if (UserModel) {
 *   const user = await UserModel.find(1);
 * }
 * ```
 */
export function getModelFromRegistry(name: string) {
  return modelsRegistry.get(name);
}

/**
 * Get all registered models from the global registry.
 *
 * @returns A Map of all registered model classes by name
 *
 * @example
 * ```typescript
 * const allModels = getAllModelsFromRegistry();
 * for (const [name, ModelClass] of allModels) {
 *   console.log(`Found model: ${name}`);
 * }
 * ```
 */
export function getAllModelsFromRegistry() {
  return new Map(modelsRegistry);
}

/**
 * Clean up all models from register
 */
export function cleanupModelsRegistery() {
  modelsRegistry.clear();
}

export function removeModelFromRegistery(name: string) {
  modelsRegistry.delete(name);
}

export function resolveModelClass(model: ChildModel<Model> | string): ChildModel<Model> {
  return typeof model === "string" ? getModelFromRegistry(model)! : model;
}
