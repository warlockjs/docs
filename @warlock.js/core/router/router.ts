/* eslint-disable @typescript-eslint/no-non-null-assertion */
import proxy, { type FastifyHttpProxyOptions } from "@fastify/http-proxy";
import fastifyStatic, { type FastifyStaticOptions } from "@fastify/static";
import concatRoute from "@mongez/concat-route";
import { ltrim, merge, toCamelCase, trim } from "@mongez/reinforcements";
import { isEmpty } from "@mongez/supportive-is";
import { log } from "@warlock.js/logger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Request } from "../http/request";
import { Response } from "../http/response";
import { type FastifyInstance } from "../http/server";
import type {
  GroupedRoutesOptions,
  ResourceMethod,
  Route,
  RouteHandler,
  RouteHandlerType,
  RouteHandlerValidation,
  RouteOptions,
  RouteResource,
  RouterGroupCallback,
  RouterStacks,
} from "./types";

export class Router {
  /**
   * Routes list
   */
  private routes: Route[] = [];

  /**
   * Router Instance
   */
  private static instance: Router;

  /**
   * Static paths
   */
  protected staticDirectories: FastifyStaticOptions[] = [];

  /**
   * Event listeners
   */
  protected eventListeners: Record<
    string,
    ((router: Router, server: FastifyInstance) => void)[]
  > = {};

  /**
   * Stacks
   * Stacks will be used for grouping routes to add prefix, name or middleware
   */
  protected stacks: RouterStacks = {
    prefix: [],
    name: [],
    middleware: [],
  };

  /**
   * Get router instance
   */
  public static getInstance() {
    if (!Router.instance) {
      Router.instance = new Router();
    }

    return Router.instance;
  }

  private constructor() {
    //
  }

  /**
   * Listen to router before scan
   */
  public beforeScanning(
    callback: (router: Router, server: FastifyInstance) => void,
  ) {
    this.eventListeners.beforeScan = [
      ...(this.eventListeners.beforeScan || []),
      callback,
    ];

    return this;
  }

  /**
   * Listen to router after scanning
   */
  public afterScanning(
    callback: (router: Router, server: FastifyInstance) => void,
  ) {
    this.eventListeners.afterScanning = [
      ...(this.eventListeners.afterScanning || []),
      callback,
    ];

    return this;
  }

  /**
   * Redirect path to another path
   */
  public redirect(
    from: string,
    to: string,
    redirectMode: "temporary" | "permanent" = "temporary",
  ) {
    return this.get(from, (_request, response) => {
      response.redirect(to, redirectMode === "temporary" ? 302 : 301);
    });
  }

  /**
   * Server static folder
   */
  public directory(options: FastifyStaticOptions) {
    this.staticDirectories.push(options);

    return this;
  }

  /**
   * Serve file
   */
  public file(path: string, location: string, cacheTime?: number) {
    return this.get(path, (_request, response) => {
      response.sendFile(location, cacheTime);
    });
  }

  /**
   * Serve cached file, it will cache the file to 1 year by default
   */
  public cachedFile(path: string, location: string, cacheTime?: number) {
    return this.get(path, (_request, response) => {
      response.sendCachedFile(location, cacheTime);
    });
  }

  /**
   * Serve list of files
   */
  public files(files: Record<string, string>, cacheTime?: number) {
    for (const [path, location] of Object.entries(files)) {
      this.get(path, (_request, response) => {
        response.sendFile(location, cacheTime);
      });
    }
  }

  /**
   * Serve list of cached files, it will cache the file to 1 year by default
   */
  public cachedFiles(files: Record<string, string>, cacheTime?: number) {
    for (const [path, location] of Object.entries(files)) {
      this.get(path, (_request, response) => {
        response.sendCachedFile(location, cacheTime);
      });
    }
  }

  /**
   * Add proxy route
   */
  public proxy(options: FastifyHttpProxyOptions) {
    this.beforeScanning((_router, server) => {
      server.register(proxy, options);
    });

    return this;
  }

  /**
   * Add route to routes list
   */
  public add(
    method: Route["method"],
    path: string | string[],
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    if (Array.isArray(path)) {
      path.forEach(p => this.add(method, p, handler, options));
      return this;
    }

    const prefix = this.stacks.prefix.reduce((path, prefix) => {
      return concatRoute(path, prefix);
    }, "");

    const name = this.stacks.name.reduceRight(
      (name, prefixName) => {
        return trim(prefixName + "." + name, ".");
      },
      options.name || trim(path.replace(/\//g, "."), "."),
    );

    path = concatRoute(prefix, path);

    const middlewarePrecedence = options.middlewarePrecedence || "after";

    if (middlewarePrecedence === "before") {
      options.middleware = [
        ...(options.middleware || []),
        ...this.stacks.middleware,
      ];
    } else {
      options.middleware = [
        ...this.stacks.middleware,
        ...(options.middleware || []),
      ];
    }

    if (Array.isArray(handler)) {
      const [controller, action] = handler;

      if (typeof controller[action] !== "function") {
        throw new Error(
          `Invalid controller action "${action}" for controller "${controller.constructor.name}"`,
        );
      }

      handler = controller[action].bind(controller) as RouteHandler;

      if (!handler.validation) {
        handler.validation = {};
        if (controller[`${action}ValidationRules`]) {
          handler.validation.rules = controller[`${action}ValidationRules`]();
        }

        if (controller[`${action}ValidationSchema`]) {
          handler.validation.schema = controller[`${action}ValidationSchema`]();
        }

        if (controller[`${action}Validate`]) {
          handler.validation.validate = controller[`${action}Validate`];
        }
      }
    }

    if (handler.validation?.rules) {
      // log.warn(
      //   "route",
      //   "DEPRECATED",
      //   `${method} ${path} "validation.rules" property is deprecated, use "validation.schema" instead`,
      // );
    }

    const routeData: Route = {
      method,
      path,
      handler,
      ...options,
      name,
      $prefix: prefix || "/",
      // it must be a new array to avoid modifying the original array
      $prefixStack: [...this.stacks.prefix],
    };

    if (routeData.name) {
      // check if the name exists
      const route = this.routes.find(route => route.name === routeData.name);

      if (route) {
        // check again if the route name exists with the same method
        if (route.method === routeData.method) {
          throw new Error(`Route name "${routeData.name}" already exists`);
        } else {
          routeData.name += `.${routeData.method.toLowerCase()}`;
        }
      }
    }

    this.routes.push(routeData);

    return this;
  }

  /**
   * Add a request that accepts all methods
   */
  public any(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("all" as Route["method"], path, handler, options);
  }

  /**
   * Add get request method
   */
  public get(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("GET", path, handler, options);
  }

  /**
   * Add post request method
   */
  public post(
    path: string | string[],
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("POST", path, handler, options);
  }

  /**
   * Add put request method
   */
  public put(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("PUT", path, handler, options);
  }

  /**
   * Add delete request method
   */
  public delete(
    path: string | string[],
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("DELETE", path, handler, options);
  }

  /**
   * Add patch request method
   */
  public patch(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("PATCH", path, handler, options);
  }

  /**
   * Add head request method
   */
  public head(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("HEAD", path, handler, options);
  }

  /**
   * Add options request method
   */
  public options(
    path: string,
    handler: RouteHandlerType,
    options: RouteOptions = {},
  ) {
    return this.add("OPTIONS", path, handler, options);
  }

  /**
   * Add full restful resource routes
   * This method will generate the following routes:
   * 1. GET /path: list all resources
   * 2. GET /path/:id: get a single resource
   * 3. POST /path: create a new resource
   * 4. PUT /path/:id: update a resource
   * 5. DELETE /path/:id: delete a resource
   * 6. PATCH /path/:id: update a resource partially
   */
  public restfulResource(
    path: string,
    resource: RouteResource,
    options: RouteOptions & {
      only?: ResourceMethod[];
      except?: ResourceMethod[];
      replace?: Partial<Record<ResourceMethod, RouteHandler>> & {
        bulkDelete?: RouteHandler;
      };
    } = {},
  ) {
    return this.prefix(path, () => {
      path = "";
      // get base resource name
      const baseResourceName = options.name || toCamelCase(ltrim(path, "/"));

      // clone the resource so we don't mess up with it
      const routeResource = resource;

      const isAcceptableResource = (type: ResourceMethod) => {
        return Boolean(
          // check if the route is not excluded
          (!options.except || !options.except.includes(type)) &&
            // check if the only option is set and the route is included
            (!options.only || options.only.includes(type)),
        );
      };

      if (routeResource.list && isAcceptableResource("list")) {
        const resourceName = baseResourceName + ".list";
        this.get(
          path,
          options.replace?.list || routeResource.list.bind(routeResource),
          {
            ...options,
            name: resourceName,
            restful: true,
          },
        );
      }

      if (routeResource.get && isAcceptableResource("get")) {
        const resourceName = baseResourceName + ".single";

        this.get(
          path + "/:id",
          options.replace?.get || routeResource.get.bind(routeResource),
          {
            ...options,
            name: resourceName,
            restful: true,
          },
        );
      }

      if (routeResource.create && isAcceptableResource("create")) {
        const resourceName = baseResourceName + ".create";

        const handler =
          options.replace?.create ||
          this.manageValidation(routeResource, "create");

        this.post(path, handler, {
          ...options,
          name: resourceName,
          restful: true,
        });
      }

      if (routeResource.update && isAcceptableResource("update")) {
        const resourceName = baseResourceName + ".update";

        const handler =
          options.replace?.update ||
          this.manageValidation(routeResource, "update");

        this.put(path + "/:id", handler, {
          ...options,
          name: resourceName,
          restful: true,
        });
      }

      if (routeResource.patch && isAcceptableResource("patch")) {
        const resourceName = baseResourceName + ".patch";

        const handler =
          options.replace?.patch ||
          this.manageValidation(routeResource, "patch");

        this.patch(path + "/:id", handler, {
          ...options,
          name: resourceName,
          restful: true,
        });
      }

      if (routeResource.delete && isAcceptableResource("delete")) {
        const resourceName = baseResourceName + ".delete";

        this.delete(
          path + "/:id",
          options.replace?.delete || routeResource.delete.bind(routeResource),
          {
            ...options,
            name: resourceName,
            restful: true,
          },
        );
      }

      if (routeResource.bulkDelete && isAcceptableResource("delete")) {
        const resourceName = baseResourceName + ".bulkDelete";

        this.delete(
          path,
          options.replace?.bulkDelete ||
            routeResource.bulkDelete.bind(routeResource),
          {
            ...options,
            name: resourceName,
            restful: true,
          },
        );
      }

      return this;
    });
  }

  /**
   * Group routes with options
   */
  public group(options: GroupedRoutesOptions, callback: RouterGroupCallback) {
    const {
      prefix,
      // name must always be defined because
      // if there are multiple groups without name
      // they might generate the same route name
      // thus causing an error
      // in this case we need always to make sure that
      // the name is always defined.
      name = prefix ? trim(prefix.replace(/\//g, "."), ".") : undefined,
      middleware,
    } = options;

    if (prefix) {
      this.stacks.prefix.push(prefix);
    }

    if (name) {
      this.stacks.name.push(name);
    }

    if (middleware) {
      this.stacks.middleware.push(...middleware);
    }

    callback();

    if (prefix) {
      this.stacks.prefix.pop();
    }

    if (name) {
      this.stacks.name.pop();
    }

    if (middleware) {
      this.stacks.middleware.splice(
        this.stacks.middleware.length - middleware.length,
        middleware.length,
      );
    }

    return this;
  }

  /**
   * Add prefix to all routes in the given callback
   */
  public prefix(prefix: string, callback: () => void) {
    return this.group({ prefix }, callback);
  }

  /**
   * Manage validation system for the given resource
   */
  private manageValidation(
    resource: RouteResource,
    method: "create" | "update" | "patch",
  ) {
    const handler = resource[method]?.bind(resource) as RouteHandler;

    const methodValidation = resource?.validation?.[method];

    if (method === "patch") {
      handler.validation = methodValidation;

      if (handler.validation?.validate) {
        handler.validation.validate =
          handler.validation.validate.bind(resource);
      }

      if (resource.validation?.patch) {
        handler.validation = merge(
          resource.validation.patch,
          handler.validation,
        );
      }

      return handler;
    }

    if (!resource.validation || (!methodValidation && !resource.validation.all))
      return handler;

    if (resource.validation.all) {
      const validationMethods = {
        all: resource?.validation?.all?.validate,
        [method]: methodValidation?.validate,
      };

      const validation: RouteHandlerValidation = {};

      if (resource.validation.all.rules || methodValidation?.rules) {
        validation.rules = merge(
          resource.validation.all.rules,
          methodValidation?.rules,
        );
      }

      if (validationMethods.all || validationMethods[method]) {
        validation.validate = async (request: Request, response: Response) => {
          if (validationMethods.all) {
            const output = await validationMethods.all.call(
              resource,
              request,
              response,
            );

            if (output) return output;
          }

          if (validationMethods[method]) {
            return await validationMethods[method]?.call(
              resource,
              request,
              response,
            );
          }

          return;
        };
      }

      if (!isEmpty(validation)) {
        handler.validation = validation;
      }
    } else {
      handler.validation = resource.validation[method];

      if (handler.validation?.validate) {
        handler.validation.validate =
          handler.validation.validate.bind(resource);
      }
    }

    return handler;
  }

  /**
   * Get all routes list
   */
  public list() {
    return this.routes;
  }

  /**
   * Register routes to the server
   */
  public scan(server: FastifyInstance) {
    this.eventListeners.beforeScan?.forEach(callback => callback(this, server));

    this.routes.forEach(route => {
      const requestMethod = route.method.toLowerCase();
      const requestMethodFunction = server[requestMethod].bind(server);

      requestMethodFunction(
        route.path,
        route.serverOptions || {},
        async (baseRequest: FastifyRequest, reply: FastifyReply) => {
          const { output, response } = await this.handleRoute(route)(
            baseRequest,
            reply,
          );

          return output || response.baseResponse;
        },
      );
    });

    for (const directoryOptions of this.staticDirectories) {
      server.register(fastifyStatic, {
        ...directoryOptions,
        decorateReply: false,
      });
    }

    this.eventListeners.afterScanning?.forEach(callback =>
      callback(this, server),
    );
  }

  /**
   * Get the route path for the given route name
   */
  public route(name: string, params: any = {}) {
    const route = this.routes.find(route => route.name === name);

    if (!route) {
      throw new Error(`Route name "${name}" not found`);
    }

    let path = route.path;

    if (route.path.includes(":")) {
      Object.keys(params).forEach(key => {
        path = path.replace(":" + key, params[key]);
      });
    }

    return path;
  }

  /**
   * Handle the given route
   */
  private handleRoute(route: Route) {
    return async (
      fastifyRequest: FastifyRequest,
      fastifyResponse: FastifyReply,
    ) => {
      const request = new Request();
      const response = new Response();
      response.setResponse(fastifyResponse);
      request.response = response;

      response.request = request;

      request.setRequest(fastifyRequest).setRoute(route);

      Request.current = request;

      log.info({
        module: "route",
        action: route.method + " " + route.path.replace("/*", ""),
        message: `Starting Request: ${request.id}`,
        context: {
          request,
          response,
        },
      });

      const result = await request.execute();

      return {
        output: result,
        response,
        request,
      };
    };
  }
}

export const router = Router.getInstance();
