import { log } from "@warlock.js/logger";
import type { InjectOptions } from "fastify";
import { registerHttpPlugins } from "../http/plugins";
import { startServer } from "../http/server";
import { router } from "../router/router";
import { setEnvironment } from "../utils";
import { HttpResponseOutputTest } from "./http-response-output-test";

let server: ReturnType<typeof startServer> | undefined;

export async function httpServerTest() {
  if (!server) {
    log.info("http", "server", "Connecting to the server");

    server = startServer();

    setEnvironment("test");

    await registerHttpPlugins(server);

    router.scan(server);

    await server.ready();

    log.success("http", "server", "Server is ready");
  }

  const request = (method: InjectOptions["method"]) => {
    return async (path: string, payload?: any, options?: InjectOptions) => {
      const response = await server!.inject({
        method,
        path,
        payload,
        ...options,
      });

      return new HttpResponseOutputTest(response);
    };
  };

  const jsonRequest = (method: InjectOptions["method"]) => {
    return (
      path: string,
      payload: any = {},
      { headers = {}, ...options }: InjectOptions = {},
    ) => {
      if (!headers["Content-Type"]) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      return request(method)(path, payload, {
        headers,
        ...options,
      });
    };
  };

  return {
    get: request("GET"),
    post: jsonRequest("POST"),
    put: jsonRequest("PUT"),
    patch: jsonRequest("PATCH"),
    delete: request("DELETE"),
    json: {
      get: request("GET"),
      post: jsonRequest("POST"),
      put: jsonRequest("PUT"),
      patch: jsonRequest("PATCH"),
      delete: request("DELETE"),
    },
  };
}

httpServerTest.post = async (
  path: string,
  payload?: any,
  options?: InjectOptions,
) => {
  const server = await httpServerTest();
  return server.post(path, payload, options);
};

httpServerTest.get = async (path: string, options?: InjectOptions) => {
  const server = await httpServerTest();
  return server.get(path, options);
};

httpServerTest.put = async (
  path: string,
  payload?: any,
  options?: InjectOptions,
) => {
  const server = await httpServerTest();
  return server.put(path, payload, options);
};

httpServerTest.patch = async (
  path: string,
  payload?: any,
  options?: InjectOptions,
) => {
  const server = await httpServerTest();
  return server.patch(path, payload, options);
};

httpServerTest.delete = async (path: string, options?: InjectOptions) => {
  const server = await httpServerTest();
  return server.delete(path, options);
};

export async function terminateHttpServerTest() {
  if (server) {
    await server.close();
  }
}
