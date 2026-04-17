import { isEmpty, isObject } from "@mongez/supportive-is";

export function isEmptyValue(value: any) {
  return isEmpty(value) && !isObject(value);
}
