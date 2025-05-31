import reactSWCPlugin from "@vitejs/plugin-react-swc";
import type { FastifyInstance } from "fastify";
import { createServer, type ViteDevServer } from "vite";
import { getServer } from "./../http";

export interface ViteOptions {
  root?: string;
  buildPath?: string;
}

const defaultOptions: ViteOptions = {
  root: process.cwd(),
  buildPath: "dist",
};

let viteServer: ViteDevServer;
export function getViteServer(): ViteDevServer {
  return viteServer!;
}

export async function createViteServer(
  _app: FastifyInstance,
  options: ViteOptions = {},
) {
  const finalOptions = {
    ...defaultOptions,
    ...options,
  };

  const app: FastifyInstance = getServer();

  // Create Vite server in middleware mode
  viteServer = await createServer({
    configFile: false,
    root: finalOptions.root,
    plugins: [reactSWCPlugin()],
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
      },
    },
    appType: "custom",
    logLevel: "info",
  });

  // Add vite instance to fastify
  app.decorate("vite", viteServer);

  // Handle development assets
  app.addHook("onRequest", async (request, reply) => {
    const url = request.url.split("?")[0];

    if (
      url.startsWith("/@") ||
      url.endsWith(".tsx") ||
      url.endsWith(".ts") ||
      url.endsWith(".js") ||
      url.endsWith(".mjs") ||
      url.endsWith(".css") ||
      url.endsWith(".jsx")
    ) {
      try {
        // Set handled flag to track if the middleware actually sent a response
        let handled = false;

        await new Promise<void>((resolve, reject) => {
          viteServer.middlewares.handle(request.raw, reply.raw, (err: any) => {
            if (err) {
              console.error(`[Vite] Error handling ${url}:`, err);
              reject(err);
            } else {
              handled = true;
              console.log(`[Vite] Successfully handled ${url}`);
              resolve();
            }
          });
        });

        // Important: Tell Fastify we handled the request
        if (handled) {
          reply.hijack();
          return reply;
        }
      } catch (e: any) {
        reply.code(500).send(e);
        return reply;
      }
    }
  });

  return viteServer;
}
