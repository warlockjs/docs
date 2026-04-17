import { log } from "@warlock.js/logger";
import type nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { MailConfigurations, SESConfigurations, SMTPConfigurations } from "./types";

// ============================================================
// Eager-loaded Nodemailer Module
// ============================================================

/**
 * Installation instructions for nodemailer
 */
const NODEMAILER_INSTALL_INSTRUCTIONS = `
Email functionality requires the nodemailer package.
Install it with:

  warlock add mailer

Or manually:

  npm install nodemailer
  pnpm add nodemailer
  yarn add nodemailer
`.trim();

/**
 * Module availability flag
 */
let moduleExists: boolean | null = null;

/**
 * Cached nodemailer module (loaded at import time)
 */
let nodemailerModule: typeof nodemailer;

let nodemailerLoadPromise: Promise<void> | null = null;

/**
 * Eagerly load nodemailer module at import time
 */
async function loadNodemailerModule() {
  try {
    const module = await import("nodemailer");
    nodemailerModule = module.default;
    moduleExists = true;
  } catch {
    moduleExists = false;
  }
}

// Kick off eager loading immediately
nodemailerLoadPromise = loadNodemailerModule();

const SES_INSTALL_INSTRUCTIONS = `
AWS SES functionality requires the @aws-sdk/client-sesv2 package.
Install it with:

  warlock add ses

Or manually:

  npm install @aws-sdk/client-sesv2
  pnpm add @aws-sdk/client-sesv2
  yarn add @aws-sdk/client-sesv2
`.trim();

let sesModuleExists: boolean | null = null;

let sesModule: typeof import("@aws-sdk/client-sesv2");

let sesLoadPromise: Promise<void> | null = null;

async function loadSesModule() {
  try {
    const module = await import("@aws-sdk/client-sesv2");
    sesModule = module.default;
    sesModuleExists = true;
  } catch {
    sesModuleExists = false;
  }
}

sesLoadPromise = loadSesModule();

function isSesConfig(config: MailConfigurations): config is SESConfigurations {
  return "driver" in config && config.driver === "ses";
}

async function getSesMailer(config: SESConfigurations): Promise<Transporter> {
  if (sesModuleExists === null && sesLoadPromise) {
    await sesLoadPromise;
  }

  if (sesModuleExists === false) {
    throw new Error(`@aws-sdk/client-sesv2 is not installed.\n\n${SES_INSTALL_INSTRUCTIONS}`);
  }

  const hash = `ses_${config.region}_${config.accessKeyId}`;

  const existingTransporter = mailerPool.get(hash);
  if (existingTransporter) {
    return existingTransporter;
  }

  log.info("mail", "pool", `Creating new SES mailer transport (pool size: ${mailerPool.size + 1})`);

  const ses = new sesModule!.SESv2Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const transporter = nodemailerModule.createTransport({
    SES: { sesClient: ses, SendEmailCommand: sesModule.SendEmailCommand },
  });

  mailerPool.set(hash, transporter);

  return transporter;
}

// ============================================================
// Mailer Pool
// ============================================================

/**
 * Mailer pool for connection reuse
 * Maps config hash to transporter instance
 */
const mailerPool = new Map<string, Transporter>();

/**
 * Create a hash from mail configuration for pooling
 */
function createConfigHash(config: SMTPConfigurations): string {
  const key = JSON.stringify({
    // SMTP specific fields
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    username: config.username,
    password: config.password,
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `mailer_${hash}`;
}

/**
 * Get hash for any mailer config
 */
function getMailerHash(config: MailConfigurations): string {
  if (isSesConfig(config)) {
    return `ses_${config.region}_${config.accessKeyId}`;
  }
  return createConfigHash(config);
}

/**
 * Get or create a mailer transporter from the pool
 * Nodemailer is eagerly loaded at import time
 */
export async function getMailer(config: MailConfigurations): Promise<Transporter> {
  if (moduleExists === null && nodemailerLoadPromise) {
    await nodemailerLoadPromise;
  }

  if (moduleExists === false) {
    throw new Error(`nodemailer is not installed.\n\n${NODEMAILER_INSTALL_INSTRUCTIONS}`);
  }

  if (isSesConfig(config)) {
    return getSesMailer(config);
  }

  const hash = getMailerHash(config);

  // Return existing transporter if available
  const existingTransporter = mailerPool.get(hash);

  if (existingTransporter) {
    return existingTransporter;
  }

  // Create new transporter
  log.info("mail", "pool", `Creating new mailer transport (pool size: ${mailerPool.size + 1})`);

  const { auth, username, password, requireTLS, tls, ...transportConfig } = config;

  const transporter = nodemailerModule.createTransport({
    requireTLS: requireTLS ?? tls,
    auth: auth ?? {
      user: username,
      pass: password,
    },
    ...transportConfig,
  });

  // Store in pool
  mailerPool.set(hash, transporter);

  return transporter;
}

/**
 * Verify a mailer connection
 */
export async function verifyMailer(config: MailConfigurations): Promise<boolean> {
  const transporter = await getMailer(config);

  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close a specific mailer connection
 */
export function closeMailer(config: MailConfigurations): void {
  const hash = getMailerHash(config);
  const transporter = mailerPool.get(hash);

  if (transporter) {
    transporter.close();
    mailerPool.delete(hash);
    log.info("mail", "pool", `Closed mailer transport (pool size: ${mailerPool.size})`);
  }
}

/**
 * Close all mailer connections
 */
export function closeAllMailers(): void {
  for (const [hash, transporter] of mailerPool) {
    transporter.close();
    mailerPool.delete(hash);
  }

  log.info("mail", "pool", "Closed all mailer transports");
}

/**
 * Get pool statistics
 */
export function getPoolStats(): { size: number; hashes: string[] } {
  return {
    size: mailerPool.size,
    hashes: Array.from(mailerPool.keys()),
  };
}
