import { RequestLog } from "./database/RequestLog";
import type { Response } from "./response";

export function logResponse(response: Response) {
  const request = response.request;
  RequestLog.create({
    statusCode: response.statusCode,
    responseTime: response.getResponseTime(),
    responseSize: response.getHeader("Content-Length"),
    responseBody: response.body,
    responseHeaders: response.getHeaders(),
    ip: request.ip,
    method: request.route.method,
    route: request.route.path,
    requestHeaders: request.headers,
    userAgent: request.userAgent,
    referer: request.referer,
    // requestBody: request.bodyInputs,
    requestParams: request.params,
    requestQuery: request.query,
  });
}

export function wrapResponseInDataKey(response: Response) {
  if (typeof response.body === "string") return;

  if (response.body) {
    response.body = { data: response.body };
  }
}
