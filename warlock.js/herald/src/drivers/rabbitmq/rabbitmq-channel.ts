import { v } from "@warlock.js/seal";
import { randomUUID } from "node:crypto";
import type { ChannelContract } from "../../contracts";
import type {
  ChannelOptions,
  ChannelStats,
  Message,
  MessageContext,
  MessageHandler,
  MessageMetadata,
  PublishOptions,
  RequestOptions,
  ResponseHandler,
  SubscribeOptions,
  Subscription,
} from "../../types";

/**
 * RabbitMQ Channel Implementation
 *
 * Wraps a RabbitMQ queue/exchange with a unified API.
 *
 * @template TPayload - The typed payload
 */
export class RabbitMQChannel<TPayload = unknown> implements ChannelContract<TPayload> {
  public readonly name: string;
  public readonly options: ChannelOptions<TPayload>;

  private readonly amqpChannel: any;
  private readonly subscriptions = new Map<string, RabbitMQSubscription>();
  private asserted = false;

  /**
   * Create a new RabbitMQ channel
   */
  public constructor(name: string, amqpChannel: any, options?: ChannelOptions<TPayload>) {
    this.name = name;
    this.amqpChannel = amqpChannel;
    this.options = options ?? {};
  }

  /**
   * Assert the queue exists
   */
  public async assert(): Promise<void> {
    if (this.asserted) return;

    const queueOptions = {
      durable: this.options.durable ?? true,
      autoDelete: this.options.autoDelete ?? false,
      exclusive: this.options.exclusive ?? false,
      messageTtl: this.options.messageTtl,
      maxLength: this.options.maxLength,
      deadLetterExchange: this.options.deadLetter?.channel ? "" : undefined,
      deadLetterRoutingKey: this.options.deadLetter?.channel,
    };

    await this.amqpChannel.assertQueue(this.name, queueOptions);
    this.asserted = true;
  }

  /**
   * Publish a message
   */
  public async publish(payload: TPayload, options?: PublishOptions): Promise<void> {
    await this.assert();

    // Validate with schema if provided
    if (this.options.schema) {
      const context = {
        allValues: payload,
        value: payload,
      };
      const result = await v.validate(this.options.schema, payload, { context });
      if (!result.isValid) {
        throw new Error(`Message validation failed: ${JSON.stringify(result.errors)}`);
      }
      payload = result.data as TPayload;
    }

    const messageId = randomUUID();
    const timestamp = new Date();

    const messageContent = JSON.stringify({
      payload,
      metadata: {
        messageId,
        timestamp: timestamp.toISOString(),
        correlationId: options?.correlationId,
        headers: options?.headers,
      },
    });

    const publishOptions: any = {
      persistent: options?.persistent ?? true,
      messageId,
      timestamp: timestamp.getTime(),
      correlationId: options?.correlationId,
      expiration: options?.expiration?.toString(),
      priority: options?.priority,
      headers: options?.headers,
    };

    // Handle delayed messages (requires rabbitmq-delayed-message-exchange plugin)
    if (options?.delay) {
      publishOptions.headers = {
        ...publishOptions.headers,
        "x-delay": options.delay,
      };
    }

    this.amqpChannel.sendToQueue(this.name, Buffer.from(messageContent), publishOptions);
  }

  /**
   * Publish multiple messages
   */
  public async publishBatch(messages: TPayload[], options?: PublishOptions): Promise<void> {
    for (const payload of messages) {
      await this.publish(payload, options);
    }
  }

  /**
   * Subscribe to messages
   *
   * Smart auto-ack behavior (when autoAck is not true):
   * - If handler completes successfully without explicit ack/nack/reject → auto-ack
   * - If handler throws an error → auto-nack (with retry if configured)
   * - If handler explicitly calls ack/nack/reject → respects that call
   */
  public async subscribe(
    handler: MessageHandler<TPayload>,
    options?: SubscribeOptions,
  ): Promise<Subscription> {
    await this.assert();

    // Use consumerId from options if provided, otherwise generate a random one
    const subscriptionId = options?.consumerId ?? randomUUID();

    // Set prefetch if specified
    if (options?.prefetch) {
      await this.amqpChannel.prefetch(options.prefetch);
    }

    // If autoAck is true, RabbitMQ handles ack immediately (fire-and-forget)
    const isFireAndForget = options?.autoAck === true;

    const consumerOptions = {
      noAck: isFireAndForget,
      exclusive: options?.exclusive ?? false,
      consumerTag: options?.group ?? subscriptionId,
    };

    const { consumerTag } = await this.amqpChannel.consume(
      this.name,
      async (msg: any) => {
        if (!msg) return;

        // Track if acknowledgment was handled explicitly
        let ackHandled = isFireAndForget;

        try {
          const content = JSON.parse(msg.content.toString());
          let payload = content.payload as TPayload;

          // Validate with schema if provided
          if (this.options.schema) {
            const context = {
              allValues: payload,
              value: payload,
            };
            const result = await v.validate(this.options.schema, payload, { context });
            if (!result.isValid) {
              // Reject invalid messages
              this.amqpChannel.nack(msg, false, false);
              return;
            }
            payload = result.data as TPayload;
          }

          const metadata: MessageMetadata = {
            messageId: msg.properties.messageId || content.metadata?.messageId || randomUUID(),
            timestamp: new Date(msg.properties.timestamp || content.metadata?.timestamp),
            correlationId: msg.properties.correlationId || content.metadata?.correlationId,
            replyTo: msg.properties.replyTo,
            priority: msg.properties.priority,
            headers: msg.properties.headers,
            retryCount: msg.properties.headers?.["x-retry-count"] || 0,
            originalChannel: this.name,
          };

          const message: Message<TPayload> = {
            metadata,
            payload,
            raw: msg,
          };

          const context: MessageContext = {
            ack: async () => {
              if (!ackHandled) {
                ackHandled = true;
                this.amqpChannel.ack(msg);
              }
            },
            nack: async (requeue = true) => {
              if (!ackHandled) {
                ackHandled = true;
                this.amqpChannel.nack(msg, false, requeue);
              }
            },
            reject: async () => {
              if (!ackHandled) {
                ackHandled = true;
                this.amqpChannel.reject(msg, false);
              }
            },
            reply: async <T>(replyPayload: T) => {
              if (msg.properties.replyTo) {
                const replyContent = JSON.stringify({
                  payload: replyPayload,
                  metadata: {
                    messageId: randomUUID(),
                    timestamp: new Date().toISOString(),
                    correlationId: msg.properties.correlationId,
                  },
                });

                this.amqpChannel.sendToQueue(msg.properties.replyTo, Buffer.from(replyContent), {
                  correlationId: msg.properties.correlationId,
                });
              }
            },
            retry: async (delay?: number) => {
              if (ackHandled) return;
              ackHandled = true;

              const retryCount = (metadata.retryCount || 0) + 1;
              const maxRetries = options?.retry?.maxRetries ?? 3;

              if (retryCount > maxRetries) {
                // Send to dead-letter if configured
                if (options?.deadLetter) {
                  await this.sendToDeadLetter(message, options.deadLetter.channel);
                }
                this.amqpChannel.ack(msg);
                return;
              }

              // Republish with retry count
              const headers = {
                ...msg.properties.headers,
                "x-retry-count": retryCount,
              };

              if (delay) {
                headers["x-delay"] = delay;
              }

              this.amqpChannel.sendToQueue(this.name, msg.content, { ...msg.properties, headers });

              this.amqpChannel.ack(msg);
            },
          };

          // Execute handler
          await handler(message, context);

          // Smart auto-ack: if handler succeeded and didn't explicitly handle ack
          if (!ackHandled) {
            this.amqpChannel.ack(msg);
          }
        } catch (error) {
          // Smart auto-nack: if handler threw and didn't explicitly handle ack
          if (ackHandled) return;

          // Handle errors - nack and potentially retry
          if (options?.retry) {
            const retryCount = msg.properties.headers?.["x-retry-count"] || 0;
            if (retryCount < options.retry.maxRetries) {
              // Requeue for retry
              this.amqpChannel.nack(msg, false, true);
            } else if (options.deadLetter) {
              // Send to dead-letter
              this.amqpChannel.nack(msg, false, false);
            } else {
              this.amqpChannel.reject(msg, false);
            }
          } else {
            // No retry configured - reject without requeue
            this.amqpChannel.nack(msg, false, false);
          }
        }
      },
      consumerOptions,
    );

    const subscription = new RabbitMQSubscription(
      subscriptionId,
      this.name,
      consumerTag,
      this.amqpChannel,
    );

    this.subscriptions.set(subscriptionId, subscription);

    return subscription;
  }

  /**
   * Unsubscribe by consumer ID
   */
  public async unsubscribeById(consumerId: string): Promise<void> {
    const subscription = this.subscriptions.get(consumerId);
    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(consumerId);
    }
  }

  /**
   * Stop consuming messages on this channel.
   * Cancels all active subscriptions gracefully.
   */
  public async stopConsuming(): Promise<void> {
    const cancellations = Array.from(this.subscriptions.values()).map(sub =>
      sub.unsubscribe(),
    );
    await Promise.all(cancellations);
  }

  /**
   * Send message to dead-letter queue
   */
  private async sendToDeadLetter(
    message: Message<TPayload>,
    deadLetterChannel: string,
  ): Promise<void> {
    const content = JSON.stringify({
      payload: message.payload,
      metadata: {
        ...message.metadata,
        originalChannel: this.name,
      },
    });

    this.amqpChannel.sendToQueue(deadLetterChannel, Buffer.from(content), { persistent: true });
  }

  /**
   * Request-response pattern
   */
  public async request<TResponse = unknown>(
    payload: TPayload,
    options?: RequestOptions,
  ): Promise<TResponse> {
    await this.assert();

    const correlationId = randomUUID();
    const timeout = options?.timeout ?? 30000;

    // Create exclusive reply queue
    const { queue: replyQueue } = await this.amqpChannel.assertQueue("", {
      exclusive: true,
      autoDelete: true,
    });

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Consume reply
      this.amqpChannel.consume(
        replyQueue,
        (msg: any) => {
          if (msg?.properties.correlationId === correlationId) {
            clearTimeout(timeoutId);
            const content = JSON.parse(msg.content.toString());
            resolve(content.payload as TResponse);
          }
        },
        { noAck: true },
      );

      // Send request
      const messageContent = JSON.stringify({
        payload,
        metadata: {
          messageId: randomUUID(),
          timestamp: new Date().toISOString(),
          correlationId,
        },
      });

      this.amqpChannel.sendToQueue(this.name, Buffer.from(messageContent), {
        correlationId,
        replyTo: replyQueue,
        expiration: timeout.toString(),
        ...options,
      });
    });
  }

  /**
   * Register response handler for RPC
   */
  public async respond<TResponse = unknown>(
    handler: ResponseHandler<TPayload, TResponse>,
  ): Promise<Subscription> {
    return this.subscribe(async (message, ctx) => {
      const response = await handler(message, ctx);
      await ctx.reply(response);
      await ctx.ack();
    });
  }

  /**
   * Get queue statistics
   */
  public async stats(): Promise<ChannelStats> {
    await this.assert();

    const queueInfo = await this.amqpChannel.checkQueue(this.name);

    return {
      name: this.name,
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount,
    };
  }

  /**
   * Purge all messages
   */
  public async purge(): Promise<number> {
    await this.assert();

    const result = await this.amqpChannel.purgeQueue(this.name);
    return result.messageCount;
  }

  /**
   * Check if queue exists
   */
  public async exists(): Promise<boolean> {
    try {
      await this.amqpChannel.checkQueue(this.name);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete the queue
   */
  public async delete(): Promise<void> {
    // Cancel all subscriptions
    for (const subscription of this.subscriptions.values()) {
      await subscription.unsubscribe();
    }
    this.subscriptions.clear();

    try {
      await this.amqpChannel.deleteQueue(this.name);
    } catch {
      // Ignore if queue doesn't exist
    }

    this.asserted = false;
  }
}

/**
 * RabbitMQ Subscription Implementation
 */
class RabbitMQSubscription implements Subscription {
  public readonly id: string;
  public readonly channel: string;
  public readonly consumerTag: string;

  private readonly amqpChannel: any;
  private _isActive = true;

  public constructor(id: string, channel: string, consumerTag: string, amqpChannel: any) {
    this.id = id;
    this.channel = channel;
    this.consumerTag = consumerTag;
    this.amqpChannel = amqpChannel;
  }

  public async unsubscribe(): Promise<void> {
    if (!this._isActive) return;

    await this.amqpChannel.cancel(this.consumerTag);
    this._isActive = false;
  }

  public async pause(): Promise<void> {
    // RabbitMQ doesn't have native pause, cancel consumer
    await this.amqpChannel.cancel(this.consumerTag);
  }

  public async resume(): Promise<void> {
    // Would need to re-subscribe - not directly supported
    throw new Error("Resume is not supported for RabbitMQ. Please create a new subscription.");
  }

  public isActive(): boolean {
    return this._isActive;
  }
}
