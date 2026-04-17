import type { FastifyCorsOptions } from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import config from "@mongez/config";
import { rootPath } from "../utils";
import type { FastifyInstance } from "./server";

const defaultCorsOptions: FastifyCorsOptions = {
  origin: "*",
  methods: "*",
};

export async function registerHttpPlugins(server: FastifyInstance) {
  // 👇🏻 register rate-limit plugin
  server.register(import("@fastify/rate-limit"), {
    // max requests per time window
    max: config.get("http.rateLimit.max", 60),
    // maximum time that is will allow max requests
    timeWindow: config.get("http.rateLimit.duration", 60 * 1000),
  });

  // 👇🏻 register cors plugin
  const corsOptions: FastifyCorsOptions | undefined = {
    ...config.get("http.cors", {}),
    ...defaultCorsOptions,
  };

  server.register(import("@fastify/cors"), corsOptions);

  // 👇🏻 import multipart plugin
  server.register(fastifyMultipart, {
    attachFieldsToBody: true,
    limits: {
      // file size could be up to 10MB
      fileSize: config.get("http.fileUploadLimit", 10 * 1024 * 1024),
    },
  });

  server.register(import("@fastify/static"), {
    root: config.get("storage.publicRoot", rootPath("public")),
    prefix: config.get("storage.publicPrefix", "/public/"),
  });

  // 👇🏻 register cookie plugin
  server.register(import("@fastify/cookie"), {
    secret: config.get("http.cookies.secret"), // Optional: allow signed cookies
    parseOptions: config.get("http.cookies.options", {}),
  });
}
