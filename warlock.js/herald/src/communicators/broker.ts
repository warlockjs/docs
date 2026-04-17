import type { BrokerDriverContract } from "../contracts";
import type { ChannelContract } from "../contracts/channel.contract";
import { EventMessage } from "../message-managers/event-message";
import { EventConsumerClass } from "../message-managers/types";
import type { ChannelOptions } from "../types";

/**
 * Options for creating a Broker
 */
export interface BrokerOptions {
  /** Unique name for this broker */
  name: string;
  /** The underlying driver */
  driver: BrokerDriverContract;
  /** Whether this is the default broker */
  isDefault?: boolean;
}

/**
 * Broker - wrapper around a driver with metadata
 *
 * Similar to DataSource in @warlock.js/cascade
 *
 * @example
 * ```typescript
 * const broker = new Broker({
 *   name: "default",
 *   driver: rabbitMQDriver,
 *   isDefault: true,
 * });
 *
 * // Get a channel
 * const channel = broker.channel("user.created");
 * ```
 */
export class Broker {
  /** Unique name identifying this broker */
  public readonly name: string;

  /** The underlying driver */
  public readonly driver: BrokerDriverContract;

  /** Whether this is the default broker */
  public readonly isDefault: boolean;

  /**
   * Create a new Broker
   *
   * @param options - Broker configuration
   */
  public constructor(options: BrokerOptions) {
    this.name = options.name;
    this.driver = options.driver;
    this.isDefault = Boolean(options.isDefault);
  }

  /**
   * Subscribe the given consumer
   */
  public subscribe(consumer: EventConsumerClass<any>) {
    return this.driver.subscribe(consumer);
  }

  /**
   * Publish the given event message
   */
  public publish<TPayload = Record<string, any>>(event: EventMessage<TPayload>) {
    this.driver.publish(event);
  }

  /**
   * Get or create a channel
   *
   * @param name - Channel name
   * @param options - Channel options
   * @returns Channel instance
   *
   * @example
   * ```typescript
   * // Simple channel
   * const channel = broker.channel("notifications");
   *
   * // Typed channel with schema
   * const orderChannel = broker.channel<OrderPayload>("orders", {
   *   schema: OrderSchema,
   *   durable: true,
   * });
   * ```
   */
  public channel<TPayload = unknown>(
    name: string,
    options?: ChannelOptions<TPayload>,
  ): ChannelContract<TPayload> {
    return this.driver.channel<TPayload>(name, options);
  }

  /**
   * Check if the broker is connected
   */
  public get isConnected(): boolean {
    return this.driver.isConnected;
  }

  /**
   * Connect the underlying driver
   */
  public async connect(): Promise<void> {
    await this.driver.connect();
  }

  /**
   * Disconnect the underlying driver
   */
  public async disconnect(): Promise<void> {
    await this.driver.disconnect();
  }

  /**
   * Start consuming messages
   */
  public async startConsuming(): Promise<void> {
    await this.driver.startConsuming();
  }

  /**
   * Stop consuming messages
   */
  public async stopConsuming(): Promise<void> {
    await this.driver.stopConsuming();
  }

  /**
   * Health check
   */
  public async healthCheck() {
    return this.driver.healthCheck();
  }
}
