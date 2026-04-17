import { resolveModelClass } from "@warlock.js/cascade";
import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import { useCurrentUser } from "../../http";
import type { ExistsExceptCurrentUserRuleOptions } from "../types";

/**
 * Exists except current user rule
 */
export const existsExceptCurrentUserRule: SchemaRule<ExistsExceptCurrentUserRuleOptions> = {
  name: "existsExceptCurrentUser",
  defaultErrorMessage: "The :input must exist",
  async validate(value: any, context) {
    const {
      Model,
      query,
      column = context.key,
      exceptCurrentUserColumn = "id",
      exceptCurrentUserValue = "id",
    } = this.context.options;

    const user = useCurrentUser();

    const ResolvedModelClass = resolveModelClass(Model);

    const dbQuery = ResolvedModelClass.query();

    dbQuery.where(column, value);

    if (user) {
      dbQuery.where(exceptCurrentUserColumn, "!=", user.get(exceptCurrentUserValue));
    }

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
