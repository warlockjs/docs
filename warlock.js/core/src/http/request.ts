import { colors } from "@mongez/copper";
import events from "@mongez/events";
import { trans, transFrom } from "@mongez/localization";
import { Random, except, get, only, rtrim, set, unset } from "@mongez/reinforcements";
import { isEmpty } from "@mongez/supportive-is";
import type { LogLevel } from "@warlock.js/logger";
import { log } from "@warlock.js/logger";
import { BaseValidator, v } from "@warlock.js/seal";
import type { FastifyRequest } from "fastify";
import { type IncomingHttpHeaders } from "node:http2";
import { config } from "../config/config-getter";
import type { Middleware, Route } from "../router";
import { validateAll } from "../validation/validateAll";
import { createRequestStore } from "./middleware/inject-request-context";
import { Response } from "./response";
import type { RequestEvent } from "./types";
import { UploadedFile } from "./uploaded-file";

type StandardHeaders = {
  // copy every declared property from http.IncomingHttpHeaders
  // but remove index signatures
  [K in keyof IncomingHttpHeaders as string extends K
    ? never
    : number extends K
      ? never
      : K]: IncomingHttpHeaders[K];
};

type HeaderKeys = keyof StandardHeaders;

export class Request<RequestValidation = any> {
  /**
   * Fastify Request object
   */
  public baseRequest!: FastifyRequest;

  /**
   * Response Object
   */
  public response!: Response;

  /**
   * Route Object
   */
  public route!: Route;

  /**
   * Parsed Request Payload
   */
  protected payload: any = {};

  /**
   * Decoded access token payload (set by auth middleware)
   */
  public decodedAccessToken?: any;

  /**
   * Current request instance
   */
  public static current: Request;

  /**
   * Translation method
   * Type of it is the same as the type of trans function
   */
  public trans: ReturnType<typeof trans> = trans;

  /**
   * Alias to trans method
   */
  public t: ReturnType<typeof trans> = trans;

  /**
   * Dynamic properties index signature
   *
   * This allows attaching custom properties to the request instance,
   * commonly used during validation middleware to attach fetched models.
   *
   * @example
   * // In validation middleware:
   * const post = await Post.find(request.int("id"));
   * if (!post) return response.notFound();
   * request.post = post; // Attach the model to the request
   *
   * // In route handler:
   * const post = request.post;
   * // Work with the pre-fetched model
   */
  [key: string]: any;

  /**
   * Locale code
   */
  protected _locale = "";

  /**
   * Validated data
   */
  protected validatedData?: RequestValidation;

  /**
   * Request id
   */
  public id = Random.string(32);

  /**
   * Start Time
   */
  public startTime = Date.now();

  /**
   * End Time
   */
  public endTime?: undefined | number;

  /**
   * Set request handler
   */
  public setRequest(request: FastifyRequest) {
    this.baseRequest = request;

    this.parsePayload();

    const localeCode = this.getLocaleCode();

    this.trans = this.t = transFrom.bind(null, localeCode);

    return this;
  }

  /**
   * Translate from the given locale code
   */
  public transFrom(localeCode: string, keyword: string, placeholders?: any) {
    return transFrom(localeCode, keyword, placeholders);
  }

  /**
   * Get current locale code
   */
  public get locale() {
    if (this._locale) return this._locale;

    return this.header("translation-locale-code") || this.localized;
  }

  /**
   * Set locale code
   */
  public set locale(localeCode: string) {
    this._locale = localeCode;
  }

  /**
   * Get locale code that will be used for translation
   */
  public get localized() {
    if (this._locale) return this._locale;

    return (this._locale = this.header("locale") || this.query["locale"]);
  }

  /**
   * Set locale code
   */
  public setLocaleCode(localeCode: string) {
    this._locale = localeCode;

    return this;
  }

  /**
   * Get current locale code or return default locale code
   */
  public getLocaleCode(defaultLocaleCode: string = config.key("app.localeCode") || "en") {
    return this.locale || defaultLocaleCode;
  }

  /**
   * Get http protocol
   */
  public get protocol() {
    return this.baseRequest.protocol;
  }

  /**
   * Validate the given validation schema
   */
  public async validate(validation: BaseValidator, selectedInputs?: string[]) {
    return await v.validate(validation, selectedInputs ? this.only(selectedInputs) : this.all());
  }

  /**
   * Clear current user
   */
  public clearCurrentUser() {
    this.user = undefined;
  }

  /**
   * Get value of the given header
   */
  public header<TCustomHeader extends string = HeaderKeys>(
    name: TCustomHeader | HeaderKeys,
    defaultValue: any = null,
  ) {
    return this.baseRequest.headers[name.toLocaleLowerCase()] ?? defaultValue;
  }

  /**
   * Get all cookies from the current request
   */
  public get cookies(): Record<string, string | undefined> {
    return this.baseRequest.cookies || {};
  }

  /**
   * Get a particular cookie value or fallback to default
   */
  public cookie(name: string, defaultValue?: any): string | any {
    const value = this.cookies[name] ?? defaultValue;

    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  /**
   * Determine if the request has the specified cookie
   */
  public hasCookie(name: string): boolean {
    return this.cookies[name] !== undefined;
  }

  /**
   * Get the current request domain
   */
  public get domain() {
    return this.baseRequest.hostname.replace(/^www\./, "");
  }

  /**
   * Get hostname
   */
  public get hostname() {
    return this.domain;
  }

  /**
   * Get request origin
   */
  public get origin() {
    return this.baseRequest.headers.origin as string;
  }

  /**
   * Get the domain of the origin
   */
  public get originDomain() {
    const domain = this.origin ? new URL(this.origin).hostname : null;

    if (domain?.startsWith("www.")) {
      return domain.replace(/^www\./, "");
    }

    return domain;
  }

  /**
   * Get authorization header value
   */
  public get authorizationValue(): string {
    const authorization = this.header("authorization");

    if (!authorization) return "";

    const [type, value] = authorization.split(" ");

    if (!["bearer", "key"].includes(type.toLowerCase())) return "";

    return value || "";
  }

  /**
   * Get access token from Authorization header
   *
   * If the Authorization header does not start with `Bearer` value then return null
   */
  public get accessToken(): string | undefined {
    const authorization = this.header("authorization");

    if (!authorization) return;

    const [type, value] = authorization.split(" ");

    if (type.toLowerCase() !== "bearer") return;

    return value;
  }

  /**
   * Get the authorization header
   */
  public get authorization() {
    return this.header("authorization");
  }

  /**
   * Get current request method
   */
  public get method(): string {
    return this.baseRequest.method;
  }

  /**
   * Parse the payload and merge it from the request body, params and query string
   */
  protected parsePayload() {
    this.payload.body = this.parseBody(this.baseRequest.body);

    this.payload.query = this.parseBody(this.baseRequest.query);
    this.payload.params = { ...(this.baseRequest.params || {}) };
    this.payload.all = {
      ...this.payload.body,
      ...this.payload.query,
      ...this.payload.params,
    };
  }

  /**
   * Parse body payload
   */
  protected parseBody(data: any) {
    try {
      if (!data) return {};

      const body: any = {};

      const arrayOfObjectValues: any = {};

      for (let key in data) {
        const value = data[key];

        let isArrayKey = false;

        if (key.endsWith("[]")) {
          isArrayKey = true;
        }

        key = rtrim(key, "[]");

        // check if the key is has a square brackets, then convert it into object
        // i.e user[email] => user: {email: "value"}
        // also check if its an array of objects

        if (key.includes("[")) {
          // check if its an array of objects
          if (key.includes("][")) {
            const keyParts = key.split("[");

            const keyName = keyParts[0];
            if (!arrayOfObjectValues[keyName]) {
              arrayOfObjectValues[keyName] = [];
            }

            const keyNameParts = keyParts[1].split("]");

            const index = Number(keyNameParts[0]);

            if (!arrayOfObjectValues[keyName][index]) {
              arrayOfObjectValues[keyName][index] = {};
            }

            // now get the key after the index
            const keyNameParts2 = keyParts[2].split("]");
            const keyName2 = keyNameParts2[0];

            arrayOfObjectValues[keyName][index][keyName2] = this.parseValue(value);

            continue;
          }

          const keyParts = key.split("[");
          const keyName = keyParts[0];
          const keyNameParts = keyParts[1].split("]");

          set(
            body,
            keyName + "." + keyNameParts[0],
            Array.isArray(value) ? value.map(this.parseValue.bind(this)) : this.parseValue(value),
          );

          continue;
        }

        if (Array.isArray(value)) {
          set(body, key, value.map(this.parseValue.bind(this)));
        } else if (isArrayKey) {
          if (body[key]) {
            body[key].push(this.parseValue(value));
          } else {
            body[key] = [this.parseValue(value)];

            continue;
          }
        } else {
          set(body, key, this.parseValue(value));
        }
      }

      // now merge the array of objects into the body
      for (const key in arrayOfObjectValues) {
        body[key] = arrayOfObjectValues[key];
      }

      return body;
    } catch (error) {
      console.log(error);
      this.log(error, "error");
    }
  }

  /**
   * Parse the given data
   */
  protected parseValue(data: any) {
    // data.value appears only in the multipart form data
    // if it json, then just return the data
    if (data?.file) return new UploadedFile(data);
    if (data?.value !== undefined && data?.fields && data?.type) {
      data = data.value;
    }

    if (data === "false") return false;

    if (data === "true") return true;

    if (data === "null") return null;

    if (typeof data === "string") return data.trim();

    return data;
  }

  /**
   * Set route handler
   */
  public setRoute(route: Route) {
    this.route = route;

    // pass the route to the response object
    this.response.setRoute(route);

    return this;
  }

  /**
   * Trigger an http event
   */
  public trigger(eventName: RequestEvent, ...args: any[]) {
    return events.trigger(`request.${eventName}`, ...args, this);
  }

  /**
   * Listen to the given event
   */
  public on(eventName: RequestEvent, callback: any) {
    return this.subscribe(eventName, callback);
  }

  /**
   * Make a log message
   */
  public log(message: any, level: LogLevel = "info") {
    if (!config.key("http.log")) return;

    log({
      module: "request",
      action: this.route.method + " " + this.route.path.replace("/*", "") + `:${this.id}`,
      message,
      type: level,
      context: {
        request: this,
      },
    });
  }

  /**
   * Get current request path
   */
  public get path() {
    return this.baseRequest.url;
  }

  /**
   * {@alias}
   */
  public get url() {
    return this.baseRequest.url;
  }

  /**
   * Get full url
   */
  public get fullUrl() {
    return this.protocol + "://" + this.hostname + this.path;
  }

  /**
   * Run middleware
   */
  public async runMiddleware() {
    // measure request time
    // check for middleware first
    const middlewareOutput = await this.executeMiddleware();

    if (middlewareOutput !== undefined) {
      // 👇🏻 make sure first its not a response instance
      if (middlewareOutput instanceof Response) return middlewareOutput;
      // 👇🏻 send the response
      return this.response.send(middlewareOutput);
    }

    const handler = this.route.handler;

    if (!handler.validation) return;

    // 👇🏻 check for validation using validateAll helper function
    const validationOutput = await validateAll(handler.validation, this, this.response);

    return validationOutput;
  }

  /**
   * Get route handler
   */
  public getHandler() {
    return this.route.handler;
  }

  /**
   * Get inputs that has been validated only
   * You can also pass an array of inputs to get only the validated inputs
   */
  public validated<Output = RequestValidation>(inputs?: (keyof Output | (string & {}))[]): Output {
    if (this.validatedData) {
      return inputs
        ? only(this.validatedData as Output, inputs as string[])
        : (this.validatedData as Output);
    }

    return {} as Output;
  }

  /**
   * Get inputs that has been validated except the given inputs
   */
  public validatedExcept(...inputs: string[]): RequestValidation {
    return except(this.validated(), inputs);
  }

  /**
   * Set validated data
   */
  public setValidatedData(data: RequestValidation) {
    this.validatedData = data;
  }

  /**
   * Execute the request
   */
  public async execute() {
    try {
      // call executingAction event

      this.log("Executing the request");

      return await createRequestStore(this, this.response);
    } catch (error) {
      this.log(error, "error");

      throw error;
    }
  }

  /**
   * Execute middleware list of current route
   */
  protected async executeMiddleware() {
    // collect all middlewares for current route
    const middlewares = this.collectMiddlewares();

    // check if there are no middlewares, then return
    if (middlewares.length === 0) return;

    this.log("About to execute request middlewares");

    // trigger the executingMiddleware event
    this.trigger("executingMiddleware", middlewares, this.route);

    for (const middleware of middlewares) {
      this.log("Executing middleware " + colors.yellowBright(middleware.name));
      const output = await middleware(this, this.response);
      this.log("Executed middleware " + colors.yellowBright(middleware.name), "success");

      if (output !== undefined) {
        this.log(
          colors.yellow("request intercepted by middleware ") + colors.cyanBright(middleware.name),
          "warn",
        );

        this.trigger("executedMiddleware");

        this.log("Request middlewares executed", "success");

        return output;
      }
    }

    this.log("Request middlewares executed", "success");

    // trigger the executedMiddleware event
    this.trigger("executedMiddleware", middlewares, this.route);
  }

  /**
   * Collect middlewares for current route
   */
  protected collectMiddlewares(): Middleware[] {
    const middlewaresList: Middleware[] = [];

    // collect route middlewares
    if (this.route.middleware) {
      middlewaresList.push(...this.route.middleware);
    }

    return middlewaresList;
  }

  /**
   * Get request input value from query string, params or body
   */
  public input(key: string, defaultValue?: any) {
    return get(this.payload.all, key, defaultValue);
  }

  /**
   * Get email input value, this will lowercase the value
   */
  public email(key: string = "email", defaultValue: string = ""): string {
    return this.input(key, defaultValue)?.toLowerCase() || defaultValue;
  }

  /**
   * @alias input
   */
  public get(key: string, defaultValue?: any) {
    return this.input(key, defaultValue);
  }

  /**
   * Determine if request has input value
   */
  public has(key: string) {
    return get(this.payload.all, key, undefined) !== undefined;
  }

  /**
   * Set request input value
   */
  public set(key: string, value: any) {
    set(this.payload.all, key, value);

    return this;
  }

  /**
   * Set the given value if the request does not have the input
   */
  public setDefault(key: string, value: any) {
    if (this.has(key)) return this;

    set(this.payload.all, key, value);

    return this;
  }

  /**
   * Unset request payload keys
   */
  public unset(...keys: string[]) {
    this.payload.all = unset(this.payload.all, keys);

    return this;
  }

  /**
   * Get request body
   */
  public get body() {
    return this.payload.body;
  }

  /**
   * Set request body value
   */
  public setBody(key: string, value: any) {
    set(this.payload.body, key, value);

    return this;
  }

  /**
   * Get body inputs except files
   */
  public get bodyInputs() {
    const inputs = this.payload.body;

    const bodyInputs: any = {};

    for (const key in inputs) {
      const value = inputs[key];

      if (value.file && value.fieldname) continue;

      bodyInputs[key] = value;
    }

    return bodyInputs;
  }

  /**
   * Get request file in UploadedFile instance
   */
  public file(key: string): UploadedFile | undefined {
    const file = this.input(key);

    return file;
  }

  /**
   * Get uploaded files from the request for the given name
   * If the given name is not present in the request, return an empty array
   */
  public files(name: string): UploadedFile[] {
    return this.input(name) || [];
  }

  /**
   * Get request params
   */
  public get params() {
    return this.payload.params;
  }

  /**
   * Set request params value
   */
  public setParam(key: string, value: any) {
    set(this.payload.params, key, value);

    return this;
  }

  /**
   * Get request query
   */
  public get query() {
    return this.payload.query;
  }

  /**
   * Set request query value
   */
  public setQuery(key: string, value: any) {
    set(this.payload.query, key, value);

    return this;
  }

  /**
   * Get all inputs
   */
  public all() {
    return this.payload.all;
  }

  /**
   * Get all inputs except params
   */
  public allExceptParams() {
    return {
      ...this.payload.query,
      ...this.payload.body,
    };
  }

  /**
   * Get all heavy inputs except params
   */
  public heavyExceptParams() {
    const inputs = this.allExceptParams();

    const heavyInputs: any = {};

    for (const key in inputs) {
      const value = inputs[key];

      if (isEmpty(value) && value !== null) continue;

      heavyInputs[key] = value;
    }

    return heavyInputs;
  }

  /**
   * Get only heavy inputs, the input with a value
   */
  public heavy() {
    const inputs = this.all();

    const heavyInputs: any = {};

    for (const key in inputs) {
      const value = inputs[key];

      if (isEmpty(value) && value !== null) continue;

      heavyInputs[key] = value;
    }

    return heavyInputs;
  }

  /**
   * Get only the given keys from the request data
   */
  public only(keys: string[]) {
    return only(this.all(), keys);
  }

  /**
   * Pluck the given keys from the request data
   */
  public pluck(keys: string[]) {
    const data = this.only(keys);

    this.unset(...keys);

    return data;
  }

  /**
   * Get all request inputs except the given keys
   */
  public except(keys: string[]) {
    return except(this.all(), keys);
  }

  /**
   * Get boolean input value
   */
  public bool(key: string, defaultValue = false) {
    const value = this.input(key, defaultValue);

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    if (value === 0) {
      return false;
    }

    return Boolean(value);
  }

  /**
   * Get integer input value
   */
  public int(key: string, defaultValue: number = 0): number | undefined {
    const value = this.input(key, defaultValue);

    if (!value && value !== 0) return undefined;

    return parseInt(value);
  }

  /**
   * Shorthand getter to get id param
   */
  public get idParam() {
    return this.int("id");
  }

  /**
   * Get string input value
   */
  public string(key: string, defaultValue: string = ""): string {
    const value = this.input(key, defaultValue);

    return String(value);
  }

  /**
   * Get float input value
   */
  public float(key: string, defaultValue: number = 0): number {
    const value = this.input(key, defaultValue);

    return parseFloat(value) || 0;
  }

  /**
   * Get number input value
   */
  public number(key: string, defaultValue: number = 0): number {
    const value = Number(this.input(key, defaultValue));

    return isNaN(value) ? defaultValue : value;
  }

  /**
   * Get request ip
   */
  public get ip() {
    return this.baseRequest.ip;
  }

  /**
   * Detect proper ip
   */
  public detectIp() {
    // as the server maybe used behind a proxy
    // then we need to check first if there is a forwarded ip
    // check for the real-ip header

    const realIp = this.header("x-real-ip");

    if (realIp) return realIp;

    const forwardedIp = this.header("x-forwarded-for");

    return forwardedIp || this.baseRequest.ip;
  }

  /**
   * An alias to detectIp
   */
  public get realIp() {
    return this.detectIp();
  }

  /**
   * Get request ips
   */
  public get ips() {
    return this.baseRequest.ips;
  }

  /**
   * Get request referer
   */
  public get referer() {
    return this.baseRequest.headers.referer;
  }

  /**
   * Get user agent
   */
  public get userAgent() {
    return this.baseRequest.headers["user-agent"];
  }

  /**
   * Get request headers
   */
  public get headers(): typeof this.baseRequest.headers {
    return this.baseRequest.headers;
  }

  /**
   * Set the given header
   */
  public setHeader(key: HeaderKeys, value: string) {
    this.baseRequest.headers[key.toLowerCase()] = value;

    return this;
  }
}
