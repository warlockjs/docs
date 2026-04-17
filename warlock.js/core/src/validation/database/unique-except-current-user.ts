import { get } from "@mongez/reinforcements";
import { resolveModelClass } from "@warlock.js/cascade";
import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import { useCurrentUser } from "../../http";
import type { UniqueExceptCurrentUserRuleOptions } from "../types";

/**
 * Unique except current user rule
 */
export const uniqueExceptCurrentUserRule: SchemaRule<UniqueExceptCurrentUserRuleOptions> = {
  name: "uniqueExceptCurrentUser",
  defaultErrorMessage: "The :input must be unique",
  async validate(value: any, context) {
    const {
      Model,
      column = context.key,
      exceptCurrentUserColumn = "id",
      exceptCurrentUserValue = "id",
      query,
    } = this.context.options;

    const user = useCurrentUser();

    const ResolvedModelClass = resolveModelClass(Model);

    const dbQuery = ResolvedModelClass.query();

    dbQuery.where(column, value);

    if (user) {
      const value =
        user instanceof ResolvedModelClass
          ? user.get(exceptCurrentUserValue)
          : get(user, exceptCurrentUserValue);
      dbQuery.where(exceptCurrentUserColumn, "!=", value);
    }

    if (query) {
      await query({
        query: dbQuery,
        value,
        allValues: context.allValues,
      });
    }

    const document = await dbQuery.first();
    return document ? invalidRule(this, context) : VALID_RULE;
  },
};
