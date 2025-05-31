import type { ManipulateType } from "dayjs";
import dayjs from "dayjs";

export function expiresAfter(duration: number, unit: ManipulateType) {
  return () => {
    return dayjs().add(duration, unit).toDate();
  };
}
