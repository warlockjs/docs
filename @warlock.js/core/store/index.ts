import type { GenericObject } from "@mongez/reinforcements";
import { AsyncLocalStorage } from "async_hooks";

const stores: Map<string, AsyncLocalStorage<any>> = new Map();

export type StoreRunCallback<T> = (store: T) => void;

/**
 * Create a new store
 * @param {string} name: The name of the store, will be used to access the store
 * @param {T} initialData: The initial data of the store
 * @param {StoreRunCallback?} runCallback: If passed, the callback will be executed when the store is created
 * @returns {object.run}: A function to run the store
 * @returns {object.destroy}: A function to destroy the store
 * @returns {object.store}: The store data
 * @returns {object.storage}: The store storage
 */
export function createStore<T extends GenericObject>(
  name: string,
  initialData: T,
  runCallback?: StoreRunCallback<T>,
) {
  const store = new AsyncLocalStorage<T>();

  stores.set(name, store);

  const ops = {
    store: initialData,
    storage: store,
    async run(fn: (store: T) => void) {
      try {
        await store.run(initialData, fn.bind(null, initialData));
      } catch (error) {
        console.error(`Error running store ${name}:`, error);
        // Handle specific rollback or cleanup here if necessary
      } finally {
        // Ensure the store is always deleted after use
        console.log("Deleting store", name);

        // stores.delete(name);
        // store.disable();
      }
    },
    destroy() {
      stores.delete(name);
      store.disable();
    },
  };

  if (runCallback) {
    ops.run(async () => await runCallback(initialData));
  }

  return ops;
}

/**
 * Get store by name
 */
export function useStore<T>(name: string): T | null {
  const store = stores.get(name);

  if (!store) {
    return null;
  }

  return store.getStore();
}
