import Fastify, { FastifyServerOptions } from "fastify";

export type FastifyInstance = ReturnType<typeof Fastify>;

// Instantiate Fastify server
let server: FastifyInstance | undefined = undefined;

export function startHttpServer(options?: FastifyServerOptions): FastifyInstance {
  return (server = Fastify({
    trustProxy: true,
    bodyLimit: 200 * 1024 * 1024 * 1024, // 200GB
    ...options,
  }));
}

/**
 * Expose the server to be publicly accessible
 */
export function getHttpServer(): FastifyInstance {
  return server;
}
