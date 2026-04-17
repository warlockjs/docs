# Resource

API resource serialization layer. Shapes model data for JSON API responses. Provides a `Resource` base class and a field builder DSL for declaring which fields to include, how to transform them, and how to handle nested/related resources.

## Key Files

| File                        | Purpose                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `resource.ts`               | `Resource` base class — `toJSON()`, field mapping, localization                                                   |
| `define-resource.ts`        | `defineResource()` — shorthand factory for creating resource classes                                              |
| `resource-field-builder.ts` | `ResourceFieldBuilder` — fluent DSL for declaring fields (`string`, `number`, `boolean`, `object`, `array`, etc.) |
| `register-resource.ts`      | Resource registration for deferred resolution                                                                     |
| `types.ts`                  | Resource type definitions                                                                                         |
| `index.ts`                  | Barrel export                                                                                                     |

## Key Exports

- `Resource` — base class to extend for custom resources
- `defineResource()` — factory function
- `ResourceFieldBuilder` — field declaration DSL
- Types: `ResourceOptions`, `ResourceField`, etc.

## Dependencies

### Internal (within `core/src`)

- `../utils` — localization helpers (`getLocalized`)

### External

- `@mongez/reinforcements` — object manipulation utilities

## Used By

- `restful/` — serializes model data in REST responses
- `http/response.ts` — `response.success(data, resource)` applies resource transformation
- Application-level resource definitions
