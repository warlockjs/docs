# Benchmark

Performance measurement utility. Wraps sync/async function execution with timing and optional latency-range reporting.

## Key Files

| File           | Purpose                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| `benchmark.ts` | `measure()` function — times execution, reports via configurable callback |
| `types.ts`     | `BenchmarkOptions`, `BenchmarkResult`, `LatencyRange` types               |
| `index.ts`     | Barrel export                                                             |

## Key Exports

- `measure(name, fn, options?)` — execute `fn`, return `{ result, duration }` with optional latency classification
- `BenchmarkOptions` / `BenchmarkResult` — configuration and result types

## Dependencies

### Internal (within `core/src`)

- None

### External

- None (pure utility)

## Used By

- `use-cases/` — benchmarks use case handler execution (enabled by default)
- Any module that needs to profile a function call
