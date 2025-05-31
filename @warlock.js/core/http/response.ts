import config from "@mongez/config";
import type { EventSubscription } from "@mongez/events";
import events from "@mongez/events";
import { fileExistsAsync } from "@mongez/fs";
import { isIterable, isPlainObject, isScalar } from "@mongez/supportive-is";
import type { LogLevel } from "@warlock.js/logger";
import { log } from "@warlock.js/logger";
import type { FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import type React from "react";
import { type ReactNode } from "react";
import send from "send";
import type { Route } from "../router";
import type { ValidationResult, Validator } from "../validator";
import { render } from "./../react";
import type { Request } from "./request";
import type { ResponseEvent } from "./types";

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
  protected currentStatusCode?: number;

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
    this.events.set("sending", [
      ...(this.events.get("sending") || []),
      callback,
    ]);

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
    return (
      this.baseResponse.statusCode >= 200 && this.baseResponse.statusCode < 300
    );
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
    return events.subscribe(event, listener);
  }

  /**
   * Trigger the response event
   */
  protected static async trigger(event: ResponseEvent, ...args: any[]) {
    // make a timeout to make sure the request events is executed first
    return new Promise(resolve => {
      setTimeout(async () => {
        await events.triggerAllAsync(event, ...args);
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

    log(
      "response",
      this.route.method + " " + this.route.path.replace("/*", ""),
      message,
      level,
    );
  }

  /**
   * Check if returning response is json
   */
  public get isJson() {
    return this.getHeader("Content-Type") === "application/json";
  }

  /**
   * Send the response
   */
  public async send(data?: any, statusCode?: number): Promise<Response> {
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
    await Response.trigger("sending", this);

    for (const callback of this.events.get("sending") || []) {
      await callback(this);
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
  public render(
    element: React.ReactElement | React.ComponentType,
    status = 200,
  ) {
    return this.setStatusCode(status).html(render(element));
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
   * send stream response
   * @TODO: check this later as it is not working in some how
   */
  public stream(contentType = "text/plain") {
    // we need to return an object with two methods
    // send: to send the data to the client
    // end: to end the stream
    // by default the content type will be set to text/html
    // we will use fastify response raw to send the data
    // and we will use the stream to end the stream
    // set the content type to text/html
    // we need also to add the charset to be utf-8

    this.baseResponse.raw.writeHead(this.statusCode, {
      "Content-Type": contentType,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    });

    // return the stream object
    return {
      send: (data: any) => {
        this.baseResponse.raw.write(data);
      },
      end: () => {
        this.baseResponse.raw.end();
      },
      render: (element: ReactNode) => {
        const html = render(element);
        this.baseResponse.raw.write(html);
      },
    };
  }

  /**
   * Stream file
   *
   * @todo: Still in progress specially with large files
   */
  private async streamFile(filePath: string) {
    if (!(await fileExistsAsync(filePath))) {
      return this.notFound({
        error: "File Not Found",
      });
    }

    try {
      const reply = this.baseResponse;

      reply.raw.writeHead(this.statusCode, {
        "Content-Type": this.getFileContentType(filePath),
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      });

      const readStream = fs.createReadStream(filePath);

      return this.baseResponse.send(readStream);
    } catch (error: any) {
      return this.serverError(error.message);
    }
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
   * Send a file as a response
   */
  public sendFile(path: string, cacheTime?: number) {
    this.log(`Sending file: ${path}`);

    const fileContent = fs.readFileSync(path);

    if (cacheTime) {
      // cache the file for 1 year
      this.header("Cache-Control", "public, max-age=" + cacheTime);
      // set expires header to 1 year
      this.header("Expires", new Date(Date.now() + cacheTime).toUTCString());
    }

    this.baseResponse.type(this.getFileContentType(path));
    this.baseResponse.send(fileContent);
    return this;
  }

  /**
   * Send file and cache it
   * Cache time in seconds
   * Cache time will be one year
   */
  public sendCachedFile(path: string, cacheTime = 31536000) {
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
  public downloadFile(filePath: string, filename?: string) {
    if (!filename) {
      filename = path.basename(filePath);
    }

    this.baseResponse.header(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    // this.baseResponse.header("Content-Type", this.getFileContentType(filePath));
    this.baseResponse.header("Content-Type", "application/octet-stream");

    this.baseResponse.send(fs.createReadStream(filePath));
  }

  /**
   * Get content type of the given path
   */
  public getFileContentType(path: string) {
    const type = send.mime.lookup(path);
    const charset = send.mime.charsets.lookup(type, "");
    if (!charset) {
      return type;
    }
    return `${type}; charset=${charset}`;
  }

  /**
   * Return validation error to response
   */
  public validationFailed(validator: Validator) {
    const responseErrorsKey = config.get("validation.keys.response", "errors");

    const responseStatus = config.get("validation.responseStatus", 400);

    log.error("request", "validation", "Validation failed");

    return this.send(
      {
        [responseErrorsKey]: validator.errors(),
      },
      responseStatus,
    );
  }

  /**
   * Mark the response as failed
   */
  public failedSchema(result: ValidationResult) {
    const responseErrorsKey = config.get("validation.keys.response", "errors");
    const inputKey = config.get("validation.keys.inputKey", "input");
    const inputError = config.get("validation.keys.inputError", "error");
    const responseStatus = config.get("validation.responseStatus", 400);

    log.error("request", "validation", "Validation failed");

    return this.send(
      {
        [responseErrorsKey]: result.errors.map(error => ({
          [inputKey]: error.input,
          [inputError]: error.error,
        })),
      },
      responseStatus,
    );
  }
}
