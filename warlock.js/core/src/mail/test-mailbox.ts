/**
 * Test Mailbox for Mail v2
 *
 * Provides utilities for capturing and asserting sent emails in test mode.
 *
 * ## Setup
 *
 * ```typescript
 * import { setMailMode, clearTestMailbox } from "@warlock.js/core/mail/v2";
 *
 * beforeEach(() => {
 *   setMailMode("test");
 *   clearTestMailbox();
 * });
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { sendMail, getTestMailbox, findMailsTo } from "@warlock.js/core/mail/v2";
 *
 * // Send email in test mode
 * await sendMail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<p>Hello</p>",
 * });
 *
 * // Get all captured mails
 * const mails = getTestMailbox();
 * expect(mails).toHaveLength(1);
 * expect(mails[0].options.subject).toBe("Welcome!");
 *
 * // Find specific mails
 * const userMails = findMailsTo("user@example.com");
 * expect(userMails).toHaveLength(1);
 *
 * // Check if mail was sent
 * expect(wasMailSentTo("user@example.com")).toBe(true);
 * expect(wasMailSentWithSubject("Welcome!")).toBe(true);
 * ```
 *
 * ## Assertion Helpers
 *
 * ```typescript
 * // Assert a mail matching a predicate was sent
 * const mail = assertMailSent(m => m.options.to === "user@example.com");
 * expect(mail.options.subject).toBe("Welcome!");
 *
 * // Assert exact count
 * assertMailCount(2); // throws if count doesn't match
 * ```
 *
 * ## Captured Mail Structure
 *
 * Each captured mail contains:
 * - `options` - Original MailOptions passed to sendMail
 * - `normalized` - Normalized mail data (arrays, addresses resolved)
 * - `timestamp` - When the mail was captured
 * - `result` - MailResult (in test mode, always success)
 * - `error` - MailError if sending failed (null in test mode)
 *
 * @module test-mailbox
 */

import type { CapturedMail } from "./types";

/**
 * Test mailbox for capturing sent emails in test mode
 */
let testMailbox: CapturedMail[] = [];

/**
 * Add a mail to the test mailbox
 */
export function captureMail(mail: CapturedMail): void {
  testMailbox.push(mail);
}

/**
 * Get all captured mails
 */
export function getTestMailbox(): CapturedMail[] {
  return [...testMailbox];
}

/**
 * Get the last captured mail
 */
export function getLastMail(): CapturedMail | undefined {
  return testMailbox[testMailbox.length - 1];
}

/**
 * Find mails by recipient
 */
export function findMailsTo(email: string): CapturedMail[] {
  return testMailbox.filter((mail) => {
    const to = Array.isArray(mail.options.to) ? mail.options.to : [mail.options.to];
    return to.includes(email);
  });
}

/**
 * Find mails by subject (partial match)
 */
export function findMailsBySubject(subject: string): CapturedMail[] {
  return testMailbox.filter((mail) => mail.options.subject.includes(subject));
}

/**
 * Check if a mail was sent to a specific recipient
 */
export function wasMailSentTo(email: string): boolean {
  return findMailsTo(email).length > 0;
}

/**
 * Check if a mail with specific subject was sent
 */
export function wasMailSentWithSubject(subject: string): boolean {
  return testMailbox.some((mail) => mail.options.subject === subject);
}

/**
 * Get mailbox size
 */
export function getMailboxSize(): number {
  return testMailbox.length;
}

/**
 * Clear the test mailbox
 */
export function clearTestMailbox(): void {
  testMailbox = [];
}

/**
 * Assert helper for testing
 */
export function assertMailSent(predicate: (mail: CapturedMail) => boolean): CapturedMail {
  const mail = testMailbox.find(predicate);

  if (!mail) {
    throw new Error("No mail matching the predicate was found in the test mailbox");
  }

  return mail;
}

/**
 * Assert that a specific number of mails were sent
 */
export function assertMailCount(count: number): void {
  if (testMailbox.length !== count) {
    throw new Error(`Expected ${count} mails to be sent, but found ${testMailbox.length}`);
  }
}
