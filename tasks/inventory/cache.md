# @warlock.js/cache — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package
- Dependencies: `@warlock.js/logger`

## Directory Tree

```text
src/
├── drivers/
│   ├── base-cache-driver.ts
│   ├── file-cache-driver.ts
│   ├── index.ts
│   ├── lru-memory-cache-driver.ts
│   ├── memory-cache-driver.ts
│   ├── memory-extended-cache-driver.ts
│   ├── null-cache-driver.ts
│   └── redis-cache-driver.ts
├── cache-manager.ts
├── index.ts
├── tagged-cache.ts
├── types.ts
└── utils.ts
```

## Exports by File

### src/index.ts
*Main entry point that exposes the public API for the cache system.*
- Re-exports: contents of `./cache-manager`, `./drivers`, `./tagged-cache`, `./types`, `./utils`

### src/types.ts
*Defines core interfaces, types, and error classes used across the cache package.*
- **Class** `CacheError` extends `Error`
- **Class** `CacheConnectionError` extends `CacheError`
- **Class** `CacheConfigurationError` extends `CacheError`
- **Class** `CacheDriverNotInitializedError` extends `CacheError`
- **Type** `CacheKey`
- **Type** `CacheOperationType`
- **Type** `CacheEventType`
- **Type** `CacheEventData`
- **Type** `CacheEventHandler`
- **Interface** `TaggedCacheDriver`
- **Type** `MemoryCacheOptions`
- **Type** `MemoryExtendedCacheOptions`
- **Type** `LRUMemoryCacheOptions`
- **Type** `FileCacheOptions`
- **Type** `RedisOptions`
- **Type** `NullCacheDriverOptions`
- **Interface** `CacheDriver<ClientType, Options>`
- **Type** `CacheData`
- **Type** `DriverClass`
- **Type** `CacheConfigurations<T, DriverName>`

### src/cache-manager.ts
*Central manager that handles driver switching, configuration, and global event delegation.*
- **Class** `CacheManager` implements `CacheDriver<any, any>`
  - `public currentDriver?: CacheDriver<any, any>`
  - `public loadedDrivers: Record<string, CacheDriver<any, any>>`
  - `public name: string`
  - `public get client()`
  - `public setCacheConfigurations(configurations: CacheConfigurations): void`
  - `public async use(driver: string | CacheDriver<any, any>): Promise<this>`
  - `public async get<T = any>(key: CacheKey): Promise<T | null>`
  - `public async set(key: CacheKey, value: any, ttl?: number): Promise<any>`
  - `public async remove(key: CacheKey): Promise<void>`
  - `public async removeNamespace(namespace: string): Promise<any>`
  - `public async flush(): Promise<void>`
  - `public async connect(): Promise<any>`
  - `public parseKey(key: CacheKey): string`
  - `public get options(): any`
  - `public setOptions(options: Record<string, any>): any`
  - `public async driver(driverName: string): Promise<CacheDriver<any, any>>`
  - `public async init(): Promise<void>`
  - `public async load(driver: string): Promise<CacheDriver<any, any>>`
  - `public registerDriver(driverName: string, driverClass: DriverClass): void`
  - `public async disconnect(): Promise<void>`
  - `public async has(key: CacheKey): Promise<boolean>`
  - `public async remember(key: CacheKey, ttl: number, callback: () => Promise<any>): Promise<any>`
  - `public async pull(key: CacheKey): Promise<any | null>`
  - `public async forever(key: CacheKey, value: any): Promise<any>`
  - `public async increment(key: CacheKey, value?: number): Promise<number>`
  - `public async decrement(key: CacheKey, value?: number): Promise<number>`
  - `public async many(keys: CacheKey[]): Promise<any[]>`
  - `public async setMany(items: Record<string, any>, ttl?: number): Promise<void>`
  - `public on(event: CacheEventType, handler: CacheEventHandler): this`
  - `public off(event: CacheEventType, handler: CacheEventHandler): this`
  - `public once(event: CacheEventType, handler: CacheEventHandler): this`
  - `public async setNX(key: CacheKey, value: any, ttl?: number): Promise<boolean>`
  - `public tags(tags: string[]): TaggedCacheDriver`
- **Constant** `cache: CacheManager`


### src/tagged-cache.ts
*Provides a wrapper for managing cache entries associated with specific tags for group invalidation.*
- **Class** `TaggedCache` implements `TaggedCacheDriver`

### src/utils.ts
*Provides helper functions for key parsing and common time-to-live duration presets.*
- **Function** `parseCacheKey(key: CacheKey, options: { globalPrefix?: string | (() => string) }): string`
- **Enum** `CACHE_FOR`

### src/drivers/index.ts
*Barrel file for all officially supported cache drivers.*
- Re-exports: contents of `./base-cache-driver`, `./file-cache-driver`, `./lru-memory-cache-driver`, `./memory-cache-driver`, `./memory-extended-cache-driver`, `./null-cache-driver`, `./redis-cache-driver`

### src/drivers/base-cache-driver.ts
*Abstract base class providing common logic, event handling, and logging for all cache drivers.*
- **Class** `BaseCacheDriver<ClientType, Options>` implements `CacheDriver<ClientType, Options>`

### src/drivers/file-cache-driver.ts
*Implementation of a cache driver that stores data as JSON files on the local filesystem.*
- **Class** `FileCacheDriver` extends `BaseCacheDriver`

### src/drivers/lru-memory-cache-driver.ts
*Memory-based cache driver implementing a Least-Recently-Used (LRU) eviction policy.*
- **Class** `LRUMemoryCacheDriver` extends `BaseCacheDriver`

### src/drivers/memory-cache-driver.ts
*Standard in-memory cache driver with support for TTL-based expiration and size limits.*
- **Class** `MemoryCacheDriver` extends `BaseCacheDriver`

### src/drivers/memory-extended-cache-driver.ts
*An extension of the memory driver that refreshes the TTL of an item every time it is accessed.*
- **Class** `MemoryExtendedCacheDriver` extends `MemoryCacheDriver`

### src/drivers/null-cache-driver.ts
*A dummy cache driver that performs no actual storage, useful for testing or disabling caching.*
- **Class** `NullCacheDriver` extends `BaseCacheDriver`

### src/drivers/redis-cache-driver.ts
*High-performance cache driver using Redis as the storage backend with native TTL support.*
- **Class** `RedisCacheDriver` extends `BaseCacheDriver`
