// Configuration
export {
  getDefaultMailConfig,
  getMailMode,
  getMailerConfig,
  isDevelopmentMode,
  isProductionMode,
  isTestMode,
  resetMailConfig,
  resolveMailConfig,
  setMailConfigurations,
  setMailMode,
} from "./config";

// Events
export { MAIL_EVENTS, generateMailId, getMailEventName, mailEvents } from "./events";

// Mailer pool
export { closeAllMailers, closeMailer, getMailer, getPoolStats, verifyMailer } from "./mailer-pool";

// React mail
export { renderReactMail } from "./react-mail";

// Functional API
export { sendMail } from "./send-mail";

// Fluent Builder
export { Mail } from "./mail";

// Test utilities
export {
  assertMailCount,
  assertMailSent,
  captureMail,
  clearTestMailbox,
  findMailsBySubject,
  findMailsTo,
  getLastMail,
  getMailboxSize,
  getTestMailbox,
  wasMailSentTo,
  wasMailSentWithSubject,
} from "./test-mailbox";

// Types
export type {
  CapturedMail,
  MailAddress,
  MailAttachment,
  MailConfigurations,
  MailErrorCode,
  MailEvents,
  MailMode,
  MailOptions,
  MailPriority,
  MailResult,
  MailersConfig,
  NormalizedMail,
  SESConfigurations,
  SMTPConfigurations,
} from "./types";

export { MailError } from "./types";
