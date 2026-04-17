import { merge } from "@mongez/reinforcements";
import { type Router } from "./router";
import type { RequestHandlerType, RouteOptions } from "./types";

export class RouteBuilder {
  protected addedRoutes = {
    get: false,
    post: false,
    put: false,
    delete: false,
    patch: false,
    options: false,
    head: false,
  };

  public constructor(
    private readonly router: Router,
    private readonly path: string,
    private readonly moreOptions: RouteOptions = {},
  ) {
    //
  }

  /**
   * Add a get method to the route
   */
  public get(handler: RequestHandlerType, options: RouteOptions = {}) {
    if (this.addedRoutes.get) {
      throw new Error(`Route ${this.path} already has a GET method`);
    }

    this.addedRoutes.get = true;
    this.router.get(this.path, handler, this.withOptions(options));
    return this;
  }

  /**
   * Get one resource, appends /:id to the path
   * For example: /posts/:id
   */
  public getOne(handler: RequestHandlerType, options: RouteOptions = {}) {
    this.router.get(`${this.path}/:id`, handler, this.withOptions(options));
    return this;
  }

  /**
   * Add a post method to the route
   */
  public post(handler: RequestHandlerType, options: RouteOptions = {}) {
    if (this.addedRoutes.post) {
      throw new Error(`Route ${this.path} already has a POST method`);
    }

    this.addedRoutes.post = true;
    this.router.post(this.path, handler, this.withOptions(options));
    return this;
  }

  /**
   * Post one resource, appends /:id to the path
   * For example: /posts/:id
   */
  public postOne(handler: RequestHandlerType, options: RouteOptions = {}) {
    this.router.post(`${this.path}/:id`, handler, this.withOptions(options));
    return this;
  }

  /**
   * Add a PUT request handler for current path
   */
  public put(handler: RequestHandlerType, options: RouteOptions = {}) {
    if (this.addedRoutes.put) {
      throw new Error(`Route ${this.path} already has a PUT method`);
    }

    this.addedRoutes.put = true;
    this.router.put(this.path, handler, this.withOptions(options));
    return this;
  }

  /**
   * Update one resource, appends /:id to the path
   */
  public updateOne(handler: RequestHandlerType, options: RouteOptions = {}) {
    this.router.put(`${this.path}/:id`, handler, this.withOptions(options));
    return this;
  }

  /**
   * Add a PATCH request handler for current path
   */
  public patch(handler: RequestHandlerType, options: RouteOptions = {}) {
    if (this.addedRoutes.patch) {
      throw new Error(`Route ${this.path} already has a PATCH method`);
    }

    this.addedRoutes.patch = true;
    this.router.patch(this.path, handler, this.withOptions(options));
    return this;
  }

  /**
   * Patch one resource, appends /:id to the path
   */
  public patchOne(handler: RequestHandlerType, options: RouteOptions = {}) {
    this.router.patch(`${this.path}/:id`, handler, this.withOptions(options));
    return this;
  }

  /**
   * Add a DELETE request handler for current path
   */
  public delete(handler: RequestHandlerType, options: RouteOptions = {}) {
    if (this.addedRoutes.delete) {
      throw new Error(`Route ${this.path} already has a DELETE method`);
    }

    this.addedRoutes.delete = true;
    this.router.delete(this.path, handler, this.withOptions(options));
    return this;
  }

  /**
   * Delete one resource, appends /:id to the path
   */
  public deleteOne(handler: RequestHandlerType, options: RouteOptions = {}) {
    this.router.delete(`${this.path}/:id`, handler, this.withOptions(options));
    return this;
  }

  // ============================================================================
  // RESTful Semantic Aliases
  // ============================================================================

  /**
   * List all resources (RESTful alias for GET collection)
   * @example router.route("/posts").list(listPosts)
   */
  public list(handler: RequestHandlerType, options: RouteOptions = {}) {
    return this.get(handler, options);
  }

  /**
   * Create a new resource (RESTful alias for POST)
   * @example router.route("/posts").create(createPost)
   */
  public create(handler: RequestHandlerType, options: RouteOptions = {}) {
    return this.post(handler, options);
  }

  /**
   * Show a single resource (RESTful alias for GET one)
   * @example router.route("/posts").show(showPost) // GET /posts/:id
   */
  public show(handler: RequestHandlerType, options: RouteOptions = {}) {
    return this.getOne(handler, options);
  }

  /**
   * Update a resource (RESTful alias for PUT one)
   * @example router.route("/posts").update(updatePost) // PUT /posts/:id
   */
  public update(handler: RequestHandlerType, options: RouteOptions = {}) {
    return this.updateOne(handler, options);
  }

  /**
   * Destroy a resource (RESTful alias for DELETE one)
   * @example router.route("/posts").destroy(deletePost) // DELETE /posts/:id
   */
  public destroy(handler: RequestHandlerType, options: RouteOptions = {}) {
    return this.deleteOne(handler, options);
  }

  // ============================================================================
  // Route Nesting
  // ============================================================================

  /**
   * Create a nested route builder
   * Useful for building nested resources like /posts/:id/comments
   * @example
   * router.route("/posts/:id")
   *   .getOne(showPost)
   *   .nest("/comments")
   *     .list(listComments)      // GET /posts/:id/comments
   *     .create(createComment);  // POST /posts/:id/comments
   */
  public nest(path: string, options: RouteOptions = {}): RouteBuilder {
    const nestedPath = `${this.path}${path}`;
    const mergedOptions = this.withOptions(options);
    return new RouteBuilder(this.router, nestedPath, mergedOptions);
  }

  /**
   * Set up common RESTful CRUD routes in one call
   * @example
   * router.route("/posts").crud({
   *   list: listPosts,        // GET /posts
   *   create: createPost,     // POST /posts
   *   show: showPost,         // GET /posts/:id
   *   update: updatePost,     // PUT /posts/:id
   *   destroy: deletePost,    // DELETE /posts/:id
   *   patch: patchPost,       // PATCH /posts/:id
   * });
   */
  public crud(
    handlers: {
      list?: RequestHandlerType;
      create?: RequestHandlerType;
      show?: RequestHandlerType;
      update?: RequestHandlerType;
      destroy?: RequestHandlerType;
      patch?: RequestHandlerType;
    },
    options: RouteOptions = {},
  ) {
    if (handlers.list) this.get(handlers.list, options);
    if (handlers.create) this.post(handlers.create, options);
    if (handlers.show) this.getOne(handlers.show, options);
    if (handlers.update) this.updateOne(handlers.update, options);
    if (handlers.destroy) this.deleteOne(handlers.destroy, options);
    if (handlers.patch) this.patchOne(handlers.patch, options);
    return this;
  }

  /**
   * Merge options with moreOptions
   */
  protected withOptions(options: RouteOptions = {}) {
    return merge(this.moreOptions, options);
  }
}
