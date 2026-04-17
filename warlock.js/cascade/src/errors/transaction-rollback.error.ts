/**
 * Error thrown when a transaction is explicitly rolled back via ctx.rollback().
 *
 * This error is used to signal transaction rollback without representing
 * an application error. It's caught by the transaction wrapper to perform
 * cleanup and then re-thrown.
 */
export class TransactionRollbackError extends Error {
  /**
   * The reason for the rollback (if provided).
   */
  public readonly reason?: string;

  /**
   * Creates a new TransactionRollbackError.
   *
   * @param reason - Optional reason for rollback (for logging/debugging)
   */
  public constructor(reason?: string) {
    super(reason || "Transaction rolled back");
    this.name = "TransactionRollbackError";
    this.reason = reason;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransactionRollbackError);
    }
  }
}
