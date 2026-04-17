import type { BaseValidator } from "@warlock.js/seal";
import type { DeadLetterOptions } from "./subscribe.types";

export type ChannelOptions<TPayload = unknown> = {
  type?: "queue" | "topic" | "fanout";
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
  deadLetter?: DeadLetterOptions;
  maxMessageSize?: number;
  messageTtl?: number;
  maxLength?: number;
  schema?: BaseValidator;
};

export type ChannelStats = {
  messageCount: number;
  consumerCount: number;
  name: string;
};
