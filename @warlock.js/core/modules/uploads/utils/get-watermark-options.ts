import config from "@mongez/config";
import { useRequestStore } from "../../../http";
import type { WatermarkOptions } from "./types";

export async function getWatermarkOptions() {
  const watermark = config.get("uploads.watermark");

  if (!watermark) return;

  const request = useRequestStore().request;

  return (await watermark(request)) as WatermarkOptions;
}
