import { type TransformerCallback } from "@warlock.js/seal";
import { Model } from "../../model/model";

export const databaseModelTransformer: TransformerCallback = (value, context) => {
  const embed = context.options.embed ?? "embedData";

  if (value instanceof Model === false && !Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof embed === "string") {
        return item[embed];
      }

      return item.only(embed);
    });
  }

  if (typeof embed === "string") {
    return (value as any)[embed];
  }

  return value.only(embed);
};
