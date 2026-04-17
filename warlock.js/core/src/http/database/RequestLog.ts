import { Model } from "@warlock.js/cascade";
import { type Infer, v } from "@warlock.js/seal";

const schema = v.object({
  statusCode: v.number(),
  responseTime: v.number(),
  responseSize: v.number(),
  responseBody: v.record(v.any()),
  responseHeaders: v.record(v.any()),
  ip: v.string(),
  method: v.string(),
  route: v.string(),
  requestHeaders: v.record(v.any()),
  userAgent: v.string(),
  referer: v.string(),
  requestBody: v.record(v.any()),
  requestParams: v.record(v.any()),
  requestQuery: v.record(v.any()),
});

type RequestLogSchema = Infer<typeof schema>;

export class RequestLog extends Model<RequestLogSchema> {
  /**
   * {@inheritdoc}
   */
  public static table = "request_logs";

  /**
   * {@inheritdoc}
   */
  public static schema = schema;
}
