import type { FastifyInstance } from "fastify";
import { useReact } from "../../react";

export async function registerHttpPlugins(app: FastifyInstance) {
  // Register React plugin
  await app.register(
    useReact({
      // Any additional options can be passed here
      root: process.cwd(),
    }),
  );
}
