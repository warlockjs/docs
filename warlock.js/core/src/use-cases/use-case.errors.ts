import type { ValidationResult } from "@warlock.js/seal";
import { HttpError } from "../http/errors/errors";

export class BadSchemaUseCaseError extends HttpError {
  public constructor(result: ValidationResult) {
    super(400, `Invalid input data`, {
      code: "BAD_SCHEMA_USE_CASE",
      errors: result.errors,
    });
  }
}
