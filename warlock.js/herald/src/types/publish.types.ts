export type PublishOptions = {
  priority?: number;
  ttl?: number;
  delay?: number;
  headers?: Record<string, string>;
  persistent?: boolean;
  correlationId?: string;
  expiration?: number;
};

export type RequestOptions = PublishOptions & {
  timeout?: number;
};
