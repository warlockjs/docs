/**
 * This class is used to be part of the Herald Event Consumer Manager.
 * It should be used to consume events from Either RabbitMQ or Kafka through Herald
 *
 * It's highly recommended using it instead of declaring manual channel namd and subscribing to event
 */
import { v, ValidationResult, type ObjectValidator } from "@warlock.js/seal";
import { randomUUID } from "crypto";
import { Consumable } from "../decorators";
import { ConsumedEventMessage, EventConsumerClass } from "./types";

export abstract class EventConsumer<Payload = Record<string, any>> {
  /**
   * Event name
   */
  public static eventName: string;

  private static _consumerId?: string;

  public static get consumerId(): string {
    if (!this._consumerId) {
      this._consumerId = randomUUID();
    }
    return this._consumerId;
  }

  public get eventName() {
    return (this.constructor as typeof EventConsumer).eventName;
  }

  /**
   * Min version accepted to be consumed by this class
   */
  public static minVersion?: number;

  /**
   * Max version accepted to be consumed by this class
   */
  public static maxVersion?: number;

  /**
   * Payload validation to auto reject the received event before accessing it in the handle method
   */
  public schema?: ObjectValidator;

  /**
   * The method that will be called when the event is received
   */
  public abstract handle(payload: Payload, event: ConsumedEventMessage): Promise<void>;

  /**
   * Determine whether this is accepted version to be used by this consumer
   */
  public static isAcceptedVersion(version: number): boolean {
    if (this.minVersion && version < this.minVersion) return false;
    if (this.maxVersion && version > this.maxVersion) return false;

    return true;
  }

  /**
   * Validate the given data
   */
  public async validate(data: Payload): Promise<ValidationResult | void> {
    if (!this.schema) return;

    return await v.validate(this.schema, data);
  }
}

/**
 * Define Consumer options
 */
type ConsumerOptions<Payload> = {
  /**
   * Payload validation to auto reject the received event before accessing it in the handle method
   */
  schema?: ObjectValidator;
  /**
   * Handle data
   */
  handle: (payload: Payload, event: ConsumedEventMessage) => Promise<void>;
  /**
   * Validate the payload before executing `handle`
   */
  validate?: (payload: Payload) => Promise<ValidationResult | boolean>;
};

/**
 * A shorthand to define an event consumer without declaring an entire class
 */
export function defineConsumer<Payload = Record<string, any>>(
  eventName: string,
  options: ConsumerOptions<Payload>,
): EventConsumerClass {
  const Class = class AnnouncedConsumer extends EventConsumer<Payload> {
    public static eventName = eventName;
    public schema = options.schema;

    public async handle(payload: Payload, event: ConsumedEventMessage) {
      if (options.validate) {
        const result = await options.validate(payload);
        if (!result || !(result as ValidationResult).isValid) return;
      }

      return options.handle(payload, event);
    }
  };

  Consumable()(Class as EventConsumerClass);

  return Class as EventConsumerClass;
}
