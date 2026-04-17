import { Message } from "../types";
import { type EventConsumer } from "./event-consumer";

export type ConsumedEventMessage = {
  version?: number;
  occurredAt?: Date;
  metadata?: Record<string, any>;
  messageId: string;
  eventName: string;
  payload: Record<string, any>;
  message: Message<any>;
};

export type EventConsumerClass<P = Record<string, any>> = {
  new (): EventConsumer<P>;
  eventName: string;
  consumerId: string;
  minVersion?: number;
  maxVersion?: number;
  isAcceptedVersion(version: number): boolean;
};
