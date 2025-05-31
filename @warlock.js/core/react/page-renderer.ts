import { type FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";
import type { ReactElement, ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import type { Request } from "../http/request";
import type { Response } from "../http/response";
import { type PageHandlerOptions } from "./types";
import { getViteServer } from "./vite-config";

export interface PageRenderOptions {
  root: string;
  buildPath: string;
}

type RenderPageOptions = {
  request: Request;
  response: Response;
  page: ReactElement;
  options?: PageRenderOptions;
  server: FastifyInstance;
};

export async function renderPage({
  request,
  page,
  response,
}: RenderPageOptions) {
  const { root, buildPath } = {
    root: process.cwd(),
    buildPath: "dist",
  };

  console.log("[Page Renderer] Initializing with:", {
    root,
    buildPath,
    url: request.url,
    env: process.env.NODE_ENV,
  });

  const url = request.url;
  const vite = getViteServer();

  try {
    let template: string;
    let render: (
      options: Omit<PageHandlerOptions, "output"> & {
        children: ReactNode;
      },
    ) => Promise<string>;

    if (process.env.NODE_ENV === "development") {
      const templatePath = path.resolve(root, "index.html");
      console.log("[Page Renderer] Reading template from:", templatePath);

      try {
        template = fs.readFileSync(templatePath, "utf-8");
        console.log(
          "[Page Renderer] Template file found and read successfully",
        );
      } catch (err: any) {
        console.error("[Page Renderer] Failed to read template:", {
          error: err.message,
          path: templatePath,
        });
        throw err;
      }
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("src/client/entry-server.tsx")).render;
    } else {
      template = fs.readFileSync(
        path.resolve(buildPath, "client/index.html"),
        "utf-8",
      );
      render = (await import(path.resolve(buildPath, "server/entry-server.js")))
        .render;
    }

    //
    const appHtml = await render({ children: page, request, response });

    // For API requests, return both the rendered HTML and serialized props
    if (request.headers["accept"]?.includes("application/json")) {
      return response.send({
        html: ReactDOMServer.renderToString(page),
      });
    }

    // Serialize the element for hydration
    // Convert the page to a string representation since React elements can't be directly serialized
    const pageContent = ReactDOMServer.renderToString(page);

    // Create the props script with proper JSON stringification
    const serializedProps = `<script>
      window.__INITIAL_PROPS__ = ${JSON.stringify({
        page: pageContent,
      }).replace(/</g, "\\u003c")};
    </script>`;

    // First inject the props, then replace the app HTML
    const html = template
      .replace(
        '<script type="module" src="/src/client/entry-client.tsx"></script>',
        `${serializedProps}\n    <script type="module" src="/src/client/entry-client.tsx"></script>`,
      )
      .replace("<!--app-html-->", appHtml);

    return html;
  } catch (e: any) {
    console.log(e);

    if (process.env.NODE_ENV === "development") {
      vite.ssrFixStacktrace(e);
    }
    throw e;
  }
}
