import { resolveModelClass } from "@warlock.js/cascade";
import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import { useRequestStore } from "../../http";
import type { ExistsExceptCurrentIdRuleOptions } from "../types";

/**
 * Exists except current ID rule
 */
export const existsExceptCurrentIdRule: SchemaRule<ExistsExceptCurrentIdRuleOptions> = {
  name: "existsExceptCurrentId",
  defaultErrorMessage: "The :input must exist",
  async validate(value: any, context) {
    const {
      Model,
      query,
      column = context.key,
      exceptCurrentIdColumn = "id",
    } = this.context.options;

    const { request } = useRequestStore();

    const ResolvedModelClass = resolveModelClass(Model);

    const dbQuery = ResolvedModelClass.query();

    dbQuery.where(column, value);
    dbQuery.where(exceptCurrentIdColumn, "!=", request.int("id"));

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
