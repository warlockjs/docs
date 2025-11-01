import config from "@mongez/config";
import { log } from "@warlock.js/logger";
import { v } from "@warlock.js/seal";
import type { Request, Response } from "../http";
import type { Route } from "../router";
import { Validator } from "./validator";

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

  if (validation.rules) {
    try {
      const validator = await request.validate(validation.rules);

      if (validator.fails()) {
        return response.validationFailed(validator);
      }
    } catch (error) {
      log.error("app.validation", "error", error);
      throw error;
    }
  }

  if (validation.schema) {
    log.info("validation", "schema", "Validating request schema");
    try {
      const result = await v.validate(
        validation.schema,
        request.allExceptParams(),
      );

      if (result.data && result.isValid) {
        request.setValidatedData(result.data);
      }

      if (!result.isValid) {
        log.error("validation", "schema", "Schema Validation failed");
        return response.failedSchema(result);
      }

      log.success("validation", "schema", "Schema Validation passed");
    } catch (error) {
      log.error("app.validation", "error", error);
      throw error;
    }
  }

  if (validation.validate) {
    Validator.trigger("customValidating", validation.validate);
    const result = await validation.validate(request, response);

    Validator.trigger("customDone", result);

    // if there is a result, it means it failed
    if (result) {
      Validator.trigger("customFails", result);

      // check if there is no response status code, then set it to config value or 400 as default
      if (!response.statusCode) {
        response.setStatusCode(config.get("validation.responseStatus", 400));
      }

      log.info("validation", "failed", "Validation failed");

      return result;
    }

    log.info("validation", "passed", "Validation passed");

    Validator.trigger("customPasses");
  }
}
