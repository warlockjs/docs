import type { Casts } from "@warlock.js/cascade";
import { Model } from "@warlock.js/cascade";

export class Seed extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "seeds";

  /**
   * {@inheritDoc}
   */
  protected casts: Casts = {
    file: "string",
    seeder: "string",
    calls: "number",
  };
}
