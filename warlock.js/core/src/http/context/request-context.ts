import type { Model } from "@warlock.js/cascade";
import { Context, contextManager } from "@warlock.js/context";
import type { Request } from "../request";
import type { Response } from "../response";

/**
 * Request Context Store
 */
export type RequestContextStore<User extends Model = Model> = {
  request: Request<User>;
  response: Response;
};

/**
 * Request Context
 *
 * Manages request-scoped data (request, response, user) using AsyncLocalStorage.
 * Extends the base Context class for consistent API.
 */
class RequestContext<User extends Model = Model> extends Context<RequestContextStore<User>> {
  /**
   * Get the current request
   */
  public getRequest(): Request<User> | undefined {
    return this.get("request");
  }

  /**
   * Get the current response
   */
  public getResponse(): Response | undefined {
    return this.get("response");
  }

  /**
   * Get the current user
   */
  public getUser(): User | undefined {
    return this.getRequest()?.user;
  }

  /**
   * Build the initial request store from HTTP context
   */
  public buildStore(payload?: Record<string, any>): RequestContextStore<User> {
    return {
      request: payload?.request,
      response: payload?.response,
    };
  }
}

/**
 * Global request context instance
 */
export const requestContext = new RequestContext();

contextManager.register("request", requestContext);

/**
 * Use request store (for backward compatibility)
 */
export function useRequestStore<UserType extends Model = Model>() {
  return (requestContext.getStore() || {}) as RequestContextStore<UserType>;
}

export function useRequest<UserType extends Model = Model>() {
  return requestContext.getRequest() as Request<UserType>;
}

export function useCurrentUser<UserType extends Model = Model>() {
  return requestContext.getUser() as UserType;
}
