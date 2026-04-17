export type BrokerDriverType = "rabbitmq" | "kafka" | "redis-streams" | "sqs";

export type BrokerEvent = "connected" | "disconnected" | "error" | "reconnecting";

export type BrokerEventListener = (...args: unknown[]) => void;

export type HealthCheckResult = {
  healthy: boolean;
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
};
