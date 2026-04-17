import { get } from "@mongez/reinforcements";
import { slugify } from "@mongez/slug";
import { authService } from "@warlock.js/auth";
import { Model, useModelTransformer } from "@warlock.js/cascade";
import { ComputedCallback, SchemaContext } from "@warlock.js/seal";

/**
 * Hash password on saving if password changes
 */
export const useHashedPassword = () =>
  useModelTransformer(({ value, isChanged, isNew }) => {
    if (!value) return value;

    if (!isNew && !isChanged) return value;

    return authService.hashPassword(String(value));
  });

type ComputedCallbackModel = (
  data: any,
  model: Model,
  context: SchemaContext,
) => any | Promise<any>;

/**
 * Generate computed value based on other fields
 */
export function useComputedModel(callback: ComputedCallbackModel) {
  const computedCallback: ComputedCallback = (data, context) => {
    return callback(data, context.rootContext!.model, context);
  };

  return computedCallback;
}

/**
 * Generate slug based on a field on saving
 */
export function useComputedSlug(field = "title", scope: "global" | "sibling" = "sibling") {
  return useComputedModel((data, model, context) => {
    const value = scope === "sibling" ? data[field] : get(context.allValues, field);

    if (!value) return model.get(field);

    return slugify(value);
  });
}
