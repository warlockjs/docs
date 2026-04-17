import { colors } from "@mongez/copper";
import type { ValidationResult } from "@warlock.js/seal";

/**
 * Error thrown when model validation fails during database write operations.
 *
 * Contains detailed information about all validation errors,
 * including field paths, error messages, and validation rules that failed.
 *
 * @example
 * ```typescript
 * try {
 *   const user = new User({ name: "", age: -5 });
 *   await user.save();
 * } catch (error) {
 *   if (error instanceof DatabaseWriterValidationError) {
 *     console.log(error.message); // "Validation failed"
 *     console.log(error.errors);
 *     // [
 *     //   { path: "name", error: "name is required", rule: "required" },
 *     //   { path: "age", error: "age must be at least 0", rule: "min" }
 *     // ]
 *   }
 * }
 * ```
 */
export class DatabaseWriterValidationError extends Error {
  /**
   * Array of validation errors from @warlock.js/seal.
   *
   * Each error contains:
   * - `path`: Dot-notation path to the field (e.g., "address.city")
   * - `error`: Human-readable error message
   * - `rule`: The validation rule that failed (e.g., "required", "email")
   * - Additional context depending on the rule
   */
  public readonly errors: ValidationResult["errors"];

  /**
   * Create a new DatabaseWriterValidationError.
   *
   * @param message - Error message (typically "Validation failed")
   * @param errors - Array of validation errors from seal
   *
   * @example
   * ```typescript
   * const error = new DatabaseWriterValidationError("Validation failed", [
   *   { path: "email", error: "email must be valid", rule: "email" }
   * ]);
   * ```
   */
  public constructor(message: string, errors: ValidationResult["errors"]) {
    super(message);
    this.name = "DatabaseWriterValidationError";
    this.errors = errors;

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseWriterValidationError);
    }

    // Override Node.js inspect to use our formatted output
    Object.defineProperty(this, "inspect", {
      value: () => this.toString(),
      enumerable: false,
    });
  }

  /**
   * Custom inspect method for Node.js console output.
   * This makes console.log and error logging use our beautiful format.
   */
  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return this.toString();
  }

  /**
   * Get a formatted string representation of all validation errors.
   *
   * Provides beautiful, colored terminal output with clear field-by-field breakdown.
   *
   * @returns Multi-line string with all errors, formatted for terminal
   *
   * @example
   * ```typescript
   * console.log(error.toString());
   * // ❌ Validation Error: UserModel
   * //
   * //   Field: email
   * //   Error: Email already exists
   * //   Value: "john@example.com"
   * ```
   */
  public toString(): string {
    // Extract model name from message (e.g., "[UserModel Model]")
    const modelMatch = this.message.match(/\[(\w+)\s+Model\]/);
    const modelName = modelMatch ? modelMatch[1] : "Model";
    const operation = this.message.includes("Insert") ? "Insert" : "Update";

    // Build header
    const lines: string[] = [];
    lines.push("");
    lines.push(colors.red(`❌ Validation Error: ${modelName} (${operation})`));
    lines.push("");

    // Group errors by field for better readability
    const errorsByField = new Map<string, Array<{ error: string; type?: string; value?: any }>>();

    for (const err of this.errors) {
      const fieldName = err.input || "unknown";
      if (!errorsByField.has(fieldName)) {
        errorsByField.set(fieldName, []);
      }
      errorsByField.get(fieldName)!.push({
        error: err.error,
        type: err.type,
        value: (err as any).value,
      });
    }

    // Format each field's errors
    for (const [fieldName, fieldErrors] of errorsByField) {
      lines.push(colors.yellow(`  Field: ${fieldName}`));

      for (const fieldError of fieldErrors) {
        lines.push(colors.white(`  Error: ${fieldError.error}`));

        if (fieldError.value !== undefined) {
          const valueStr =
            typeof fieldError.value === "string"
              ? `"${fieldError.value}"`
              : JSON.stringify(fieldError.value);
          lines.push(colors.gray(`  Value: ${valueStr}`));
        }

        if (fieldError.type) {
          lines.push(colors.cyan(`  Type:  ${fieldError.type}`));
        }
      }

      lines.push(""); // Blank line between fields
    }

    return lines.join("\n");
  }

  /**
   * Get validation errors for a specific field.
   *
   * @param fieldPath - Dot-notation path to the field
   * @returns Array of errors for that field
   *
   * @example
   * ```typescript
   * const emailErrors = error.getFieldErrors("email");
   * console.log(emailErrors);
   * // [{ path: "email", error: "email must be valid", rule: "email" }]
   * ```
   */
  public getFieldErrors(fieldPath: string): ValidationResult["errors"] {
    return this.errors.filter((err) => err.input === fieldPath);
  }

  /**
   * Check if a specific field has validation errors.
   *
   * @param fieldPath - Dot-notation path to the field
   * @returns True if the field has errors
   *
   * @example
   * ```typescript
   * if (error.hasFieldError("email")) {
   *   console.log("Email is invalid");
   * }
   * ```
   */
  public hasFieldError(fieldPath: string): boolean {
    return this.errors.some((err) => err.input === fieldPath);
  }
}
