import { AsyncLocalStorage } from "async_hooks";

/**
 * Base class for all AsyncLocalStorage-based contexts
 *
 * Provides a consistent API for managing context across async operations.
 * All framework contexts (request, storage, database) extend this class.
 *
 * @template TStore - The type of data stored in context
 *
 * @example
 * ```typescript
 * interface MyContextStore {
 *   userId: string;
 *   tenant: string;
 * }
 *
 * class MyContext extends Context<MyContextStore> {}
 * const myContext = new MyContext();
 *
 * // Use it
 * await myContext.run({ userId: '123', tenant: 'acme' }, async () => {
 *   const userId = myContext.get('userId'); // '123'
 * });
 * ```
 */
export abstract class Context<TStore extends Record<string, any>> {
  protected readonly storage: AsyncLocalStorage<TStore> = new AsyncLocalStorage<TStore>();

  /**
   * Run a callback within a new context
   *
   * Creates a new async context with the provided store data.
   * All operations within the callback will have access to this context.
   *
   * @param store - Initial context data
   * @param callback - Async function to execute
   * @returns Result of the callback
   */
  public run<T>(store: TStore, callback: () => Promise<T>): Promise<T> {
    return this.storage.run(store, callback);
  }

  /**
   * Enter a new context without a callback
   *
   * Useful for middleware where you want to set context for the rest of the request.
   * Unlike `run()`, this doesn't require a callback.
   *
   * @param store - Context data to set
   */
  public enter(store: TStore): void {
    this.storage.enterWith(store);
  }

  /**
   * Update the current context
   *
   * Merges new data into existing context, or enters new context if none exists.
   *
   * @param updates - Partial context data to merge
   */
  public update(updates: Partial<TStore>): void {
    const current = this.storage.getStore();

    if (current) {
      Object.assign(current, updates);
    } else {
      this.enter(updates as TStore);
    }
  }

  /**
   * Get the current context store
   *
   * @returns Current context or undefined if not in context
   */
  public getStore(): TStore | undefined {
    return this.storage.getStore();
  }

  /**
   * Get a specific value from context
   *
   * @param key - Key to retrieve
   * @returns Value or undefined
   */
  public get<K extends keyof TStore>(key: K): TStore[K] | undefined {
    return this.storage.getStore()?.[key];
  }

  /**
   * Set a specific value in context
   *
   * @param key - Key to set
   * @param value - Value to store
   */
  public set<K extends keyof TStore>(key: K, value: TStore[K]): void {
    this.update({ [key]: value } as any);
  }

  /**
   * Clear the context
   */
  public clear(): void {
    this.storage.enterWith({} as TStore);
  }

  /**
   * Check if currently in a context
   */
  public hasContext(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /**
   * Build the initial store for this context
   *
   * Override this method to provide custom initialization logic.
   * Called by ContextManager.buildStores() for each registered context.
   *
   * @param payload - Generic payload (e.g., { request, response } for HTTP contexts)
   * @returns Initial store data
   */
  public abstract buildStore(payload?: Record<string, any>): TStore;
}
