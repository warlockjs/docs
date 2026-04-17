export type BaseConnectionOptions = {
  name?: string;
  isDefault?: boolean;
};

export type RabbitMQSocketOptions = {
  keepAlive?: boolean | number;
  noDelay?: boolean;
  timeout?: number;
  ca?: string | Buffer | Array<string | Buffer>;
  cert?: string | Buffer;
  key?: string | Buffer;
  passphrase?: string;
  servername?: string;
  rejectUnauthorized?: boolean;
};

export type RabbitMQClientOptions = {
  frameMax?: number;
  channelMax?: number;
  locale?: string;
  socket?: RabbitMQSocketOptions;
};

export type RabbitMQConnectionOptions<
  TClientOptions extends RabbitMQClientOptions = RabbitMQClientOptions,
> = BaseConnectionOptions & {
  driver: "rabbitmq";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
  uri?: string;
  heartbeat?: number;
  connectionTimeout?: number;
  reconnect?: boolean;
  reconnectDelay?: number;
  prefetch?: number;
  clientOptions?: TClientOptions;
};

export type KafkaClientOptions = {
  retry?: {
    initialRetryTime?: number;
    retries?: number;
    maxRetryTime?: number;
    factor?: number;
    multiplier?: number;
  };
  logLevel?: number;
  logCreator?: any;
};

export type KafkaConnectionOptions<TClientOptions extends KafkaClientOptions = KafkaClientOptions> =
  BaseConnectionOptions & {
    driver: "kafka";
    brokers: string[];
    clientId?: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    ssl?: boolean | object;
    sasl?: {
      mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
      username: string;
      password: string;
    };
    clientOptions?: TClientOptions;
  };

export type ConnectionOptions = RabbitMQConnectionOptions | KafkaConnectionOptions;

export type BrokerConfigurations<TClientOptions = any> =
  | RabbitMQConnectionOptions<
      TClientOptions extends RabbitMQClientOptions ? TClientOptions : RabbitMQClientOptions
    >
  | KafkaConnectionOptions<
      TClientOptions extends KafkaClientOptions ? TClientOptions : KafkaClientOptions
    >;
