# Documentation Audit: Herald

## Summary
- **Total pages**: 0
- **OK**: 0
- **STUB**: 0
- **NEEDS_REVIEW**: 0
- **MISSING**: 100% (The entire package is undocumented)

## Missing Documentation Coverage (Public API)

The following aspects of the `@warlock.js/herald` package are NOT covered in the current documentation:

### Core Concepts
- [ ] What is Herald? (Message Bus/Communicator architecture)
- [ ] Supported Drivers: RabbitMQ (primary), Kafka (referenced but needs docs).

### API Reference
- [ ] **Communicator**: `Communicator` class, `connect()`, `disconnect()`, `channel()`.
- [ ] **Registry**: `communicatorRegistry`, `register()`, `setDefault()`, `use()`.
- [ ] **Channels**: `ChannelContract`, `publish()`, `subscribe()`, `rpc()`.
- [ ] **Managers**: `EventMessage` (defining events), `EventConsumer` (consuming events).
- [ ] **Decorators**: `@Consumable` for automatic subscription.
- [ ] **Utilities**: `publishEvent()`, `subscribeConsumer()`, `communicatorChannel()`.

### Configuration
- [ ] `src/config/communicator.ts` structure and options.
- [ ] RabbitMQ specific options (Host, Port, User, Pass, VHost).

## Observations
- Herald is listed as a "Highlighted Feature" in the Introduction but has no link.
- It is mentioned as a "Communicator Connector" in the Connectors page but without usage details.
- This is a critical gap for any event-driven or microservice-based architecture using Warlock.js.
