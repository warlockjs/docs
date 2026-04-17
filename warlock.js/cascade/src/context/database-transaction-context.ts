import { Context, contextManager } from "@warlock.js/context";

interface TransactionContextStore {
  session?: unknown;
}

/**
 * Database Transaction Context
 *
 * Manages database transaction sessions using AsyncLocalStorage.
 * Extends the base Context class for consistent API.
 */
class DatabaseTransactionContext extends Context<TransactionContextStore> {
  /**
   * Get the current transaction session
   */
  public getSession<TSession = unknown>(): TSession | undefined {
    return this.get("session") as TSession | undefined;
  }

  /**
   * Check if there's an active transaction in the current context
   */
  public hasActiveTransaction(): boolean {
    return this.getSession() !== undefined;
  }

  /**
   * Set the transaction session in context
   */
  public setSession(session: unknown): void {
    this.set("session", session);
  }

  /**
   * Exit the transaction context
   */
  public exit(): void {
    this.clear();
  }

  /**
   * Build the initial transaction store with defaults
   */
  public buildStore(): TransactionContextStore {
    return { session: undefined };
  }
}

export const databaseTransactionContext = new DatabaseTransactionContext();

contextManager.register("db.transaction", databaseTransactionContext);
