import config from "@mongez/config";
import { hash } from "@mongez/password";
import type { Model } from "@warlock.js/cascade";

/**
 * Cast password on model save
 * If the password is not changed, keep it as is
 */
export function castPassword(value: any, column: string, model: Model) {
  return value
    ? hash(String(value), config.get("auth.password.salt", 12))
    : model.getInitial(column);
}
