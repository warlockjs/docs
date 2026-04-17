import { Model } from "@warlock.js/cascade";
import { Infer, v } from "@warlock.js/seal";

const schema = v.object({
  module: v.string(),
  action: v.string(),
  message: v.string(),
  trace: v.record(v.any()),
  level: v.string(),
});

type LogSchema = Infer<typeof schema>;

export class DatabaseLogModel extends Model<LogSchema> {
  /**
   * Table name
   */
  public static table = "logs";

  /**
   * {@inheritdoc}
   */
  public static schema = schema;
}
