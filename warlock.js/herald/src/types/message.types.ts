export type MessageMetadata = {
  messageId: string;
  correlationId?: string;
  replyTo?: string;
  priority?: number;
  timestamp: Date;
  headers?: Record<string, string>;
  retryCount?: number;
  originalChannel?: string;
};

export type Message<TPayload = unknown> = {
  readonly metadata: MessageMetadata;
  readonly payload: TPayload;
  readonly raw?: unknown;
};

export type MessageContext = {
  ack(): Promise<void>;
  nack(requeue?: boolean): Promise<void>;
  reject(): Promise<void>;
  reply<T>(payload: T): Promise<void>;
  retry(delay?: number): Promise<void>;
};

export type Subscription = {
  readonly id: string;
  readonly channel: string;
  readonly consumerTag?: string;
  unsubscribe(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isActive(): boolean;
};

export type MessageHandler<TPayload = unknown> = (
  message: Message<TPayload>,
  ctx: MessageContext,
) => Promise<void> | void;

export type ResponseHandler<TPayload = unknown, TResponse = unknown> = (
  message: Message<TPayload>,
  ctx: MessageContext,
) => Promise<TResponse> | TResponse;
