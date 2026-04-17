import type {
  ChannelOptions,
  ChannelStats,
  MessageHandler,
  PublishOptions,
  RequestOptions,
  ResponseHandler,
  SubscribeOptions,
  Subscription,
} from "../types";

/**
 * Channel contract - represents a queue (RabbitMQ) or topic (Kafka)
 *
 * Provides a unified pub/sub interface across different message brokers.
 *
 * @template TPayload - The typed payload for messages on this channel
 *
 * @example
 * ```typescript
 * // Get a typed channel
 * const userChannel = herald().channel<UserPayload>("user.created");
 *
 * // Publish
 * await userChannel.publish({ userId: 1, email: "test@example.com" });
 *
 * // Subscribe
 * userChannel.subscribe(async (message, ctx) => {
 *   console.log(message.payload.userId);
 *   await ctx.ack();
 * });
 * ```
 */
export interface ChannelContract<TPayload = unknown> {
  /**
   * Channel name/routing key
   */
  readonly name: string;

  /**
   * Channel options
   */
  readonly options: ChannelOptions<TPayload>;

  /**
   * Publish a message to this channel
   *
   * @param payload - The message payload
   * @param options - Optional publish options
   *
   * @example
   * ```typescript
   * await channel.publish({ orderId: 123 });
   *
   * // With options
   * await channel.publish({ orderId: 123 }, {
   *   priority: 5,
   *   persistent: true,
   *   correlationId: "req-123",
   * });
   * ```
   */
  publish(payload: TPayload, options?: PublishOptions): Promise<void>;

  /**
   * Publish multiple messages in a batch
   *
   * More efficient than publishing one by one.
   *
   * @param messages - Array of payloads to publish
   * @param options - Optional publish options (applied to all messages)
   *
   * @example
   * ```typescript
   * await channel.publishBatch([
   *   { event: "page_view", page: "/home" },
   *   { event: "page_view", page: "/products" },
   * ]);
   * ```
   */
  publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void>;

  /**
   * Subscribe to messages on this channel
   *
   * @param handler - Function to handle incoming messages
   * @param options - Optional subscribe options
   * @returns Subscription object for managing the subscription
   *
   * @example
   * ```typescript
   * const subscription = await channel.subscribe(
   *   async (message, ctx) => {
   *     await processOrder(message.payload);
   *     await ctx.ack();
   *   },
   *   {
   *     prefetch: 10,
   *     retry: { maxRetries: 3, delay: 1000 },
   *   }
   * );
   *
   * // Later: unsubscribe
   * await subscription.unsubscribe();
   * ```
   */
  subscribe(handler: MessageHandler<TPayload>, options?: SubscribeOptions): Promise<Subscription>;

  /**
   * Unsubscribe a consumer by its ID
   *
   * @param consumerId - The consumer ID to unsubscribe
   *
   * @example
   * ```typescript
   * await channel.unsubscribeById("consumer-uuid");
   * ```
   */
  unsubscribeById(consumerId: string): Promise<void>;

  /**
   * Request-Response pattern (RPC)
   *
   * Publishes a message and waits for a response.
   *
   * @param payload - The request payload
   * @param options - Request options including timeout
   * @returns Promise resolving to the response
   *
   * @example
   * ```typescript
   * const result = await channel.request<ProcessResult>(
   *   { imageUrl: "https://..." },
   *   { timeout: 30000 }
   * );
   * console.log(result.processedUrl);
   * ```
   */
  request<TResponse = unknown>(payload: TPayload, options?: RequestOptions): Promise<TResponse>;

  /**
   * Register a response handler for RPC pattern
   *
   * The return value of the handler becomes the response.
   *
   * @param handler - Function to handle requests and return responses
   * @returns Subscription for managing the responder
   *
   * @example
   * ```typescript
   * channel.respond(async (message, ctx) => {
   *   const result = await processImage(message.payload);
   *   return { processedUrl: result.url };
   * });
   * ```
   */
  respond<TResponse = unknown>(
    handler: ResponseHandler<TPayload, TResponse>,
  ): Promise<Subscription>;

  /**
   * Get channel statistics
   *
   * @returns Channel stats including message count and consumer count
   *
   * @example
   * ```typescript
   * const stats = await channel.stats();
   * console.log(`Messages: ${stats.messageCount}, Consumers: ${stats.consumerCount}`);
   * ```
   */
  stats(): Promise<ChannelStats>;

  /**
   * Purge all messages from the channel
   *
   * Use with caution - this deletes all pending messages.
   *
   * @returns Number of messages purged
   *
   * @example
   * ```typescript
   * const purgedCount = await channel.purge();
   * console.log(`Purged ${purgedCount} messages`);
   * ```
   */
  purge(): Promise<number>;

  /**
   * Check if the channel exists
   *
   * @returns True if the channel exists on the broker
   */
  exists(): Promise<boolean>;

  /**
   * Delete the channel
   *
   * Use with caution - this removes the queue/topic entirely.
   */
  delete(): Promise<void>;

  /**
   * Assert/create the channel with its options
   *
   * Creates the channel if it doesn't exist, or verifies options match.
   */
  assert(): Promise<void>;

  /**
   * Stop consuming messages on this channel.
   * Cancels all active subscriptions gracefully.
   */
  stopConsuming(): Promise<void>;
}
