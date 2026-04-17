import type { CookieSerializeOptions } from "@fastify/cookie";
import config from "@mongez/config";
import type { EventSubscription } from "@mongez/events";
import events from "@mongez/events";
import { fileExistsAsync } from "@mongez/fs";
import { isIterable, isPlainObject, isScalar } from "@mongez/supportive-is";
import type { LogLevel } from "@warlock.js/logger";
import { log } from "@warlock.js/logger";
import type { ValidationResult } from "@warlock.js/seal";
import type { FastifyReply } from "fastify";
import fs from "fs";
import mime from "mime";
import path from "path";
import type React from "react";
import { type ReactNode } from "react";
import type { Route } from "../router";
import { StorageFile } from "../storage";
import { renderReact } from "./../react";
import type { Request } from "./request";
import type { ResponseEvent, ResponseSSEController, ResponseStreamController } from "./types";

type CookieValue = string | number | boolean | Record<string, any> | Array<any>;

export enum ResponseStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Options for sending files
 */
export type SendFileOptions = {
  cacheTime?: number;
  immutable?: boolean;
  inline?: boolean;
  filename?: string;
};

/**
 * Options for sending buffers
 */
export type SendBufferOptions = SendFileOptions & {
  contentType?: string;
  etag?: string;
};

export class Response {
  /**
   * Current route
   */
  protected route!: Route;

  /**
   * Fastify response object
   */
  public baseResponse!: FastifyReply;

  /**
   * Current status code
   */
  protected currentStatusCode = 200;

  /**
   * Current response body
   */
  protected currentBody: any;

  /**
   * A flag to determine if response is being sent
   */
  protected isSending = false;

  /**
   * Request object
   */
  public request!: Request;

  /**
   * Internal events related to this particular response object
   */
  protected events = new Map<string, any[]>();

  /**
   * Parsed body
   * This will return the parsed body of the response
   * Please note that if this property is called before the response is sent, it will return undefined
   */
  public parsedBody: any;

  /**
   * Get raw response
   */
  public get raw() {
    return this.baseResponse.raw;
  }

  /**
   * Get Current response body
   */
  public get body() {
    return this.currentBody;
  }

  /**
   * Set response body
   */
  public set body(body: any) {
    this.currentBody = body;
  }

  /**
   * Add event on sending response
   */
  public onSending(callback: any) {
    this.events.set("sending", [...(this.events.get("sending") || []), callback]);

    return this;
  }

  /**
   * Add event on sent response
   */
  public onSent(callback: any) {
    this.events.set("sent", [...(this.events.get("sent") || []), callback]);

    return this;
  }

  /**
   * Set the Fastify response object
   */
  public setResponse(response: FastifyReply) {
    this.baseResponse = response;

    // Listen to the 'finish' event to track when response is fully sent
    // This works for all response types: JSON, streams, buffers, files, etc.
    this.baseResponse.raw.once("finish", () => {
      this.request.endTime = Date.now();
    });

    return this;
  }

  /**
   * Reset the response state
   */
  public reset() {
    this.route = {} as Route;
    this.currentBody = null;
    this.currentStatusCode = 200;
  }

  /**
   * Set current route
   */
  public setRoute(route: Route) {
    this.route = route;

    return this;
  }

  /**
   * Get the content type
   */
  public get contentType() {
    return this.baseResponse.getHeader("Content-Type");
  }

  /**
   * Set the content type
   */
  public setContentType(contentType: string) {
    this.baseResponse.header("Content-Type", contentType);

    return this;
  }

  /**
   * Get the status code
   */
  public get statusCode(): number {
    return this.currentStatusCode ?? this.baseResponse.statusCode;
  }

  /**
   * Check if response status is ok
   */
  public get isOk() {
    return this.currentStatusCode >= 200 && this.currentStatusCode < 300;
  }

  /**
   * Check if the response has been sent
   */
  public get sent() {
    return this.baseResponse.sent;
  }

  /**
   * Add a listener to the response event
   */
  public static on(
    event: ResponseEvent,
    listener: (response: Response) => void,
  ): EventSubscription {
    return events.subscribe(`response.${event}`, listener);
  }

  /**
   * Trigger the response event
   */
  protected static async trigger(event: ResponseEvent, ...args: any[]) {
    // make a timeout to make sure the request events is executed first
    return new Promise((resolve) => {
      setTimeout(async () => {
        await events.triggerAllAsync(`response.${event}`, ...args);
        resolve(true);
      }, 0);
    });
  }

  /**
   * Parse body
   */
  protected async parseBody() {
    return await this.parse(this.currentBody);
  }

  /**
   * Parse the given value
   */
  public async parse(value: any): Promise<any> {
    // if it is a falsy value, return it
    if (!value || isScalar(value)) return value;

    // if it has a `toJSON` method, call it and await the result then return it
    if (value.toJSON) {
      value.request = this.request;
      return await value.toJSON();
    }

    // if it is iterable, an array or array-like object then parse each item
    if (isIterable(value)) {
      const values = Array.from(value);

      return Promise.all(
        values.map(async (item: any) => {
          return await this.parse(item);
        }),
      );
    }

    // if not plain object, then return it
    if (!isPlainObject(value)) {
      return value;
    }

    // loop over the object and check if the value and call `parse` on it
    for (const key in value) {
      const subValue = value[key];

      value[key] = await this.parse(subValue);
    }

    return value;
  }

  /**
   * Make a log message
   */
  public log(message: string, level: LogLevel = "info") {
    if (!config.get("http.log")) return;

    log({
      module: "response",
      action: this.route.method + " " + this.route.path.replace("/*", "") + `:${this.request.id}`,
      message,
      type: level,
      context: {
        request: this.request,
        response: this,
      },
    });
  }

  /**
   * Check if returning response is json
   */
  public get isJson() {
    return this.getHeader("Content-Type") === "application/json";
  }

  /**
   * Send the response
   * @param data - Response data
   * @param statusCode - HTTP status code
   * @param triggerEvents - Whether to trigger response events (default: true)
   */
  public async send(data?: any, statusCode?: number, triggerEvents = true): Promise<Response> {
    if (statusCode) {
      this.currentStatusCode = statusCode;
    }

    if (data === this) return this;

    if (data) {
      this.currentBody = data;
    }

    if (!this.currentStatusCode) {
      this.currentStatusCode = 200;
    }

    this.log("Sending response");
    // trigger the sending event
    if (Array.isArray(this.currentBody) || isPlainObject(this.currentBody)) {
      this.setContentType("application/json");
    }

    if (triggerEvents) {
      await Response.trigger("sending", this);

      for (const callback of this.events.get("sending") || []) {
        await callback(this);
      }

      if (this.isJson) {
        await Response.trigger("sendingJson", this);
        for (const callback of this.events.get("sendingJson") || []) {
          await callback(this);
        }

        if (this.isOk) {
          await Response.trigger("sendingSuccessJson", this);
          for (const callback of this.events.get("sendingSuccessJson") || []) {
            await callback(this);
          }
        }
      }
    }

    // parse the body and make sure it is transformed to sync data instead of async data
    if (typeof this.currentBody !== "string") {
      this.parsedBody = await this.parseBody();
    } else {
      this.parsedBody = data;
    }

    // Set the status first
    this.baseResponse.status(this.currentStatusCode);

    // Then send the response with the parsed body
    await this.baseResponse.send(this.parsedBody);

    this.log("Response sent");

    if (triggerEvents) {
      // trigger the sent event
      Response.trigger("sent", this);

      for (const callback of this.events.get("sent") || []) {
        callback(this);
      }

      // trigger the success event if the status code is 2xx
      if (this.currentStatusCode >= 200 && this.currentStatusCode < 300) {
        Response.trigger("success", this);
      }

      // trigger the successCreate event if the status code is 201
      if (this.currentStatusCode === 201) {
        Response.trigger("successCreate", this);
      }

      // trigger the badRequest event if the status code is 400
      if (this.currentStatusCode === 400) {
        Response.trigger("badRequest", this);
      }

      // trigger the unauthorized event if the status code is 401
      if (this.currentStatusCode === 401) {
        Response.trigger("unauthorized", this);
      }

      // trigger the forbidden event if the status code is 403
      if (this.currentStatusCode === 403) {
        Response.trigger("forbidden", this);
      }

      // trigger the notFound event if the status code is 404
      if (this.currentStatusCode === 404) {
        Response.trigger("notFound", this);
      }

      // trigger the throttled event if the status code is 429
      if (this.currentStatusCode === 429) {
        Response.trigger("throttled", this);
      }

      // trigger the serverError event if the status code is 500
      if (this.currentStatusCode === 500) {
        Response.trigger("serverError", this);
      }

      // trigger the error event if the status code is 4xx or 5xx
      if (this.currentStatusCode >= 400) {
        Response.trigger("error", this);
      }
    }

    return this;
  }

  /**
   * Send html response
   */
  public html(data: string, statusCode?: number) {
    return this.setContentType("text/html").send(data, statusCode);
  }

  /**
   * Render the given react component
   */
  public render(element: React.ReactElement | React.ComponentType, status = 200) {
    return this.setStatusCode(status).html(renderReact(element));
  }

  /**
   * Send xml response
   */
  public xml(data: string, statusCode?: number) {
    return this.setContentType("text/xml").send(data, statusCode);
  }

  /**
   * Send plain text response
   */
  public text(data: string, statusCode?: number) {
    return this.setContentType("text/plain").send(data, statusCode);
  }

  /**
   * Create a streaming response for progressive/chunked data sending
   *
   * This method allows you to send data in chunks and control when the response ends.
   * Perfect for Server-Sent Events (SSE), progressive rendering, or streaming large responses.
   *
   * @example
   * ```ts
   * const stream = response.stream("text/html");
   * stream.send("<html><body>");
   * stream.send("<h1>Hello</h1>");
   * stream.render(<MyComponent />);
   * stream.send("</body></html>");
   * stream.end();
   * ```
   *
   * @param contentType - The content type for the stream (default: "text/plain")
   * @returns Stream controller with send(), render(), and end() methods
   */
  public stream(contentType = "text/plain"): ResponseStreamController {
    // Set headers using the response API
    this.setContentType(contentType);
    this.header("Transfer-Encoding", "chunked");
    this.header("Cache-Control", "no-cache");
    this.header("Connection", "keep-alive");
    this.header("X-Content-Type-Options", "nosniff");

    // Trigger sending events
    Response.trigger("sending", this);
    for (const callback of this.events.get("sending") || []) {
      callback(this);
    }

    this.log("Starting stream");

    // Track stream state
    let isEnded = false;
    const chunks: any[] = [];

    // Write headers to start the stream
    // Note: We use raw here because we need chunked encoding control
    // This is the only valid use case for bypassing Fastify's abstraction
    this.baseResponse.raw.writeHead(this.statusCode, this.getHeaders() as any);

    return {
      /**
       * Send a chunk of data to the client
       * @param data - Data to send (string, Buffer, or any serializable data)
       */
      send: (data: any) => {
        if (isEnded) {
          throw new Error("Cannot send data: stream has already ended");
        }

        this.baseResponse.raw.write(data);

        return this;
      },

      /**
       * Render a React component and send it as a chunk
       * @param element - React element or component to render
       */
      render: (element: ReactNode) => {
        if (isEnded) {
          throw new Error("Cannot render: stream has already ended");
        }

        const html = renderReact(element);
        chunks.push(html);
        this.baseResponse.raw.write(html);

        return this;
      },

      /**
       * End the stream and trigger completion events
       */
      end: () => {
        if (isEnded) {
          return this;
        }

        isEnded = true;

        // Store the streamed content for logging/debugging
        this.currentBody = chunks;
        this.parsedBody = chunks;

        // End the response
        this.baseResponse.raw.end();

        this.log("Stream ended");

        // Trigger sent events
        Response.trigger("sent", this);
        for (const callback of this.events.get("sent") || []) {
          callback(this);
        }

        // Trigger success event if status is 2xx
        if (this.isOk) {
          Response.trigger("success", this);
        }

        // Trigger status-specific events
        if (this.currentStatusCode === 201) {
          Response.trigger("successCreate", this);
        }

        return this;
      },

      /**
       * Check if the stream has ended
       */
      get ended() {
        return isEnded;
      },
    };
  }

  /**
   * Create a Server-Sent Events (SSE) stream
   *
   * SSE is a standard for pushing real-time updates from server to client.
   * Perfect for live notifications, progress updates, or real-time data feeds.
   *
   * @example
   * ```ts
   * const sse = response.sse();
   *
   * // Send events
   * sse.send("message", { text: "Hello!" });
   * sse.send("notification", { type: "info", message: "Update available" }, "msg-123");
   *
   * // Keep connection alive
   * const keepAlive = setInterval(() => sse.comment("ping"), 30000);
   *
   * // Clean up when done
   * clearInterval(keepAlive);
   * sse.end();
   * ```
   *
   * @returns SSE controller with send(), comment(), and end() methods
   */
  public sse(): ResponseSSEController {
    // Set SSE-specific headers
    this.setContentType("text/event-stream");
    this.header("Cache-Control", "no-cache, no-store, must-revalidate");
    this.header("Connection", "keep-alive");
    this.header("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Trigger sending events
    Response.trigger("sending", this);
    for (const callback of this.events.get("sending") || []) {
      callback(this);
    }

    this.log("Starting SSE stream");

    // Track stream state
    let isEnded = false;
    const events: any[] = [];
    const disconnectHandlers: Array<() => void> = [];

    // Write headers to start the stream
    this.baseResponse.raw.writeHead(this.statusCode, this.getHeaders() as any);

    // Detect client disconnect — set isEnded silently and invoke cleanup handlers.
    // Without this, background jobs keep writing to a dead socket after the client drops.
    this.baseResponse.raw.on("close", () => {
      if (!isEnded) {
        isEnded = true;
        this.log("SSE client disconnected");
        for (const handler of disconnectHandlers) {
          handler();
        }
      }
    });

    const controller: ResponseSSEController = {
      /**
       * Send an SSE event
       * @param event - Event name (e.g., "message", "chunk", "done")
       * @param data - Event data (will be JSON stringified)
       * @param id - Optional event ID for client-side Last-Event-ID tracking (reconnect support)
       */
      send: (event: string, data: any, id?: string): ResponseSSEController => {
        // Silent no-op after disconnect — background jobs should not crash when
        // the client drops mid-stream. The onDisconnect handler handles cleanup.
        if (isEnded) return controller;

        let message = "";
        if (id) message += `id: ${id}\n`;
        message += `event: ${event}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;

        events.push({ event, data, id });
        this.baseResponse.raw.write(message);

        return controller;
      },

      /**
       * Send a comment (keeps connection alive, invisible to client)
       * Useful for preventing timeout on long-lived connections
       * @param text - Comment text
       */
      comment: (text: string): ResponseSSEController => {
        // Silent no-op after disconnect
        if (isEnded) return controller;

        this.baseResponse.raw.write(`: ${text}\n\n`);

        return controller;
      },

      /**
       * End the SSE stream and trigger completion events
       */
      end: (): ResponseSSEController => {
        if (isEnded) return controller;

        isEnded = true;

        // Store the events for logging/debugging
        this.currentBody = events;
        this.parsedBody = events;

        // End the response
        this.baseResponse.raw.end();

        this.log("SSE stream ended");

        // Trigger sent events
        Response.trigger("sent", this);
        for (const callback of this.events.get("sent") || []) {
          callback(this);
        }

        // Trigger success event if status is 2xx
        if (this.isOk) {
          Response.trigger("success", this);
        }

        return controller;
      },

      /**
       * Register a handler to be called when the client disconnects.
       * Use this to clean up EventEmitter listeners, cancel background jobs, etc.
       *
       * @example
       * ```ts
       * const sse = response.sse();
       * const listener = (chunk) => sse.send("chunk", { chunk });
       * eventBus.on(aiMessageId, listener);
       * sse.onDisconnect(() => eventBus.off(aiMessageId, listener));
       * ```
       */
      onDisconnect: (handler: () => void): ResponseSSEController => {
        disconnectHandlers.push(handler);
        return controller;
      },

      /**
       * Check if the stream has ended (either via end() or client disconnect)
       */
      get ended() {
        return isEnded;
      },
    };

    return controller;
  }

  /**
   * Set the status code
   */
  public setStatusCode(statusCode: number) {
    this.currentStatusCode = statusCode;

    return this;
  }

  /**
   * Redirect the user to another route
   */
  public redirect(url: string, statusCode = 302) {
    this.baseResponse.redirect(url, statusCode);

    return this;
  }

  /**
   * Permanent redirect
   */
  public permanentRedirect(url: string) {
    this.baseResponse.redirect(url, 301);

    return this;
  }

  /**
   * Get the response time
   */
  public getResponseTime() {
    return this.baseResponse.elapsedTime;
  }

  /**
   * Remove a specific header
   */
  public removeHeader(key: string) {
    this.baseResponse.removeHeader(key);

    return this;
  }

  /**
   * Get a specific header
   */
  public getHeader(key: string) {
    return this.baseResponse.getHeader(key);
  }

  /**
   * Get the response headers
   */
  public getHeaders() {
    return this.baseResponse.getHeaders();
  }

  /**
   * Set multiple headers
   */
  public headers(headers: Record<string, string>) {
    this.baseResponse.headers(headers);

    return this;
  }

  /**
   * Set the response header
   */
  public header(key: string, value: any) {
    this.baseResponse.header(key, value);

    return this;
  }

  /**
   * Set a cookie on the response
   *
   * @example
   * response.cookie('theme', 'dark', { maxAge: 3600, httpOnly: true })
   */
  public cookie(name: string, value: CookieValue, options?: CookieSerializeOptions) {
    const defaultOptions = config.get("http.cookies.options", {});
    this.baseResponse.setCookie(name, JSON.stringify(value), { ...defaultOptions, ...options });

    return this;
  }

  /**
   * Clear a cookie from the response
   *
   * @example
   * response.clearCookie('token', { path: '/' });
   */
  public clearCookie(name: string, options?: CookieSerializeOptions) {
    const defaultOptions = config.get("http.cookies.options", {});
    this.baseResponse.clearCookie(name, { ...defaultOptions, ...options });

    return this;
  }

  /**
   * Alias to header method
   */
  public setHeader(key: string, value: any) {
    return this.header(key, value);
  }

  /**
   * Send an error response with status code 500
   */
  public serverError(data: any) {
    return this.send(data, 500);
  }

  /**
   * Send a forbidden response with status code 403
   */
  public forbidden(
    data: any = {
      error: "You are not allowed to access this resource, FORBIDDEN",
    },
  ) {
    return this.send(data, 403);
  }

  /**
   * Send a service unavailable response with status code 503
   */
  public serviceUnavailable(data: any) {
    return this.send(data, 503);
  }

  /**
   * Send an unauthorized response with status code 401
   */
  public unauthorized(
    data: any = {
      error: "unauthorized",
    },
  ) {
    return this.send(data, 401);
  }

  /**
   * Send a not found response with status code 404
   */
  public notFound(
    data: any = {
      error: "notFound",
    },
  ) {
    return this.send(data, 404);
  }

  /**
   * Send a bad request response with status code 400
   */
  public badRequest(data: any) {
    return this.send(data, 400);
  }

  /**
   * Send a success response with status code 201
   */
  public successCreate(data: any) {
    return this.send(data, 201);
  }

  /**
   * Send a success response
   */
  public success(data: any = { success: true }) {
    return this.send(data);
  }

  /**
   * Send a no content response with status code 204
   */
  public noContent() {
    return this.baseResponse.status(204).send();
  }

  /**
   * Send an accepted response with status code 202
   * Used for async operations that have been accepted but not yet processed
   */
  public accepted(data: any = { message: "Request accepted for processing" }) {
    return this.send(data, 202);
  }

  /**
   * Send a conflict response with status code 409
   */
  public conflict(data: any = { error: "Resource conflict" }) {
    return this.send(data, 409);
  }

  /**
   * Send an unprocessable entity response with status code 422
   * Used for semantic validation errors
   */
  public unprocessableEntity(data: any) {
    return this.send(data, 422);
  }

  /**
   * Apply response options (cache, disposition, etag)
   * Shared helper for sendFile and sendBuffer
   */
  private applyResponseOptions(options: SendBufferOptions, defaultFilename?: string): boolean {
    // Set content type if provided
    if (options.contentType) {
      this.baseResponse.type(options.contentType);
    }

    // Set cache headers if specified
    if (options.cacheTime) {
      const cacheControl = options.immutable
        ? `public, max-age=${options.cacheTime}, immutable`
        : `public, max-age=${options.cacheTime}`;
      this.header("Cache-Control", cacheControl);
      this.header("Expires", new Date(Date.now() + options.cacheTime * 1000).toUTCString());
    }

    // Set ETag if provided (for conditional requests)
    if (options.etag) {
      this.header("ETag", options.etag);

      // Check If-None-Match for conditional request
      const ifNoneMatch = this.request.header("if-none-match");
      if (ifNoneMatch && ifNoneMatch === options.etag) {
        this.log("Content not modified (ETag match), sending 304");
        this.baseResponse.status(304).send();
        return true; // Indicates 304 was sent
      }
    }

    // Set Content-Disposition if inline or filename is specified
    if (options.inline !== undefined || options.filename) {
      const disposition = options.inline ? "inline" : "attachment";
      const filename = options.filename || defaultFilename || "file";
      this.header("Content-Disposition", `${disposition}; filename=\"${filename}\"`);
    }

    return false; // No 304 sent
  }

  /**
   * Send a file as a response
   */
  public async sendFile(filePath: string | StorageFile, options?: number | SendFileOptions) {
    if (filePath instanceof StorageFile) {
      filePath = filePath.absolutePath!;
    }

    this.log(`Sending file: ${filePath}`);

    // Check if file exists first
    if (!(await fileExistsAsync(filePath))) {
      return this.notFound({
        error: "File Not Found",
      });
    }

    try {
      // Normalize options to object format
      const opts = typeof options === "number" ? { cacheTime: options } : options || {};

      // Get file stats for ETag and Last-Modified
      const stats = await fs.promises.stat(filePath);
      const lastModified = stats.mtime;

      // Generate ETag based on file size and modification time
      const etag = `"${stats.size}-${stats.mtime.getTime()}"`;

      // Set Last-Modified header
      this.header("Last-Modified", lastModified.toUTCString());
      this.header("ETag", etag);

      // Set content type
      const contentType = this.getFileContentType(filePath);
      this.baseResponse.type(contentType);

      // Apply common response options (cache, disposition)
      const defaultFilename = path.basename(filePath);
      const sent304 = this.applyResponseOptions({ ...opts, etag, contentType }, defaultFilename);
      if (sent304) return this.baseResponse;

      // Check conditional request headers
      const ifNoneMatch = this.request.header("if-none-match");
      const ifModifiedSince = this.request.header("if-modified-since");

      // Handle If-None-Match (ETag validation)
      if (ifNoneMatch && ifNoneMatch === etag) {
        this.log("File not modified (ETag match), sending 304");
        return this.baseResponse.status(304).send();
      }

      // Handle If-Modified-Since (Last-Modified validation)
      if (ifModifiedSince) {
        const modifiedSinceDate = new Date(ifModifiedSince);
        if (lastModified.getTime() <= modifiedSinceDate.getTime()) {
          this.log("File not modified (Last-Modified check), sending 304");
          return this.baseResponse.status(304).send();
        }
      }

      // Use streaming for efficient file sending
      const stream = fs.createReadStream(filePath);

      // Handle stream errors
      stream.on("error", (error) => {
        this.log(`Error reading file: ${error.message}`, "error");
        if (!this.baseResponse.sent) {
          this.serverError({
            error: "Error reading file",
            message: error.message,
          });
        }
      });

      // Send the stream (endTime will be set by finish event listener)
      return this.baseResponse.send(stream);
    } catch (error: any) {
      this.log(`Error sending file: ${error.message}`, "error");
      return this.serverError({
        error: "Error sending file",
        message: error.message,
      });
    }
  }

  /**
   * Send buffer as a response
   * Useful for dynamically generated content (e.g., resized images, generated PDFs)
   */
  public sendBuffer(buffer: Buffer, options?: number | SendBufferOptions) {
    this.log("Sending buffer");

    // Normalize options to object format
    const opts = typeof options === "number" ? { cacheTime: options } : options || {};

    // Apply common response options (cache, disposition, etag)
    const sent304 = this.applyResponseOptions(opts);
    if (sent304) return this.baseResponse;

    // Note: endTime is set in the main send() method for non-streaming responses
    return this.baseResponse.send(buffer);
  }

  /**
   * Send an Image instance as a response
   * Automatically detects image format and sets content type
   */
  public async sendImage(
    image: any, // Type as 'any' to avoid circular dependency with Image class
    options?: number | (Omit<SendBufferOptions, "contentType"> & { contentType?: string }),
  ) {
    this.log("Sending image");

    // Normalize options to object format
    const opts = typeof options === "number" ? { cacheTime: options } : options || {};

    // Get image metadata to determine format
    const metadata = await image.metadata();
    const format = metadata.format || "jpeg";

    // Convert image to buffer
    const buffer = await image.toBuffer();

    // Auto-set content type if not provided
    const contentType = opts.contentType || `image/${format}`;

    // Auto-generate ETag if not provided
    // Format: "format-widthxheight-size" (e.g., "jpeg-800x600-45231")
    // This catches changes in dimensions, quality, filters, and format
    if (!opts.etag) {
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      opts.etag = `"${format}-${width}x${height}-${buffer.length}"`;
    }

    // Apply common response options with auto-detected content type
    const sent304 = this.applyResponseOptions({ ...opts, contentType });
    if (sent304) return this.baseResponse;

    // Note: endTime is set in the main send() method for non-streaming responses
    return this.baseResponse.send(buffer);
  }

  /**
   * Send file and cache it
   * Cache time in seconds
   * Cache time will be one year
   */
  public sendCachedFile(path: string | StorageFile, cacheTime = 31536000) {
    return this.sendFile(path, cacheTime);
  }

  /**
   * Download the given file path
   */
  public download(path: string, filename?: string) {
    return this.downloadFile(path, filename);
  }

  /**
   * Download the given file path
   */
  public async downloadFile(filePath: string, filename?: string) {
    // Check if file exists first
    if (!(await fileExistsAsync(filePath))) {
      return this.notFound({
        error: "File Not Found",
      });
    }

    try {
      if (!filename) {
        filename = path.basename(filePath);
      }

      this.baseResponse.header("Content-Disposition", `attachment; filename="${filename}"`);

      // this.baseResponse.header("Content-Type", this.getFileContentType(filePath));
      this.baseResponse.header("Content-Type", "application/octet-stream");

      const stream = fs.createReadStream(filePath);

      // Handle stream errors
      stream.on("error", (error) => {
        this.log(`Error reading file for download: ${error.message}`, "error");
        if (!this.baseResponse.sent) {
          this.serverError({
            error: "Error reading file",
            message: error.message,
          });
        }
      });

      // Send the stream (endTime will be set by finish event listener)
      return this.baseResponse.send(stream);
    } catch (error: any) {
      this.log(`Error downloading file: ${error.message}`, "error");
      return this.serverError({
        error: "Error downloading file",
        message: error.message,
      });
    }
  }

  /**
   * Get content type of the given path
   */
  public getFileContentType(filePath: string) {
    const type = mime.getType(filePath) || "application/octet-stream";
    return type;
  }

  /**
   * Mark the response as failed
   */
  public failedSchema(result: ValidationResult) {
    const { errors, inputKey, inputError, status } = config.get("validation.response", {
      errors: "errors",
      inputKey: "input",
      inputError: "error",
      status: 400,
    });

    log.error("request", "validation", `${this.request.id} - Validation failed`);

    return this.send(
      {
        [errors]: result.errors.map((error) => ({
          [inputKey]: error.input,
          [inputError]: error.error,
        })),
      },
      status,
    );
  }
}
