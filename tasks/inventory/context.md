# @warlock.js/context — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package
- Dependencies: None

## Directory Tree

```
src/
├── base-context.ts
├── context-manager.ts
└── index.ts
```

## Exports by File

### src/base-context.ts
*Provides an abstract base class for managing asynchronous local storage contexts with a unified API.*

- **Abstract Class** `Context<TStore extends Record<string, any>>`
  - `public run<T>(store: TStore, callback: () => Promise<T>): Promise<T>`
  - `public enter(store: TStore): void`
  - `public update(updates: Partial<TStore>): void`
  - `public getStore(): TStore | undefined`
  - `public get<K extends keyof TStore>(key: K): TStore[K] | undefined`
  - `public set<K extends keyof TStore>(key: K, value: TStore[K]): void`
  - `public clear(): void`
  - `public hasContext(): boolean`
  - `public abstract buildStore(payload?: Record<string, any>): TStore`

### src/context-manager.ts
*Orchestrates multiple contexts, allowing them to be registered, initialized, and run simultaneously.*

- **Class** `ContextManager`
  - `public register(name: string, context: Context<any>): this`
  - `public async runAll<T>(stores: Record<string, any>, callback: () => Promise<T>): Promise<T>`
  - `public enterAll(stores: Record<string, any>): void`
  - `public clearAll(): void`
  - `public getContext<T extends Context<any>>(name: string): T | undefined`
  - `public hasContext(name: string): boolean`
  - `public buildStores(payload?: Record<string, any>): Record<string, any>`
  - `public unregister(name: string): boolean`
- **Constant** `contextManager: ContextManager`

### src/index.ts
*Entry point that re-exports all context and manager functionality.*

- **Re-exports**:
  - All from `./base-context`
  - All from `./context-manager`
