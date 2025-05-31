import { get } from "@mongez/reinforcements";
import { type LightMyRequestResponse } from "fastify";
import type { IncomingHttpHeaders } from "http";

type HeaderKey = keyof IncomingHttpHeaders;

export class HttpResponseOutputTest {
  /**
   * Constructor
   */
  public constructor(public readonly raw: LightMyRequestResponse) {
    //
  }

  /**
   * Get body as json
   */
  public json() {
    return this.raw.json();
  }

  /**
   * Get response body
   */
  public get body() {
    return this.raw.body;
  }

  /**
   * Get value from json body
   * Works only if the expected response to be json
   */
  public get<Output = any>(key: string): Output {
    return get(this.json(), key);
  }

  /**
   * Get status code
   */
  public get statusCode() {
    return this.raw.statusCode;
  }

  /**
   * Check if current response status is OK
   */
  public get isOk() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  /**
   * Get headers
   */
  public get headers() {
    return this.raw.headers;
  }

  /**
   * Get a header value
   */
  public header(key: HeaderKey) {
    return this.headers[key];
  }
}
