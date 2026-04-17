import type { SchemaContext } from "../types";
import type { BaseValidator } from "./base-validator";
import { ComputedValidator, type ComputedCallback } from "./computed-validator";

/**
 * Callback function for managed fields
 * Receives only schema context (no data dependency)
 */
export type ManagedCallback<TResult = any> = (context: SchemaContext) => TResult | Promise<TResult>;

/**
 * Managed field validator
 *
 * The callback is optional - if not provided, the framework can inject the value.
 * @example
 * ```ts
 * // With callback (framework executes it)
 * const schema = v.object({
 *   name: v.string(),
 *   createdAt: v.managed(() => new Date()),
 *   updatedAt: v.managed(() => new Date()),
 * });
 *
 * // Without callback (framework injects value)
 * const schema = v.object({
 *   name: v.string(),
 *   id: v.managed(() => 1),
 * });
 * ```
 */
export class ManagedValidator<TResult = any> extends ComputedValidator<TResult> {
  /**
   * Create a new managed field validator
   *
   * @param callback - Optional function to generate the value
   * @param resultValidator - Optional validator to validate the generated result
   */
  constructor(callback: ManagedCallback<TResult>, resultValidator?: BaseValidator) {
    // Convert ManagedCallback to ComputedCallback
    // Managed callbacks don't receive data, only context
    const computedCallback: ComputedCallback<TResult> = (_data, context) => callback(context);

    super(computedCallback, resultValidator);
  }
}
