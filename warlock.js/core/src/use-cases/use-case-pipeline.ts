import type { ObjectValidator } from "@warlock.js/seal";
import { v } from "@warlock.js/seal";
import type {
  UseCaseBeforeMiddleware,
  UseCaseContext,
  UseCaseGuard,
  UseCaseOnExecutingContext,
} from "./types";
import { fireLifecycleEvent, globalEventsCallbacksMap } from "./use-case-events";
import { BadSchemaUseCaseError } from "./use-case.errors";

export type PipelineOptions<Input, Output> = {
  name: string;
  id: string;
  data: Input;
  ctx: UseCaseContext;
  startedAt: Date;
  schema?: ObjectValidator;
  guards?: UseCaseGuard<Input>[];
  before?: UseCaseBeforeMiddleware<Input>[];
  handler: (data: Input, ctx: UseCaseContext) => Promise<Output>;
  /** Invocation-level onExecuting override */
  onExecuting?: (ctx: UseCaseOnExecutingContext) => void;
  /** Use-case-level onExecuting */
  ucOnExecuting?: (ctx: UseCaseOnExecutingContext) => void;
};

/**
 * Runs the full use-case pipeline in order:
 * onExecuting event → guards → validation → before middleware → handler
 *
 * Throws on guard failure, validation failure, or handler failure.
 * Callers are responsible for retry and benchmarking wrapping.
 *
 * @example
 * const output = await runPipeline({ name, id, data, ctx, schema, guards, before, handler, ... });
 */
export async function runPipeline<Input, Output>(
  opts: PipelineOptions<Input, Output>,
): Promise<Output> {
  const { name, id, ctx, startedAt, schema, guards, before, handler, onExecuting, ucOnExecuting } =
    opts;
  let data = opts.data;

  // 1. Fire onExecuting lifecycle event
  await fireLifecycleEvent<UseCaseOnExecutingContext>(
    { name, id, data, schema: schema!, ctx, startedAt },
    {
      invocation: onExecuting ? [onExecuting] : undefined,
      useCase: ucOnExecuting ? [ucOnExecuting] : undefined,
      global: globalEventsCallbacksMap.onExecuting.length
        ? globalEventsCallbacksMap.onExecuting
        : undefined,
    },
  );

  // 2. Guards — authorization/precondition checks, run before validation
  if (guards) {
    for (const guard of guards) {
      await guard(Object.freeze(data) as Readonly<Input>, ctx);
    }
  }

  // 3. Schema validation
  if (schema) {
    const result = await v.validate(schema, data);

    if (!result.isValid) {
      throw new BadSchemaUseCaseError(result);
    }

    data = result.data;
  }

  // 4. Before middleware — sequential data transformation chain
  let transformed = data;
  if (before) {
    for (const mw of before) {
      transformed = await mw(transformed, ctx);
    }
  }

  // 5. Core handler
  return handler(transformed, ctx);
}
