type FileHealthStats = {
  /**
   * File Health State
   */
  state: "healthy" | "defective";
  /**
   * Number of errors
   */
  errors: number;
  /**
   * Number of warnings
   */
  warnings: number;
};

type FileHealthMessage = {
  /**
   * Message
   */
  message: string;
  /**
   * Type of the message
   */
  type: "error" | "warning";
  /**
   * Line number
   */
  lineNumber: number;
  /**
   * Column number
   */
  columnNumber: number;
  /**
   * Length of the error/warning span
   */
  length?: number;
  /**
   * Rule ID (for ESLint)
   */
  ruleId?: string;
};

export class FileHealthResult {
  /**
   * Result of the health check
   */
  public result: "healthy" | "defective" = "healthy";

  /**
   * Messages list (either for errors or warnings)
   */
  public messages: FileHealthMessage[] = [];

  /**
   * Mark as healthy
   */
  public markAsHealthy(): void {
    this.result = "healthy";
  }

  /**
   * Add errors
   */
  public addErrors(messages: FileHealthMessage[]): void {
    this.result = "defective";
    this.messages.push(...messages);
  }

  /**
   * Add warnings
   */
  public addWarnings(messages: FileHealthMessage[]): void {
    this.result = "defective";
    this.messages.push(...messages);
  }

  /**
   * Get file health stats
   */
  public getStats(): FileHealthStats {
    return {
      state: this.result,
      errors: this.messages.filter((message) => message.type === "error").length,
      warnings: this.messages.filter((message) => message.type === "warning").length,
    };
  }
}
