import type { ValidationResult } from "../types";
import type { StandardSchemaV1 } from "./types";

/**
 * Maps a Seal ValidationResult to a Standard Schema result shape.
 *
 * Seal error paths are dot-notation strings (e.g. "address.city").
 * Standard Schema expects an array of path segments: [{ key: "address" }, { key: "city" }].
 *
 * @example
 * ```ts
 * const result = await validator.validate(value, context);
 * return mapToStandardResult(result);
 * // Success → { value: <data> }
 * // Failure → { issues: [{ message: "...", path: [{ key: "..." }] }] }
 * ```
 */
export function mapToStandardResult(
  result: ValidationResult,
): StandardSchemaV1.Result<unknown> {
  if (result.isValid) {
    return { value: result.data };
  }

  return {
    issues: result.errors.map(e => ({
      message: e.error,
      path: e.input
        ? e.input.split(".").map(key => ({ key }))
        : undefined,
    })),
  };
}
