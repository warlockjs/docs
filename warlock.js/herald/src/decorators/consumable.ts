import { brokerRegistry } from "../communicators";
import { type EventConsumerClass } from "../message-managers/types";

export type ConsumableOptions = {
  broker?: string;
};

export const pendingSubscribers = new Set<{
  Consumer: EventConsumerClass;
  options?: ConsumableOptions;
}>();

/**
 * Register the consumer to the broker
 */
export function Consumable(options?: ConsumableOptions) {
  return function (target: EventConsumerClass) {
    const brokerName = options?.broker;

    try {
      const currentBroker = brokerRegistry.get(brokerName);

      // if broker is connected, subscribe the consumer
      if (currentBroker?.isConnected) {
        currentBroker.subscribe(target);
      } else {
        pendingSubscribers.add({ Consumer: target, options });
      }
    } catch {
      // mostly it will be an error that broker is not registered yet
      // then add it to the pending subscribers
      pendingSubscribers.add({ Consumer: target, options });
    }
  };
}

// Register pending consumers on broker's connection is done
brokerRegistry.on("connected", (broker) => {
  for (const { Consumer, options } of pendingSubscribers) {
    if (options?.broker && broker.name !== options.broker) {
      continue;
    }

    broker.subscribe(Consumer);
  }
});
