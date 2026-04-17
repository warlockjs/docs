import type { MailConfigurations, MailersConfig, MailMode, SMTPConfigurations } from "./types";

/**
 * Default mail configurations
 */
const defaultConfigurations: Partial<SMTPConfigurations> = {
  secure: true,
  tls: true,
  driver: "smtp",
};

/**
 * Current mail mode
 */
let currentMode: MailMode = "production";

/**
 * Registered mailers configuration
 */
let mailersConfig: MailersConfig = {};

/**
 * Set the mail mode
 *
 * @param mode "production" | "development" | "test"
 *
 * - **production**: Actually sends emails via SMTP
 * - **development**: Logs emails to console without sending
 * - **test**: Captures emails to test mailbox for assertions
 *
 * @example
 * ```typescript
 * // In test setup
 * setMailMode("test");
 *
 * // In development
 * setMailMode("development");
 * ```
 */
export function setMailMode(mode: MailMode): void {
  currentMode = mode;
}

/**
 * Get the current mail mode
 */
export function getMailMode(): MailMode {
  return currentMode;
}

/**
 * Check if in production mode
 */
export function isProductionMode(): boolean {
  return currentMode === "production";
}

/**
 * Check if in development mode
 */
export function isDevelopmentMode(): boolean {
  return currentMode === "development";
}

/**
 * Check if in test mode
 */
export function isTestMode(): boolean {
  return currentMode === "test";
}

/**
 * Set mail configurations
 *
 * Supports both simple config and named mailers.
 *
 * @example
 * ```typescript
 * // Simple config (sets as default)
 * setMailConfigurations({
 *   host: "smtp.gmail.com",
 *   port: 587,
 *   username: "...",
 *   password: "...",
 * });
 *
 * // Named mailers
 * setMailConfigurations({
 *   default: { host: "smtp.sendgrid.net", ... },
 *   mailers: {
 *     marketing: { host: "smtp.mailchimp.com", ... },
 *     transactional: { host: "smtp.postmark.com", ... },
 *   },
 * });
 * ```
 */
export function setMailConfigurations(config: MailConfigurations | MailersConfig): void {
  // Check if it's a MailersConfig (has 'default' or 'mailers' key)
  if ("default" in config || "mailers" in config) {
    mailersConfig = config as MailersConfig;
  } else {
    // Simple config - set as default
    mailersConfig = {
      default: config as MailConfigurations,
    };
  }
}

export function getDefaultMailConfig(): MailConfigurations {
  const config = mailersConfig.default;
  if (!config) return {} as MailConfigurations;
  if ("driver" in config && config.driver === "ses") return config;

  return {
    ...defaultConfigurations,
    ...config,
  } as SMTPConfigurations;
}

/**
 * Get a named mailer configuration
 */
export function getMailerConfig(name: string): MailConfigurations | undefined {
  if (name === "default") {
    return getDefaultMailConfig();
  }

  const config = mailersConfig.mailers?.[name];
  if (!config) {
    return undefined;
  }

  if ("driver" in config && config.driver === "ses") return config;

  return {
    ...defaultConfigurations,
    ...config,
  } as SMTPConfigurations;
}

/**
 * Resolve configuration from options
 * Priority: config > mailer > default
 */
export function resolveMailConfig(options: {
  config?: MailConfigurations;
  mailer?: string;
}): MailConfigurations {
  if (options.config) {
    // SES config passes through as-is, no defaultConfigurations merge
    if ("driver" in options.config && options.config.driver === "ses") {
      return options.config;
    }

    return {
      ...defaultConfigurations,
      ...options.config,
    } as SMTPConfigurations;
  }

  if (options.mailer) {
    const config = getMailerConfig(options.mailer);
    if (!config) {
      throw new Error(`Mailer "${options.mailer}" not found in configuration`);
    }
    return config;
  }

  return getDefaultMailConfig();
}

/**
 * Reset all configurations (useful for testing)
 */
export function resetMailConfig(): void {
  currentMode = "production";
  mailersConfig = {};
}
