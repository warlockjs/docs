import { config } from "../config";
import { EncryptionPasswordConfigurations } from "./types";

/**
 * Default bcrypt salt rounds.
 */
const DEFAULT_SALT_ROUNDS = 12;

// ============================================================
// Lazy-loaded bcryptjs SDK Types
// ============================================================

/**
 * Cached bcryptjs module (loaded once, reused)
 */
let Bcryptjs: typeof import("bcryptjs");

let isModuleExists: boolean | null = null;

/**
 * Installation instructions for bcryptjs package
 */
const BCRYPTJS_INSTALL_INSTRUCTIONS = `
Password encryption requires the bcryptjs package.
Install it with:

  npm install bcryptjs

Or with your preferred package manager:

  pnpm add bcryptjs
  yarn add bcryptjs
`.trim();

/**
 * Load bcryptjs module
 */
async function loadBcryptjs() {
  try {
    Bcryptjs = await import("bcryptjs");
    isModuleExists = true;
  } catch {
    isModuleExists = false;
  }
}

loadBcryptjs();

/**
 * Hashes a password using bcrypt (async — does not block the event loop).
 *
 * Salt rounds are read from \`encryption.password.saltRounds\` config,
 * defaulting to 12.
 *
 * @example
 * import { hashPassword } from "@warlock.js/core";
 *
 * const hashed = await hashPassword("user-password-123");
 * // Store \`hashed\` in the database
 */
export async function hashPassword(password: string): Promise<string> {
  if (!isModuleExists) {
    throw new Error(BCRYPTJS_INSTALL_INSTRUCTIONS);
  }

  const saltRounds = config.key<EncryptionPasswordConfigurations["salt"]>(
    "encryption.password.salt",
    DEFAULT_SALT_ROUNDS,
  )!;

  return Bcryptjs.hash(String(password), saltRounds);
}

/**
 * Verifies a plain password against a bcrypt hash (async — does not block the event loop).
 *
 * @example
 * import { verifyPassword } from "@warlock.js/core";
 *
 * const isValid = await verifyPassword("user-password-123", storedHash);
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!isModuleExists) {
    throw new Error(BCRYPTJS_INSTALL_INSTRUCTIONS);
  }

  return Bcryptjs.compare(String(plainPassword), String(hashedPassword));
}
