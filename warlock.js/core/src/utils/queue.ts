/**
 * A utility class for managing a queue of operations.
 * Allows enqueuing values and executing a function when the queue reaches a certain size or after a specified interval.
 * Supports both parallel and sequential execution of the queued operations.
 */
export class Queue<T> {
  /** The items currently in the queue. */
  private items: T[] = [];

  /** The maximum size of the queue before triggering execution. */
  private readonly maxSize?: number;

  /** The interval in milliseconds after which the queue will be executed if not already triggered by size. */
  private readonly interval: number;

  /** The function to execute with the items in the queue. */
  private readonly executeFn: (items: T[]) => Promise<void>;

  /** Timer for managing the interval-based execution. */
  private timer: NodeJS.Timeout | null = null;

  /** Flag to determine if execution should be parallel or sequential. */
  private readonly executeInParallel: boolean;

  /** The batch size for processing items. */
  private readonly batchSize: number;

  /** Whether the current queue is busy executing */
  private isExecuting = false;

  /**
   * Constructs a new Queue instance.
   * @param executeFn - The function to execute with the items in the queue.
   * @param maxSize - The maximum number of items before the queue is executed.
   * @param executeEvery - The time in milliseconds after which the queue is executed if not already triggered.
   * @param executeInParallel - Whether to execute the function in parallel or sequentially.
   * @param batchSize - The number of items to process in each batch.
   */
  public constructor(
    executeFn: (items: T[]) => Promise<void>,
    executeInParallel: boolean = true,
    executeEvery: number = 5000,
    batchSize: number,
    maxSize?: number,
  ) {
    this.executeFn = executeFn;
    this.maxSize = maxSize;
    this.interval = executeEvery;
    this.executeInParallel = executeInParallel;
    this.batchSize = batchSize;
  }

  /**
   * Adds an item to the queue.
   * Triggers execution if the queue reaches the maximum size.
   * Starts a timer if not already running.
   * @param item - The item to add to the queue.
   */
  public enqueue(item: T): void {
    this.items.push(item);
    if (this.maxSize && this.items.length >= this.maxSize) {
      this.execute();
    }

    if (!this.timer) {
      this.startTimer();
    }
  }

  /**
   * Starts a timer to execute the queue after the specified interval.
   */
  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.items.length > 0) {
        this.execute();
      }
    }, this.interval);
  }

  /**
   * Executes the function with the current items in the queue.
   * Processes items in batches and resets the timer.
   */
  private async execute(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isExecuting = true;

    // Now there are couple scenarios:
    // 1. Batch size has value, we need to check if its going to be executed in parallel or sequentially
    // 2. Batch size is not provided, we will execute all items in a single call
    if (this.batchSize) {
      const itemsToProcess = this.items.splice(0, this.batchSize);
      if (this.executeInParallel) {
        await Promise.all(itemsToProcess.map(item => this.executeFn([item])));
      } else {
        for (const item of itemsToProcess) {
          await this.executeFn([item]);
        }
      }
    }

    this.isExecuting = false;
  }
}
