import { log } from "@warlock.js/logger";
import { readFile } from "node:fs/promises";
import type { Options as NodemailerOptions } from "nodemailer/lib/mailer";
import { isDevelopmentMode, isTestMode, resolveMailConfig } from "./config";
import { MAIL_EVENTS, generateMailId, mailEvents } from "./events";
import { getMailer } from "./mailer-pool";
import { renderReactMail } from "./react-mail";
import { captureMail } from "./test-mailbox";
import {
  MailError,
  type CapturedMail,
  type MailAddress,
  type MailAttachment,
  type MailOptions,
  type MailPriority,
  type MailResult,
  type NormalizedMail,
} from "./types";

/**
 * Normalize email address to string
 */
function addressToString(address: MailAddress): string {
  if (typeof address === "string") {
    return address;
  }

  return `"${address.name}" <${address.address}>`;
}

/**
 * Normalize recipients to array
 */
function normalizeRecipients(recipients: string | string[] | undefined): string[] {
  if (!recipients) {
    return [];
  }

  return Array.isArray(recipients) ? recipients : [recipients];
}

/**
 * Map priority to nodemailer format
 */
function mapPriority(priority: MailPriority): "high" | "normal" | "low" {
  return priority;
}

/**
 * Normalize mail options to internal format
 */
function normalizeMail(options: MailOptions): NormalizedMail {
  const config = resolveMailConfig(options);

  return {
    to: normalizeRecipients(options.to),
    cc: normalizeRecipients(options.cc),
    bcc: normalizeRecipients(options.bcc),
    replyTo: options.replyTo,
    from: options.from || config.from || { name: "No Reply", address: "noreply@localhost" },
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments || [],
    priority: options.priority || "normal",
    headers: options.headers || {},
    tags: options.tags || [],
    correlationId: options.correlationId,
    config,
  };
}

/**
 * Resolve attachment - read file if path is provided
 */
async function resolveAttachment(attachment: MailAttachment): Promise<{
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}> {
  // If path is provided, read the file
  if (attachment.path) {
    try {
      const content = await readFile(attachment.path);
      return {
        filename: attachment.filename,
        content,
        contentType: attachment.contentType,
        encoding: attachment.encoding,
        cid: attachment.cid,
      };
    } catch (error) {
      throw new MailError(
        `Failed to read attachment file "${attachment.path}": ${error instanceof Error ? error.message : "Unknown error"}`,
        "CONFIG_ERROR",
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Already has content
  return {
    filename: attachment.filename,
    content: attachment.content!,
    contentType: attachment.contentType,
    encoding: attachment.encoding,
    cid: attachment.cid,
  };
}

/**
 * Build nodemailer options from normalized mail
 */
async function buildNodemailerOptions(normalized: NormalizedMail): Promise<NodemailerOptions> {
  const options: NodemailerOptions = {
    to: normalized.to,
    from: addressToString(normalized.from),
    subject: normalized.subject,
    priority: mapPriority(normalized.priority),
  };

  if (normalized.cc.length > 0) {
    options.cc = normalized.cc;
  }

  if (normalized.bcc.length > 0) {
    options.bcc = normalized.bcc;
  }

  if (normalized.replyTo) {
    options.replyTo = normalized.replyTo;
  }

  if (normalized.html) {
    options.html = normalized.html;
  }

  if (normalized.text) {
    options.text = normalized.text;
  }

  if (normalized.attachments.length > 0) {
    // Resolve all attachments (read files if needed)
    const resolvedAttachments = await Promise.all(
      normalized.attachments.map((att) => resolveAttachment(att as MailAttachment)),
    );

    options.attachments = resolvedAttachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
      encoding: att.encoding,
      cid: att.cid,
    }));
  }

  if (Object.keys(normalized.headers).length > 0) {
    options.headers = normalized.headers;
  }

  return options;
}

/**
 * Run per-mail event handler
 */
async function runMailEvent<T extends (...args: any[]) => any>(
  handler: T | undefined,
  ...args: Parameters<T>
): Promise<ReturnType<T> | undefined> {
  if (!handler) {
    return undefined;
  }

  try {
    return await handler(...args);
  } catch (error) {
    log.error("mail", "event", `Per-mail event handler error: ${error}`);
    return undefined;
  }
}

/**
 * Trigger both global and mail-specific events
 */
async function triggerEvents(
  mailId: string,
  event: "beforeSending" | "sent" | "success" | "error",
  ...args: any[]
): Promise<any[]> {
  try {
    // Trigger global event (e.g., mail.success)
    const globalEventName =
      event === "beforeSending"
        ? "BEFORE_SENDING"
        : event === "sent"
          ? "SENT"
          : event === "success"
            ? "SUCCESS"
            : "ERROR";

    const globalResults = await mailEvents.trigger(
      globalEventName as keyof typeof MAIL_EVENTS,
      ...args,
    );

    // Trigger mail-specific event (e.g., mail.$id.success)
    const specificResults = await mailEvents.triggerForMail(mailId, event, ...args);

    return [...(globalResults || []), ...(specificResults || [])];
  } catch (error) {
    log.error("mail", "event", `Event handler error: ${error}`);
    return [];
  }
}

/**
 * Send an email
 *
 * @param options Mail options including recipients, content, and configuration
 * @returns Result containing success status, message ID, and accepted/rejected recipients
 *
 * @example
 * ```typescript
 * // Basic usage
 * await sendMail({
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>World</p>",
 * });
 *
 * // With React component
 * await sendMail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   component: <WelcomeEmail name="John" />,
 * });
 *
 * // Track specific mail with events
 * const mailId = generateMailId();
 * mailEvents.onMailSuccess(mailId, (mail, result) => {
 *   console.log("This specific mail was sent!");
 * });
 * await sendMail({ id: mailId, to: "...", subject: "...", html: "..." });
 * ```
 */
export async function sendMail(options: MailOptions): Promise<MailResult> {
  // Generate or use provided mail ID
  const mailId = options.id || generateMailId();

  // Render React component if provided
  if (options.component) {
    try {
      options.html = await renderReactMail(options.component);
    } catch (error) {
      const mailError = new MailError(
        `Failed to render React component: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RENDER_ERROR",
        error instanceof Error ? error : undefined,
      );

      await runMailEvent(options.onError, options, mailError);
      await triggerEvents(mailId, "error", options, mailError);

      throw mailError;
    }
  }

  // Normalize mail
  const normalized = normalizeMail(options);
  const driver = normalized.config.driver || "smtp";

  // Run beforeSending event (per-mail, global, and mail-specific)
  const beforeResult = await runMailEvent(options.beforeSending, options);
  const globalBeforeResults = await triggerEvents(mailId, "beforeSending", options);

  // If any returns false, cancel sending
  if (beforeResult === false || globalBeforeResults.some((r) => r === false)) {
    log.info(
      `mail.${driver}`,
      "cancelled",
      "Mail sending cancelled by beforeSending event",
    );

    const result: MailResult = {
      success: false,
      accepted: [],
      rejected: normalized.to,
      response: "Cancelled by beforeSending event",
    };

    return result;
  }

  // Test mode - capture without sending
  if (isTestMode()) {
    log.info(
      `mail.${driver}`,
      "test",
      `[TEST MODE] Captured mail to: ${normalized.to.join(", ")}`,
    );

    const result: MailResult = {
      success: true,
      messageId: `test-${mailId}@localhost`,
      accepted: normalized.to,
      rejected: [],
      response: "Test mode - mail captured",
    };

    const captured: CapturedMail = {
      options,
      normalized,
      timestamp: new Date(),
      result,
    };

    captureMail(captured);

    await runMailEvent(options.onSuccess, options, result);
    await triggerEvents(mailId, "success", options, result);
    await runMailEvent(options.onSent, options, result, null);
    await triggerEvents(mailId, "sent", options, result, null);

    return result;
  }

  // Development mode - log without sending
  if (isDevelopmentMode()) {
    log.info(
      `mail.${driver}`,
      "dev",
      `[DEV MODE] Would send mail to: ${normalized.to.join(", ")}`,
    );
    log.info(`mail.${driver}`, "dev", `Subject: ${normalized.subject}`);

    if (normalized.html) {
      log.info(
        `mail.${driver}`,
        "dev",
        `HTML length: ${normalized.html.length} chars`,
      );
    }

    const result: MailResult = {
      success: true,
      messageId: `dev-${mailId}@localhost`,
      accepted: normalized.to,
      rejected: [],
      response: "Development mode - mail logged",
    };

    await runMailEvent(options.onSuccess, options, result);
    await triggerEvents(mailId, "success", options, result);
    await runMailEvent(options.onSent, options, result, null);
    await triggerEvents(mailId, "sent", options, result, null);

    return result;
  }

  // Production mode - actually send
  try {
    const config = resolveMailConfig(options);
    const mailer = await getMailer(config);
    const nodemailerOptions = await buildNodemailerOptions(normalized);

    log.info(
      `mail.${driver}`,
      "send",
      `Sending mail to: ${normalized.to.join(", ")}`,
    );

    const output = await mailer.sendMail(nodemailerOptions);

    const accepted = output.accepted || (output.messageId ? normalized.to : []);
    const rejected = output.rejected || [];

    const result: MailResult = {
      success: accepted.length > 0,
      messageId: output.messageId,
      accepted: accepted as string[],
      rejected: rejected as string[],
      response: output.response,
      envelope: output.envelope,
    };

    if (result.success) {
      log.success(
        `mail.${driver}`,
        "sent",
        `Mail sent successfully (ID: ${result.messageId})`,
      );
      await runMailEvent(options.onSuccess, options, result);
      await triggerEvents(mailId, "success", options, result);
    } else {
      log.warn(
        `mail.${driver}`,
        "partial",
        `Mail partially rejected: ${rejected.join(", ")}`,
      );
    }

    await runMailEvent(options.onSent, options, result, null);
    await triggerEvents(mailId, "sent", options, result, null);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let code: MailError["code"] = "UNKNOWN";

    // Detect error type
    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
      code = "CONNECTION_ERROR";
    } else if (errorMessage.includes("authentication") || errorMessage.includes("auth")) {
      code = "AUTH_ERROR";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      code = "TIMEOUT";
    } else if (errorMessage.includes("rate") || errorMessage.includes("limit")) {
      code = "RATE_LIMIT";
    }

    const mailError = new MailError(
      `Failed to send mail: ${errorMessage}`,
      code,
      error instanceof Error ? error : undefined,
    );

    log.error(`mail.${driver}`, "error", mailError.message);

    await runMailEvent(options.onError, options, mailError);
    await triggerEvents(mailId, "error", options, mailError);
    await runMailEvent(options.onSent, options, null, mailError);
    await triggerEvents(mailId, "sent", options, null, mailError);

    throw mailError;
  }
}
