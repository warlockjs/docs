import { Broker, brokerRegistry } from "../communicators";
import type { BrokerDriverContract, ChannelContract } from "../contracts";
import { EventConsumerClass, EventMessage } from "../message-managers";
import type { ChannelOptions, ConnectionOptions, RabbitMQConnectionOptions } from "../types";

/**
 * Connect to a message broker and register it.
 *
 * This is a high-level utility function that simplifies connection setup
 * for most projects. It handles driver instantiation, connection,
 * broker creation, and automatic registration.
 *
 * **Supported Drivers:**
 * - `rabbitmq` (default) - RabbitMQ/AMQP driver
 * - `kafka` - Apache Kafka driver (coming soon)
 *
 * @param options - Connection configuration options
 * @returns A connected and registered Broker instance
 * @throws {Error} If connection fails or driver is not implemented
 *
 * @example
 * ```typescript
 * // RabbitMQ connection
 * const broker = await connectToBroker({
 *   driver: "rabbitmq",
 *   host: "localhost",
 *   port: 5672,
 *   username: "guest",
 *   password: "guest",
 * });
 *
 * // Use the broker
 * await broker.channel("user.created").publish({ userId: 1 });
 * ```
 *
 * @example
 * ```typescript
 * // Multiple brokers
 * await connectToBroker({
 *   driver: "rabbitmq",
 *   name: "notifications",
 *   isDefault: true,
 *   host: process.env.RABBITMQ_HOST,
 * });
 *
 * await connectToBroker({
 *   driver: "rabbitmq",
 *   name: "analytics",
 *   host: process.env.ANALYTICS_RABBITMQ_HOST,
 * });
 *
 * // Use default broker
 * herald().channel("notifications").publish({ ... });
 *
 * // Use specific broker
 * herald("analytics").channel("events").publish({ ... });
 * ```
 */
export async function connectToBroker(options: ConnectionOptions): Promise<Broker> {
  // Default values
  const driverType = options.driver ?? "rabbitmq";
  const brokerName = options.name ?? "default";
  const isDefault = options.isDefault ?? true;

  // Create driver based on type
  let driver: BrokerDriverContract;

  switch (driverType) {
    case "rabbitmq": {
      const rabbitOptions = options as RabbitMQConnectionOptions;
      // Dynamic import to avoid requiring amqplib if not used
      const { RabbitMQDriver } = await import("../drivers/rabbitmq/rabbitmq-driver");
      driver = new RabbitMQDriver(rabbitOptions);
      break;
    }

    case "kafka": {
      // const kafkaOptions = options as KafkaConnectionOptions;
      // Dynamic import to avoid requiring kafkajs if not used
      throw new Error(
        "Kafka driver is not yet implemented. Coming soon! For now, please use RabbitMQ.",
      );
    }

    default:
      throw new Error(`Unknown driver: "${driverType}". Supported drivers: rabbitmq, kafka`);
  }

  // Create broker
  const broker = brokerRegistry.register({
    name: brokerName,
    driver,
    isDefault,
  });

  // Connect to the message broker
  try {
    await driver.connect();
  } catch (error) {
    throw new Error(
      `Failed to connect to ${driverType}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return broker;
}

/**
 * Get a broker by name or the default one.
 *
 * This is the main entry point for using brokers in your application.
 * Named after the package — `herald()` carries your messages!
 *
 * @param name - Optional broker name (uses default if not provided)
 * @returns Broker instance
 * @throws MissingBrokerError if broker not found
 *
 * @example
 * // Get default broker
 * const channel = herald().channel("user.created");
 * await channel.publish({ userId: 1 });
 *
 * // Get specific broker
 * const analyticsChannel = herald("analytics").channel("events");
 * await analyticsChannel.publish({ event: "page_view" });
 *
 * // Subscribe to messages
 * herald()
 *   .channel<UserPayload>("user.created")
 *   .subscribe(async (message, ctx) => {
 *     console.log("User created:", message.payload);
 *     await ctx.ack();
 *   });
 * ```
 */
export function herald(name?: string): Broker {
  return brokerRegistry.get(name);
}

/**
 * Get channel instance for the given name from default broker.
 *
 * Shorthand for `herald().channel(name, options)`.
 *
 * @param name - Channel name
 * @param options - Optional channel options
 * @returns Channel instance
 * @throws MissingBrokerError if broker not found
 *
 * @example
 * ```typescript
 * const channel = heraldChannel("user.created");
 * await channel.publish({ userId: 1 });
 * ```
 */
export function heraldChannel<TPayload = unknown>(
  name: string,
  options?: ChannelOptions<TPayload>,
): ChannelContract<TPayload> {
  return herald().channel<TPayload>(name, options);
}

/**
 * Publish an EventMessage to the default broker.
 *
 * @param event - Event message to publish
 * @returns Promise that resolves when the event is published
 * @throws Error if the broker is not connected
 *
 * @example
 * ```typescript
 * await publishEvent(new UserUpdatedEvent({ id: 1, name: "John Doe" }));
 * ```
 */
export async function publishEvent<TPayload = Record<string, any>>(event: EventMessage<TPayload>) {
  return herald().publish(event);
}

/**
 * Subscribe an EventConsumer class to the default broker.
 *
 * @param Consumer - Event consumer class
 * @returns Unsubscribe function
 * @throws MissingBrokerError if broker not found
 *
 * @example
 * ```typescript
 * await subscribeConsumer(UserUpdatedConsumer);
 * ```
 */
export async function subscribeConsumer<TPayload = Record<string, any>>(
  Consumer: EventConsumerClass<TPayload>,
) {
  return herald().subscribe(Consumer);
}
