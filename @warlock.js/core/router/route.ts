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
   * Postman options
   */
  public postman(options: RouteData["postman"]) {
    this.data.postman = options;

    return this;
  }
}
