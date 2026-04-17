import type { GenericObject } from "@mongez/reinforcements";
import type { ObjectValidator } from "@warlock.js/seal";
import type { RouteShorthandOptions } from "fastify";
import type { Request, Response, ReturnedResponse } from "../http";
import type { ResponseSchema } from "../resource/types";

/**
 * Middleware response
 */
export type MiddlewareResponse = ReturnedResponse | undefined | void;

/**
 * Middleware method
 * Receives the request and response objects
 * And returns a response object or undefined if the request should continue
 */
export type Middleware<MiddlewareRequest extends Request = Request> = {
  (request: MiddlewareRequest, response: Response): MiddlewareResponse;
};

export type RouterGroupCallback = () => void;

export type RequestHandlerType = RequestHandler<any> | [GenericObject, string];

/**
 * Resource standard methods
 */
export type ResourceMethod = "list" | "get" | "create" | "update" | "delete" | "patch";

export type RestfulMiddleware = Record<string, [Middleware]>;

export type RequestHandlerValidation<TRequest extends Request = Request> = {
  /**
   * Validation custom message
   */
  validate?: Middleware<TRequest>;
  /**
   * Define what should be validated
   * If not passed, it will be validating only body and query
   */
  validating?: ("body" | "query" | "params" | "headers")[];
  /**
   * Validation schema
   */
  schema?: ObjectValidator;
};

export interface RequestControllerContract {
  /**
   * Request object
   */
  request: Request;
  /**
   * Response object
   */
  response: Response;
  /**
   * Request Handler execution
   */
  execute(): Promise<ReturnedResponse>;
  /**
   * Request description
   */
  description?: string;
  /**
   * Request validation middleware
   */
  middleware?: () => Promise<MiddlewareResponse> | MiddlewareResponse;
}

export type RequestHandler<TRequest extends Request = Request> = {
  /**
   * Function Declaration
   */
  (request: TRequest, response: Response): ReturnedResponse | void;

  /**
   * Validation static object property which can be optional
   */
  validation?: RequestHandlerValidation<TRequest>;

  /**
   * Request Handler Description
   */
  description?: string;

  /**
   * Response schema for documentation / OpenAPI generation.
   * Keyed by HTTP status code. Each entry declares the expected response body shape.
   */
  responseSchema?: ResponseSchema;
};

export interface RouteOptions {
  /**
   * Route middleware
   */
  middleware?: Middleware[];
  /**
   * Middleware precedence to be applied before grouped middleware or after it
   */
  middlewarePrecedence?: "before" | "after";
  /**
   * Route name
   */
  name?: string;
  /**
   * Route description
   * Could be used for generating documentation
   */
  description?: string;
  /**
   * Request server options
   */
  serverOptions?: RouteShorthandOptions;
  /**
   * Set route label
   * Will be used for generating documentation
   * If not set, then Warlock will try to generate a label from the route path
   */
  label?: string;
  /**
   * Whether it is part of restful routes
   */
  restful?: boolean;
  /**
   * Mark this route as a page route that will be handled by React SSR
   */
  isPage?: boolean;
  /**
   * Rate limit options for this route
   */
  rateLimit?: {
    /**
     * Max number of requests within the time window
     */
    max: number;
    /**
     * Time window in milliseconds
     */
    timeWindow: number;
    /**
     * Error message when rate limit is exceeded
     */
    errorMessage?: string;
  };
}

export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD"
  | "all";

/**
 * Route Object
 */
export type Route = RouteOptions & {
  /**
   * Route method
   */
  method: RequestMethod;
  /**
   * Route source file (Relative path)
   */
  sourceFile: string;
  /**
   * Route path
   */
  path: string;
  /**
   * Route handler Can be a function
   * And als can have a `validation` object as a static property of the handler
   */
  handler: RequestHandler;
  /**
   * Path prefix
   * Kindly note the prefix is auto added by the router and it should be added to the path itself
   * this will be used for generating the documentation
   */
  $prefix: string;
  /**
   * Path prefix Stack
   * Kindly note the prefix is auto added by the router and it should be added to the path itself
   * this will be used for generating the documentation
   */
  $prefixStack: string[];
  /**
   * Rate limit
   */
  rateLimit?: RouteOptions["rateLimit"];
};

export type PartialPick<T, F extends keyof T> = Omit<T, F> & Partial<Pick<T, F>>;

/**
 * Grouped routes options
 */
export type GroupedRoutesOptions = {
  /**
   * Middlewares to be applied to all routes
   */
  middleware?: Middleware[];
  /**
   * Route prefix
   */
  prefix?: string;
  /**
   * Route name
   * This will be added to each route as a name prefix
   */
  name?: string;
};

/** Route resource */
export type RouteResource = {
  /**
   * list route
   */
  list?: RequestHandler;
  /**
   * Single resource route
   */
  get?: RequestHandler;
  /**
   * Create resource route
   */
  create?: RequestHandler;
  /**
   * Update resource route
   */
  update?: RequestHandler;
  /**
   * Patch resource route
   */
  patch?: RequestHandler;
  /**
   * Delete resource route
   */
  delete?: RequestHandler;
  /**
   * Delete Multiple Records
   */
  bulkDelete?: RequestHandler;
  /**
   * Validation object
   */
  validation?: {
    /**
     * Apply validation on create|update|patch combined
     */
    all?: RequestHandlerValidation<any>;
    /**
     * Create validation object
     */
    create?: RequestHandlerValidation<any>;
    /**
     * Update validation object
     */
    update?: RequestHandlerValidation<any>;
    /**
     * Patch validation object
     */
    patch?: RequestHandlerValidation<any>;
  };
};

export type RouterStacks = {
  prefix: string[];
  name: string[];
  middleware: Middleware[];
  /**
   * Source file path for routes being added (for HMR route tracking)
   */
  sourceFile?: string;
};
