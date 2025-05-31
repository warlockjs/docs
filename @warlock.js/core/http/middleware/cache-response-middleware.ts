import { except } from "@mongez/reinforcements";
import { cache } from "@warlock.js/cache";
import type { Request } from "./../request";
import type { Response } from "./../response";

// TODO: Add option to determine whether to cache the response or not
// TODO: add option to determine what to be cached from the response
// TODO: add cache middleware config options for example to set the default driver, ttl, etc

export type CacheMiddlewareOptions = {
  /**
   * Cache key
   */
  cacheKey:
    | string
    | ((request: Request) => string)
    | ((request: Request) => Promise<string>);
  /**
   * If true, then the response will be cached based on the current locale code
   * This is useful when you have a multi-language website, and you want to cache the response based on the current locale
   *
   * @default true
   */
  withLocale?: boolean;
  /**
   * List of keys from the response object to omit from the cached response
   *
   * @default ['user']
   */
  omit?: string[];
  /**
   * Expires after number of seconds
   */
  ttl?: number;
  /**
   * Cache driver
   *
   * @see config/cache.ts: drivers object
   * @default cache manager
   */
  driver?: string;
};

const defaultCacheOptions: Partial<CacheMiddlewareOptions> = {
  withLocale: true,
};

type ParsedCacheOptions = Required<CacheMiddlewareOptions> & {
  cacheKey: string;
};

async function parseCacheOptions(
  cacheOptions: CacheMiddlewareOptions | string,
  request: Request,
) {
  if (typeof cacheOptions === "string") {
    cacheOptions = {
      cacheKey: cacheOptions,
    };
  }

  if (typeof cacheOptions.cacheKey === "function") {
    cacheOptions.cacheKey = await cacheOptions.cacheKey(request);
  }

  const finalCacheOptions = {
    ...defaultCacheOptions,
    ...cacheOptions,
  } as ParsedCacheOptions;

  if (finalCacheOptions.withLocale) {
    const locale = request.getLocaleCode();

    finalCacheOptions.cacheKey = `${finalCacheOptions.cacheKey}:${locale}`;
  }

  if (!finalCacheOptions.omit) {
    finalCacheOptions.omit = ["user", "settings"];
  }

  return finalCacheOptions;
}

export function cacheMiddleware(
  responseCacheOptions: CacheMiddlewareOptions | string,
) {
  return async function (request: Request, response: Response) {
    const { ttl, omit, cacheKey, driver } = await parseCacheOptions(
      responseCacheOptions,
      request,
    );
    console.log({ ttl, omit, cacheKey, driver });

    const cacheDriver = driver ? await cache.use(driver) : cache;

    const content = await cacheDriver.get(cacheKey);

    if (content) {
      const output = content.data;

      return response.baseResponse.send(output);
    }

    response.onSent((response: Response) => {
      if (!response.isOk || response.request.path !== request.path) {
        return;
      }

      const content = {
        data: except(response.parsedBody, omit),
      };

      cacheDriver.set(cacheKey, content, ttl);
    });
  };
}
