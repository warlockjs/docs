import { Resource } from "./resource";

/**
 * Decorator for hand-written Resource classes.
 * Triggers one-time schema normalization (converts string cast types into
 * pre-built ResourceFieldBuilder instances) so transformOutput runs against
 * builders without per-call overhead.
 *
 * @example
 * ```typescript
 * @RegisterResource()
 * class PostResource extends Resource {
 *   static schema = {
 *     id: "number",
 *     title: "string",
 *     keywords: "string[]",
 *   };
 * }
 * ```
 */
export function RegisterResource() {
  return function (target: typeof Resource) {
    target.parsedSchema = Resource.normalizeSchema(target.schema);
  };
}
