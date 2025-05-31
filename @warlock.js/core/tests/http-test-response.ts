import { get } from "@mongez/reinforcements";
import type { HttpResponseOutputTest } from "@warlock.js/core";
import type { OutgoingHttpHeaders } from "http2";
import { expect } from "vitest";

export class HttpResponseTest {
  /**
   * Constructor
   */
  public constructor(public readonly response: HttpResponseOutputTest) {
    //
  }

  /**
   * Expect status to be the given code
   */
  public expectStatus(code: number) {
    expect(this.response.statusCode).toBe(code);
    return this;
  }

  /**
   * Expect Status to be 200
   */
  public expectOk() {
    return this.expectStatus(200);
  }

  /**
   * Expect Status to be 201
   */
  public expectCreated() {
    return this.expectStatus(201);
  }

  /**
   * Expect status to be redirect
   */
  public expectRedirect() {
    return this.expectStatus(302);
  }

  /**
   * Expect redirect to the given location
   */
  public expectRedirectTo(location: string) {
    expect(this.response.headers.location).toBe(location);

    return this;
  }

  /**
   * Expect Status to be 400
   */
  public expectBadRequest() {
    return this.expectStatus(400);
  }

  /**
   * Expect Status to be 401
   */
  public expectUnauthorized() {
    return this.expectStatus(401);
  }

  /**
   * Expect Status to be 403
   */
  public expectForbidden() {
    return this.expectStatus(403);
  }

  /**
   * Expect Status to be 404
   */
  public expectNotFound() {
    return this.expectStatus(404);
  }

  /**
   * Expect the response to be JSON
   */
  public expectJson() {
    return this.expectHeaderContains("content-type", "application/json");
  }

  /**
   * Expect header to have exact match value
   */
  public expectHeader(name: keyof OutgoingHttpHeaders, value: string) {
    expect(this.response.headers[name]).toBe(value);
    return this;
  }

  /**
   * Expect A header to contain the given value
   */
  public expectHeaderContains(name: keyof OutgoingHttpHeaders, value: string) {
    expect(this.response.headers[name]).toContain(value);
    return this;
  }

  /**
   * Expect body to be the given json value
   */
  public expectBody(value: any) {
    expect(this.response.json()).deep.equals(value);
    return this;
  }

  /**
   * Expect body to be the given json value
   */
  public expectBodyToHave(value: any) {
    expect(this.response.json()).toMatchObject(value);
    return this;
  }

  /**
   * Expect body to contain the given exact value
   */
  public expectBodyContains(value: any) {
    expect(this.response.body).toContain(value);
    return this;
  }

  /**
   * Expect a body key to have the given value
   */
  public expectBodyKey(key: string, value: any) {
    const bodyValue = get(this.response.json(), key);

    expect(bodyValue).toBe(value);
    return this;
  }
}
