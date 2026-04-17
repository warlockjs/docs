import {
  globalModelEvents,
  type ModelEventListener,
  type ModelEventName,
} from "../../events/model-events";
import type { Model } from "../model";

export async function emitModelEvent<TContext = unknown>(
  model: Model,
  event: ModelEventName,
  context?: TContext,
): Promise<void> {
  const ctor = model.constructor as any;
  await model.events.emit(event, model, context as TContext);
  await ctor.events().emit(event, model, context as TContext);
  await globalModelEvents.emit(event, model, context as TContext);
}

export function onModelEvent<TContext = unknown>(
  model: Model,
  event: ModelEventName,
  listener: ModelEventListener<any, TContext>,
): () => void {
  return model.events.on(event, listener);
}

export function onceModelEvent<TContext = unknown>(
  model: Model,
  event: ModelEventName,
  listener: ModelEventListener<any, TContext>,
): () => void {
  return model.events.once(event, listener);
}

export function offModelEvent<TContext = unknown>(
  model: Model,
  event: ModelEventName,
  listener: ModelEventListener<any, TContext>,
): void {
  model.events.off(event, listener);
}
