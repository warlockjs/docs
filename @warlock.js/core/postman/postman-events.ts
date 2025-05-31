import events from "@mongez/events";
import type { PostmanVariable } from "./types";

export const PostmanEvents = {
  trigger(event: "collectingVariables", data: any) {
    return events.trigger("postman." + event, data);
  },
  onCollectingVariables(callback: (variables: PostmanVariable[]) => void) {
    return events.subscribe("postman.collectingVariables", callback);
  },
};
