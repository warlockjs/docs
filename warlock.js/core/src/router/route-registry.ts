import FindMyWay, { type HTTPMethod, type Instance } from "find-my-way";
import type { Route } from "./types";

/**
 * Route Registry
 * Manages dynamic route matching using find-my-way for HMR support
 */
export class RouteRegistry {
  private router: Instance<any>;

  public constructor() {
    this.router = FindMyWay({
      ignoreTrailingSlash: true,
      caseSensitive: false,
    });
  }

  /**
   * Register all routes from the router's internal list
   */
  public register(routes: Route[]): void {
    // Register each route
    for (const route of routes) {
      if (route.method === "all") {
        this.registerRoute({
          ...route,
          method: "GET",
        });

        this.registerRoute({
          ...route,
          method: "POST",
        });
      } else {
        this.registerRoute(route);
      }
    }
  }

  /**
   * Register a single route
   */
  public registerRoute(route: Route): void {
    this.router.on(route.method as HTTPMethod, route.path, (req, res, params) => {
      // Store the route and params for later use
      return { route, params };
    });
  }

  /**
   * Find a matching route for the given method and URL
   * @returns Matched route with extracted params, or null if no match
   */
  public find(
    method: string,
    url: string,
  ): { route: Route; params: Record<string, string> } | null {
    // Strip query string from URL (find-my-way expects just the path)
    const path = url.split("?")[0];

    const match = this.router.find(method as HTTPMethod, path);

    if (!match) {
      return null;
    }

    // find-my-way handler expects (req, res, params, store, searchParams)
    // We only care about the return value which contains { route, params }
    return match.handler(null as any, null as any, match.params, match.store, {});
  }

  /**
   * Get all registered routes count (for debugging)
   */
  public getRouteCount(): number {
    return this.router
      .prettyPrint()
      .split("\n")
      .filter((line) => line.trim()).length;
  }
}
