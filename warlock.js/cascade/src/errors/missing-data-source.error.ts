/**
 * Error thrown when a requested data source is not found in the registry.
 *
 * This can occur when:
 * - Attempting to retrieve a non-existent named data source
 * - Trying to get the default data source before any have been registered
 * - Context override references an unregistered data source name
 */
export class MissingDataSourceError extends Error {
  /**
   * The name of the data source that was not found (if applicable).
   */
  public readonly dataSourceName?: string;

  /**
   * Creates a new MissingDataSourceError.
   *
   * @param message - Descriptive error message
   * @param dataSourceName - Optional data source name that was not found
   */
  public constructor(message: string, dataSourceName?: string) {
    super(message);
    this.name = "MissingDataSourceError";
    this.dataSourceName = dataSourceName;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingDataSourceError);
    }
  }
}
