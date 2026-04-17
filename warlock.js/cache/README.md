# Warlock Cache

Cache manager for nodejs applications.

## Features

- **Simple**: The cache manager is simple to use, you can cache any data you want with just a few lines of code.
- **Multiple Drivers**: The cache manager supports `+6` drivers, you can use the memory driver, redis driver, or create your own custom driver.
- **Custom Drivers**: You can create your own custom driver, the cache manager is designed to be extensible.
- **Unified Configurations**: The cache manager allows you to define the cache configurations in one place, and use them across the application.
- **Multiple Drivers Usage**: the default cache driver is used by the cache manager, however, you can use any other driver for certain tasks.
- **Global Prefix**: Every driver has a global prefix function, this function is called each time an operation is performed, and it returns a string, this string is used as a prefix for the key.
- **Namespace**: The cache manager allows you to clear the cache for a specific namespace, this is useful when working with multi-tenant applications.

## Installation

`yarn create @mongez/warlock.cache`

Or

`npx create @mongez/warlock.cache`

Or

`pnpm create @mongez/warlock.cache`

## Configurations

First step, we need to define the cache configurations, in your configuration directory create a file to define the cache configurations.

```ts
import {
  cache,
  type CacheConfigurations,
  MemoryCacheDriver,
} from "@mongez/warlock.cache";

const configurations: CacheConfigurations = {
  drivers: {
    memory: MemoryCacheDriver,
  },
  default: "memory",
  memory: {
    // time of expiration in seconds
    ttl: 60 * 60 * 24 * 7, // 7 days
  },
};

cache.setCacheConfigurations(configurations);
```

This will allow using memory cache driver, which will cache the data in the memory, and it will be removed when the application is restarted.

## Usage

It is that just simple, you can use the cache manager to cache any data you want.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // get the name from the cache
  const name = await cache.get("name");

  // if the name is not cached, we will get null, we can set a default value
  const name = await cache.get("name", "default name");
}
```

## Setting Values

To set a value, we can use the `set` method.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // set the name in the cache
  await cache.set("name", "John Doe");

  // set the name in the cache for 10 minutes
  await cache.set("name", "John Doe", 60 * 10);
}
```

### Storing objects and arrays

By default, the cache manager out of the box handles primitive values along with objects and arrays, they are serialized into string if the driver allows only primitive values then deserialized when getting the value, if the driver allows setting objects and arrays, then they will be stored as is like in the memory driver.

## Removing Values

To remove a value from the cache, we can use the `remove` method.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // remove the name from the cache
  await cache.remove("name");
}
```

## Clearing the Cache

To clear the cache, we can use the `flush` method.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // clear the cache
  await cache.flush();
}
```

## Clearing By Namespace

In some situations, we need to clear the cache for a specific namespace, for example, we have a cache for the user profile, and we need to clear it when the user updates his profile, we can use the `removeByNamespace` method.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // set user profile
  await cache.set("user.profile", { name: "John Doe" });

  // set user totals

  await cache.set("user.totals", { posts: 10, comments: 20 });

  // clear the cache
  await cache.removeByNamespace("user");
}
```

This will remove both `user.profile` and `user.totals` from the cache.

It could be useful when working with multi tenant applications, we can use the tenant ID as a namespace, and when we need to clear the cache for a specific tenant, we can use the `removeByNamespace` method.

## Global Prefix

Every driver's options have by default `globalPrefix` async function, this function is called each time an operation is performed, and it returns a string, this string is used as a prefix for the key, let's add it to our memory driver.

```ts
import {
  cache,
  type CacheConfigurations,
  MemoryCacheDriver,
} from "@mongez/warlock.cache";

const configurations: CacheConfigurations = {
  drivers: {
    memory: MemoryCacheDriver,
  },
  default: "memory",
  memory: {
    // time of expiration in seconds
    ttl: 60 * 60 * 24 * 7, // 7 days
    globalPrefix: async () => {
      // get the current client ID
      const clientId = await getCurrentClientId();

      // return the prefix
      return `client-${clientId}`;
    },
  },
};

cache.setCacheConfigurations(configurations);
```

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // set the name in the cache
  await cache.set("name", "John Doe"); // will be stored as client-1:name
}
```

## Available Drivers

The cache manager is shipped with 4 drivers:

- [Null Cache Driver](#null-cache-driver): This is the default used driver, it doesn't cache anything, it is useful for mocking the cache implementation.
- [Memory Cache Driver](#memory-cache-driver): This driver caches the data in the memory, it means that the data will be removed when the application is restarted.
- [Memory Extended Cache Driver](#memory-extended-cache-driver): Memory Cache Driver with extended **TTL**.
- [LRU Cache Driver](#lru-cache-driver): This driver caches the data in the memory with LRU algorithm.
- [Redis Cache Driver](#redis-cache-driver): This driver caches the data in the redis server.
- [File Cache Driver](#file-cache-driver): This driver caches the data in the file system.

### Redis Cache Driver

[Redis](https://redis.io/) is a popular cache driver, it is fast and reliable, to use it, we just need to define the driver and its configurations in the settings, the package is installed by default, so we don't need to install it.

```ts
import {
  cache,
  type CacheConfigurations,
  MemoryCacheDriver,
  RedisCacheDriver,
} from "@mongez/warlock.cache";

const configurations: CacheConfigurations = {
  drivers: {
    memory: MemoryCacheDriver,
    redis: RedisCacheDriver,
  },
  default: "redis",
  options: {
    redis: {
      // time of expiration in seconds
      ttl: 60 * 60 * 24 * 7, // 7 days
      // the redis connection options
      host: "127.0.0.1",
      port: 6379,
    },
  },
};

cache.setCacheConfigurations(configurations);
```

You can also pass `url` option directly if you're using a remote redis server.

```ts
const configurations: CacheConfigurations = {
  drivers: {
    memory: MemoryCacheDriver,
    redis: RedisCacheDriver,
  },
  default: "redis",
  options: {
    redis: {
      // time of expiration in seconds
      ttl: 60 * 60 * 24 * 7, // 7 days
      // the redis connection options
      url: "redis://host:port",
    },
  },
};

cache.setCacheConfigurations(configurations);
```

Any other options that are not defined in the driver options will be passed to the redis client, so you can pass any other options that are supported by the redis client.

```ts
import { cache, RedisCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    redis: RedisCacheDriver,
  },
  default: "redis",
  options: {
    redis: {
      // time of expiration in seconds
      ttl: 60 * 60 * 24 * 7, // 7 days
      // the redis connection options
      ...redisConnectionOptions,
    },
  },
});
```

> Redis is a dependency to this package so you don't need to install it manually.

### Memory Cache Driver

This driver caches the data in the memory, it means that the data will be removed when the application is restarted.

```ts
import { cache, MemoryCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    memory: MemoryCacheDriver,
  },
  default: "memory",
});
```

### Memory Extended Cache Driver

Works exactly like the Memory Cache Driver, the main difference is that whenever the cache is hit, the TTL is extended by the same amount of time.

For example, if a cache value is set to expire in 10 minutes, and it is hit after 5 minutes, the TTL will be reset again to be 10 minutes.

```ts
import { cache, MemoryExtendedCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    memoryExtended: MemoryExtendedCacheDriver,
  },
  default: "memoryExtended",
});
```

You can also define it as a replacement to `MemoryCacheDriver` as it already extends it:

```ts
import { cache, MemoryExtendedCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    memory: MemoryExtendedCacheDriver,
  },
  default: "memory",
});
```

Example of usage:

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // set the name in the cache
  await cache.set("name", "John Doe", 60 * 10); // will be stored for 10 minutes

  // later after 3 minutes...

  // get the name from the cache
  const name = await cache.get("name"); // will be stored for 10 minutes from now
}
```


### LRU Cache Driver

[LRU Cache](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)) is a cache driver that caches the data in the memory with LRU algorithm.

So how this works? The LRU cache driver will store the data in the memory, and when the memory is full, it will remove the least recently used item.

```ts
import { cache, LRUCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    lru: LRUCacheDriver,
  },
  default: "lru",
  options: {
    lru: {
      // the maximum number of items to be stored in the cache, default to 1000
      max: 1000,
    },
  },
});
```

> At the time being, there is no TTL for this driver

### File Cache Driver

This driver caches the data in the file system.

```ts
import { cache, FileCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    file: FileCacheDriver,
  },
  default: "file",
  options: {
    file: {
      // time of expiration in seconds
      ttl: 60 * 60 * 24 * 7, // 7 days
      // the directory to store the cache files
      directory: "path/to/cache/directory",
    },
  },
});
```

### Null Cache Driver

This driver doesn't cache anything, it is useful for mocking the cache implementation.

```ts
import { cache, NullCacheDriver } from "@mongez/warlock.cache";

cache.setCacheConfigurations({
  drivers: {
    null: NullCacheDriver,
  },
  default: "null",
});
```

## Custom Drivers

To create a custom driver, we need to create a class that implements the `CacheDriver` interface

```ts
export interface CacheDriver<ClientType, Options> {
  /**
   * The cache driver options
   */
  options: Options;
  /**
   * Cache driver name
   */
  name: string;
  /**
   *  Remove all cached items by namespace
   */
  removeNamespace(namespace: string): Promise<any>;
  /**
   * Set the cache driver options
   */
  setOptions(options: Options): any;
  /**
   * Parse the key to be used in the cache
   */
  parseKey(key: string | GenericObject): Promise<string>;
  /**
   * Set a value in the cache
   *
   * @param key The cache key, could be an object or string
   * @param value The value to be stored in the cache
   * @param ttl The time to live in seconds
   */
  set(key: string | GenericObject, value: any, ttl?: number): Promise<any>;
  /**
   * Get a value from the cache
   */
  get(key: string | GenericObject): Promise<any | null>;
  /**
   * Remove a value from the cache
   */
  remove(key: string | GenericObject): Promise<void>;
  /**
   * Flush the entire cache
   */
  flush(): Promise<void>;
  /**
   * Connect to the cache driver
   */
  connect(): Promise<any>;
  /**
   * The cache client
   */
  client?: ClientType;
}
```

## Base Cache Driver

This is an abstract class that implements the `CacheDriver` interface, it handles multiple things for you, like **logging**, **parsing TTL** and **parsing key** so we can easily create a new driver by extending this class.

```ts
import { BaseCacheDriver, type CacheDriver } from "@mongez/warlock.cache";

export class MyCacheDriver
  extends BaseCacheDriver<>
  implements CacheDriver<any, any>
{
  /**
   * The cache driver name
   */
  public name = "database";

  /**
   * Database connection
   */
  public connection: any;

  /**
   * Connect to the cache driver
   */
  public async connect() {
    // connect to database
    // options are handled by the base class
    this.connection = await connectToDatabase(this.options);
  }

  /**
   * Set a value in the cache
   *
   * @param key The cache key, could be an object or string
   * @param value The value to be stored in the cache
   * @param ttl The time to live in seconds
   */
  public async set(key: string | GenericObject, value: any, ttl?: number) {
    // set the value in the database
  }

  /**
   * Get a value from the database
   */
  public async get(key: string | GenericObject) {
    // get the value from the database
  }

  /**
   * Remove a value from the database
   */
  public async remove(key: string | GenericObject) {
    // remove the value from the database
  }

  /**
   * Flush the entire cache
   */
  public async flush() {
    // flush the database
  }
}
```

## Using certain drivers

The `cache` manager will always use the default cache you set in the cache options, however, you could use any another driver for certain tasks by calling `use` method, this method receives the driver name and return the driver instance, if the driver is not loaded yet it will be loaded (and connected) before returning the driver instance.

```ts
import { cache } from "@mongez/warlock.cache";

async function main() {
  // set the name in the cache
  const redis = cache.use("redis");
  const memory = cache.use("memory");
}
```
