import type { FastifyInstance } from "fastify";
import { createViteServer } from "./vite-config";

//
export interface ReactPluginOptions {
  root?: string;
  buildPath?: string;
  entryPath?: string;
  template?: string;
}

export class ReactPlugin {
  public constructor(
    private readonly app: FastifyInstance,
    private readonly options: ReactPluginOptions = {},
  ) {}

  public async register(): Promise<void> {
    // Create Vite server

    await createViteServer(this.app, this.options);

    // Handle cleanup
    this.app.addHook("onClose", async () => {
      await this.app.vite?.close();
    });
  }
}

export function useReact(options: ReactPluginOptions = {}) {
  return async (app: FastifyInstance) => {
    const plugin = new ReactPlugin(app, options);
    await plugin.register();
  };
}
