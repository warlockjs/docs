/**
 * The purpose of this middleware is to create a separate context for each request
 * So classes and functions can access only current request and response in the context
 */

// use async_hooks to create a new context for each request
import { trans } from "@mongez/localization";
import type { Model } from "@warlock.js/cascade";
import { AsyncLocalStorage } from "async_hooks";
import { type Request } from "../request";
import { type Response } from "../response";
import { type ReturnedResponse } from "./../types";

export type Context<User extends Model = Model> = {
  request: Request<User>;
  response: Response;
  user: User;
};

// create a new instance of AsyncLocalStorage

const asyncLocalStorage = new AsyncLocalStorage<Context>();

export function createRequestStore(
  request: Request<any>,
  response: Response,
): Promise<ReturnedResponse> {
  // store the request and response in the context
  return new Promise<ReturnedResponse>((resolve, reject) => {
    asyncLocalStorage.run(
      {
        request,
        response,
        get user() {
          return request.user;
        },
      },
      async () => {
        //
        try {
          const result = await request.runMiddleware();

          if (result) {
            return resolve(result);
          }

          request.trigger("executingAction", request.route);

          const handler = request.getHandler();

          request.log("Executing Handler", "info");

          const output = await handler(request, response);

          request.log("Handler Executed Successfully", "success");

          // call executedAction event
          request.trigger("executedAction", request.route);

          resolve(output as ReturnedResponse);
        } catch (error: any) {
          reject(error);
          return response.badRequest({
            error: error.message,
          });
        }
      },
    );
  });
}

/**
 * Get Request Context
 *
 * @deprecated use `useRequestStore` instead
 */
export function requestContext<UserType extends Model = Model>() {
  // get the context from the current execution
  return (asyncLocalStorage.getStore() || {}) as Context<UserType>;
}

/**
 * Get current request object
 */
export function currentRequest(): Request | undefined {
  return useRequestStore().request;
}

/**
 * Get the request store
 */
export function useRequestStore<UserType extends Model = Model>() {
  // get the context from the current execution
  return (asyncLocalStorage.getStore() || {}) as Context<UserType>;
}

export function t(keyword: string, placeholders?: any) {
  const { request } = useRequestStore();

  return request?.trans(keyword, placeholders) || trans(keyword);
}

/**
 * Get the value of the given key from the request
 * If not found, then execute the given callback and store its result in the request then return it
 */
export async function fromRequest<T>(
  key: string,
  callback: (request?: Request) => Promise<T>,
): Promise<T> {
  const request = currentRequest();

  if (!request) return await callback();

  if (request[key]) return request[key];

  request[key] = await callback(request);

  return request[key];
}
