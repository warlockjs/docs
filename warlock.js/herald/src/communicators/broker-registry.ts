import { EventEmitter } from "node:events";
import type { BrokerRegistryEvent, BrokerRegistryListener } from "../types";
import { Broker, type BrokerOptions } from "./broker";

/**
 * Error thrown when a broker is not found
 */
export class MissingBrokerError extends Error {
  public readonly brokerName?: string;

  public constructor(message: string, brokerName?: string) {
    super(message);
    this.name = "MissingBrokerError";
    this.brokerName = brokerName;
  }
}

/**
 * Broker Registry
 *
 * Maintains registry of named brokers.
 * Similar to DataSourceRegistry in @warlock.js/cascade
 *
 * @example
 * ```typescript
 * // Register a broker
 * brokerRegistry.register({
 *   name: "default",
 *   driver: rabbitMQDriver,
 *   isDefault: true,
 * });
 *
 * // Get the default broker
 * const comm = brokerRegistry.get();
 *
 * // Get a specific broker by name
 * const analytics = brokerRegistry.get("analytics");
 *
 * // Listen for events
 * brokerRegistry.on("connected", (comm) => {
 *   console.log(`${comm.name} connected`);
 * });
 * ```
 */
class BrokerRegistry {
  private readonly sources = new Map<string, Broker>();
  private defaultSource?: Broker;
  private readonly events = new EventEmitter();

  /**
   * Register a new broker
   *
   * Sets up event forwarding from the driver to the registry.
   *
   * @param options - Broker configuration
   * @returns The registered broker instance
   *
   * @example
   * ```typescript
   * const broker = brokerRegistry.register({
   *   name: "primary",
   *   driver: myDriver,
   *   isDefault: true,
   * });
   * ```
   */
  public register(options: BrokerOptions): Broker {
    const broker = new Broker(options);
    this.sources.set(broker.name, broker);

    const isNewDefault = broker.isDefault || !this.defaultSource;

    if (isNewDefault) {
      this.defaultSource = broker;
    }

    // Emit registration events
    this.events.emit("registered", broker);

    if (isNewDefault) {
      this.events.emit("default-registered", broker);
    }

    // Forward driver events to registry
    broker.driver.on("connected", () => {
      this.events.emit("connected", broker);
    });

    broker.driver.on("disconnected", () => {
      this.events.emit("disconnected", broker);
    });

    return broker;
  }

  /**
   * Clear all registered brokers
   */
  public clear(): void {
    this.defaultSource = undefined;
    this.sources.clear();
  }

  /**
   * Listen for registry events
   *
   * @param event - Event to listen for
   * @param listener - Callback function
   *
   * @example
   * ```typescript
   * brokerRegistry.on("registered", (comm) => {
   *   console.log(`Broker "${comm.name}" registered`);
   * });
   *
   * brokerRegistry.on("connected", (comm) => {
   *   console.log(`Broker "${comm.name}" connected`);
   * });
   * ```
   */
  public on(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void {
    this.events.on(event, listener);
  }

  /**
   * Listen for a registry event once
   *
   * @param event - Event to listen for
   * @param listener - Callback function
   */
  public once(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void {
    this.events.once(event, listener);
  }

  /**
   * Remove an event listener
   *
   * @param event - Event to stop listening for
   * @param listener - Callback to remove
   */
  public off(event: BrokerRegistryEvent, listener: BrokerRegistryListener): void {
    this.events.off(event, listener);
  }

  /**
   * Get a broker by name or the default one
   *
   * @param name - Optional broker name
   * @returns Broker instance
   * @throws MissingBrokerError if not found
   *
   * @example
   * ```typescript
   * // Get default broker
   * const comm = brokerRegistry.get();
   *
   * // Get specific broker
   * const analytics = brokerRegistry.get("analytics");
   * ```
   */
  public get(name?: string): Broker {
    if (name !== undefined) {
      const source = this.sources.get(name);
      if (!source) {
        throw new MissingBrokerError(`Broker "${name}" is not registered.`, name);
      }
      return source;
    }

    if (!this.defaultSource) {
      throw new MissingBrokerError("No default broker registered.");
    }

    return this.defaultSource;
  }

  /**
   * Check if a broker exists
   *
   * @param name - Broker name to check
   * @returns True if exists
   */
  public has(name: string): boolean {
    return this.sources.has(name);
  }

  /**
   * Check if any brokers are registered
   */
  public hasAny(): boolean {
    return this.sources.size > 0;
  }

  /**
   * Get all registered brokers
   *
   * @returns Array of all brokers
   *
   * @example
   * ```typescript
   * // Disconnect all brokers
   * for (const comm of brokerRegistry.getAll()) {
   *   await comm.disconnect();
   * }
   * ```
   */
  public getAll(): Broker[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get all broker names
   *
   * @returns Array of broker names
   */
  public getNames(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Get the default broker (if any)
   *
   * @returns Default broker or undefined
   */
  public getDefault(): Broker | undefined {
    return this.defaultSource;
  }
}

/**
 * Global broker registry instance
 */
export const brokerRegistry = new BrokerRegistry();
