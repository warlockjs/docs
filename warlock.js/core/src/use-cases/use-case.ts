import { except, Random } from "@mongez/reinforcements";
import { measure } from "../benchmark";
import { config } from "../config";
import { retry } from "../retry";
import type {
  UseCase,
  UseCaseConfigurations,
  UseCaseErrorResult,
  UseCaseResult,
  UseCaseRuntimeOptions,
} from "./types";
import { fireLifecycleEvent, globalEventsCallbacksMap } from "./use-case-events";
import { runPipeline } from "./use-case-pipeline";
import {
  $registerUseCase,
  $unregisterUseCase,
  addUseCaseHistory,
  increaseUseCaseFailedCalls,
  increaseUseCaseSuccessCalls,
} from "./use-cases-registry";

const defaultUseCaseOptions: UseCaseConfigurations = {
  benchmarkOptions: {
    enabled: true,
    latencyRange: {
      excellent: 100,
      poor: 200,
    },
  },
  retryOptions: {
    count: 0,
    delay: 0,
  },
};

/**
 * Defines and registers a use case.
 *
 * A use case is a named, observable, optionally benchmarked unit of business logic.
 * The returned handler is a typed async function you call with the input data.
 *
 * Execution order: onExecuting → guards → validation → before → handler → after → onCompleted
 *
 * @example
 * export const createOrderUseCase = useCase<OrderOutput, OrderInput>({
 *   name: "create_order",
 *   schema: createOrderSchema,
 *   guards: [authGuard],
 *   handler: async (data, ctx) => orderService.create(data),
 *   after: [sendConfirmationEmail],
 *   retries: { count: 2, delay: 500 },
 * });
 *
 * // In a controller:
 * const output = await createOrderUseCase({ ...validated, user_id: req.user.id });
 */
export function useCase<Output, Input = any>(options: UseCase<Output, Input>) {
  const { name, handler, schema, guards, before, after, onExecuting, onCompleted, onError } =
    options;

  // Merge per-use-case options with global config defaults
  const useCaseConfig = config.get<UseCaseConfigurations>("use-cases", defaultUseCaseOptions);
  const benchmarkOptions = options.benchmarkOptions ?? useCaseConfig?.benchmarkOptions;
  const retryOptions = options.retryOptions ?? useCaseConfig?.retryOptions;

  $registerUseCase(name, {
    ...options,
    calls: { success: 0, failed: 0, total: 0 },
  });

  const useCaseHandler = async (
    data: Input,
    {
      ctx = {},
      id = `uc-${name}-` + Random.string(),
      onExecuting: invocationOnExecuting,
      onCompleted: invocationOnCompleted,
      onError: invocationOnError,
    }: UseCaseRuntimeOptions = {},
  ): Promise<Output> => {
    ctx.schema = schema;
    ctx.id = id;

    const startedAt = new Date();
    let output: Output | undefined;
    let error: Error | undefined;
    let benchmarkResult: { latency: number; state: "excellent" | "good" | "poor" } | undefined;

    // The core pipeline — wrapped by retry and/or benchmark below
    const execute = () =>
      runPipeline<Input, Output>({
        name,
        id,
        data,
        ctx,
        startedAt,
        schema,
        guards,
        before,
        handler,
        onExecuting: invocationOnExecuting,
        ucOnExecuting: onExecuting,
      });

    // Apply retry if configured, otherwise execute once
    const run = () =>
      retryOptions?.count && retryOptions.count > 0 ? retry(execute, retryOptions) : execute();

    try {
      if (benchmarkOptions) {
        // measure() catches errors internally and returns a result object.
        // Re-throw on failure so the outer catch handles it uniformly.
        const result = await measure(
          name,
          run,
          typeof benchmarkOptions === "boolean" ? undefined : benchmarkOptions,
        );

        if (result.success) {
          output = result.value;
          benchmarkResult = except(result, ["value", "success"]);
        } else {
          benchmarkResult = except(result, ["error", "success"]);
          throw result.error;
        }
      } else {
        output = await run();
      }
    } catch (err) {
      error = err as Error;
    }

    const endedAt = new Date();

    // After middleware — fire-and-forget side effects, only on success
    if (!error && after && output !== undefined) {
      for (const middleware of after) {
        try {
          await middleware(output, ctx);
        } catch (err) {
          console.error(`[use-case] After middleware error in "${name}":`, err);
        }
      }
    }

    const snapshot: UseCaseResult<Output> = {
      output,
      ctx,
      startedAt,
      endedAt,
      id,
      name,
      retries: retryOptions?.count
        ? { count: retryOptions.count, delay: retryOptions.delay }
        : undefined,
      benchmarkResult,
      calls: increaseUseCaseSuccessCalls(name),
    };

    if (error) {
      await fireLifecycleEvent<UseCaseErrorResult>(
        { ...except(snapshot, ["output"]), error, calls: increaseUseCaseFailedCalls(name) },
        {
          invocation: invocationOnError ? [invocationOnError] : undefined,
          useCase: onError ? [onError] : undefined,
          global: globalEventsCallbacksMap.onError.length
            ? globalEventsCallbacksMap.onError
            : undefined,
        },
      );
      throw error;
    }

    await addUseCaseHistory(name, snapshot);

    await fireLifecycleEvent<UseCaseResult<Output>>(snapshot, {
      invocation: invocationOnCompleted ? [invocationOnCompleted] : undefined,
      useCase: onCompleted ? [onCompleted] : undefined,
      global: globalEventsCallbacksMap.onCompleted.length
        ? globalEventsCallbacksMap.onCompleted
        : undefined,
    });

    return output!;
  };

  useCaseHandler.$cleanup = () => {
    $unregisterUseCase(name);
  };

  return useCaseHandler;
}
