import { get } from "@mongez/reinforcements";
import { Aggregate } from "@warlock.js/cascade";
import { useRequestStore } from "./../../http/middleware/inject-request-context";
import type {
  ExistsExceptCurrentIdRuleOptions,
  ExistsExceptCurrentUserRuleOptions,
  ExistsRuleOptions,
  SchemaRule,
  UniqueExceptCurrentIdRuleOptions,
  UniqueExceptCurrentUserRuleOptions,
  UniqueRuleOptions,
} from "./types";
import { VALID_RULE, invalidRule } from "./utils";

export const uniqueRule: SchemaRule<UniqueRuleOptions> = {
  name: "unique",
  errorMessage: "The :input must be unique",
  async validate(value: any, context) {
    const {
      Model,
      except,
      column = context.key,
      exceptColumnName,
      exceptValue,
      query,
    } = this.context.options;

    const dbQuery: Aggregate =
      typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

    dbQuery.where(column, value);

    if (except) {
      const exceptValue = get(context.allValues, except);
      if (exceptValue !== undefined) {
        dbQuery.where(except, "!=", exceptValue);
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

export const uniqueExceptCurrentUserRule: SchemaRule<UniqueExceptCurrentUserRuleOptions> =
  {
    name: "uniqueExceptCurrentUser",
    errorMessage: "The :input must be unique",
    async validate(value: any, context) {
      const {
        Model,
        column = context.key,
        exceptCurrentUserColumn = "id",
        exceptCurrentUserValue = "id",
        query,
      } = this.context.options;

      const { user } = useRequestStore();

      const dbQuery: Aggregate =
        typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

      dbQuery.where(column, value);

      if (user) {
        dbQuery.where(
          exceptCurrentUserColumn,
          "!=",
          user.get(exceptCurrentUserValue),
        );
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

export const uniqueExceptCurrentIdRule: SchemaRule<UniqueExceptCurrentIdRuleOptions> =
  {
    name: "uniqueExceptCurrentId",
    errorMessage: "The :input must be unique",
    async validate(value: any, context) {
      const {
        Model,
        column = context.key,
        exceptCurrentIdColumn = "id",
        query,
      } = this.context.options;

      const { request } = useRequestStore();

      const dbQuery: Aggregate =
        typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

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
      return document ? invalidRule(this, context) : VALID_RULE;
    },
  };

export const existsRule: SchemaRule<ExistsRuleOptions> = {
  name: "exists",
  errorMessage: "The :input must exist",
  async validate(value: any, context) {
    const { Model, query, column = context.key } = this.context.options;

    const dbQuery: Aggregate =
      typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

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

export const existsExceptCurrentUserRule: SchemaRule<ExistsExceptCurrentUserRuleOptions> =
  {
    name: "existsExceptCurrentUser",
    errorMessage: "The :input must exist",
    async validate(value: any, context) {
      const {
        Model,
        query,
        column = context.key,
        exceptCurrentUserColumn = "id",
        exceptCurrentUserValue = "id",
      } = this.context.options;

      const { user } = useRequestStore();

      const dbQuery: Aggregate =
        typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

      dbQuery.where(column, value);

      if (user) {
        dbQuery.where(
          exceptCurrentUserColumn,
          "!=",
          user.get(exceptCurrentUserValue),
        );
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

export const existsExceptCurrentIdRule: SchemaRule<ExistsExceptCurrentIdRuleOptions> =
  {
    name: "existsExceptCurrentId",
    errorMessage: "The :input must exist",
    async validate(value: any, context) {
      const {
        Model,
        query,
        column = context.key,
        exceptCurrentIdColumn = "id",
      } = this.context.options;

      const { request } = useRequestStore();

      const dbQuery: Aggregate =
        typeof Model !== "string" ? Model.aggregate() : new Aggregate(Model);

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
