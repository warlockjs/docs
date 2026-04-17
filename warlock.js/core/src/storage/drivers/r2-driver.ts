import { ltrim } from "@mongez/reinforcements";
import type { R2StorageDriverOptions } from "../types";
import { CloudDriver } from "./cloud-driver";

/**
 * Cloudflare R2 Storage Driver
 *
 * R2 is S3-compatible but uses a different URL structure and doesn't require regions.
 *
 * URL Patterns:
 * - With publicDomain: https://{publicDomain}/{key}
 * - With urlPrefix: {urlPrefix}/{key}
 * - Default public bucket: https://pub-{accountId}.r2.dev/{key}
 *
 * @example
 * ```typescript
 * const driver = new R2Driver({
 *   bucket: "my-bucket",
 *   region: "auto", // R2 doesn't use traditional regions
 *   accessKeyId: process.env.R2_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
 *   accountId: process.env.R2_ACCOUNT_ID,
 *   publicDomain: "assets.example.com", // Optional custom domain
 * });
 * ```
 */
export class R2Driver extends CloudDriver<R2StorageDriverOptions> {
  /**
   * Driver name
   */
  public readonly name = "r2";

  /**
   * Get R2 endpoint URL
   *
   * R2 endpoint format: https://{accountId}.r2.cloudflarestorage.com
   */
  protected getEndpoint(): string {
    return this.options.endpoint || `https://${this.options.accountId}.r2.cloudflarestorage.com`;
  }

  /**
   * Get public URL for file
   *
   * Priority: urlPrefix > publicDomain > default R2 URL
   *
   * Note: For R2 public access, you typically need to:
   * - Enable public access on the bucket
   * - Or use a custom domain through Cloudflare
   */
  public url(location: string): string {
    // 1. Use urlPrefix if configured
    if (this.options.urlPrefix) {
      const prefix = this.options.urlPrefix.replace(/\/+$/, "");
      location = `${prefix}/${ltrim(location, "/")}`;
    }

    // 2. Use publicDomain if configured
    if (this.options.publicDomain) {
      const domain = this.options.publicDomain.replace(/\/+$/, "");
      return `${domain}/${location}`;
    }

    // 3. Fallback to R2 public bucket URL
    // Note: Public access must be enabled on the bucket for this to work
    return `https://pub-${this.options.accountId}.r2.dev/${location}`;
  }
}
