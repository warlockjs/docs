import type {
  UseCaseErrorResult,
  UseCaseEventsCallbacksMap,
  UseCaseOnExecutingContext,
  UseCaseResult,
} from "./types";

/**
 * Global event callbacks — shared across all use case instances.
 */
export const globalEventsCallbacksMap: UseCaseEventsCallbacksMap = {
  onExecuting: [],
  onCompleted: [],
  onError: [],
};

/**
 * Subscribe to lifecycle events fired by any use case.
 *
 * @example
 * globalUseCasesEvents.onCompleted((result) => metrics.track(result.name, result.benchmarkResult));
 * globalUseCasesEvents.onError((ctx) => logger.error(ctx.name, ctx.error));
 */
export const globalUseCasesEvents = {
  onExecuting(callback: (ctx: UseCaseOnExecutingContext) => void) {
    globalEventsCallbacksMap.onExecuting.push(callback);
    return {
      unsubscribe: () => {
        const idx = globalEventsCallbacksMap.onExecuting.indexOf(callback);
        if (idx !== -1) globalEventsCallbacksMap.onExecuting.splice(idx, 1);
      },
    };
  },
  onCompleted<Output>(callback: (result: UseCaseResult<Output>) => void) {
    globalEventsCallbacksMap.onCompleted.push(callback);
    return {
      unsubscribe: () => {
        const idx = globalEventsCallbacksMap.onCompleted.indexOf(callback);
        if (idx !== -1) globalEventsCallbacksMap.onCompleted.splice(idx, 1);
      },
    };
  },
  onError(callback: (ctx: UseCaseErrorResult) => void) {
    globalEventsCallbacksMap.onError.push(callback);
    return {
      unsubscribe: () => {
        const idx = globalEventsCallbacksMap.onError.indexOf(callback);
        if (idx !== -1) globalEventsCallbacksMap.onError.splice(idx, 1);
      },
    };
  },
};

/**
 * Dispatches a lifecycle event to invocation → use-case → global observers, in that order.
 * All observers are awaited sequentially.
 */
export async function fireLifecycleEvent<EventCtx>(
  ctx: EventCtx,
  observers: {
    invocation?: ((ctx: EventCtx) => void | Promise<void>)[];
    useCase?: ((ctx: EventCtx) => void | Promise<void>)[];
    global?: ((ctx: EventCtx) => void | Promise<void>)[];
  },
) {
  if (observers.invocation) {
    for (const obs of observers.invocation) await obs(ctx);
  }

  if (observers.useCase) {
    for (const obs of observers.useCase) await obs(ctx);
  }

  if (observers.global) {
    for (const obs of observers.global) await obs(ctx);
  }
}
