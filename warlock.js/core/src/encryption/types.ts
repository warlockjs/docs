/**
 * Configuration for the encryption module.
 *
 * @example
 * // src/config/encryption.ts
 * import type { EncryptionConfigurations } from "@warlock.js/core";
 * import { env } from "@warlock.js/core";
 *
 * const encryptionConfig: EncryptionConfigurations = {
 *   key: env("APP_ENCRYPTION_KEY"),
 *   algorithm: "aes-256-gcm",
 *   hmacKey: env("APP_HMAC_KEY"),
 *   password: {
 *     saltRounds: 12,
 *   },
 * };
 *
 * export default encryptionConfig;
 */
export type EncryptionConfigurations = {
  /**
   * 32-byte hex-encoded encryption key (64 hex characters).
   * Used by encrypt() and decrypt().
   * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   */
  key: string;

  /**
   * Encryption algorithm to use.
   * Defaults to "aes-256-gcm" if not set.
   */
  algorithm?: string;

  /**
   * Separate HMAC key (hex-encoded) for hmacHash().
   * Falls back to `key` if not provided.
   * Best practice: keep these separate.
   * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   */
  hmacKey?: string;

  /**
   * Password hashing configuration (bcrypt).
   */
  password?: EncryptionPasswordConfigurations;
};

export type EncryptionPasswordConfigurations = {
  /**
   * bcrypt salt rounds. Higher = slower and more secure.
   * 10–12 is the standard range. Defaults to 12.
   */
  salt?: number;
};
