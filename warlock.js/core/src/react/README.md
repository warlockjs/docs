# React

React server-side rendering support. Provides `renderReact()` which converts React components/elements to HTML strings. Eagerly loads `react` and `react-dom/server` at import time; throws a clear error with install instructions if packages are missing.

## Key Files

| File       | Purpose                                                           |
| ---------- | ----------------------------------------------------------------- |
| `index.ts` | `renderReact()` function — renders React elements to HTML strings |

## Key Exports

- `renderReact(element)` — renders a `ReactElement`, `ComponentType`, or `ReactNode` to an HTML string

## Dependencies

### Internal (within `core/src`)

- None

### External

- `react` — optional peer dependency
- `react-dom/server` — optional peer dependency (`renderToString`)

## Used By

- `mail/react-mail.ts` — renders React-based email templates to HTML
- Application-level SSR use cases
