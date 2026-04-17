export { DatabaseCacheDriver } from "./database-cache-driver";
export type { DatabaseCacheOptions } from "./database-cache-driver";

// Auto-register database cache driver
import { cache } from "@warlock.js/cache";
import { DatabaseCacheDriver } from "./database-cache-driver";

cache.registerDriver("database", DatabaseCacheDriver);
