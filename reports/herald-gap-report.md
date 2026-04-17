# Herald Documentation Gap Report

**Generated:** 2026-04-17  
**Branch:** 001-ecosystem-docs  
**Docs site:** `docs/herald/`  
**Maps source:** `warlock.js/herald/.maps/src/`

---

## Existing Pages (23 total)

`introduction`, `quick-start`, `core-concepts`, `connecting`, `channels`, `channel-options`,
`publishing`, `publish-options`, `consuming`, `subscribe-options`, `event-messages`,
`message-context`, `event-consumers`, `consumable-decorator`, `broker-events`,
`subscription-management`, `multiple-brokers`, `rabbitmq`, `request-reply`,
`retries-and-dead-letters`, `error-handling`, `real-world-examples`, `best-practices`

---

## Coverage by Map-Documented Symbol

| Symbol / Feature | Map source | Status |
|---|---|---|
| `connectToBroker()` | utils | ✅ Covered — `connecting.mdx` |
| `herald()` | utils | ✅ Covered — `connecting.mdx`, `channels.mdx` |
| `heraldChannel()` | utils | ✅ Covered — `connecting.mdx`, `channels.mdx` |
| `publishEvent()` | utils | ✅ Covered — `publishing.mdx` |
| `subscribeConsumer()` | utils | ⚠️ Partial — referenced in intro but no dedicated coverage of return value (unsubscribe fn) or usage pattern |
| `Broker` class (all methods) | communicators | ⚠️ Partial — basics in `core-concepts.mdx`, but `healthCheck()`, `startConsuming()`, `stopConsuming()`, `isConnected` are **not documented** |
| `BrokerOptions` | communicators | ⚠️ Partial — fields covered in `connecting.mdx` table but type name never mentioned |
| `BrokerRegistry` class | communicators | ⚠️ Partial — used indirectly via `connectToBroker`; `has()`, `hasAny()`, `getAll()`, `getNames()`, `getDefault()`, `clear()`, `once()`, `off()` are **missing** |
| `brokerRegistry` singleton | communicators | ⚠️ Partial — used indirectly; direct access pattern not documented |
| `MissingBrokerError` | communicators | ❌ Missing |
| `BrokerDriverContract` interface | contracts | ❌ Missing — no "custom drivers" page exists |
| `ChannelContract` interface | contracts | ❌ Missing — methods shown via usage but the contract itself is undocumented |
| `ChannelContract.purge()` | contracts | ❌ Missing |
| `ChannelContract.exists()` | contracts | ❌ Missing |
| `ChannelContract.delete()` | contracts | ❌ Missing |
| `ChannelContract.assert()` | contracts | ❌ Missing |
| `ChannelContract.stopConsuming()` | contracts | ❌ Missing |
| `ChannelContract.unsubscribeById()` | contracts | ❌ Missing |
| `ChannelContract.publishBatch()` | contracts | ❌ Missing — `publishing.mdx` uses `Promise.all` pattern but never shows `publishBatch()` |
| `ChannelContract.stats()` | contracts | ⚠️ Partial — shown in `channels.mdx` without `await` and `ChannelStats` type is unnamed |
| `EventMessage` + `defineEvent()` | message-managers | ✅ Covered — `event-messages.mdx` |
| `EventConsumer` + `defineConsumer()` | message-managers | ✅ Covered — `event-consumers.mdx` |
| `ConsumedEventMessage` type | message-managers | ⚠️ Partial — fields appear in examples; no reference table of all fields |
| `EventConsumerClass` type | message-managers | ❌ Missing — static members (`consumerId`, `isAcceptedVersion()`) not documented |
| `prepareConsumerSubscription()` | message-managers | ✅ Internal — correctly excluded |
| `pendingSubscribers` | decorators | ✅ Internal — correctly excluded |
| `Consumable` + `ConsumableOptions` | decorators | ✅ Covered — `consumable-decorator.mdx` |
| `RabbitMQDriver` | drivers | ✅ Covered — `rabbitmq.mdx` |
| `RabbitMQConnectionOptions` | types | ✅ Covered — `connecting.mdx` |
| `RabbitMQSocketOptions` (TLS fields) | types | ❌ Missing — `cert`, `ca`, `key`, `rejectUnauthorized`, `servername` not documented |
| `RabbitMQClientOptions` (`frameMax`, `channelMax`) | types | ❌ Missing |
| `KafkaConnectionOptions` | types | ❌ Missing — types exist, driver not yet implemented; needs a "coming soon" stub |
| `ChannelOptions` | types | ✅ Covered — `channel-options.mdx` |
| `ChannelStats` | types | ⚠️ Partial — fields not listed in a reference table |
| `PublishOptions` | types | ✅ Covered — `publish-options.mdx` |
| `RequestOptions` | types | ⚠️ Partial — `timeout` field may be undocumented; check `request-reply.mdx` |
| `SubscribeOptions` | types | ✅ Covered — `subscribe-options.mdx` |
| `RetryOptions` + `DeadLetterOptions` | types | ✅ Covered — `retries-and-dead-letters.mdx` |
| `MessageMetadata` | types | ⚠️ Partial — fields like `retryCount`, `originalChannel`, `correlationId` likely undocumented |
| `Message<TPayload>` | types | ⚠️ Partial — `payload` shown everywhere; `metadata` and `raw` fields not documented |
| `MessageContext` | types | ✅ Covered — `message-context.mdx` (verify `retry()` and `reply()` methods) |
| `Subscription` | types | ✅ Covered — `subscription-management.mdx` (verify `pause()`, `resume()`, `isActive()`) |
| `MessageHandler` + `ResponseHandler` | types | ⚠️ Partial — used in examples but type signatures never shown as a reference |
| `BrokerDriverType` union | types | ❌ Missing — `"rabbitmq" \| "kafka" \| "redis-streams" \| "sqs"` never listed |
| `BrokerEvent` union | types | ✅ Covered — `broker-events.mdx` |
| `BrokerEventListener` | types | ✅ Covered — `broker-events.mdx` |
| `HealthCheckResult` | types | ❌ Missing |
| `BrokerRegistryEvent` union | types | ⚠️ Partial — `"registered"` / `"default-registered"` events likely missing |
| `BrokerRegistryListener` | types | ⚠️ Partial — same as above |

---

## Errors in Existing Docs

These are bugs to fix regardless of new pages:

### 1. `channels.mdx` — Wrong method name: `channel.close()`

The docs call `channel.close()` but this method does **not exist** in `ChannelContract`.

- To stop consumers: use `channel.stopConsuming()`
- To delete the queue entirely: use `channel.delete()`
- To close a named channel from the broker/driver level: use `broker.driver.closeChannel(name)` (internal — not for app code)

### 2. `channels.mdx` — Missing `await` on `stats()`

`ChannelContract.stats()` returns `Promise<ChannelStats>` but the example calls it synchronously:

```ts
// Wrong
const stats = orderPlacedChannel.stats();

// Correct
const stats = await orderPlacedChannel.stats();
```

### 3. `connecting.mdx` + `channels.mdx` — Wrong `publish()` signature

Several examples pass `(eventName, payload)` as two arguments:

```ts
// Wrong — channel already knows its name
await channel.publish("order.placed", { orderId: 123 });

// Correct — signature is publish(payload, options?)
await channel.publish({ orderId: 123 });
```

### 4. `channel-options.mdx` — Dead-letter string shorthand doesn't exist

The docs show `deadLetter: "order.placed.dlq"` as a string shorthand.  
`DeadLetterOptions` only accepts `{ channel: string; preserveOriginal?: boolean }`. No string form exists in the API.

```ts
// Wrong
heraldChannel("order.placed", { deadLetter: "order.placed.dlq" });

// Correct
heraldChannel("order.placed", { deadLetter: { channel: "order.placed.dlq" } });
```

---

## Action Plan

### New Pages to Write

| Page | Content |
|---|---|
| `channel-management.mdx` | `publishBatch()`, `stats()` (with `ChannelStats`), `purge()`, `exists()`, `delete()`, `assert()`, `stopConsuming()`, `unsubscribeById()` |
| `health-checks.mdx` | `broker.healthCheck()`, `HealthCheckResult`, `broker.isConnected`, `startConsuming()`, `stopConsuming()`, graceful shutdown lifecycle |
| `broker-registry.mdx` | `brokerRegistry` singleton, all registry methods, `MissingBrokerError`, `BrokerRegistryEvent`, `BrokerRegistryListener` |
| `custom-drivers.mdx` | `BrokerDriverContract` full interface for implementing custom drivers |

### Existing Pages to Update

| Page | What to fix / add |
|---|---|
| `channels.mdx` | Fix `close()` → `stopConsuming()` / `delete()`; fix `stats()` missing `await`; add `ChannelStats` reference table |
| `connecting.mdx` | Fix `publish(eventName, payload)` → `publish(payload)` |
| `channel-options.mdx` | Fix dead-letter string shorthand; add `fanout` as valid `type` option |
| `publishing.mdx` | Add `publishBatch()` example |
| `rabbitmq.mdx` | Add `RabbitMQSocketOptions` (TLS), `RabbitMQClientOptions` (`frameMax`, `channelMax`) |
| `event-consumers.mdx` | Add `EventConsumerClass` static members: `consumerId`, `isAcceptedVersion()`, `minVersion`, `maxVersion` |
| `message-context.mdx` | Verify `retry()` and `reply()` methods; add `MessageMetadata` + `Message<TPayload>` reference tables |
| `subscribe-options.mdx` | Verify `subscribeConsumer()` return value (unsubscribe function) is documented |
| `broker-events.mdx` | Add `"registered"` and `"default-registered"` registry events; add `BrokerRegistryEvent` reference |
