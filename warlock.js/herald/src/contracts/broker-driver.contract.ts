import { type EventMessage } from "../message-managers/event-message";
import { EventConsumerClass } from "../message-managers/types";
import type {
  BrokerDriverType,
  BrokerEvent,
  BrokerEventListener,
  ChannelOptions,
  HealthCheckResult,
} from "../types";
import type { ChannelContract } from "./channel.contract";

/**
 * Broker Driver Contract
 *
 * Base contract for all message bus drivers (RabbitMQ, Kafka, etc.)
 * Similar to DriverContract in @warlock.js/cascade
 *
 * @example
 * ```typescript
 * // Driver implementation
 * class RabbitMQDriver implements BrokerDriverContract {
 *   readonly name = "rabbitmq";
 *   // ...
 * }
 * ```
 */
export interface BrokerDriverContract {
  /**
   * Driver name identifier
   *
   * @example "rabbitmq", "kafka", "redis-streams"
   */
  readonly name: BrokerDriverType;

  /**
   * Whether currently connected to the message broker
   */
  readonly isConnected: boolean;

  /**
   * Establish connection to the message broker
   *
   * @throws Error if connection fails
   *
   * @example
   * ```typescript
   * await driver.connect();
   * console.log("Connected to RabbitMQ");
   * ```
   */
  connect(): Promise<void>;

  /**
   * Close connection gracefully
   *
   * Ensures all pending operations complete before disconnecting.
   *
   * @example
   * ```typescript
   * await driver.disconnect();
   * ```
   */
  disconnect(): Promise<void>;

  /**
   * Register event listeners for driver lifecycle events
   *
   * @param event - Event name to listen for
   * @param listener - Callback function
   *
   * @example
   * ```typescript
   * driver.on("connected", () => {
   *   console.log("Connected to broker");
   * });
   *
   * driver.on("disconnected", () => {
   *   console.log("Disconnected from broker");
   * });
   *
   * driver.on("error", (error) => {
   *   console.error("Driver error:", error);
   * });
   *
   * driver.on("reconnecting", (attempt) => {
   *   console.log(`Reconnection attempt ${attempt}`);
   * });
   * ```
   */
  on(event: BrokerEvent, listener: BrokerEventListener): void;

  /**
   * Remove an event listener
   *
   * @param event - Event name
   * @param listener - Callback to remove
   */
  off(event: BrokerEvent, listener: BrokerEventListener): void;

  /**
   * Subscribe the given consumer class to the driver
   *
   * @param consumer - Consumer class to subscribe
   * @returns Unsubscribe function
   * @example
   * ```typescript
   * driver.subscribe(UserUpdatedConsumer);
   * ```
   */
  subscribe(consumer: EventConsumerClass): () => void;

  /**
   * Unsubscribe the given consumer class from the driver
   *
   * @param consumer - Consumer class to unsubscribe
   *
   * @example
   * ```typescript
   * driver.unsubscribe(UserUpdatedConsumer);
   * ```
   */
  unsubscribe(consumer: EventConsumerClass): void;

  /**
   * Publish the given event message
   */
  publish<TPayload = Record<string, any>>(event: EventMessage<TPayload>): void;

  /**
   * Get or create a channel
   *
   * Channels are lazy-created and cached for reuse.
   *
   * @param name - Channel/queue/topic name
   * @param options - Channel configuration
   * @returns Channel instance
   *
   * @example
   * ```typescript
   * // Simple channel
   * const channel = driver.channel("user.created");
   *
   * // With options
   * const orderChannel = driver.channel("orders", {
   *   durable: true,
   *   deadLetter: { channel: "orders.failed" },
   * });
   *
   * // Typed channel
   * const typedChannel = driver.channel<OrderPayload>("orders", {
   *   schema: OrderSchema,
   * });
   * ```
   */
  channel<TPayload = unknown>(
    name: string,
    options?: ChannelOptions<TPayload>,
  ): ChannelContract<TPayload>;

  /**
   * Start consuming messages from all subscribed channels
   *
   * Call this after setting up all subscriptions to begin processing.
   *
   * @example
   * ```typescript
   * // Set up subscriptions
   * channel1.subscribe(handler1);
   * channel2.subscribe(handler2);
   *
   * // Start consuming
   * await driver.startConsuming();
   * ```
   */
  startConsuming(): Promise<void>;

  /**
   * Stop consuming messages gracefully
   *
   * Waits for currently processing messages to complete.
   *
   * @example
   * ```typescript
   * await driver.stopConsuming();
   * ```
   */
  stopConsuming(): Promise<void>;

  /**
   * Perform a health check on the connection
   *
   * @returns Health check result with status and optional latency
   *
   * @example
   * ```typescript
   * const health = await driver.healthCheck();
   * if (health.healthy) {
   *   console.log(`Healthy, latency: ${health.latency}ms`);
   * } else {
   *   console.error(`Unhealthy: ${health.error}`);
   * }
   * ```
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get list of all channels managed by this driver
   *
   * @returns Array of channel names
   */
  getChannelNames(): string[];

  /**
   * Close and remove a specific channel
   *
   * @param name - Channel name to close
   */
  closeChannel(name: string): Promise<void>;
}
