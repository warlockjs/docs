/**
 * Standard Schema Spec Types
 *
 * Copied from @standard-schema/spec to avoid a runtime dependency.
 * Source: https://standardschema.dev
 *
 * Implements:
 *  - StandardSchemaV1  — for validation interop (OpenAI, LangGraph, TanStack Form, Conform, etc.)
 *  - StandardJSONSchemaV1 — for JSON Schema generation (OpenAPI, draft-07, draft-2020-12)
 */

// ─────────────────────────────────────────────────────────────
// Standard Schema V1
// ─────────────────────────────────────────────────────────────

/** The Standard Schema interface. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown,
      options?: Options | undefined,
    ) => Result<Output> | Promise<Result<Output>>;
  }

  /** Success result. */
  export interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }

  /** Options passed to validate. */
  export interface Options {
    readonly libraryOptions?: Record<string, unknown> | undefined;
  }

  /** Failure result. */
  export interface FailureResult {
    readonly issues: ReadonlyArray<Issue>;
  }

  export type Result<Output> = SuccessResult<Output> | FailureResult;

  /** Issue in a failed result. */
  export interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  /** A single segment in an issue path. */
  export interface PathSegment {
    readonly key: PropertyKey;
  }

  /** The Standard types interface. */
  export interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
  }

  /** Infer the input type of a Standard Schema. */
  export type InferInput<S extends StandardSchemaV1> = NonNullable<
    S["~standard"]["types"]
  >["input"];

  /** Infer the output type of a Standard Schema. */
  export type InferOutput<S extends StandardSchemaV1> = NonNullable<
    S["~standard"]["types"]
  >["output"];
}

// ─────────────────────────────────────────────────────────────
// Standard JSON Schema V1
// ─────────────────────────────────────────────────────────────

/** The Standard JSON Schema interface. */
export interface StandardJSONSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardJSONSchemaV1.Props<Input, Output>;
}

export declare namespace StandardJSONSchemaV1 {
  export interface Props<Input = unknown, Output = Input>
    extends Omit<StandardSchemaV1.Props<Input, Output>, never> {
    readonly jsonSchema: Converter;
  }

  /** Methods for generating JSON Schema. */
  export interface Converter {
    /** Converts the input type to JSON Schema. */
    readonly input: (options: Options) => Record<string, unknown>;
    /** Converts the output type to JSON Schema. */
    readonly output: (options: Options) => Record<string, unknown>;
  }

  /**
   * Supported JSON Schema targets.
   * Libraries should throw if a target is not supported.
   *
   * - `draft-2020-12`  — JSON Schema 2020-12 (default, recommended)
   * - `draft-07`       — JSON Schema draft-07 (Swagger 2.0, older tooling)
   * - `openapi-3.0`    — OpenAPI 3.0 extensions (nullable: true)
   * - `openai-strict`  — OpenAI Structured Outputs strict mode.
   *                      All fields listed in required; optional fields
   *                      expressed as `{ type: ["T", "null"] }` instead
   *                      of being omitted from required.
   */
  export type Target =
    | "draft-2020-12"
    | "draft-07"
    | "openapi-3.0"
    | "openai-strict"
    | ({} & string); // allow future targets while preserving autocomplete

  export interface Options {
    readonly target: Target;
    readonly libraryOptions?: Record<string, unknown> | undefined;
  }
}
