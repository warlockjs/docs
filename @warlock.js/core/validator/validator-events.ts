import events from "@mongez/events";
import type { ValidationEvent } from "./types";

export const validatorEvents = {
  trigger: (eventName: ValidationEvent, ...args: any[]) =>
    events.trigger(`validation.${eventName}`, ...args),
  on(eventName: ValidationEvent, callback: (...args: any[]) => void) {
    return events.subscribe(`validation.${eventName}`, callback);
  },
};
