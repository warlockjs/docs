import crypto from "crypto";
import { config } from "../config";
import { EncryptionConfigurations } from "./types";

/**
 * Creates a deterministic HMAC-SHA256 hash of the given string.
 *
 * Useful for creating searchable, unique fingerprints of sensitive data
 * (e.g., an API key) without storing the plaintext.
 *
 * Uses a dedicated HMAC key from config. Falls back to the encryption key
 * if no separate HMAC key is configured.
 *
 * @example
 * import { hmacHash } from "@warlock.js/core";
 *
 * const fingerprint = hmacHash("sk-proj-12345");
 * // Store `fingerprint` in DB for lookups, store encrypted value separately
 */
export function hmacHash(plainText: string): string {
  if (!plainText) return plainText;

  const hmacKey =
    config.key<EncryptionConfigurations["hmacKey"]>("encryption.hmacKey") ||
    config.key<EncryptionConfigurations["key"]>("encryption.key");

  if (!hmacKey) {
    throw new Error(
      "Missing HMAC key. Set 'encryption.hmacKey' (or 'encryption.key') in your config.",
    );
  }

  const keyBuffer = Buffer.from(hmacKey, "hex");

  return crypto.createHmac("sha256", keyBuffer).update(plainText).digest("hex");
}
