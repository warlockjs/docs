/**
 * Warlock Herald - Message Bus
 *
 * A powerful, type-safe message bus library for RabbitMQ, Kafka, and more.
 *
 * Package: @warlock.js/herald
 *
 * Let heralds carry your messages across services!
 *
 * Structure:
 * - contracts/ - Core interfaces
 * - brokers/ - Broker and registry
 * - drivers/ - RabbitMQ, Kafka implementations
 * - types/ - TypeScript type definitions
 * - utils/ - Connection helpers
 *
 * @example
 * ```typescript
 * import { connectToBroker, herald } from "@warlock.js/herald";
 *
 * // Connect to RabbitMQ
 * await connectToBroker({
 *   driver: "rabbitmq",
 *   host: "localhost",
 *   port: 5672,
 * });
 *
 * // Publish a message
 * await herald().channel("user.created").publish({ userId: 1 });
 *
 * // Subscribe to messages
 * herald()
 *   .channel<UserPayload>("user.created")
 *   .subscribe(async (message, ctx) => {
 *     console.log(message.payload);
 *     await ctx.ack();
 *   });
 * ```
 */

// Export types
export * from "./types/index";

// Export contracts
export * from "./contracts";

// Export brokers
export * from "./communicators";

// Export drivers
export * from "./drivers";

// Export utilities (connectToBroker, herald function)
export * from "./utils";

// Export message managers
export * from "./message-managers";

// Export decorators
export * from "./decorators";
