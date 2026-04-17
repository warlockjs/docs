import { type ObjectValidator } from "@warlock.js/seal";
import { BenchmarkOptions } from "../benchmark";
import { RetryOptions } from "../retry";

/**
 * Shared context object passed through the entire use case pipeline.
 * Contains the optional schema and can be enriched by guards/middleware
 * with arbitrary data (e.g., currentUser, permissions, request metadata).
 */
export type UseCaseContext = {
  schema?: ObjectValidator;
} & Record<string, any>;

/**
 * Guard function that runs **before** schema validation.
 *
 * Guards are authorization/precondition checks. They receive a read-only
 * view of the input data and can enrich the context, but **must not** mutate
 * the input. Throw an error to abort the entire pipeline.
 *
 * @example
 * ```ts
 * const authGuard: UseCaseGuard<LoginInput> = async (data, ctx) => {
 *   const user = await getSession(ctx.token);
 *   if (!user) throw new UnauthorizedError();
 *   ctx.currentUser = user;
 * };
 * ```
 *
 * @template Input - The shape of the use case input data
 */
export type UseCaseGuard<Input> = (
  data: Readonly<Input>,
  ctx: UseCaseContext,
) => void | Promise<void>;

/**
 * Before middleware that runs **after** schema validation.
 *
 * Receives validated data and must return the (optionally transformed) data.
 * Multiple before middlewares form a chain: output of one becomes input of next.
 * Can also enrich the context.
 *
 * @example
 * ```ts
 * const normalizeEmail: UseCaseBeforeMiddleware<SignupInput> = async (data, ctx) => {
 *   return { ...data, email: data.email.toLowerCase().trim() };
 * };
 * ```
 *
 * @template Input - The shape of the use case input data
 */
export type UseCaseBeforeMiddleware<Input> = (
  data: Input,
  ctx: UseCaseContext,
) => Input | Promise<Input>;

/**
 * After middleware that runs **after** the handler succeeds.
 *
 * Fire-and-forget side effects: errors are caught and logged, never thrown.
 * Does **not** affect the returned output. Use for analytics, notifications,
 * cache invalidation, webhooks, etc.
 *
 * @example
 * ```ts
 * const notifySlack: UseCaseAfterMiddleware<OrderOutput> = async (output, ctx) => {
 *   await slack.send(`New order #${output.orderId} placed`);
 * };
 * ```
 *
 * @template Output - The shape of the use case output data
 */
export type UseCaseAfterMiddleware<Output> = (
  output: Output,
  ctx: UseCaseContext,
) => void | Promise<void>;

/**
 * Context passed to `onExecuting` lifecycle event callbacks.
 * Fired at the start of each use case execution, before guards run.
 */
export type UseCaseOnExecutingContext = {
  /** The shared pipeline context */
  ctx: UseCaseContext;
  /** Unique execution ID */
  id: string;
  /** Use case name */
  name: string;
  /** Raw input data */
  data: any;
  /** Schema validator (if defined) */
  schema: ObjectValidator;
  /** Timestamp when execution started */
  startedAt: Date;
};

/**
 * Use case definition.
 *
 * Defines the full execution pipeline: guards → validation → before → handler → after.
 * All fields except `name` and `handler` are optional.
 *
 * @example
 * ```ts
 * const createOrder = await useCase<OrderOutput, OrderInput>({
 *   name: "create-order",
 *   guards: [authGuard, rateLimitGuard],
 *   schema: v.object({ productId: v.string().required(), quantity: v.number().min(1) }),
 *   before: [normalizeInput, enrichWithPricing],
 *   handler: async (data, ctx) => orderService.create(data, ctx.currentUser),
 *   after: [sendConfirmationEmail, invalidateCache],
 *   retries: { count: 3, delay: 1000 },
 *   benchmark: true,
 * });
 * ```
 *
 * @template Output - The shape of the handler's return value
 * @template Input - The shape of the input data (before transformation)
 */
export type UseCase<Output = any, Input = any> = {
  /** Unique use case identifier, used for registration, logging, and cache keys */
  name: string;
  /** Core business logic handler. Receives validated + transformed data and context */
  handler: (filteredData: Input, ctx: UseCaseContext) => Promise<Output>;
  /** Optional schema validator (from @warlock.js/seal). Runs after guards */
  schema?: ObjectValidator;
  /** Guards to run before validation. Sequential, can enrich ctx, cannot mutate data */
  guards?: UseCaseGuard<Input>[];
  /** Before middleware to run after validation. Sequential, can transform data */
  before?: UseCaseBeforeMiddleware<Input>[];
  /** After middleware to run on success. Fire-and-forget, errors are logged not thrown */
  after?: UseCaseAfterMiddleware<Output>[];
  /** Lifecycle callback: fires when execution starts (before guards) */
  onExecuting?: (ctx: UseCaseOnExecutingContext) => void;
  /** Lifecycle callback: fires on successful completion with full result snapshot */
  onCompleted?: (result: UseCaseResult<Output>) => void;
  /** Lifecycle callback: fires on error with error details and execution context */
  onError?: (ctx: UseCaseErrorResult) => void;
  /**
   * Retry configuration. When set, the handler is retried on failure
   * up to `count` times with an optional `delay` between attempts.
   */
  retryOptions?: RetryOptions;
  /**
   * Benchmark configuration. Set to `true` for default thresholds,
   * or provide an object to customize latency classification.
   */
  benchmarkOptions?: BenchmarkOptions | false;
};
/**
 * A registered use case with call tracking metadata.
 * Created internally when a use case is registered via `useCase()`.
 */
export type RegisteredUseCase<Output = any, Input = any> = UseCase<Output, Input> & {
  /** Execution call counters */
  calls: {
    /** Number of successful executions */
    success: number;
    /** Number of failed executions */
    failed: number;
    /** Total executions (success + failed) */
    total: number;
  };
};

/**
 * Runtime options passed at invocation time (second argument to the executor).
 * These override or supplement the use case definition for a single execution.
 *
 * @example
 * ```ts
 * await createOrder(orderData, {
 *   id: "order-123",
 *   ctx: { currentUser },
 *   onCompleted: (result) => console.log("Order created:", result.output),
 * });
 * ```
 *
 * @template Output - The shape of the use case output data
 */
export type UseCaseRuntimeOptions<Output = any> = {
  /** Override the auto-generated execution ID */
  id?: string;
  /** Provide a pre-populated context object */
  ctx?: UseCaseContext;
  /** Invocation-level lifecycle callback: fires first, before use case and global */
  onExecuting?: (ctx: UseCaseOnExecutingContext) => void;
  /** Invocation-level lifecycle callback: fires first on success */
  onCompleted?: (result: UseCaseResult<Output>) => void;
  /** Invocation-level lifecycle callback: fires first on error */
  onError?: (ctx: UseCaseErrorResult) => void;
};

/**
 * Error result snapshot, emitted via `onError` lifecycle callbacks.
 * Contains all fields from `UseCaseResult` except `output`, plus the thrown error.
 */
export type UseCaseErrorResult = Omit<UseCaseResult, "output"> & {
  /** The error that caused the failure */
  error: Error;
};

/**
 * Success result snapshot, emitted via `onCompleted` lifecycle callbacks
 * and stored in execution history cache.
 *
 * @template Output - The shape of the handler's return value
 */
export type UseCaseResult<Output = any> = {
  /** Handler return value (undefined if execution failed) */
  output?: Output;
  /** The pipeline context at time of completion */
  ctx: UseCaseContext;
  /** Timestamp when execution started */
  startedAt: Date;
  /** Timestamp when execution ended */
  endedAt: Date;
  /** Unique execution ID */
  id: string;
  /** Use case name */
  name: string;
  /** Number of successful calls at time of completion */
  calls: number;
  /** Retry state (present only if retries were configured) */
  retries?: {
    /** Total allowed retries */
    count: number;
    /** Actual attempt number that succeeded/failed (if tracked) */
    currentRetry?: number;
    /** Delay between retries in ms */
    delay?: number;
  };
  /** Benchmark result (present only if benchmark was enabled) */
  benchmarkResult?: {
    /** Execution time in milliseconds */
    latency: number;
    /** Performance classification */
    state: "poor" | "good" | "excellent";
  };
};

/**
 * Internal registry of global lifecycle event callback arrays.
 * Used by `globalUseCasesEvents` to manage subscriptions.
 */
export type UseCaseEventsCallbacksMap = {
  onExecuting: ((ctx: UseCaseOnExecutingContext) => void)[];
  onCompleted: ((result: UseCaseResult<any>) => void)[];
  onError: ((ctx: UseCaseErrorResult) => void)[];
};

/**
 * App-level configuration for use cases, resolved via `config.get("use-cases")`.
 * Provides default values that can be overridden per use case.
 *
 * @example
 * ```ts
 * // In your app config file:
 * export default {
 *   "use-cases": {
 *     benchmark: { enabled: true, latencyRange: { up: 100, down: 500 } },
 *     retries: { count: 3, delay: 1000 },
 *     history: { enabled: true, ttl: 7200 },
 *   },
 * };
 * ```
 */
export type UseCaseConfigurations = {
  /**
   * Default benchmark settings for all use cases.
   * For standalone benchmark usage, use `config.get("benchmark")` instead.
   */
  benchmarkOptions?: BenchmarkOptions | false;
  /** Default retry settings for all use cases */
  retryOptions?: RetryOptions;
  /** Execution history cache settings */
  history?: {
    /** Enable/disable history storage (default: true) */
    enabled?: boolean;
    /** Cache TTL in seconds (default: 3600)
     * Setting it to false will use default cache ttl value
     */
    ttl?: number | false;
  };
};
