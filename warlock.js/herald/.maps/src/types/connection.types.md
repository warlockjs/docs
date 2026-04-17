# connection.types
source: src/types/connection.types.ts
description: Connection configuration types for RabbitMQ and Kafka brokers with options.
complexity: simple
first-mapped: 2026-04-17 04:25:18 AM
last-mapped: 2026-04-17 04:25:18 AM

## Exports
- `BaseConnectionOptions` — Base connection configuration with name and default [lines 1-4]
- `RabbitMQSocketOptions` — RabbitMQ socket-level TLS and connection options [lines 6-16]
- `RabbitMQClientOptions` — RabbitMQ client frame and channel limits [lines 18-23]
- `RabbitMQConnectionOptions` — Full RabbitMQ connection with generic client options [lines 25-41]
- `KafkaClientOptions` — Kafka client retry and logging configuration [lines 43-53]
- `KafkaConnectionOptions` — Full Kafka connection with brokers and SASL [lines 55-69]
- `ConnectionOptions` — Union of RabbitMQ or Kafka options [line 71]
- `BrokerConfigurations` — Generic broker config supporting both drivers [lines 73-79]

## Types & Interfaces

### BaseConnectionOptions [lines 1-4] — Base connection metadata
- `name?: string` — Optional connection name identifier
- `isDefault?: boolean` — Mark connection as default broker

### RabbitMQSocketOptions [lines 6-16] — Socket-level security settings
- `keepAlive?: boolean | number` — TCP keep-alive configuration
- `noDelay?: boolean` — Disable Nagle's algorithm
- `timeout?: number` — Socket timeout in milliseconds
- `ca?: string | Buffer | Array<string | Buffer>` — Certificate authority
- `cert?: string | Buffer` — Client certificate
- `key?: string | Buffer` — Client private key
- `passphrase?: string` — Passphrase for encrypted key
- `servername?: string` — SNI hostname for TLS
- `rejectUnauthorized?: boolean` — Validate certificate chain

### RabbitMQClientOptions [lines 18-23] — RabbitMQ protocol options
- `frameMax?: number` — Maximum frame size in bytes
- `channelMax?: number` — Maximum number of channels
- `locale?: string` — Client locale preference
- `socket?: RabbitMQSocketOptions` — Socket configuration

### RabbitMQConnectionOptions [lines 25-41] — Full RabbitMQ configuration
- `driver: "rabbitmq"` — Driver identifier (literal)
- `host?: string` — Hostname or IP address
- `port?: number` — Port number
- `username?: string` — Authentication username
- `password?: string` — Authentication password
- `vhost?: string` — Virtual host path
- `uri?: string` — Connection URI (alternative)
- `heartbeat?: number` — Heartbeat interval seconds
- `connectionTimeout?: number` — Connection timeout milliseconds
- `reconnect?: boolean` — Enable automatic reconnection
- `reconnectDelay?: number` — Delay between reconnect attempts
- `prefetch?: number` — Message prefetch count
- `clientOptions?: TClientOptions` — Protocol-level options

### KafkaClientOptions [lines 43-53] — Kafka library options
- `retry?: { initialRetryTime?, retries?, maxRetryTime?, factor?, multiplier? }` — Retry strategy
- `logLevel?: number` — Logging verbosity level
- `logCreator?: any` — Custom log creation function

### KafkaConnectionOptions [lines 55-69] — Full Kafka configuration
- `driver: "kafka"` — Driver identifier (literal)
- `brokers: string[]` — List of broker addresses
- `clientId?: string` — Kafka client identifier
- `connectionTimeout?: number` — Connection timeout milliseconds
- `requestTimeout?: number` — Request timeout milliseconds
- `ssl?: boolean | object` — Enable/configure SSL
- `sasl?: { mechanism, username, password }` — SASL authentication config
- `clientOptions?: TClientOptions` — Library-level options

### ConnectionOptions [line 71] — Driver-agnostic connection config
- Union type of `RabbitMQConnectionOptions | KafkaConnectionOptions`

### BrokerConfigurations [lines 73-79] — Generic broker configuration
- Generic over `TClientOptions` with conditional type narrowing
