# drivers

created: 2026-04-17 04:56:56 AM
updated: 2026-04-17 04:56:56 AM

> This folder contains driver implementations for Herald's supported message brokers. Each sub-folder is one broker driver implementing BrokerDriverContract and ChannelContract.

## What lives here

- `rabbitmq/` — RabbitMQ/AMQP driver: RabbitMQDriver and RabbitMQChannel implementations

## Adding a new driver

To add a new driver, create a sub-folder (e.g., `kafka/`) and implement two core interfaces:

1. **BrokerDriverContract** from `src/contracts/broker-driver.contract.ts` — handles connection lifecycle (connect/disconnect), consumer management (subscribe/unsubscribe), event publishing, channel management, and health checks.

2. **ChannelContract** from `src/contracts/channel.contract.ts` — manages individual channels/queues/topics including message subscription, acknowledgment, and channel-specific options.

Export your driver classes via a sub-folder `index.ts` file and register it in the `connectToBroker()` factory in `src/utils/connect-to-broker.ts` by adding a new case in the driver type switch statement.

## DO NOT

- Do NOT add business logic to drivers — they implement the transport layer only. Keep all event validation, transformation, and routing logic in message-managers or contracts.
- Do NOT import application-level code from drivers — dependency must flow inward (drivers import from contracts, types, message-managers only). Never import from communicators, services, or domain code.
- Do NOT instantiate drivers directly in application code — always use `connectToBroker()` factory from utils. This ensures proper registration and lifecycle management via brokerRegistry.
