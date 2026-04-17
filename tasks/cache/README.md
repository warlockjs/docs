# Cache Docs — Quality Pass Task Plan

All 22 pages in `docs/cache/` need a quality pass. Tasks below are independent — run in any order or in parallel.

---

## For External Agents

- **Repo root:** the directory containing `docs/`, `sidebars.ts`, etc. Set `REPO_ROOT` to the absolute path before running any task (e.g. `/home/user/warlock-docs-latest` or `D:\xampp\htdocs\mongez\node\warlock.js\docs\warlock-docs-latest`)
- **Always read the target file first** before making any edits — never assume current content
- **Apply only the changes described** — do not rewrite sections not mentioned in the task
- **File paths in each task are relative to `REPO_ROOT`**

---

## Writing Rules (apply to every task)

These rules override any default writing style:

1. **No marketing language.** Ban: powerful, enterprise-grade, feature-rich, production-ready, battle-tested, robust, comprehensive, seamless, cutting-edge. Just describe what it does.
2. **No filler openers.** Never start a section with "In this section, we will..." or "Now let's take a look at...". Start with the thing itself.
3. **No redundant "What is X?" sections.** The page title already says what it is. Open with a one-sentence description then go straight to code.
4. **Every example is real.** Use this scenario throughout: an e-commerce API. Products, users, orders, carts, sessions. Example keys: `products.{id}`, `users.{id}.profile`, `orders.{userId}.recent`, `cart.{sessionId}`, `rate-limit.api.{ip}`. No `user.123 → { name: "John" }`.
5. **No :::tip/:::info for obvious things.** Admonitions only for genuine gotchas or non-obvious constraints. One admonition per major section maximum.
6. **Section titles are nouns or imperative verbs.** Never questions. "Why Use Cache?" → remove it. "Key Highlights" → remove it.
7. **No emoji in headings or bullet lists.**
8. **Keep it short.** If a sentence doesn't add information, delete it. Target: 20–30% shorter than current length while covering the same API surface.

---

## Real-World Scenario Reference

Use this e-commerce API context in every example:

```ts
// Products
await cache.set(`products.${id}`, product, CACHE_FOR.ONE_HOUR);
await cache.remember(`products.category.${categoryId}`, CACHE_FOR.HALF_HOUR, () => db.products.findByCategory(categoryId));

// User sessions and profiles
await cache.set(`users.${userId}.profile`, profile, CACHE_FOR.ONE_DAY);
await cache.pull(`users.${userId}.verify-token`);

// Orders
await cache.set(`orders.${userId}.recent`, orders, CACHE_FOR.HALF_HOUR);
await cache.removeNamespace(`orders.${userId}`); // invalidate on new order

// Rate limiting
await cache.increment(`rate-limit.api.${ip}`);
await cache.setNX(`rate-limit.api.${ip}`, 0, 60); // 60s window

// Cart
await cache.set(`cart.${sessionId}`, cartData, CACHE_FOR.ONE_DAY);
await cache.tags(["cart", `user.${userId}`]).set(`cart.${sessionId}`, cartData);
```

---

## Tasks

### Task 1 — Rewrite `introduction.mdx`

**File:** `docs/cache/introduction.mdx`

**Problems to fix:**
- "Package Overview" and "What is @warlock.js/cache?" sections are nearly identical — merge into a single 2-sentence opening paragraph
- "Key Highlights" block (emoji bullets) — delete entirely
- "Why Use Cache?" — delete entirely
- "Why Choose @warlock.js/cache?" — delete entirely
- The quick example uses generic `user.123` — replace with a real-world scenario

**Target structure:**
```
# Introduction
[1-sentence description of what the package does]
[installation tab block]

## Core Operations
[table: method | what it does — quick reference]

## Drivers
[table: driver | best for — same content as existing but no emoji]

## Advanced Features
[4 bullet links: tags, events, atomic operations, stampede prevention — no emoji, no sub-headers]
```

**Keep:** driver comparison table, installation tabs, links to quick-start.

---

### Task 2 — Improve `quick-start.mdx`

**File:** `docs/cache/quick-start.mdx`

**Problems:**
- Example uses `user.123 → { name: "John" }` — too generic
- "That's it! You're now caching data." — filler

**Fix:**
Replace the 30-second example with a product catalog scenario: fetch product by ID, cache it, remember pattern for category listing. Show the 3 most common patterns back-to-back: `set/get`, `remember`, `removeNamespace`. Keep the page short.

---

### Task 3 — Clean `cache-manager.mdx`

**File:** `docs/cache/cache-manager.mdx`

**Problems:**
- "What is the Cache Manager?" section is redundant — the intro paragraph already says it
- Troubleshooting section is generic boilerplate
- Examples use `user.1`, `posts.123.comments` with no context

**Fix:**
- Delete "What is the Cache Manager?" sub-section, fold the bullet list into the opening paragraph
- Replace examples with the e-commerce scenario
- Condense troubleshooting to a single :::info admonition with the 2 most useful points

---

### Task 4 — Review `configurations.mdx`, `namespaces.mdx`

**Files:** `docs/cache/configurations.mdx`, `docs/cache/namespaces.mdx`

**`configurations.mdx` issues:**
- The :::info about env parsers is 8 lines for a 1-sentence point — trim to 2 lines
- Environment-based config example is the most useful, move it first

**`namespaces.mdx` issues:**
- Read the file and apply writing rules
- Ensure the `removeNamespace` example uses orders or cart (real scenario where you invalidate all keys for a user)

---

### Task 5 — Review Drivers group

**Files:** `docs/cache/memory.mdx`, `docs/cache/memory-extended.mdx`, `docs/cache/lru-memory.mdx`, `docs/cache/redis.mdx`, `docs/cache/file.mdx`, `docs/cache/null.mdx`

**For each file:**
1. Read it fully
2. Delete any intro paragraph that restates the page title
3. Replace generic examples with e-commerce scenario
4. Ensure the options table (if present) is accurate
5. Redis: ensure the connection URL example (`REDIS_URL`) is prominent — most production setups use a URL not host/port

---

### Task 6 — Review Advanced Features group

**Files:** `docs/cache/tags.mdx`, `docs/cache/events.mdx`, `docs/cache/atomic-operations.mdx`, `docs/cache/stampede-prevention.mdx`, `docs/cache/bulk-operations.mdx`

**For each file:**
1. Read it fully
2. Apply writing rules
3. Tags: ensure the "invalidate all user-related cache on profile update" scenario is prominent
4. Events: ensure the monitoring/metrics example is concrete (log to console, send to metrics service)
5. Atomic operations: use rate limiting (`rate-limit.api.{ip}`) as the primary example — it's the most common use case
6. Stampede prevention: the `remember()` pattern with a slow DB query is the right example — keep but make the query realistic (product catalog fetch)
7. Bulk operations: product catalog batch load is ideal — `many(productIds.map(id => \`products.${id}\`))`

---

### Task 7 — Review Reference group

**Files:** `docs/cache/utils.mdx`, `docs/cache/best-practices.mdx`, `docs/cache/comparison.mdx`, `docs/cache/make-your-own-cache-driver.mdx`

**`utils.mdx`:** Verify `CACHE_FOR` enum values are accurate. Remove any filler.

**`best-practices.mdx`:** Read and trim. Remove generic advice ("always handle errors") that doesn't apply specifically to caching. Keep cache-specific patterns: key naming, TTL strategy, stampede prevention, tag grouping.

**`comparison.mdx`:** Read. Ensure it's accurate and not biased. If it reads like a sales pitch, rewrite the conclusions to be neutral.

**`make-your-own-cache-driver.mdx`:** Read. Ensure the driver implementation example is complete and actually compiles. Remove any closing filler ("Now you're ready to...").

---

### Task 8 — Review `cache-driver-interface.mdx`, `base-cache-driver.mdx`

**Files:** `docs/cache/cache-driver-interface.mdx`, `docs/cache/base-cache-driver.mdx`

These are reference pages. For each:
1. Every method must have: signature, what it does, example
2. No method section should just say "See [driver interface](./cache-driver-interface)" without showing the signature
3. Apply writing rules — no filler

---

## Running these tasks

Each task is independent. Suggested parallel execution:

- **Batch A** (most impactful, run first): Task 1, Task 2, Task 3
- **Batch B** (reference pages): Task 4, Task 7, Task 8
- **Batch C** (deep content): Task 5, Task 6
