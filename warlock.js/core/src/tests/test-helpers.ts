/**
 * Warlock.js Test Helpers
 *
 * Utilities for testing Warlock.js applications.
 */

import { config } from "../config";

/**
 * Get the test server base URL
 */
export function getTestServerUrl(): string {
  const port = config.key("http.port", 2031);
  const host = config.key("http.host", "localhost");
  return `http://${host}:${port}`;
}

/**
 * Simple HTTP request helper for test server
 * Uses native fetch - lightweight, no extra dependencies
 */
export async function testRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getTestServerUrl();
  const url = path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * GET request helper
 */
export async function testGet(path: string, options: RequestInit = {}): Promise<Response> {
  return testRequest(path, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export async function testPost(
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<Response> {
  return testRequest(path, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function testPut(
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<Response> {
  return testRequest(path, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function testDelete(path: string, options: RequestInit = {}): Promise<Response> {
  return testRequest(path, { ...options, method: "DELETE" });
}

/**
 * PATCH request helper
 */
export async function testPatch(
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<Response> {
  return testRequest(path, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Parse JSON response with type safety
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status and return parsed JSON
 */
export async function expectJson<T>(response: Response, expectedStatus = 200): Promise<T> {
  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}. Body: ${text}`);
  }
  return parseJsonResponse<T>(response);
}
