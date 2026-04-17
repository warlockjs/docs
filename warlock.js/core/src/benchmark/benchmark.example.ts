import { BenchmarkProfiler, BenchmarkSnapshots, ConsoleChannel, measure } from "@warlock.js/core";

// ─── 1. Basic usage — just measure, no profiler ───────────────────────────────
const basic = await measure("fetch-homepage", () =>
  fetch("https://crafted-internet.com").then((r) => r.text()),
);

console.log("─── Basic ───────────────────────────────");
console.log(`name:    ${basic.name}`);
console.log(`latency: ${basic.latency}ms`);
console.log(`state:   ${basic.state}`);
console.log(`success: ${basic.success}`);

// ─── 2. With latency thresholds ───────────────────────────────────────────────
const withRange = await measure(
  "fetch-with-threshold",
  () => fetch("https://crafted-internet.com").then((r) => r.json()),
  {
    latencyRange: { excellent: 50, poor: 300 },
    onComplete: (r) => console.log(`\n[onComplete] ${r.name} → ${r.latency}ms (${r.state})`),
    onError: (r) => console.error(`\n[onError]    ${r.name} → failed after ${r.latency}ms`),
    onFinish: (r) => console.log(`[onFinish]   ${r.name} → done (success: ${r.success})`),
  },
);

console.log("\n─── With latency range ──────────────────");
console.log(`state: ${withRange.state}`);

// ─── 3. Error capture — shouldBenchmarkError ──────────────────────────────────
const errResult = await measure(
  "fetch-bad-url",
  () => fetch("https://this-domain-does-not-exist-xyz.com"),
  {
    // Only benchmark network errors, not 4xx business errors
    shouldBenchmarkError: (err) => err instanceof TypeError,
  },
);

console.log("\n─── Error result ────────────────────────");
console.log(`success: ${errResult.success}`);
if (!errResult.success) {
  console.log(`error:   ${(errResult.error as Error).message}`);
  console.log(`latency: ${errResult.latency}ms`);
}

// ─── 4. BenchmarkProfiler — accumulate stats across multiple calls ─────────────
const profiler = new BenchmarkProfiler({
  maxSamples: 100,
  channels: [new ConsoleChannel()],
});

// Simulate 5 calls with varying latency
const endpoints = [50, 120, 80, 600, 95];
for (const delay of endpoints) {
  await measure("simulated-db-query", () => new Promise((resolve) => setTimeout(resolve, delay)), {
    latencyRange: { excellent: 100, poor: 500 },
  });
}

// One failing call
await measure("simulated-db-query", () => {
  throw new Error("Connection refused");
});

const stats = profiler.stats("simulated-db-query");
console.log("\n─── Profiler stats ──────────────────────");
console.log(stats);

// Flush all stats to channels (ConsoleChannel prints a table)
console.log("\n─── Profiler flush → ConsoleChannel ─────");
await profiler.flush();

// ─── 5. BenchmarkSnapshots — store raw error results ──────────────────────────
const snapshots = new BenchmarkSnapshots({
  maxSnapshots: 10,
  capture: "error", // only store failures
});

// Two success calls (ignored by capture:"error")
await measure("payment-api", () => Promise.resolve({ id: 1 }), { snapshotContainer: snapshots });
await measure("payment-api", () => Promise.resolve({ id: 2 }), { snapshotContainer: snapshots });
// One failure (captured)
await measure(
  "payment-api",
  () => {
    throw new Error("Gateway timeout");
  },
  { snapshotContainer: snapshots },
);

console.log("\n─── BenchmarkSnapshots (errors only) ────");
const stored = snapshots.getSnapshots("payment-api");
console.log(`stored snapshots: ${stored.length}`); // 1
if (!stored[0].success) {
  console.log(`captured error:  ${(stored[0].error as Error).message}`);
  console.log(`captured latency: ${stored[0].latency}ms`);
}

// ─── 6. Disabled — measure() becomes a pure passthrough ───────────────────────
const disabled = await measure("passthrough", () => ({ data: "raw value" }), { enabled: false });

console.log("\n─── Disabled (passthrough) ──────────────");
console.log(`latency: ${disabled.latency}ms`); // 0
console.log(`state:   ${disabled.state}`); // excellent
if (disabled.success) {
  console.log(`value:   ${JSON.stringify(disabled.value)}`);
}
