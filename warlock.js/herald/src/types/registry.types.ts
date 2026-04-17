import type { Broker } from "../communicators/broker";

export type BrokerRegistryEvent =
  | "registered"
  | "default-registered"
  | "connected"
  | "disconnected";

export type BrokerRegistryListener = (broker: Broker) => void;
