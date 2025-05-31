import { Model, type Casts } from "@warlock.js/cascade";

export class AccessToken extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "accessTokens";

  /**
   * {@inheritDoc}
   */
  protected casts: Casts = {
    lastAccess: "date",
    token: "string",
    "user.id": "int",
    "user._id": "string",
    "user.userType": "string",
  };
}
