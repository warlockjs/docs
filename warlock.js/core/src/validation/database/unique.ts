import { get } from "@mongez/reinforcements";
import { resolveModelClass } from "@warlock.js/cascade";
import { invalidRule, VALID_RULE, type SchemaRule } from "@warlock.js/seal";
import type { UniqueRuleOptions } from "../types";

/**
 * Unique rule - validates value is unique in database
 */
export const uniqueRule: SchemaRule<UniqueRuleOptions> = {
  name: "unique",
  defaultErrorMessage: "The :input must be unique",
  async validate(value: any, context) {
    const {
      Model,
      except,
      column = context.key,
      exceptColumnName,
      exceptValue,
      query,
    } = this.context.options;

    const ResolvedModelClass = resolveModelClass(Model);

    const dbQuery = ResolvedModelClass.query();

    dbQuery.where(column, value);

    if (except) {
      const exceptVal = get(context.allValues, except);
      if (exceptVal !== undefined) {
        dbQuery.where(except, "!=", exceptVal);
      }
    }

    if (exceptColumnName !== undefined) {
      dbQuery.where(exceptColumnName, "!=", exceptValue);
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
