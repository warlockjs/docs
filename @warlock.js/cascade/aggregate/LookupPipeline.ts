import type { GenericObject } from "@mongez/reinforcements";
import { isEmpty } from "@mongez/supportive-is";
import { parsePipelines } from "./parsePipelines";
import { Pipeline } from "./pipeline";

export type LookupPipelineOptions = {
  from: string;
  localField?: string;
  foreignField?: string;
  as?: string;
  single?: boolean;
  pipeline?: (Pipeline | GenericObject)[];
  let?: GenericObject;
};

export class LookupPipeline extends Pipeline {
  /**
   * Constructor
   */
  public constructor(options: LookupPipelineOptions) {
    super("lookup");

    const { from, localField, foreignField, as, pipeline = [] } = options;

    const parsedPipelines = parsePipelines(pipeline);

    const data: GenericObject = {
      from,
      localField,
      foreignField,
      as,
    };

    if (!isEmpty(parsedPipelines)) {
      data.pipeline = parsedPipelines;
    }

    this.data(data);
  }
}

export function lookupPipeline(options: LookupPipelineOptions) {
  return new LookupPipeline(options);
}
