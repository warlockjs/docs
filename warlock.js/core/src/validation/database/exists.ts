import { resolveModelClass } from "@warlock.js/cascade";
import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import type { ExistsRuleOptions } from "../types";

/**
 * Exists rule - validates record exists in database
 */
export const existsRule: SchemaRule<ExistsRuleOptions> = {
  name: "exists",
  defaultErrorMessage: "The :input must exist",
  async validate(value: any, context) {
    const { Model, query, column = context.key } = this.context.options;

    const ResolvedModelClass = resolveModelClass(Model);

    const dbQuery = ResolvedModelClass.query();

    dbQuery.where(column, value);

    if (query) {
      await query({
        query: dbQuery,
        value,
        allValues: context.allValues,
      });
    }

    const document = await dbQuery.first();
    return document ? VALID_RULE : invalidRule(this, context);
  },
};
