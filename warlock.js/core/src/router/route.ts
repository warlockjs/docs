import type { Route as RouteData } from "./types";

export class Route {
  public constructor(public data: RouteData) {}

  /**
   * Set route name
   */
  public name(name: string) {
    this.data.name = name;

    return this;
  }

  /**
   * Set route middleware
   */
  public middleware(middleware: RouteData["middleware"]) {
    this.data.middleware = middleware;

    return this;
  }

  /**
   * Set route description
   */
  public description(description: string) {
    this.data.description = description;

    return this;
  }

  /**
   * Set route label
   */
  public label(label: string) {
    this.data.label = label;

    return this;
  }

  /**
   * Set route path
   */
  public path(path: string) {
    this.data.path = path;

    return this;
  }

  /**
   * Set route method
   */
  public method(method: RouteData["method"]) {
    this.data.method = method;

    return this;
  }

  /**
   * Set route handler
   */
  public handler(handler: RouteData["handler"]) {
    this.data.handler = handler;

    return this;
  }
}
