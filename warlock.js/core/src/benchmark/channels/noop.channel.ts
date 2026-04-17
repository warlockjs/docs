import type { BenchmarkChannel } from "../types";

export class NoopChannel implements BenchmarkChannel {
  public onFlush(): void {}
}
