/**
 * The purpose of this middleware is to create a separate context for each request
 * So classes and functions can access only current request and response in the context
 */
import { trans } from "@mongez/localization";
import type { Model } from "@warlock.js/cascade";
import { createStore, useStore } from "../../store";
import type { Request } from "../request";
import type { Response } from "../response";

export type Context<User = any> = {
  request: Request<User>;
  response: Response;
  user: User;
};

// create a new instance of AsyncLocalStorage

export function createuseRequestStore(
  request: Request<any>,
  response: Response,
) {
  // store the request and response in the context
  return new Promise((resolve, reject) => {
    createStore(
      "request",
      {
        request,
        response,
        get user() {
          return request.user;
        },
      },
      async () => {
        try {
          const result = await request.runMiddleware();

          if (result) {
            return resolve(result);
          }

          request.trigger("executingAction", request.route);

          const handler = request.getHandler();

          await handler(request, response);

          // call executedAction event
          request.trigger("executedAction", request.route);
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
export function requestContext<
  UserType extends Model = Model,
>(): Context<UserType> {
  return useRequestStore<UserType>();
}

/**
 * Get the request store
 */
export function useRequestStore<
  UserType extends Model = Model,
>(): Context<UserType> {
  // get the context from the current execution
  return useStore<Context<UserType>>("request") || ({} as Context<UserType>);
}

/**
 * Translate the given keyword
 */
export function t(keyword: string, placeholders?: any) {
  const { request } = useRequestStore();

  return request?.trans(keyword, placeholders) || trans(keyword);
}

/**
 * Get the value of the given key from the current request
 * If not found, then execute the given callback and store its result in the request then return it
 * If this function called outside the request context, it will return the result of the callback every time
 */
export async function fromRequest<T>(
  key: string,
  callback: (request: Request) => Promise<T>,
): Promise<T> {
  const { request } = useRequestStore();

  if (!request) return await callback(request);

  if (request[key]) return request[key];

  request[key] = await callback(request);

  return request[key];
}
