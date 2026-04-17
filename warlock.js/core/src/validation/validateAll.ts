import config from "@mongez/config";
import { merge } from "@mongez/reinforcements";
import { log } from "@warlock.js/logger";
import { v } from "@warlock.js/seal";
import type { Request, Response } from "../http";
import type { RequestHandlerValidation, Route } from "../router";

function resolveDataToParse(validating: RequestHandlerValidation["validating"], request: Request) {
  if (!validating || validating.length === 0) return request.allExceptParams();

  let data: any = {};

  for (const validatingType of validating) {
    if (validatingType === "body") {
      data = merge(data, request.body);
    }

    if (validatingType === "query") {
      data = merge(data, request.query);
    }

    if (validatingType === "params") {
      data = merge(data, request.params);
    }

    if (validatingType === "headers") {
      data = merge(data, request.headers);
    }
  }

  return data;
}

/**
 * Validate the request route
 */
export async function validateAll(
  validation: Route["handler"]["validation"],
  request: Request,
  response: Response,
) {
  if (!validation) return;

  log.info("validation", "started", "Start validating the request");

  if (validation.schema) {
    log.info("validation", "schema", "Validating request schema");
    try {
      const data = resolveDataToParse(validation.validating, request);
      const result = await v.validate(validation.schema, data);

      if (result.data && result.isValid) {
        request.setValidatedData(result.data);
      }

      if (!result.isValid) {
        log.warn("validation", "schema", "Schema Validation failed");
        return response.failedSchema(result);
      }

      log.success("validation", "schema", "Schema Validation passed");
    } catch (error) {
      log.warn("app.validation", "error", error);
      throw error;
    }
  }

  if (validation.validate) {
    const result = await validation.validate(request, response);

    // if there is a result, it means it failed
    if (result) {
      // check if there is no response status code, then set it to config value or 400 as default
      if (!response.statusCode) {
        response.setStatusCode(config.get("validation.responseStatus", 400));
      }

      log.info("validation", "failed", "Validation failed");

      return result;
    }

    log.info("validation", "passed", "Validation passed");
  }
}
