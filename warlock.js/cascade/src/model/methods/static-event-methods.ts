import {
  ModelEvents,
  globalModelEvents,
  type ModelEventListener,
  type ModelEventName,
} from "../../events/model-events";
import { removeModelFromRegistery } from "../register-model";
import type { ChildModel, Model } from "../model";

/**
 * Isolated event emitter registry — one ModelEvents instance per model constructor.
 * Encapsulated here so no other module needs to know it exists.
 */
const modelEventsRegistry = new WeakMap<any, any>();

export function getModelEvents<TModel extends Model>(
  ModelClass: any,
): ModelEvents<TModel> {
  let events = modelEventsRegistry.get(ModelClass);
  if (!events) {
    events = new ModelEvents<TModel>();
    modelEventsRegistry.set(ModelClass, events);
  }
  return events as ModelEvents<TModel>;
}

export function cleanupModelEvents(ModelClass: any): void {
  modelEventsRegistry.delete(ModelClass);
  removeModelFromRegistery(ModelClass.name);
}

export function onStaticEvent<TModel extends Model = Model, TContext = unknown>(
  ModelClass: ChildModel<TModel>,
  event: ModelEventName,
  listener: ModelEventListener<TModel, TContext>,
): () => void {
  return ModelClass.events<TModel>().on(event, listener);
}

export function onceStaticEvent<TModel extends Model = Model, TContext = unknown>(
  ModelClass: ChildModel<TModel>,
  event: ModelEventName,
  listener: ModelEventListener<TModel, TContext>,
): () => void {
  return ModelClass.events<TModel>().once(event, listener);
}

export function offStaticEvent<TModel extends Model = Model, TContext = unknown>(
  ModelClass: ChildModel<TModel>,
  event: ModelEventName,
  listener: ModelEventListener<TModel, TContext>,
): void {
  ModelClass.events<TModel>().off(event, listener);
}

export function getGlobalEvents(): ModelEvents<Model> {
  return globalModelEvents;
}
