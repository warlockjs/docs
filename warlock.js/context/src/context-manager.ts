import type { Context } from "./base-context";

/**
 * Context Manager - Orchestrates multiple contexts together
 *
 * Allows running multiple AsyncLocalStorage contexts in a single operation,
 * making it easy to link request, storage, database, and other contexts.
 *
 * @example
 * ```typescript
 * // Register contexts
 * contextManager
 *   .register('request', requestContext)
 *   .register('storage', storageDriverContext)
 *   .register('database', databaseDataSourceContext);
 *
 * // Run all contexts together
 * await contextManager.runAll({
 *   request: { request, response, user },
 *   storage: { driver, metadata: { tenantId: '123' } },
 *   database: { dataSource: 'primary' },
 * }, async () => {
 *   // All contexts active!
 *   await handleRequest();
 * });
 * ```
 */
export class ContextManager {
  private contexts = new Map<string, Context<any>>();

  /**
   * Register a context
   *
   * @param name - Unique context name
   * @param context - Context instance
   * @returns This instance for chaining
   */
  public register(name: string, context: Context<any>): this {
    this.contexts.set(name, context);
    return this;
  }

  /**
   * Run all registered contexts together
   *
   * Nests all context.run() calls, ensuring all contexts are active
   * for the duration of the callback.
   *
   * @param stores - Context stores keyed by context name
   * @param callback - Async function to execute
   * @returns Result of the callback
   */
  public async runAll<T>(stores: Record<string, any>, callback: () => Promise<T>): Promise<T> {
    const entries = Array.from(this.contexts.entries());

    // Build nested context runners
    const runner = entries.reduceRight((next, [name, context]) => {
      return () => context.run(stores[name] || {}, next);
    }, callback);

    return runner();
  }

  /**
   * Enter all contexts at once (for middleware)
   *
   * @param stores - Context stores keyed by context name
   */
  public enterAll(stores: Record<string, any>): void {
    for (const [name, context] of this.contexts.entries()) {
      if (stores[name]) {
        context.enter(stores[name]);
      }
    }
  }

  /**
   * Clear all contexts
   */
  public clearAll(): void {
    for (const context of this.contexts.values()) {
      context.clear();
    }
  }

  /**
   * Get a specific registered context
   *
   * @param name - Context name
   * @returns Context instance or undefined
   */
  public getContext<T extends Context<any>>(name: string): T | undefined {
    return this.contexts.get(name) as T | undefined;
  }

  /**
   * Check if a context is registered
   *
   * @param name - Context name
   * @returns True if context is registered
   */
  public hasContext(name: string): boolean {
    return this.contexts.has(name);
  }

  /**
   * Build all context stores by calling each context's buildStore() method
   *
   * This is the immutable pattern - returns a new record of stores.
   * Each context defines its own initialization logic.
   *
   * @param payload - Payload passed to each buildStore() (e.g., { request, response })
   * @returns Record of context name -> store data
   *
   * @example
   * ```typescript
   * const httpContextStore = contextManager.buildStores({ request, response });
   * await contextManager.runAll(httpContextStore, async () => { ... });
   * ```
   */
  public buildStores(payload?: Record<string, any>): Record<string, any> {
    const stores: Record<string, any> = {};

    for (const [name, context] of this.contexts.entries()) {
      stores[name] = context.buildStore(payload) ?? {};
    }

    return stores;
  }

  /**
   * Unregister a context
   *
   * @param name - Context name to remove
   * @returns True if context was removed
   */
  public unregister(name: string): boolean {
    return this.contexts.delete(name);
  }
}

/**
 * Global context manager instance
 *
 * Use this singleton to register and manage all framework contexts.
 */
export const contextManager = new ContextManager();
