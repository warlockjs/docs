import { ltrim } from "@mongez/reinforcements";
import type { CloudStorageDriverOptions } from "../types";
import { CloudDriver } from "./cloud-driver";

/**
 * DigitalOcean Spaces Storage Driver
 *
 * Spaces is S3-compatible with a different URL structure.
 *
 * URL Patterns:
 * - With urlPrefix: {urlPrefix}/{key}
 * - CDN URL: https://{bucket}.{region}.cdn.digitaloceanspaces.com/{key}
 * - Origin URL: https://{bucket}.{region}.digitaloceanspaces.com/{key}
 *
 * Regions: nyc3, sfo3, ams3, sgp1, fra1, etc.
 *
 * @example
 * ```typescript
 * const driver = new DOSpacesDriver({
 *   bucket: "my-space",
 *   region: "nyc3",
 *   accessKeyId: process.env.DO_SPACES_KEY,
 *   secretAccessKey: process.env.DO_SPACES_SECRET,
 * });
 * ```
 */
export class DOSpacesDriver extends CloudDriver<CloudStorageDriverOptions> {
  /**
   * Driver name
   */
  public readonly name = "spaces";

  /**
   * Get Spaces endpoint URL
   *
   * Spaces endpoint format: https://{region}.digitaloceanspaces.com
   */
  protected getEndpoint(): string {
    return this.options.endpoint || `https://${this.options.region}.digitaloceanspaces.com`;
  }

  /**
   * Get public URL for file
   *
   * Note: DO Spaces includes automatic CDN with the `.cdn.` subdomain
   */
  public url(location: string): string {
    // 1. Use urlPrefix if configured
    if (this.options.urlPrefix) {
      const prefix = this.options.urlPrefix.replace(/\/+$/, "");
      location = `${prefix}/${ltrim(location, "/")}`;
    }

    // 2. Default Spaces CDN URL
    return `https://${this.options.bucket}.${this.options.region}.cdn.digitaloceanspaces.com/${location}`;
  }
}
