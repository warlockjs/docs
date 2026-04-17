import events from "@mongez/events";
import { Random } from "@mongez/reinforcements";

/**
 * Generate a unique mail ID for event namespacing
 */
export function generateMailId(): string {
  return "M" + Random.int(32);
}

/**
 * Mail event names (global events)
 */
export const MAIL_EVENTS = {
  BEFORE_SENDING: "mail.beforeSending",
  SENT: "mail.sent",
  SUCCESS: "mail.success",
  ERROR: "mail.error",
} as const;

/**
 * Get namespaced event name for a specific mail
 * @param mailId Unique mail identifier
 * @param event Event type
 * @returns Namespaced event name (e.g., "mail.abc123.success")
 */
export function getMailEventName(
  mailId: string,
  event: "beforeSending" | "sent" | "success" | "error",
): string {
  return `mail.${mailId}.${event}`;
}

/**
 * Mail events wrapper
 *
 * Supports two event patterns:
 * 1. Global events: `mail.success` - fires for ALL emails
 * 2. Specific events: `mail.$mailId.success` - fires for ONE email
 *
 * ## Usage
 *
 * ```typescript
 * // Global listener - all emails
 * mailEvents.onSuccess((mail, result) => {
 *   console.log("Any mail sent:", result.messageId);
 * });
 *
 * // Specific listener - one email by ID
 * const mailId = generateMailId();
 * mailEvents.onMailSuccess(mailId, (mail, result) => {
 *   console.log("This specific mail sent:", result.messageId);
 * });
 *
 * await sendMail({
 *   id: mailId, // Use the same ID
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>World</p>",
 * });
 * ```
 */
export const mailEvents = {
  /**
   * Trigger a global mail event
   */
  trigger: (eventName: keyof typeof MAIL_EVENTS, ...args: any[]) => {
    return events.trigger(MAIL_EVENTS[eventName], ...args);
  },

  /**
   * Trigger a specific mail event (by mail ID)
   */
  triggerForMail: (
    mailId: string,
    event: "beforeSending" | "sent" | "success" | "error",
    ...args: any[]
  ) => {
    return events.trigger(getMailEventName(mailId, event), ...args);
  },

  /**
   * Subscribe to global mail events
   */
  on: (eventName: keyof typeof MAIL_EVENTS, callback: (...args: any[]) => void) => {
    return events.subscribe(MAIL_EVENTS[eventName], callback);
  },

  // === GLOBAL EVENT HELPERS ===

  /**
   * Subscribe to beforeSending event (all mails)
   */
  onBeforeSending: (callback: (mail: any) => void | Promise<void> | false | Promise<false>) => {
    return events.subscribe(MAIL_EVENTS.BEFORE_SENDING, callback);
  },

  /**
   * Subscribe to sent event (all mails, after attempt)
   */
  onSent: (callback: (mail: any, result: any, error: any) => void | Promise<void>) => {
    return events.subscribe(MAIL_EVENTS.SENT, callback);
  },

  /**
   * Subscribe to success event (all mails)
   */
  onSuccess: (callback: (mail: any, result: any) => void | Promise<void>) => {
    return events.subscribe(MAIL_EVENTS.SUCCESS, callback);
  },

  /**
   * Subscribe to error event (all mails)
   */
  onError: (callback: (mail: any, error: any) => void | Promise<void>) => {
    return events.subscribe(MAIL_EVENTS.ERROR, callback);
  },

  // === SPECIFIC MAIL EVENT HELPERS ===

  /**
   * Subscribe to beforeSending event for a specific mail
   */
  onMailBeforeSending: (
    mailId: string,
    callback: (mail: any) => void | Promise<void> | false | Promise<false>,
  ) => {
    return events.subscribe(getMailEventName(mailId, "beforeSending"), callback);
  },

  /**
   * Subscribe to sent event for a specific mail
   */
  onMailSent: (
    mailId: string,
    callback: (mail: any, result: any, error: any) => void | Promise<void>,
  ) => {
    return events.subscribe(getMailEventName(mailId, "sent"), callback);
  },

  /**
   * Subscribe to success event for a specific mail
   */
  onMailSuccess: (mailId: string, callback: (mail: any, result: any) => void | Promise<void>) => {
    return events.subscribe(getMailEventName(mailId, "success"), callback);
  },

  /**
   * Subscribe to error event for a specific mail
   */
  onMailError: (mailId: string, callback: (mail: any, error: any) => void | Promise<void>) => {
    return events.subscribe(getMailEventName(mailId, "error"), callback);
  },
};
