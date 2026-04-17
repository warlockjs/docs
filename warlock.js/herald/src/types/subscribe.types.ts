export type RetryOptions = {
  maxRetries: number;
  delay: number | ((attempt: number) => number);
};

export type DeadLetterOptions = {
  channel: string;
  preserveOriginal?: boolean;
};

export type SubscribeOptions = {
  consumerId?: string;
  group?: string;
  prefetch?: number;
  autoAck?: boolean;
  retry?: RetryOptions;
  deadLetter?: DeadLetterOptions;
  exclusive?: boolean;
};
