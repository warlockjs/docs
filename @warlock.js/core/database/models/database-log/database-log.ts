import type { Casts } from "@warlock.js/cascade";
import { Model } from "@warlock.js/cascade";

export class DatabaseLogModel extends Model {
  /**
   * Collection name
   */
  public static collection = "logs";

  /**
   * {@inheritdoc}
   */
  protected casts: Casts = {
    module: "string",
    action: "string",
    message: "string",
    trace: "object",
    level: "string",
  };
}
