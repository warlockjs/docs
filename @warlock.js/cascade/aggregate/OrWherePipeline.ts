import type { GenericObject } from "@mongez/reinforcements";
import { WhereExpression } from "./WhereExpression";
import { WherePipeline } from "./WherePipeline";

export class OrWherePipeline extends WherePipeline {
  /**
   * Constructor
   */

  public constructor(...operations: GenericObject[]);
  public constructor(...operations: [column: string, value: any][]);
  public constructor(expression: GenericObject) {
    super(expression);
  }

  /**
   * {@inheritDoc}
   */
  public parse() {
    const data: {
      [key: string]: any;
    }[] = [];

    // we have three types of where
    // first one is an array of arrays, each array contains two items, column and value
    // second one is an array of objects, each object contains column and value
    // third one is an object, each key is the column and the value is the value (Recommended for simple multiple value checks)
    /**
     * Examples
     *
     * Example 1:
     * query.orWhere([
     *  ["name", "hasan"],
     * ["age", 20]
     * ])
     *
     * Example 2
     * query.orWhere([
     *  {bedrooms: $agg.in([20, 30, 40])},
     *  {bedrooms: $agg.gte(7)}
     * ])
     *
     * Example 3
     * query.orWhere({
     *  name: "hasan",
     *  age: 20
     * })
     */

    if (Array.isArray(this.pipelineData)) {
      for (const operation of this.pipelineData) {
        if (Array.isArray(operation)) {
          data.push({
            [operation[0]]: operation[1],
          });
        } else {
          data.push(operation);
        }
      }
    } else {
      for (const column in this.pipelineData) {
        data.push({
          [column]: this.pipelineData[column],
        });
      }
    }

    return {
      $match: {
        $or: data,
      },
    };
  }
}

export function orWherePipeline(column: string, value: any): OrWherePipeline;
export function orWherePipeline(...args: any[]) {
  return new OrWherePipeline(WhereExpression.parse.apply(null, args as any));
}
