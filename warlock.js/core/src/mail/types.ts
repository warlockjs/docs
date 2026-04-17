import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type React from "react";

/**
 * AWS SES mail configuration
 */
export type SESConfigurations = {
  driver: "ses";
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  from?: MailAddress;
};

/**
 * Any mail configuration (SMTP or SES)
 */
export type MailConfigurations = SMTPConfigurations | SESConfigurations;

/**
 * Mail mode determines how emails are handled
 */
export type MailMode = "production" | "development" | "test";

/**
 * Mail priority levels
 */
export type MailPriority = "high" | "normal" | "low";

/**
 * Email address with optional name
 */
export type MailAddress =
  | string
  | {
      name: string;
      address: string;
    };

/**
 * Mail attachment
 * Supports both buffer/string content and file paths
 */
export type MailAttachment = {
  filename: string;
  contentType?: string;
  encoding?: "base64" | "binary" | "hex";
  cid?: string; // Content-ID for inline attachments
} & (
  | {
      content: Buffer | string;
      path?: never;
    }
  | {
      content?: never;
      path: string; // File path - will be read automatically
    }
);

/**
 * Mail configuration for SMTP transport
 *
 * ## Basic Configuration
 *
 * ```typescript
 * setMailConfigurations({
 *   host: "smtp.gmail.com",
 *   port: 587,
 *   secure: false,           // true for 465, false for other ports
 *   tls: true,               // Use STARTTLS
 *   username: "user@gmail.com",
 *   password: "app-password",
 *   from: { name: "My App", address: "noreply@myapp.com" },
 * });
 * ```
 *
 * ## Configuration Options
 *
 * | Option | Type | Default | Description |
 * |--------|------|---------|-------------|
 * | `host` | `string` | - | SMTP server hostname (e.g., "smtp.gmail.com") |
 * | `port` | `number` | 587 | SMTP port. Common: 25, 465 (SSL), 587 (TLS) |
 * | `secure` | `boolean` | false | Use SSL/TLS. Set `true` for port 465 |
 * | `tls` | `boolean` | true | Enable STARTTLS upgrade. For port 587 |
 * | `requireTLS` | `boolean` | - | Fail if STARTTLS upgrade fails |
 * | `username` | `string` | - | SMTP auth username (convenience alias) |
 * | `password` | `string` | - | SMTP auth password (convenience alias) |
 * | `auth` | `object` | - | Full auth object: `{ user, pass, type }` |
 * | `from` | `MailAddress` | - | Default sender for all emails |
 *
 * ## Provider Examples
 *
 * ### Gmail
 * ```typescript
 * { host: "smtp.gmail.com", port: 587, tls: true, username: "...", password: "..." }
 * ```
 *
 * ### SendGrid
 * ```typescript
 * { host: "smtp.sendgrid.net", port: 587, username: "apikey", password: "SG.xxx" }
 * ```
 *
 * ### AWS SES
 * ```typescript
 * { host: "email-smtp.us-east-1.amazonaws.com", port: 587, username: "...", password: "..." }
 * ```
 *
 * ### Mailgun
 * ```typescript
 * { host: "smtp.mailgun.org", port: 587, username: "postmaster@...", password: "..." }
 * ```
 *
 * ## Multi-tenant Usage
 *
 * For multi-tenant apps, pass config per-mail instead of globally:
 * ```typescript
 * await sendMail({
 *   config: tenant.mailSettings,  // Tenant-specific config
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>World</p>",
 * });
 * ```
 */
export type SMTPConfigurations = SMTPTransport.Options & {
  /**
   * Transport driver type
   */
  driver?: "smtp";
  /**
   * Enable STARTTLS upgrade (alias for requireTLS)
   * Set to `true` for port 587
   */
  tls?: boolean;
  /**
   * SMTP authentication username
   * Convenience alias - can also use `auth.user`
   */
  username?: string;
  /**
   * SMTP authentication password
   * Convenience alias - can also use `auth.pass`
   */
  password?: string;
  /**
   * Default sender for all emails
   * Can be string ("noreply@app.com") or object ({ name, address })
   */
  from?: MailAddress;
};

/**
 * Named mailers configuration
 */
export type MailersConfig = {
  /**
   * Default mailer configuration
   */
  default?: MailConfigurations;
  /**
   * Named mailer configurations
   */
  mailers?: Record<string, MailConfigurations>;
};

/**
 * Mail result after sending
 */
export type MailResult = {
  success: boolean;
  messageId?: string;
  accepted: string[];
  rejected: string[];
  response?: string;
  envelope?: {
    from: string;
    to: string[];
  };
};

/**
 * Error codes for mail operations
 */
export type MailErrorCode =
  | "CONNECTION_ERROR"
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "INVALID_ADDRESS"
  | "REJECTED"
  | "TIMEOUT"
  | "RENDER_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN";

/**
 * Mail event callbacks (per-mail)
 * For global events, use mailEvents.on() from events.ts
 */
export type MailEvents = {
  /**
   * Called before sending the email
   * Can be used to modify the mail or cancel sending
   */
  beforeSending?: (mail: MailOptions) => void | Promise<void> | false | Promise<false>;
  /**
   * Called after send attempt (success or failure)
   */
  onSent?: (
    mail: MailOptions,
    result: MailResult | null,
    error: MailError | null,
  ) => void | Promise<void>;
  /**
   * Called only on successful send
   */
  onSuccess?: (mail: MailOptions, result: MailResult) => void | Promise<void>;
  /**
   * Called only on error
   */
  onError?: (mail: MailOptions, error: MailError) => void | Promise<void>;
};

/**
 * Mail options for sending
 */
export type MailOptions = {
  /**
   * Unique mail ID for event namespacing
   * If not provided, one will be auto-generated
   *
   * Use this to subscribe to events for a specific mail:
   * ```typescript
   * const mailId = generateMailId();
   * mailEvents.onMailSuccess(mailId, (mail, result) => { ... });
   * await sendMail({ id: mailId, to: "...", subject: "...", html: "..." });
   * ```
   */
  id?: string;

  // Recipients
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;

  // Content
  subject: string;
  html?: string;
  text?: string;
  component?: React.ReactElement;

  // Configuration
  config?: MailConfigurations;
  mailer?: string;
  from?: MailAddress;

  // Attachments
  attachments?: MailAttachment[];

  // Options
  priority?: MailPriority;
  headers?: Record<string, string>;
  tags?: string[];

  // Meta
  correlationId?: string;
} & MailEvents;

/**
 * Internal normalized mail data
 */
export type NormalizedMail = {
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string;
  from: MailAddress;
  subject: string;
  html?: string;
  text?: string;
  attachments: MailAttachment[];
  priority: MailPriority;
  headers: Record<string, string>;
  tags: string[];
  correlationId?: string;
  config: MailConfigurations;
};

/**
 * Captured mail for test mode
 */
export type CapturedMail = {
  options: MailOptions;
  normalized: NormalizedMail;
  timestamp: Date;
  result?: MailResult;
  error?: MailError;
};

/**
 * Mail error class
 */
export class MailError extends Error {
  public readonly code: MailErrorCode;
  public readonly originalError?: Error;

  public constructor(message: string, code: MailErrorCode, originalError?: Error) {
    super(message);
    this.name = "MailError";
    this.code = code;
    this.originalError = originalError;
  }
}
