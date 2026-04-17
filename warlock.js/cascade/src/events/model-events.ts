import { QueryBuilderContract } from "../contracts";
import type { Model } from "../model/model";
import { DeleteStrategy } from "../types";

type OnValidatingEventContext = {
  isInsert: boolean;
  mode: "insert" | "update";
};

type OnSavingEventContext = {
  isInsert: boolean;
  mode: "insert" | "update";
};

type OnDeletingEventContext = {
  strategy: DeleteStrategy;
  primaryKeyValue: string | number;
  primaryKey: string;
};

export type OnDeletedEventContext = OnDeletingEventContext & {
  deletedCount: number;
  trashRecord?: Record<string, unknown>;
};

type OnFetchingEventContext = {
  table: string;
  modelClass: any;
};

type OnHydratingEventContext = {
  query: QueryBuilderContract;
  hydrateCallback?: (data: any, index: number) => any;
};

type OnFetchedEventContext = {
  query: QueryBuilderContract;
  rawRecords: any[];
  duration: number;
};

/**
 * Lifecycle events understood by Cascade models.
 *
 * The list mirrors the hooks in the legacy ORM so downstream code can subscribe
 * with consistent semantics.
 */
export type ModelEventName =
  | "initializing"
  | "fetching"
  | "hydrating"
  | "fetched"
  | "validating"
  | "validated"
  | "saving"
  | "saved"
  | "creating"
  | "created"
  | "updating"
  | "updated"
  | "deleting"
  | "deleted"
  | "restoring"
  | "restored";

/** Signature of an event listener registered against a model lifecycle hook. */
export type ModelEventListener<TModel, TContext = unknown> = (
  model: TModel,
  context: TContext,
) => void | Promise<void>;

/**
 * Light-weight async event emitter used to power model lifecycle hooks.
 *
 * The implementation intentionally avoids any external dependency so we can
 * re-use it in drivers, writers, and other core services without pulling in
 * heavier event libraries.
 */
export class ModelEvents<TModel> {
  public readonly listeners = new Map<ModelEventName, Set<ModelEventListener<TModel>>>();

  /**
   * Register a listener for the given event.
   * Returns an unsubscribe function for convenience.
   */
  public on<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    const listeners = this.ensureListenerSet(event);
    listeners.add(listener as ModelEventListener<TModel>);
    return () => this.off(event, listener);
  }

  /**
   * Register a listener that automatically unsubscribes after the first call.
   */
  public once<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    const wrapper: ModelEventListener<TModel, TContext> = async (model, context) => {
      try {
        await listener(model, context);
      } finally {
        this.off(event, wrapper);
      }
    };
    return this.on(event, wrapper);
  }

  /**
   * Deregister a listener for the given event.
   */
  public off<TContext = unknown>(
    event: ModelEventName,
    listener: ModelEventListener<TModel, TContext>,
  ): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }
    listeners.delete(listener as ModelEventListener<TModel>);
    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event to all registered listeners.
   */
  public async emit<TContext = unknown>(
    event: ModelEventName,
    model: TModel,
    context: TContext,
  ): Promise<void> {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) {
      return;
    }
    for (const listener of Array.from(listeners)) {
      await listener(model, context);
    }
  }

  /**
   * Emit events for fetching
   */
  public async emitFetching<TContext = unknown>(
    query: QueryBuilderContract,
    context?: TContext,
  ): Promise<void> {
    await this.emit("fetching", query as any, context);
  }

  /**
   * Remove all registered listeners.
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * Registers a listener for the "saving" event.
   *
   * Fired before a model is persisted (both insert and update), and before validation.
   * Use this hook for data enrichment and preparation (e.g., setting createdBy, updatedBy).
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onSaving<TContext = OnSavingEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("saving", listener);
  }

  /**
   * Registers a listener for the "saved" event.
   *
   * Fired after a model has been successfully persisted.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onSaved<TContext = unknown>(listener: ModelEventListener<TModel, TContext>) {
    return this.on("saved", listener);
  }

  /**
   * Registers a listener for the "creating" event.
   *
   * Fired before a new model is inserted into the database.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onCreating<TContext = unknown>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("creating", listener);
  }

  /**
   * Registers a listener for the "created" event.
   *
   * Fired after a new model has been successfully inserted.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onCreated<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void {
    return this.on("created", listener);
  }

  /**
   * Registers a listener for the "updating" event.
   *
   * Fired before an existing model is updated in the database.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onUpdating<TContext = unknown>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("updating", listener);
  }

  /**
   * Registers a listener for the "updated" event.
   *
   * Fired after an existing model has been successfully updated.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onUpdated<TContext = unknown>(listener: ModelEventListener<TModel, TContext>): () => void {
    return this.on("updated", listener);
  }

  /**
   * Registers a listener for the "deleting" event.
   *
   * Fired before a model is deleted from the database.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onDeleting<TContext = OnDeletingEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("deleting", listener);
  }

  /**
   * Registers a listener for the "deleted" event.
   *
   * Fired after a model has been successfully deleted.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onDeleted<TContext = OnDeletedEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("deleted", listener);
  }

  /**
   * Registers a listener for the "validating" event.
   *
   * Fired before model validation is performed.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onValidating<TContext = OnValidatingEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("validating", listener);
  }

  /**
   * Registers a listener for the "validated" event.
   *
   * Fired after model validation has completed.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onValidated<TContext = unknown>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("validated", listener);
  }

  /**
   * Registers a listener for the "fetching" event.
   *
   * Fired before a query is executed to fetch models.
   * Receives the query builder instance, allowing modification before execution.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onFetching<TContext = OnFetchingEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("fetching", listener);
  }

  /**
   * Registers a listener for the "hydrating" event.
   *
   * Fired after raw records are fetched but before they are hydrated into model instances.
   * Allows modification of raw data before hydration.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onHydrating<TContext = OnHydratingEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("hydrating", listener);
  }

  /**
   * Registers a listener for the "fetched" event.
   *
   * Fired after models have been fetched and hydrated.
   * Receives hydrated model instances and query context.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onFetched<TContext = OnFetchedEventContext>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("fetched", listener);
  }

  /**
   * Registers a listener for the "restoring" event.
   *
   * Fired before a soft-deleted model is restored.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onRestoring<TContext = unknown>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("restoring", listener);
  }

  /**
   * Registers a listener for the "restored" event.
   *
   * Fired after a soft-deleted model has been successfully restored.
   *
   * @param listener - The callback to invoke
   * @returns An unsubscribe function
   */
  public onRestored<TContext = unknown>(
    listener: ModelEventListener<TModel, TContext>,
  ): () => void {
    return this.on("restored", listener);
  }

  /**
   * Ensures a listener set exists for the given event.
   *
   * @param event - The event name
   * @returns The listener set for the event
   * @private
   */
  private ensureListenerSet(event: ModelEventName): Set<ModelEventListener<TModel>> {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }
    return listeners;
  }
}

/**
 * Global event emitter invoked for every model instance, regardless of type.
 * Useful for cross-cutting concerns like auditing or request-scoped enrichment.
 */
export const globalModelEvents = new ModelEvents<Model>();
